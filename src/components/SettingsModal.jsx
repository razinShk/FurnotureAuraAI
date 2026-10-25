import React, { useState } from 'react';
import { X, Key, Cpu, Sparkles, Check, Info, Database } from 'lucide-react';
import { supabaseUrl } from '../lib/supabase';

export default function SettingsModal({ isOpen, onClose }) {
  const [replicateKey, setReplicateKey] = useState(
    localStorage.getItem('aura_replicate_key') ||
    import.meta.env.VITE_REPLICATE_API_KEY ||
    ''
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    localStorage.setItem('aura_replicate_key', replicateKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">API & Cloud Configuration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Replicate Unified Engine & Supabase BaaS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <Info size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Architecture Setup:</strong>
              <div className="mt-1 flex flex-col gap-1 text-slate-500 dark:text-slate-400">
                <span>• <strong>Backend-as-a-Service:</strong> Supabase (Auth, Postgres, Storage, Functions)</span>
                <span>• <strong>Room Vision & Tagging:</strong> Replicate Spatial Vision</span>
                <span>• <strong>Photorealistic Staging:</strong> Replicate Neural Staging</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key size={13} className="text-amber-500" />
                Replicate API Token (Unified AI Provider)
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
            </label>
            <input
              type="password"
              placeholder="r8_********************************"
              value={replicateKey}
              onChange={(e) => setReplicateKey(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono shadow-sm"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              ✨ <strong>Powers AI pipelines on Replicate:</strong> spatial vision analysis and high-precision room furniture staging.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database size={13} className="text-indigo-600 dark:text-indigo-400" />
                Connected Supabase Project
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Online</span>
            </label>
            <div className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center justify-between shadow-sm">
              <span className="truncate">{supabaseUrl}</span>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-500/30">
                BaaS Active
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {savedSuccess ? 'Settings applied successfully!' : 'Configured for production'}
            </span>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <Check size={14} />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
