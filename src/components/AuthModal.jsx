import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Shield, 
  User, 
  Store, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  Briefcase 
} from 'lucide-react';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';

export default function AuthModal({ isOpen, onClose, onSelectDemoUser, activeRole }) {
  const { isDark } = useTheme();
  const [authView, setAuthView] = useState('clerk'); // 'clerk' or 'personas'
  const [clerkMode, setClerkMode] = useState('sign-in'); // 'sign-in' or 'sign-up'
  const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Clerk B2B Authentication
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in to your showroom, studio account, or admin console
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/40">
          <button
            onClick={() => setAuthView('clerk')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
              authView === 'clerk'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 bg-white dark:bg-indigo-500/10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Lock size={14} />
            <span>Clerk Cloud Auth</span>
          </button>
          <button
            onClick={() => setAuthView('personas')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
              authView === 'personas'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 bg-white dark:bg-indigo-500/10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Instant B2B Roles</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {authView === 'clerk' ? (
            <div className="flex flex-col items-center">
              {hasClerkKey ? (
                <div className="w-full flex flex-col items-center">
                  {/* Mode switch */}
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-6">
                    <button
                      onClick={() => setClerkMode('sign-in')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        clerkMode === 'sign-in'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setClerkMode('sign-up')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        clerkMode === 'sign-up'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <div className="w-full flex justify-center clerk-auth-container">
                    {clerkMode === 'sign-in' ? (
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
                    ) : (
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
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Clerk publishable key missing in .env
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Select your specialized B2B role to immediately test platform capabilities:
              </p>

              {/* Super Admin Persona */}
              <button
                onClick={() => {
                  onSelectDemoUser({
                    id: 'user-admin',
                    name: 'Razin Sheikh (Super Admin)',
                    email: 'admin@furnitureaura.ai',
                    role: 'admin',
                    credits: 5000,
                    plan: 'Super Admin Unlimited'
                  });
                  onClose();
                }}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-500 text-left transition-all group flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-400/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <Shield size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Super Admin</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold">
                        Global Access
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Oversee real platform users, allocate AI credits, monitor Replicate pipelines
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </button>

              {/* Store Owner (Biller) Persona */}
              <button
                onClick={() => {
                  onSelectDemoUser({
                    id: 'user-biller-1',
                    name: 'Showroom Retailer (Biller)',
                    email: 'biller@aura.ai',
                    role: 'biller',
                    credits: 850,
                    plan: 'Retailer Pro',
                    storeId: 'store-1'
                  });
                  onClose();
                }}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-amber-500/30 hover:border-amber-500 dark:hover:border-amber-500 text-left transition-all group flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-600/30 border border-amber-200 dark:border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <Store size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Store Owner (Biller)</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold">
                        Showroom Owner
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      List real showroom catalog items, view customer staging events and quote inquiries
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
              </button>

              {/* Customer Persona */}
              <button
                onClick={() => {
                  onSelectDemoUser({
                    id: 'user-customer-1',
                    name: 'Interior Studio Customer',
                    email: 'studio@client.com',
                    role: 'customer',
                    credits: 100,
                    plan: 'Studio Pro'
                  });
                  onClose();
                }}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Studio Customer</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                        Architect / Client
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Upload room photos, stage luxury furniture with Replicate, request quotes
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
