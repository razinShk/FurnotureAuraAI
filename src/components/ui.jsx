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
            <div className="flex items-start justify-between gap-3 px-5 pt-2 sm:pt-5 pb-3 border-b border-stone-200/70 dark:border-stone-800">
              <div className="flex items-center gap-3 min-w-0">
                {icon && (
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  {title && <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 truncate">{title}</h2>}
                  {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-10 h-10 shrink-0 -mr-2 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div className={`sheet-body ${bodyClassName}`}>{children}</div>
          {footer && (
            <div className="sheet-footer px-5 pt-3 border-t border-stone-200/70 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95">
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
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-900 dark:text-stone-100">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    violet: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
  };
  return (
    <div className="min-w-[150px] flex-1 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">{label}</span>
        {icon && <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone] || tones.brand}`}>{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-stone-400 mt-0.5">{hint}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="py-14 px-6 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/40">
      {icon && (
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100">{title}</h3>
      {description && <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5 flex justify-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div role="tablist" className="inline-flex w-full sm:w-auto p-1 rounded-xl bg-stone-100 dark:bg-stone-800/80">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              active
                ? 'bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            {opt.label}
            {typeof opt.count === 'number' && (
              <span className="ml-1.5 text-xs font-semibold text-stone-400">{opt.count}</span>
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
      className={`shrink-0 min-h-[36px] px-3.5 rounded-full text-sm font-semibold border transition-all ${
        active
          ? 'bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-500/20'
          : 'bg-white text-stone-700 border-stone-200 hover:border-brand-500/40 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-800'
      }`}
    >
      {children}
    </button>
  );
}

export const inputClass =
  'w-full min-h-[44px] bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all';

export const labelClass = 'block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm font-bold shadow-sm shadow-brand-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none';
