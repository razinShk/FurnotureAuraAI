import React, { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { SignIn, SignUp, useUser, useClerk } from '@clerk/clerk-react';

export default function AuthPage({ 
  currentUser, 
  activeRole, 
  initialTab = 'signin',
  onNavigate 
}) {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
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

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121110] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      
      {/* Top Header */}
      <header className="px-4 sm:px-8 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-brand-600 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
            FA
          </span>
          <span className="font-extrabold tracking-tight text-sm font-serif">
            FurnitureAura<span className="text-brand-500 font-sans ml-0.5">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('studio')}
            className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold transition-colors"
          >
            Launch Studio
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
        
        {/* Title Header */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-bold mb-1">
            <Lock size={13} />
            <span>Identity & Access Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight font-serif">
            Sign In & Platform Access
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Secure authentication for Studio Clients, B2B Showroom Retailers, and Administrators.
          </p>
        </div>

        {/* Current Active Account Card (Only shown if signed in) */}
        {isSignedIn && currentUser && (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-extrabold text-xl shrink-0">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-white">
                    {currentUser.name}
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                    activeRole === 'admin'
                      ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-500/30'
                      : activeRole === 'biller'
                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                      : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                  }`}>
                    {roleLabel[activeRole] || activeRole}
                  </span>

                  {isSuperAdmin && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-500 text-white flex items-center gap-1 shadow-sm">
                      <Crown size={11} />
                      Platform Admin
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {currentUser.email} • <span className="font-bold text-stone-700 dark:text-stone-300">{currentUser.credits ?? 0} AI Credits Remaining</span>
                </div>
              </div>
            </div>

            {/* Role-Specific Portal Links */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {activeRole === 'admin' && (
                <button
                  onClick={() => onNavigate('admin')}
                  className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5"
                >
                  <Shield size={14} />
                  <span>Super Admin Console</span>
                </button>
              )}

              {(activeRole === 'biller' || activeRole === 'admin') && (
                <button
                  onClick={() => onNavigate('biller')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <Store size={14} />
                  <span>Showroom Portal</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('studio')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Launch Studio</span>
              </button>

              <button
                onClick={() => signOut()}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Navigation Tabs */}
        <div className="flex p-1.5 rounded-2xl bg-stone-200/80 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 mb-8 max-w-lg mx-auto w-full">
          <button
            onClick={() => handleTabChange('signin')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-stone-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => handleTabChange('signup')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-stone-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <UserPlus size={15} />
            <span>Sign Up</span>
          </button>

          <button
            onClick={() => handleTabChange('roles')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-stone-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={15} />
            <span>Platform Roles</span>
          </button>
        </div>

        {/* TAB 1: DEDICATED SIGN IN */}
        {activeTab === 'signin' && (
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center">
              {hasClerkKey ? (
                <div className="w-full flex justify-center clerk-auth-container">
                  <SignIn 
                    routing="hash"
                    afterSignInUrl="/"
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-0 p-0 bg-transparent"
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-stone-500">Authentication service is configured.</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 w-full text-center">
                <span className="text-xs text-stone-500">Don't have an account yet? </span>
                <button
                  onClick={() => handleTabChange('signup')}
                  className="text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Sign up with 100 free credits
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEDICATED SIGN UP */}
        {activeTab === 'signup' && (
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center">
              <div className="w-full mb-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 flex items-center gap-2.5 text-xs text-brand-700 dark:text-brand-300 font-bold">
                <Sparkles size={16} className="text-brand-500 shrink-0" />
                <span>Get 100 Free Starter AI Credits on Registration</span>
              </div>

              {hasClerkKey ? (
                <div className="w-full flex justify-center clerk-auth-container">
                  <SignUp 
                    routing="hash"
                    afterSignUpUrl="/"
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none border-0 p-0 bg-transparent"
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-stone-500">Authentication service is active.</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 w-full text-center">
                <span className="text-xs text-stone-500">Already registered? </span>
                <button
                  onClick={() => handleTabChange('signin')}
                  className="text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Sign in to your account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM ROLES EXPLANATION (Informative, No Privilege Escalation) */}
        {activeTab === 'roles' && (
          <div className="space-y-4 max-w-2xl mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-white font-serif">
                Platform Account Roles
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Learn about specialized platform capabilities for customers, retailers, and administrators.
              </p>
            </div>

            {/* 1. Customer Studio */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <User size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                      Interior Studio Client
                    </h3>
                    <span className="text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      Standard Member
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Upload room photos, detect architectural components with AI vision, stage luxury furniture, and request quotes.
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    Includes 100 starter AI credits upon registration with multi-session project auto-saving.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => handleTabChange('signup')}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center"
              >
                <span>Register Free</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 2. Showroom Retailer */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-600/20 border border-amber-200 dark:border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Store size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                      Showroom Retailer (Store Owner)
                    </h3>
                    <span className="text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
                      B2B Partner
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    List showroom furniture collections, manage real-time pricing, view customer staging events, and respond to quote inquiries.
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    Requires verification by platform administrator. Includes 850 monthly AI credits.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => onNavigate('catalog')}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center"
              >
                <span>Browse Catalog</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 3. Platform Super Admin */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/20 border border-brand-200 dark:border-brand-400/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                  <Shield size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-stone-900 dark:text-white">
                      Platform Administrator
                    </h3>
                    <span className="text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-extrabold shadow-sm">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Global platform control, database telemetry, prediction logging, user management, and credit allocation.
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    Restricted strictly to authorized platform administrators.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => handleTabChange('signin')}
                className="px-5 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-500/25 flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center"
              >
                <span>Admin Sign In</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
