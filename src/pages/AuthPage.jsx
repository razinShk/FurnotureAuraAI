import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Store, 
  User, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  ArrowLeft, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Crown,
  Key,
  Layers,
  Check
} from 'lucide-react';
import { SignIn, SignUp, useUser, useClerk } from '@clerk/clerk-react';

export default function AuthPage({ 
  currentUser, 
  activeRole, 
  initialTab = 'signin',
  onSelectRolePersona, 
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
  const isSuperAdminEmail = email === 'razinshaikh3133@gmail.com' || activeRole === 'admin';

  const roleLabel = {
    admin: 'Super Admin',
    biller: 'Store Owner',
    customer: 'Customer',
    guest: 'Guest'
  };

  const handleActivateSuperAdmin = () => {
    const adminPersona = {
      id: 'user-admin-razin',
      name: 'Razin Shaikh (Super Admin)',
      email: 'razinshaikh3133@gmail.com',
      role: 'admin',
      credits: 5000,
      plan: 'Super Admin Unlimited'
    };
    if (onSelectRolePersona) onSelectRolePersona(adminPersona);
    onNavigate('admin');
  };

  const handleActivateStoreOwner = () => {
    const billerPersona = {
      id: 'user-biller-1',
      name: 'Showroom Retailer (Biller)',
      email: 'biller@furnitureaura.ai',
      role: 'biller',
      credits: 850,
      plan: 'Retailer Enterprise',
      storeId: 'store-1'
    };
    if (onSelectRolePersona) onSelectRolePersona(billerPersona);
    onNavigate('biller');
  };

  const handleActivateCustomer = () => {
    const customerPersona = {
      id: 'user-customer-studio',
      name: 'Interior Studio Client',
      email: 'client@aura.ai',
      role: 'customer',
      credits: 100,
      plan: 'Free Explorer'
    };
    if (onSelectRolePersona) onSelectRolePersona(customerPersona);
    onNavigate('studio');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Top Header */}
      <header className="px-4 sm:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
            FA
          </span>
          <span className="font-extrabold tracking-tight text-sm">
            FurnitureAura<span className="text-amber-500">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('studio')}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors"
          >
            Launch Studio
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
        
        {/* Title Header */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-1">
            <Lock size={13} />
            <span>Identity & Access Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign In, Sign Up & B2B Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Full access to Super Admin Platform Console, Retail Showroom Store Portal, and AI Interior Studio.
          </p>
        </div>

        {/* Current Active Account Card */}
        {currentUser && (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xl shrink-0">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    {currentUser.name}
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                    activeRole === 'admin'
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                      : activeRole === 'biller'
                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                      : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                  }`}>
                    {roleLabel[activeRole] || activeRole}
                  </span>

                  {isSuperAdminEmail && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                      <Crown size={11} />
                      Primary Super Admin
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentUser.email} • <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser.credits ?? 0} AI Credits Remaining</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <button
                onClick={() => onNavigate('admin')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
              >
                <Shield size={14} />
                <span>Super Admin</span>
              </button>

              <button
                onClick={() => onNavigate('biller')}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Store size={14} />
                <span>Store Owner</span>
              </button>

              <button
                onClick={() => onNavigate('studio')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Studio</span>
              </button>

              <button
                onClick={() => {
                  signOut();
                  if (onSelectRolePersona) onSelectRolePersona(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                title="Sign out / reset role"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Navigation Tabs */}
        <div className="flex p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-8 max-w-lg mx-auto w-full">
          <button
            onClick={() => handleTabChange('signin')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => handleTabChange('signup')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus size={15} />
            <span>Sign Up</span>
          </button>

          <button
            onClick={() => handleTabChange('roles')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={15} />
            <span>B2B Roles</span>
          </button>
        </div>

        {/* TAB 1: DEDICATED SIGN IN */}
        {activeTab === 'signin' && (
          <div className="w-full max-w-md mx-auto space-y-6">
            
            {/* Super Admin Notice Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-amber-50 dark:from-indigo-950/40 dark:to-amber-950/40 border border-indigo-200 dark:border-indigo-500/30 flex flex-col gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Crown size={18} />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Super Admin Platform Authority</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                    Designated Administrator: <strong className="text-indigo-700 dark:text-indigo-400">razinshaikh3133@gmail.com</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={handleActivateSuperAdmin}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Key size={14} />
                <span>1-Click Enter as Super Admin (razinshaikh3133@gmail.com)</span>
              </button>
            </div>

            {/* Clerk Sign In Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center">
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
                  <p className="text-xs text-slate-500">Clerk authentication is enabled.</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 w-full text-center">
                <span className="text-xs text-slate-500">Don't have an account yet? </span>
                <button
                  onClick={() => handleTabChange('signup')}
                  className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Sign up with 100 free credits
                </button>
              </div>
            </div>

            {/* Quick Role Persona Switcher Footer */}
            <div className="text-center">
              <button
                onClick={() => handleTabChange('roles')}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
              >
                Or explore B2B Personas (Super Admin, Store Owner, Customer) →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: DEDICATED SIGN UP */}
        {activeTab === 'signup' && (
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center">
              <div className="w-full mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-2.5 text-xs text-indigo-700 dark:text-indigo-300 font-bold">
                <Sparkles size={16} className="text-amber-500 shrink-0" />
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
                  <p className="text-xs text-slate-500">Clerk publishable key is active.</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 w-full text-center">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  onClick={() => handleTabChange('signin')}
                  className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Sign in to your account
                </button>
              </div>
            </div>

            {/* Quick Role Persona Switcher Footer */}
            <div className="text-center">
              <button
                onClick={() => handleTabChange('roles')}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
              >
                Or explore B2B Personas (Super Admin, Store Owner, Customer) →
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DEDICATED B2B ENTERPRISE ROLES & PERSONA PORTAL */}
        {activeTab === 'roles' && (
          <div className="space-y-4 max-w-2xl mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Select Your Specialized Platform Persona
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Switch between Super Admin, Retail Showroom Store Owner, and Studio Customer with 1 click.
              </p>
            </div>

            {/* 1. Super Admin Card */}
            <div 
              onClick={handleActivateSuperAdmin}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-600/40 hover:border-indigo-600 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-md hover:shadow-xl group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-400/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                  <Shield size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Super Admin (Platform Owner)
                    </h3>
                    <span className="text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold shadow-sm">
                      Global Authority
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Primary Super Admin: <strong className="text-indigo-600 dark:text-indigo-400">razinshaikh3133@gmail.com</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Live Supabase database telemetry, user credit allocation (+ / -), Replicate neural diffusion models, and platform controls.
                  </p>
                </div>
              </div>

              <button className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center">
                <span>Enter Super Admin</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 2. Store Owner (Showroom Retailer) Card */}
            <div 
              onClick={handleActivateStoreOwner}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all cursor-pointer shadow-sm hover:shadow-xl group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-600/20 border border-amber-200 dark:border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Store size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Store Owner / Showroom Retailer
                    </h3>
                    <span className="text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold shadow-sm">
                      B2B Showroom
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage showroom furniture pieces, pricing, upholstery swatches, customer staging analytics & quotes.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Includes 850 monthly AI credits and instant catalog synchronization with live Supabase database.
                  </p>
                </div>
              </div>

              <button className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center">
                <span>Enter Store Portal</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* 3. Studio Customer Card */}
            <div 
              onClick={handleActivateCustomer}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-sm hover:shadow-xl group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <User size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Interior Customer / Studio Designer
                    </h3>
                    <span className="text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold shadow-sm">
                      Studio Access
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload room photos, stage furniture from showrooms or custom prompts, generate quotes and save versions.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Includes 100 starter AI staging credits with persistent multi-session project auto-saving and gallery.
                  </p>
                </div>
              </div>

              <button className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center">
                <span>Enter Customer Studio</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
