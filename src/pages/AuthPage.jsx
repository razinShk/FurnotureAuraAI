import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Store, 
  User, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Crown,
  CheckCircle2,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import { SignIn, SignUp, useUser, useClerk } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';

export default function AuthPage({ 
  currentUser, 
  activeRole, 
  initialTab = 'signin',
  onNavigate 
}) {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { isDark, toggleTheme } = useTheme();
  const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  // Tab: 'signin' | 'signup' | 'roles'
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['signin', 'signup', 'roles'].includes(hash)) return hash;
    }
    return initialTab;
  });

  useEffect(() => {
    if (initialTab && ['signin', 'signup', 'roles'].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // When authentication succeeds, directly take the user to the studio
  useEffect(() => {
    if (isSignedIn) {
      onNavigate('studio');
    }
  }, [isSignedIn, onNavigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  const email = (user?.primaryEmailAddress?.emailAddress || currentUser?.email || '').toLowerCase();
  const isSuperAdmin = email === 'razinshaikh3133@gmail.com' || activeRole === 'admin';

  const roleLabel = {
    admin: 'Super Admin',
    biller: 'Showroom Owner',
    customer: 'Studio Client',
    guest: 'Visitor'
  };

  // Bespoke luxury Clerk appearance tokens matching Warm Luxury Editorial design
  const clerkAppearance = useMemo(() => ({
    variables: {
      colorPrimary: '#c59b63',
      colorText: isDark ? '#faf8f5' : '#1c1917',
      colorTextSecondary: isDark ? '#a8a29e' : '#78716c',
      colorBackground: isDark ? '#161514' : '#ffffff',
      colorInputBackground: isDark ? '#1a1918' : '#faf8f5',
      colorInputText: isDark ? '#faf8f5' : '#1c1917',
      borderRadius: '0.75rem',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    elements: {
      rootBox: "w-full",
      card: "shadow-none border-0 p-0 bg-transparent w-full",
      header: "hidden", // Replaced with bespoke editorial serif headlines
      socialButtonsBlockButton: "rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold py-2.5 transition-all shadow-sm",
      socialButtonsBlockButtonText: "text-xs font-semibold text-stone-700 dark:text-stone-300",
      dividerLine: "bg-stone-200 dark:bg-stone-800",
      dividerText: "text-[11px] text-stone-400 dark:text-stone-500 uppercase tracking-wider font-semibold",
      formFieldLabel: "text-xs font-bold text-stone-700 dark:text-stone-300 mb-1",
      formFieldInput: "rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:border-[#c59b63] focus:ring-2 focus:ring-[#c59b63]/20 text-xs py-2.5 text-stone-900 dark:text-stone-100 transition-all",
      formButtonPrimary: "rounded-xl bg-[#c59b63] hover:bg-[#b3884d] active:bg-[#9e763e] text-white font-bold text-xs py-3 shadow-md shadow-[#c59b63]/25 transition-all",
      footerActionText: "text-xs text-stone-500 dark:text-stone-400",
      footerActionLink: "text-xs font-bold text-[#c59b63] hover:text-[#b3884d] transition-colors",
      alert: "rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-300 shadow-sm",
      alertText: "text-xs font-medium text-rose-800 dark:text-rose-300 leading-relaxed"
    }
  }), [isDark]);

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121110] text-stone-900 dark:text-stone-100 flex transition-colors duration-200">
      
      {/* =========================================================================
          LEFT COLUMN: Luxury Architectural Showcase (Desktop Only, lg+)
          ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-12 bg-[#121110] text-white relative overflow-hidden border-r border-stone-800/80">
        
        {/* Subtle Ambient Architectural Lighting Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#c59b63]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Top Brand Lockup */}
        <div className="relative z-10">
          <button 
            onClick={() => onNavigate('landing')} 
            className="flex items-center gap-3 group text-left"
            title="Return to Home"
          >
            <img
              src="/furnipeek-logo.jpg"
              alt="FurniPeek Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-[#c59b63]/20 border border-[#c59b63]/40 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="font-serif font-bold tracking-tight text-xl text-white">
                Furni<span className="text-[#c59b63]">Peek</span><span className="text-[#c59b63] font-sans ml-1 text-xs font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#c59b63]/15 border border-[#c59b63]/30">AI</span>
              </div>
              <div className="text-[10px] tracking-widest uppercase text-stone-400 font-bold">
                AI Furniture Preview & Flat Redesign
              </div>
            </div>
          </button>
        </div>

        {/* Center Editorial Statement */}
        <div className="relative z-10 my-auto py-12 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-[#c59b63] text-xs font-bold tracking-wide">
            <Sparkles size={13} className="text-[#c59b63]" />
            <span>Generative Staging Intelligence</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white font-serif tracking-tight leading-[1.2]">
            Where Architectural Space Meets Generative Precision.
          </h2>

          <p className="text-sm text-stone-300 leading-relaxed font-light">
            Curate showroom collections, align photorealistic natural room lighting, and present breathtaking staging visualizations to clients in seconds.
          </p>

          <div className="pt-4 space-y-3.5 border-t border-stone-800/80">
            <div className="flex items-center gap-3 text-xs text-stone-300">
              <span className="w-6 h-6 rounded-lg bg-[#c59b63]/15 border border-[#c59b63]/30 text-[#c59b63] flex items-center justify-center shrink-0">
                <Store size={14} />
              </span>
              <span><strong>Curated Showroom Catalogs</strong> — Multi-brand luxury designer items</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-300">
              <span className="w-6 h-6 rounded-lg bg-[#c59b63]/15 border border-[#c59b63]/30 text-[#c59b63] flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </span>
              <span><strong>Millimeter-Scale Placement</strong> — Authentic spatial geometry & lighting</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-300">
              <span className="w-6 h-6 rounded-lg bg-[#c59b63]/15 border border-[#c59b63]/30 text-[#c59b63] flex items-center justify-center shrink-0">
                <Shield size={14} />
              </span>
              <span><strong>Enterprise Security</strong> — Supabase PostgreSQL Row-Level Security</span>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Testimonial */}
        <div className="relative z-10 pt-6 border-t border-stone-800/60">
          <p className="text-xs italic text-stone-400 font-serif leading-relaxed">
            “FurniPeek transforms empty architectural voids into bespoke showroom environments before our first physical consultation.”
          </p>
          <div className="text-[11px] text-stone-500 font-sans mt-1.5 font-medium">
            — Studio Atelier, Milan Architectural Showcase
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Dedicated Authentication Portal
          ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
        
        {/* Navigation Bar inside Auth Container */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-[#c59b63] dark:hover:text-[#c59b63] transition-colors py-1.5 px-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60"
          >
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors shadow-sm"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Central Auth Card Container */}
        <div className="w-full max-w-md mx-auto my-auto py-4">

          {/* Mobile Logo (Shown only on small viewports where left column is hidden) */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <img
                src="/furnipeek-logo.jpg"
                alt="FurniPeek Logo"
                className="w-9 h-9 rounded-xl object-cover shadow-md border border-[#c59b63]/40"
              />
              <span className="font-serif font-bold tracking-tight text-lg text-stone-900 dark:text-stone-100">
                Furni<span className="text-[#c59b63]">Peek</span><span className="text-[#c59b63] font-sans ml-0.5 text-xs font-extrabold uppercase">AI</span>
              </span>
            </div>
          </div>

          {/* ===================================================================
              CASE 1: CURRENTLY SIGNED IN USER
              =================================================================== */}
          {isSignedIn && currentUser ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
                  <CheckCircle2 size={13} />
                  <span>Authenticated Session</span>
                </div>
                <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white font-serif">
                  Welcome, {currentUser.name}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {currentUser.email}
                </p>
              </div>

              {/* Status & Credits Info */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
                    Platform Role
                  </div>
                  <div className="text-xs font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 mt-0.5">
                    {isSuperAdmin && <Crown size={12} className="text-[#c59b63]" />}
                    <span>{roleLabel[activeRole] || activeRole}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
                    AI Credits
                  </div>
                  <div className="text-sm font-extrabold text-[#c59b63] tabular-nums mt-0.5">
                    {currentUser.credits ?? 0} Credits
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => onNavigate('studio')}
                  className="w-full py-3 px-4 rounded-xl bg-[#c59b63] hover:bg-[#b3884d] text-white font-bold text-xs shadow-md shadow-[#c59b63]/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles size={16} />
                  <span>Launch AI Staging Studio</span>
                </button>

                {activeRole === 'admin' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Shield size={15} />
                    <span>Super Admin Console</span>
                  </button>
                )}

                {(activeRole === 'biller' || activeRole === 'admin') && (
                  <button
                    onClick={() => onNavigate('biller')}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Store size={15} />
                    <span>Showroom Retailer Portal</span>
                  </button>
                )}

                <button
                  onClick={() => signOut()}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* ===================================================================
               CASE 2: GUEST / AUTHENTICATION PORTAL (SIGN IN / SIGN UP)
               =================================================================== */
            <div className="space-y-6">
              
              {/* Clean Editorial Title */}
              <div className="text-center space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white font-serif tracking-tight">
                  {activeTab === 'signin' && 'Welcome Back'}
                  {activeTab === 'signup' && 'Create Your Studio Account'}
                  {activeTab === 'roles' && 'Platform Roles & Tiers'}
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-normal">
                  {activeTab === 'signin' && 'Sign in to access your staging canvas, saved projects, and AI credits.'}
                  {activeTab === 'signup' && 'Register today to receive 100 complimentary starter staging credits.'}
                  {activeTab === 'roles' && 'Explore specialized capabilities for clients, showroom retailers, and administrators.'}
                </p>
              </div>

              {/* Segmented Mode Switcher */}
              <div className="flex p-1.5 rounded-2xl bg-stone-200/70 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full shadow-inner">
                <button
                  onClick={() => handleTabChange('signin')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'signin'
                      ? 'bg-white dark:bg-stone-800 text-[#c59b63] dark:text-[#c59b63] shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => handleTabChange('signup')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'signup'
                      ? 'bg-white dark:bg-stone-800 text-[#c59b63] dark:text-[#c59b63] shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus size={14} />
                  <span>Create Account</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-50 dark:bg-brand-950/60 text-[#c59b63] font-extrabold">+100</span>
                </button>

                <button
                  onClick={() => handleTabChange('roles')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    activeTab === 'roles'
                      ? 'bg-white dark:bg-stone-800 text-[#c59b63] dark:text-[#c59b63] shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Roles</span>
                </button>
              </div>

              {/* -------------------- TAB: SIGN IN -------------------- */}
              {activeTab === 'signin' && (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                  
                  {/* Google OAuth Guidance Banner */}
                  <div className="mb-5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                    <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold">First time using this Google account? </span>
                      <span>Switch to </span>
                      <button 
                        onClick={() => handleTabChange('signup')}
                        className="font-extrabold underline text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100"
                      >
                        Create Account
                      </button>
                      <span> to register in one click. Existing Google accounts sign in directly below.</span>
                    </div>
                  </div>

                  {/* Clerk Authentication Component */}
                  {hasClerkKey ? (
                    <div className="w-full flex justify-center clerk-auth-container">
                      <SignIn 
                        routing="hash"
                        signUpUrl="#signup"
                        forceRedirectUrl="/#studio"
                        fallbackRedirectUrl="/#studio"
                        signUpForceRedirectUrl="/#studio"
                        signUpFallbackRedirectUrl="/#studio"
                        appearance={clerkAppearance}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-stone-500">Authentication service is configured.</p>
                    </div>
                  )}

                  {/* Footer link to Sign Up */}
                  <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 w-full text-center">
                    <span className="text-xs text-stone-500 dark:text-stone-400">Don't have an account yet? </span>
                    <button
                      onClick={() => handleTabChange('signup')}
                      className="text-xs font-bold text-[#c59b63] hover:text-[#b3884d] hover:underline transition-colors"
                    >
                      Create account with 100 free credits →
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------- TAB: CREATE ACCOUNT (SIGN UP) -------------------- */}
              {activeTab === 'signup' && (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                  
                  {/* Starter Credits Promotion Banner */}
                  <div className="mb-5 p-3 rounded-xl bg-brand-50/80 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/40 text-brand-900 dark:text-brand-200 text-xs flex items-center gap-2.5">
                    <Sparkles size={16} className="text-[#c59b63] shrink-0" />
                    <span className="font-bold">Includes 100 complimentary AI Staging Credits upon registration.</span>
                  </div>

                  {/* Clerk Sign Up Component */}
                  {hasClerkKey ? (
                    <div className="w-full flex justify-center clerk-auth-container">
                      <SignUp 
                        routing="hash"
                        signInUrl="#signin"
                        forceRedirectUrl="/#studio"
                        fallbackRedirectUrl="/#studio"
                        signInForceRedirectUrl="/#studio"
                        signInFallbackRedirectUrl="/#studio"
                        appearance={clerkAppearance}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-stone-500">Authentication service is active.</p>
                    </div>
                  )}

                  {/* Footer link to Sign In */}
                  <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 w-full text-center">
                    <span className="text-xs text-stone-500 dark:text-stone-400">Already registered? </span>
                    <button
                      onClick={() => handleTabChange('signin')}
                      className="text-xs font-bold text-[#c59b63] hover:text-[#b3884d] hover:underline transition-colors"
                    >
                      Sign in to your account →
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------- TAB: PLATFORM ROLES -------------------- */}
              {activeTab === 'roles' && (
                <div className="space-y-4">
                  {/* 1. Customer Studio */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <User size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            Studio Client
                          </h3>
                          <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400">
                            Standard Membership
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleTabChange('signup')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                      >
                        Register
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      Upload living space photos, detect architectural components, stage luxury designer items, and request direct B2B pricing quotes. Includes 100 starter credits.
                    </p>
                  </div>

                  {/* 2. Showroom Retailer */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Store size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            Showroom Retailer
                          </h3>
                          <span className="text-[10px] uppercase font-extrabold text-amber-600 dark:text-amber-400">
                            B2B Partner Tier
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate('catalog')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors"
                      >
                        Catalog
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      Curate furniture catalog collections, manage real-time inventory and pricing, track customer staging impressions, and respond to quote inquiries.
                    </p>
                  </div>

                  {/* 3. Super Admin */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#c59b63]/15 border border-[#c59b63]/30 text-[#c59b63] flex items-center justify-center">
                          <Shield size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            Platform Administrator
                          </h3>
                          <span className="text-[10px] uppercase font-extrabold text-[#c59b63]">
                            Super Admin
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleTabChange('signin')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#c59b63] hover:bg-[#b3884d] text-white font-bold text-xs transition-colors"
                      >
                        Admin Log In
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      Global platform control, database telemetry, prediction log auditing, user profile administration, and atomic credit adjustments.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Discreet Footer Note */}
        <div className="text-center pt-6 text-[11px] text-stone-400 dark:text-stone-500">
          Protected by Supabase Row-Level Security & Clerk Identity Architecture
        </div>
      </div>
    </div>
  );
}
