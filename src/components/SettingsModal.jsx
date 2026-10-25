import React, { useState } from 'react';
import { 
  X, 
  User, 
  Sun, 
  Moon, 
  Sparkles, 
  Trash2, 
  LogOut, 
  Check, 
  ShieldCheck, 
  Layers,
  Palette
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [clearedSuccess, setClearedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClearDrafts = () => {
    try {
      localStorage.removeItem('aura_studio_session_v3');
      localStorage.removeItem('aura_recent_creations');
      setClearedSuccess(true);
      setTimeout(() => setClearedSuccess(false), 2000);
    } catch (e) {
      console.warn('Clear drafts note:', e);
    }
  };

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const isSuperAdmin = email.toLowerCase() === 'razinshaikh3133@gmail.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Studio & Account Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personalize workspace and manage preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* User Account Card */}
          {isSignedIn && user ? (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-extrabold flex items-center justify-center text-lg shrink-0">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-stone-900 dark:text-white truncate">
                    {user.fullName || user.firstName || 'Studio Member'}
                  </div>
                  <div className="text-xs text-stone-500 truncate">{email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck size={11} />
                      {isSuperAdmin ? 'Super Admin' : 'Verified Member'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">Guest Visitor Mode</div>
                <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">Sign in to save room staging projects and unlock 100 free AI credits.</div>
              </div>
            </div>
          )}

          {/* Theme / Appearance Preference */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
              <Sun size={14} className="text-brand-500" />
              <span>Studio Appearance & Lighting</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  theme === 'light'
                    ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500/20'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Sun size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">Light Studio</div>
                  <div className="text-[10px] text-stone-400">Warm editorial alabaster</div>
                </div>
                {theme === 'light' && <Check size={16} className="ml-auto text-brand-500" />}
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  theme === 'dark'
                    ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500/20'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-stone-800 text-stone-200 flex items-center justify-center shrink-0">
                  <Moon size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">Dark Studio</div>
                  <div className="text-[10px] text-stone-400">Obsidian night canvas</div>
                </div>
                {theme === 'dark' && <Check size={16} className="ml-auto text-brand-500" />}
              </button>
            </div>
          </div>

          {/* Local Studio Cache / Storage Management */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-brand-500" />
              <span>Canvas Cache & Staged Drafts</span>
            </label>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Local Canvas Session</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {clearedSuccess ? 'Drafts cleared from local storage.' : 'Clear temporary room photos cached in your browser.'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearDrafts}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} />
                <span>{clearedSuccess ? 'Cleared' : 'Reset Canvas'}</span>
              </button>
            </div>
          </div>

          {/* Sign Out / Security */}
          {isSignedIn && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Active session</span>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
