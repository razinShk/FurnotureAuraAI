-- =========================================================================
-- FURNITURE AURA AI — PRODUCTION SECURITY & RLS ENFORCEMENT MIGRATION
-- Migration: 20261025_production_security.sql
-- =========================================================================

-- 1. Ensure profiles table supports standard text identifiers (compatible with both Clerk IDs and Supabase Auth UIDs)
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- 1a. Drop all existing policies on public.profiles first to prevent "cannot alter type of a column used in a policy definition" error
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;

  -- 1b. Alter profiles.id to text if it's currently uuid
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    -- Drop existing foreign key constraint if it references auth.users(id)
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;

-- Enforce check constraints on role and credits
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profile_role;
ALTER TABLE public.profiles ADD CONSTRAINT check_profile_role CHECK (role IN ('customer', 'biller', 'admin'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profile_credits;
ALTER TABLE public.profiles ADD CONSTRAINT check_profile_credits CHECK (credits >= 0);

-- 2. HARDEN ATOMIC CREDIT RPC FUNCTIONS WITH EXPLICIT SEARCH_PATH
CREATE OR REPLACE FUNCTION public.deduct_user_credits(p_user_id text, p_amount integer)
RETURNS jsonb AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credit deduction amount');
  END IF;

  UPDATE public.profiles
  SET credits = credits - p_amount,
      total_generations = COALESCE(total_generations, 0) + 1,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO v_remaining;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient AI credits remaining');
  END IF;

  RETURN jsonb_build_object('success', true, 'remaining_credits', v_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Admin credit adjustment function
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(p_user_id text, p_amount integer DEFAULT 0, p_set_total integer DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_new_credits integer;
BEGIN
  IF p_set_total IS NOT NULL THEN
    UPDATE public.profiles
    SET credits = GREATEST(0, p_set_total),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id
    RETURNING credits INTO v_new_credits;
  ELSE
    UPDATE public.profiles
    SET credits = GREATEST(0, credits + p_amount),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id
    RETURNING credits INTO v_new_credits;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target user profile not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'credits', v_new_credits);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.deduct_user_credits(text, integer) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(text, integer, integer) TO authenticated, service_role;

-- 3. ROW-LEVEL SECURITY ENFORCEMENT
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auraroom_projects ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profile access" ON public.profiles;
DROP POLICY IF EXISTS "Public profile view" ON public.profiles;
CREATE POLICY "Public profile view" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (
  id = auth.uid()::text 
  OR id = (auth.jwt() ->> 'sub')
  OR (SELECT role FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR id = auth.uid()::text) = 'admin'
);

DROP POLICY IF EXISTS "Service role profile upsert" ON public.profiles;
CREATE POLICY "Service role profile upsert" ON public.profiles FOR INSERT WITH CHECK (true);

-- Stores Policies
DROP POLICY IF EXISTS "Public store viewing" ON public.stores;
CREATE POLICY "Public store viewing" ON public.stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owner management" ON public.stores;
CREATE POLICY "Store owner management" ON public.stores FOR ALL USING (
  owner_id = auth.uid()::text
  OR owner_id = (auth.jwt() ->> 'sub')
  OR (SELECT role FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR id = auth.uid()::text) = 'admin'
);

-- Catalog Items Policies
DROP POLICY IF EXISTS "Public catalog browsing" ON public.catalog_items;
CREATE POLICY "Public catalog browsing" ON public.catalog_items FOR SELECT USING (in_stock = true OR true);

DROP POLICY IF EXISTS "Store catalog management" ON public.catalog_items;
CREATE POLICY "Store catalog management" ON public.catalog_items FOR ALL USING (
  store_id IN (
    SELECT id FROM public.stores 
    WHERE owner_id = auth.uid()::text OR owner_id = (auth.jwt() ->> 'sub')
  )
  OR (SELECT role FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR id = auth.uid()::text) = 'admin'
);

-- Quotes Policies (PII Protection)
DROP POLICY IF EXISTS "Insert quotes" ON public.quotes;
CREATE POLICY "Insert quotes" ON public.quotes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "View quotes" ON public.quotes;
DROP POLICY IF EXISTS "Store owner view quotes" ON public.quotes;
CREATE POLICY "Store owner view quotes" ON public.quotes FOR SELECT USING (
  store_id IN (
    SELECT id FROM public.stores 
    WHERE owner_id = auth.uid()::text OR owner_id = (auth.jwt() ->> 'sub')
  )
  OR customer_email = (auth.jwt() ->> 'email')
  OR (SELECT role FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR id = auth.uid()::text) = 'admin'
);

-- User Projects Policies
DROP POLICY IF EXISTS "Project access" ON public.auraroom_projects;
CREATE POLICY "Project access" ON public.auraroom_projects FOR ALL USING (
  user_id = auth.uid()::text 
  OR user_id = (auth.jwt() ->> 'sub')
  OR user_id = 'guest_user'
  OR (SELECT role FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR id = auth.uid()::text) = 'admin'
);

-- Prediction Logs Policies
DROP POLICY IF EXISTS "Prediction logs access" ON public.prediction_logs;
CREATE POLICY "Prediction logs access" ON public.prediction_logs FOR SELECT USING (
  user_id = auth.uid()::text
  OR user_id = (auth.jwt() ->> 'sub')
  OR (SELECT role FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR id = auth.uid()::text) = 'admin'
);
CREATE POLICY "Insert prediction logs" ON public.prediction_logs FOR INSERT WITH CHECK (true);

-- Staging Events Policies (Analytics)
DROP POLICY IF EXISTS "Staging events insert" ON public.staging_events;
CREATE POLICY "Staging events insert" ON public.staging_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staging events select" ON public.staging_events;
CREATE POLICY "Staging events select" ON public.staging_events FOR SELECT USING (true);

-- 4. DESIGNATE SUPER ADMIN AUTHORITY
-- Ensure razinshaikh3133@gmail.com has global admin authority and starter credits
UPDATE public.profiles
SET role = 'admin', 
    credits = GREATEST(credits, 5000), 
    plan = 'Super Admin Unlimited'
WHERE LOWER(email) = 'razinshaikh3133@gmail.com';
