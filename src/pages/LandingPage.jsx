import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Camera, 
  Eye, 
  Sliders, 
  Layers, 
  Store, 
  ShieldCheck, 
  Check, 
  Play, 
  ChevronRight,
  TrendingUp,
  Cpu,
  ShoppingBag
} from 'lucide-react';
import { fetchCatalogItems } from '../services/supabaseService';

export default function LandingPage({ onNavigate, onSelectCatalogItem }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    fetchCatalogItems()
      .then(items => {
        if (items && items.length > 0) {
          setFeaturedItems(items.slice(0, 4));
        } else {
          setFeaturedItems([]);
        }
      })
      .catch(() => setFeaturedItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-amber-500/10 blur-[130px] pointer-events-none rounded-full dark:from-indigo-600/20 dark:via-violet-600/15 dark:to-amber-500/10" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative text-center max-w-4xl mx-auto space-y-6">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-md text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Replicate Neural Diffusion</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Spatial Vision Tagging</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>B2B Showroom Staging</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Transform Any Room With Furniture{' '}
            <span className="gold-gradient-text">You Can Actually Buy.</span>
          </h1>

          {/* Subhead */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Snap your living room, touch showroom furniture from verified designer store catalogs, and watch photorealistic 3D lighting, reflections, and perspective adapt in seconds.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('studio')}
              className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/25 flex items-center gap-3 transition-all transform active:scale-95"
            >
              <Sparkles size={18} />
              <span>Launch AI Staging Studio</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => onNavigate('catalog')}
              className="px-7 py-4 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center gap-2.5 transition-all shadow-sm"
            >
              <Store size={18} className="text-amber-600 dark:text-amber-400" />
              <span>Browse Store Catalogs</span>
            </button>
          </div>

          {/* Trust Metric Badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Clerk Enterprise Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Spatial 3D Vision Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-amber-600 dark:text-amber-400" />
              <span>Real-Time Mobile Camera Staging</span>
            </div>
          </div>
        </div>

        {/* Live Interactive Split Hero Preview */}
        <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full select-none overflow-hidden">
            {/* After Image (Full width background) */}
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85"
              alt="Staged Interior"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Staged Overlay highlight pill */}
            <div className="absolute top-4 right-4 bg-indigo-600/95 backdrop-blur-md text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg z-20">
              <Sparkles size={14} /> AFTER: Staged Luxury Interior
            </div>

            {/* Before Image (Clipped by slider position) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85"
                alt="Original Room"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  width: '100%',
                  minWidth: '100%',
                  maxWidth: 'none'
                }}
              />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md text-slate-800 dark:text-slate-300 text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 z-20 shadow-sm">
                BEFORE: Empty Living Room
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none flex items-center justify-center z-30"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl border-2 border-white text-xs font-extrabold">
                ↔
              </div>
            </div>

            {/* Invisible Range Input for Interactive Dragging */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
              aria-label="Before after comparison slider"
            />
          </div>

          <div className="px-6 py-4 bg-slate-50/95 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Interactive Slider: Drag left or right to inspect real-time neural diffusion staging</span>
            </div>
            <button
              onClick={() => onNavigate('studio')}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
            >
              <span>Test This Room in Studio</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 4-Step Production Workflow */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/60 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            State-Of-The-Art Spatial Architecture
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            How FurnitureAura AI Delivers 100% Real Staging
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Unlike generic AI image generators, we bind real physical furniture SKUs, store pricing, and architectural coordinates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/50 transition-all group bg-white dark:bg-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-lg mb-4 group-hover:scale-105 transition-transform">
              1
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Snap Room in Flight</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Use your mobile camera directly, upload an architectural photo, or select from penthouse suites.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 transition-all group bg-white dark:bg-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-extrabold text-lg mb-4 group-hover:scale-105 transition-transform">
              2
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Spatial Vision Tagging</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Vision neural models automatically recognize furniture pins, bounding boxes, wall surfaces, and floor planes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/50 transition-all group bg-white dark:bg-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-extrabold text-lg mb-4 group-hover:scale-105 transition-transform">
              3
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Touch Store Catalog</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Select verified furniture from partner store billers. Real SKUs, materials, dimensions, and itemized checkout estimates.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50 transition-all group bg-white dark:bg-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-lg mb-4 group-hover:scale-105 transition-transform">
              4
            </div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">Neural Staging Engine</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Diffusion neural staging casts natural ray-traced shadows, matches ambient daylight bounce, and blends seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Furniture Catalog Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Live Showroom Inventory
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Popular Catalog Pieces To Stage
            </h3>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
          >
            <span>View All Store Collections</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {featuredItems.length === 0 ? (
          <div className="py-16 px-6 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-2xl mx-auto">
            <Store className="mx-auto text-amber-500 mb-3" size={36} />
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
              Showrooms Ready For Live Inventory
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Furniture retailers can log into the Store Owner (Biller) portal to upload catalog collections for customer room staging.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onNavigate('biller')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Go to Store Owner Panel
              </button>
              <button
                onClick={() => onNavigate('studio')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                Open AI Studio
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col group bg-white dark:bg-slate-900 shadow-sm hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 shadow-sm">
                    {item.category?.toUpperCase() || 'SHOWROOM'}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      {item.storeName || 'Partner Showroom'}
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug mb-2">
                      {item.name}
                    </h4>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${Number(item.price || 0).toLocaleString()}
                    </div>
                    <button
                      onClick={() => {
                        if (onSelectCatalogItem) onSelectCatalogItem(item);
                        onNavigate('studio');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
                    >
                      <Sparkles size={13} />
                      <span>Stage in Room</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* For Furniture Store Retailers (Billers) */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-900 bg-gradient-to-b from-slate-50 to-indigo-50/40 dark:from-slate-950 dark:to-indigo-950/20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-indigo-200 dark:border-indigo-500/20 relative overflow-hidden bg-white/80 dark:bg-slate-900/60 shadow-lg">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <Store size={14} />
              <span>For Furniture Retailers & Showrooms (Billers)</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Turn Shopper Browsing Into Instant Living Room Purchases.
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              As a store owner, upload your inventory into your private showroom catalog. Your customers can snap their rooms, touch your sofas and tables, and send you direct consultation quote requests.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <button
                onClick={() => onNavigate('biller')}
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>Open Store Owner Admin Panel</span>
                <ArrowRight size={15} />
              </button>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Track which customer staged which furniture in real-time
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & AI Credits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Fair & Transparent AI Credits
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Choose Your AI Staging Quota
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            1 Credit per spatial vision analysis • 2 Credits per high-res neural diffusion generation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-md">
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Free Explorer</div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">$0 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ forever</span></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Perfect for homeowners wanting to test room ideas.</p>
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600 dark:text-emerald-400" /> 100 Welcome AI Credits</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600 dark:text-emerald-400" /> Option A Store Catalog access</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600 dark:text-emerald-400" /> Live mobile camera capture</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-emerald-600 dark:text-emerald-400" /> HD Room Downloads</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('studio')}
              className="mt-8 w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors"
            >
              Start Free Staging
            </button>
          </div>

          {/* Designer Pro */}
          <div className="glass-panel p-8 rounded-3xl border-2 border-indigo-600 dark:border-indigo-500/60 relative flex flex-col justify-between shadow-2xl shadow-indigo-600/10 bg-white dark:bg-slate-900">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">Studio Designer Pro</div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">$29 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ month</span></div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">For interior designers, architects, and staging pros.</p>
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-200">
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-600 dark:text-indigo-400" /> 1,200 AI Credits / month</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-600 dark:text-indigo-400" /> Fast-track neural staging priority</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-600 dark:text-indigo-400" /> Unlimited Version History rollback</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-600 dark:text-indigo-400" /> Option C Reference Photo upload</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-indigo-600 dark:text-indigo-400" /> Itemized Quote Specification</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('studio')}
              className="mt-8 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Retailer Biller */}
          <div className="glass-card p-8 rounded-3xl border border-amber-300 dark:border-amber-500/30 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-md">
            <div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Showroom Retailer</div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">$199 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ month</span></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">For furniture stores & brand showrooms.</p>
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><Check size={14} className="text-amber-600 dark:text-amber-400" /> 10,000 AI Credits / month</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-amber-600 dark:text-amber-400" /> Full Store Catalog Management</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-amber-600 dark:text-amber-400" /> Customer Staging Activity Analytics</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-amber-600 dark:text-amber-400" /> In-Store Consultation Lead Routing</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-amber-600 dark:text-amber-400" /> Dedicated Super Admin Support</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('biller')}
              className="mt-8 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/20"
            >
              Launch Retailer Suite
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto w-full transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-[10px]">
              AI
            </div>
            <span className="font-extrabold text-slate-900 dark:text-slate-300 text-sm">FurnitureAura AI</span>
            <span>— Spatial Interior & Furniture Studio</span>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <button onClick={() => onNavigate('studio')} className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Studio</button>
            <button onClick={() => onNavigate('catalog')} className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Catalog</button>
            <button onClick={() => onNavigate('biller')} className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Store Owner</button>
            <button onClick={() => onNavigate('admin')} className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Super Admin</button>
            <button onClick={() => onNavigate('auth')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign In / B2B</button>
          </div>

          <div>
            © 2026 FurnitureAura AI Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
