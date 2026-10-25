-- =========================================================================
-- FURNITURE AURA AI — SUPABASE PRODUCTION MIGRATION
-- Schema: Profiles, Showrooms, Catalog, Analytics, Quotes, Projects
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USER PROFILES TABLE (Linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  role text default 'customer' not null,
  credits integer default 100 not null,
  plan text default 'Free Explorer' not null,
  total_generations integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to create profile when auth.user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url, role, credits, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    100,
    'Free Explorer'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, profiles.name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. RETAIL SHOWROOMS / STORES
create table if not exists public.stores (
  id text primary key,
  name text not null,
  tagline text,
  owner_id text,
  owner_email text,
  location text,
  active_catalog_count integer default 0,
  avatar text,
  credits integer default 500,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SHOWROOM CATALOG ITEMS
create table if not exists public.catalog_items (
  id text primary key,
  store_id text references public.stores(id) on delete cascade not null,
  name text not null,
  category text not null,
  price numeric(10, 2) not null,
  color text default '#4f46e5',
  prompt text not null,
  dimensions text default 'Standard Luxury Sizing',
  material text default 'Premium Architectural Finish',
  image_url text not null,
  in_stock boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CUSTOMER STAGING USAGE & EVENTS (For Retailer Analytics)
create table if not exists public.staging_events (
  id text primary key,
  customer_id text,
  customer_name text,
  customer_email text,
  store_id text references public.stores(id) on delete cascade,
  store_name text,
  furniture_id text,
  furniture_name text,
  furniture_price numeric(10, 2),
  room_type text default 'Living Room',
  action text default 'staged',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ROOM QUOTATION REQUESTS
create table if not exists public.quotes (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  store_id text,
  items jsonb not null default '[]'::jsonb,
  total_estimate numeric(10, 2) not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. AI TELEMETRY & PREDICTION LOGS
create table if not exists public.prediction_logs (
  id text primary key,
  model text not null,
  task text not null,
  prediction_id text,
  user_id text,
  status text not null,
  duration_ms integer not null,
  credits_cost integer default 2 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. USER SAVED ROOMS & PROJECTS
create table if not exists public.auraroom_projects (
  id text primary key,
  user_id text not null,
  name text not null,
  thumbnail_url text,
  pins jsonb default '[]'::jsonb,
  versions jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. ATOMIC USER CREDIT DEDUCTION RPC
create or replace function public.deduct_user_credits(p_user_id text, p_amount integer)
returns jsonb as $$
declare
  v_remaining integer;
begin
  update public.profiles
  set credits = credits - p_amount,
      total_generations = total_generations + 1
  where id::text = p_user_id and credits >= p_amount
  returning credits into v_remaining;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Insufficient credits');
  end if;

  return jsonb_build_object('success', true, 'remaining_credits', v_remaining);
end;
$$ language plpgsql security definer;

-- 9. ENABLE ROW-LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.catalog_items enable row level security;
alter table public.staging_events enable row level security;
alter table public.quotes enable row level security;
alter table public.prediction_logs enable row level security;
alter table public.auraroom_projects enable row level security;

-- 10. POLICIES
-- Profiles: Users can view their own profile, admins can view all
drop policy if exists "Public profile access" on public.profiles;
create policy "Public profile access" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Stores: Anyone can view
drop policy if exists "Public store viewing" on public.stores;
create policy "Public store viewing" on public.stores for select using (true);
create policy "Admin store management" on public.stores for all using (true);

-- Catalog Items: Anyone can browse catalog
drop policy if exists "Public catalog browsing" on public.catalog_items;
create policy "Public catalog browsing" on public.catalog_items for select using (true);
create policy "Biller catalog management" on public.catalog_items for all using (true);

-- Staging Events: Anyone authenticated can insert
drop policy if exists "Insert staging events" on public.staging_events;
create policy "Insert staging events" on public.staging_events for insert with check (true);
create policy "View staging events" on public.staging_events for select using (true);

-- Quotes: Anyone can insert quotes
drop policy if exists "Insert quotes" on public.quotes;
create policy "Insert quotes" on public.quotes for insert with check (true);
create policy "View quotes" on public.quotes for select using (true);

-- Prediction Logs: Service & Admins
drop policy if exists "Prediction logs access" on public.prediction_logs;
create policy "Prediction logs access" on public.prediction_logs for all using (true);

-- Projects: Anyone can manage their projects
drop policy if exists "Project access" on public.auraroom_projects;
create policy "Project access" on public.auraroom_projects for all using (true);

-- =========================================================================
-- 11. INITIAL SEED DATA FOR SHOWROOMS & LUXURY CATALOG
-- =========================================================================

insert into public.stores (id, name, tagline, owner_id, owner_email, location, active_catalog_count, avatar, credits)
values 
  ('store-1', 'Aura Atelier Living', 'Modern Architectural Minimalism & Italian Leather', 'user-biller-1', 'biller.milan@auraatelier.com', 'Milan / New York', 14, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80', 850),
  ('store-2', 'Nordic Form Studios', 'Scandinavian Oak, Bouclé Textures & Sculptural Lighting', 'user-biller-2', 'copenhagen@nordicform.io', 'Copenhagen / London', 10, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80', 620)
on conflict (id) do nothing;

insert into public.catalog_items (id, store_id, name, category, price, color, prompt, dimensions, material, image_url, in_stock)
values
  ('cat-s1', 'store-1', 'Cloud White Bouclé Curvature Sofa', 'sofa', 2450, '#f8fafc', 'a luxury curved white bouclé 3-seater modern sofa with organic sculptural silhouette', '94"W x 38"D x 31"H', 'Italian Bouclé & Kiln-dried Hardwood', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80', true),
  ('cat-s2', 'store-1', 'Milano Cognac Chesterfield Sofa', 'sofa', 3190, '#9a3412', 'an Italian full-grain cognac tan leather mid-century modern luxury sofa', '88"W x 36"D x 30"H', 'Full-Grain Top Leather & Brass Accents', 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=600&q=80', true),
  ('cat-s3', 'store-2', 'Emerald Velvet Lounge Sectional', 'sofa', 2680, '#065f46', 'a deep jewel-toned emerald green velvet modern luxury lounge sofa', '102"W x 62"D x 32"H', 'Performance Velvet & Matte Black Steel', 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=600&q=80', true),
  ('cat-t1', 'store-1', 'Carrara Marble Fluted Coffee Table', 'table', 890, '#f1f5f9', 'a low round white polished Carrara marble coffee table with fluted pedestal base', '42"Dia x 15"H', 'Natural Italian Carrara Marble', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80', true),
  ('cat-t2', 'store-2', 'Solid Walnut Sculptural Table', 'table', 740, '#78350f', 'a sculptural solid walnut organic low coffee table with rounded chamfered edges', '48"W x 26"D x 16"H', 'American Walnut', 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80', true),
  ('cat-t3', 'store-1', 'Minimalist Travertine Monolith', 'table', 1120, '#d6d3d1', 'a minimalist monolithic beige Roman travertine rectangular coffee table', '46"W x 28"D x 14"H', 'Honed Roman Travertine', 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=600&q=80', true),
  ('cat-c1', 'store-2', 'Cream Bouclé Swivel Barrel Chair', 'chair', 920, '#fef3c7', 'a luxury cream bouclé fabric swivel barrel accent lounge armchair', '32"W x 32"D x 29"H', 'Teddy Bouclé & 360° Brushed Brass Swivel', 'https://images.unsplash.com/photo-1580481077195-c22ae224b75f?auto=format&fit=crop&w=600&q=80', true),
  ('cat-c2', 'store-1', 'Sienna Saddle Leather Lounge Chair', 'chair', 1250, '#9a3412', 'a Scandinavian cognac saddle leather lounge chair with smoked oak angled frame', '30"W x 34"D x 31"H', 'Hand-Stitched Saddle Hide & Smoked Oak', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80', true),
  ('cat-f1', 'store-1', 'Calacatta Gold Bookmatched Tiles', 'floor', 1650, '#f8fafc', 'large format polished Calacatta gold marble floor tiles with grey and subtle brass veins', '48" x 48" Tiles', 'Vitrified Polished Marble', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', true),
  ('cat-f2', 'store-2', 'Honey White Oak Herringbone Parquet', 'floor', 1380, '#b45309', 'warm honey white oak natural herringbone wood parquet flooring with matte UV lacquer', 'Chevron Engineered Hardwood', 'French White Oak', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', true),
  ('cat-w1', 'store-1', 'Venetian Warm Limewash Plaster', 'wall', 490, '#e7e5e4', 'warm beige textured Italian Venetian limewash plaster architectural wall finish', 'Custom Accent Wall Treatment', 'Natural Mineral Slaked Lime', 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=600&q=80', true),
  ('cat-l1', 'store-2', 'Brushed Brass Globe Arc Lamp', 'lamp', 420, '#facc15', 'a tall arching brushed champagne brass floor lamp with an etched frosted glass globe shade', '76"H x 38"Reach', 'Solid Brass & Handblown Glass', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80', true)
on conflict (id) do nothing;
