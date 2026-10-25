import React, { useState } from 'react';
import { X, ShoppingBag, CheckCircle, ShieldCheck, ArrowRight, Store } from 'lucide-react';

export default function RoomQuoteModal({ isOpen, onClose, stagedItems, totalEstimate, onQuoteSubmitted }) {
  const [submitted, setSubmitted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (onQuoteSubmitted) {
      onQuoteSubmitted({
        customerName,
        customerEmail,
        customerPhone,
        items: stagedItems,
        total: totalEstimate
      });
    }
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Room Furniture Specification</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Itemized quotation for staged architectural furniture</p>
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
        <div className="p-6 overflow-y-auto space-y-5">
          {submitted ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle size={36} />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Quotation Request Dispatched!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                The furniture showroom owner has received your staged room render and item selections. An interior consultant will contact you shortly.
              </p>
            </div>
          ) : (
            <>
              {/* Itemized List */}
              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Staged Store Items in Current Room ({stagedItems.length})
                </div>

                {stagedItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                    No catalog items staged yet. Select items from Option A Store Catalog in the studio to populate this quote.
                  </div>
                ) : (
                  stagedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: item.color || '#4f46e5' }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>{item.category?.toUpperCase()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <Store size={11} /> {item.storeName || 'Partner Showroom'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">${item.price?.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">In Stock</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-indigo-500/20 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">Estimated Total Investment</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">${totalEstimate?.toLocaleString()}</div>
                </div>
                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                  Includes White-Glove Staging & Delivery
                </div>
              </div>

              {/* Consultation / Quote Form */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Request White Glove Consultation
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Vance"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="david@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 shadow-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Direct Store Price Guarantee</span>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <span>Send Quote to Store Biller</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
