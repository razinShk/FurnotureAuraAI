import React, { useState } from 'react';
import { X, Lock, Sparkles } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/clerk-react';

export default function AuthModal({ isOpen, onClose }) {
  const [clerkMode, setClerkMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 dark:border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 font-serif">
                {clerkMode === 'sign-in' ? 'Sign In to FurnitureAura' : 'Create an Account'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {clerkMode === 'sign-in' 
                  ? 'Access your studio projects and credits' 
                  : 'Get 100 free starter credits upon registration'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-1.5 m-5 mb-0 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setClerkMode('sign-in')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              clerkMode === 'sign-in'
                ? 'bg-white dark:bg-stone-700 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setClerkMode('sign-up')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              clerkMode === 'sign-up'
                ? 'bg-white dark:bg-stone-700 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <span>Sign Up</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-extrabold">+100</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 flex flex-col items-center">
          {hasClerkKey ? (
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
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">Authentication service is configured.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
