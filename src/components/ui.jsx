import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Bottom sheet on phones, centered dialog on tablets/desktop.
 * Built on native <dialog> + showModal() for focus trapping, Esc handling and inert background.
 */
export function Sheet({ open, onClose, title, subtitle, icon, children, footer, size = 'md', bodyClassName = 'p-5' }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`sheet ${size === 'lg' ? 'sheet-lg' : ''} ${size === 'full' ? 'sheet-full' : ''}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose?.();
      }}
    >
      {open && (
        <div className="sheet-inner">
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <span className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>
          {(title || subtitle) && (
            <div className="flex items-start justify-between gap-3 px-5 pt-2 sm:pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                {icon && (
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  {title && <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">{title}</h2>}
                  {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-10 h-10 shrink-0 -mr-2 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div className={`sheet-body ${bodyClassName}`}>{children}</div>
          {footer && (
            <div className="sheet-footer px-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400'
  };
  return (
    <div className="min-w-[150px] flex-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        {icon && <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="py-14 px-6 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40">
      {icon && (
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5 flex justify-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div role="tablist" className="inline-flex w-full sm:w-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
              active
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {opt.label}
            {typeof opt.count === 'number' && (
              <span className="ml-1.5 text-xs font-semibold text-slate-400">{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 min-h-[36px] px-3.5 rounded-full text-sm font-semibold border transition-colors ${
        active
          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

export const inputClass =
  'w-full min-h-[44px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-40 disabled:pointer-events-none';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none';
