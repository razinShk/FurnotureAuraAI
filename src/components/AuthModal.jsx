import React, { useState, useMemo } from 'react';
import { X, Lock, Sparkles, Info } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';

export default function AuthModal({ isOpen, onClose }) {
  const [clerkMode, setClerkMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const { isDark } = useTheme();
  const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

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
      header: "hidden",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c59b63]/15 border border-[#c59b63]/30 flex items-center justify-center text-[#c59b63]">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 font-serif">
                {clerkMode === 'sign-in' ? 'Sign In to Studio' : 'Create an Account'}
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
        <div className="flex p-1.5 m-5 mb-0 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80">
          <button
            onClick={() => setClerkMode('sign-in')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              clerkMode === 'sign-in'
                ? 'bg-white dark:bg-stone-700 text-[#c59b63] dark:text-[#c59b63] shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setClerkMode('sign-up')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              clerkMode === 'sign-up'
                ? 'bg-white dark:bg-stone-700 text-[#c59b63] dark:text-[#c59b63] shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <span>Sign Up</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-50 dark:bg-brand-950/60 text-[#c59b63] font-extrabold">+100</span>
          </button>
        </div>

        {/* Notice Banner */}
        <div className="px-5 pt-3">
          {clerkMode === 'sign-in' ? (
            <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2">
              <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>First time with this Google email? Click <strong>Sign Up</strong> above to create your account first.</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-brand-50/80 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/40 text-brand-900 dark:text-brand-200 text-[11px] flex items-center gap-2">
              <Sparkles size={14} className="text-[#c59b63] shrink-0" />
              <span>Includes 100 complimentary AI Staging Credits on registration.</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 pt-3 flex flex-col items-center">
          {hasClerkKey ? (
            <div className="w-full flex justify-center clerk-auth-container">
              {clerkMode === 'sign-in' ? (
                <SignIn 
                  routing="hash"
                  signUpUrl="#signup"
                  fallbackRedirectUrl="/#studio"
                  signUpFallbackRedirectUrl="/#studio"
                  appearance={clerkAppearance}
                />
              ) : (
                <SignUp 
                  routing="hash"
                  signInUrl="#signin"
                  fallbackRedirectUrl="/#studio"
                  signInFallbackRedirectUrl="/#studio"
                  appearance={clerkAppearance}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-stone-500">Authentication service is configured.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
