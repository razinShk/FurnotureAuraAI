import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Store, 
  ArrowUpDown, 
  Check, 
  ChevronRight,
  SlidersHorizontal,
  Layers,
  Camera,
  Upload,
  RefreshCw,
  X
} from 'lucide-react';
import { fetchCatalogItems, fetchStores } from '../services/supabaseService';
import { analyzeReferenceFurniture } from '../services/aiService';
import CameraCaptureModal from '../components/CameraCaptureModal';

export default function StoreCatalogPage({ onSelectCatalogItem, onNavigate }) {
  const [catalog, setCatalog] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('popular'); // 'popular' | 'price-asc' | 'price-desc'
  const [loading, setLoading] = useState(true);
  const [isLensCameraOpen, setIsLensCameraOpen] = useState(false);
  const [lensSnappedPhoto, setLensSnappedPhoto] = useState(null);
  const [isLensScanning, setIsLensScanning] = useState(false);
  const [lensDetectedSummary, setLensDetectedSummary] = useState('');
  const [lensScoreMap, setLensScoreMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [items, storeList] = await Promise.all([
        fetchCatalogItems(),
        fetchStores()
      ]);
      setCatalog(items || []);
      setStores(storeList || []);
    } catch (e) {
      console.warn('Catalog loading notice:', e);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Furniture' },
    { id: 'sofa', label: 'Sofas & Sectionals' },
    { id: 'table', label: 'Coffee & Accent Tables' },
    { id: 'chair', label: 'Lounge Chairs' },
    { id: 'floor', label: 'Flooring & Tiles' },
    { id: 'wall', label: 'Wall Textures' },
    { id: 'lamp', label: 'Sculptural Lighting' }
  ];

  // Filter and Sort
  const handleLensCapture = async (photoDataUrl) => {
    setLensSnappedPhoto(photoDataUrl);
    setIsLensScanning(true);
    setLensDetectedSummary('Analyzing snapped furniture shape, fabric & color...');
    try {
      const data = await analyzeReferenceFurniture(photoDataUrl);
      const desc = (data?.description || '').toLowerCase();

      let detectedCat = 'all';
      if (/\b(sofa|sectional|couch|settee|loveseat|divan)\b/.test(desc)) detectedCat = 'sofa';
      else if (/\b(chair|armchair|lounger|recliner|stool|accent chair|seat)\b/.test(desc)) detectedCat = 'chair';
      else if (/\b(table|desk|console|coffee table|dining|nightstand|sideboard|credenza)\b/.test(desc)) detectedCat = 'table';
      else if (/\b(lamp|chandelier|pendant|sconce|light|lighting)\b/.test(desc)) detectedCat = 'lamp';
      else if (/\b(rug|carpet|floor|tile|parquet|wood floor)\b/.test(desc)) detectedCat = 'floor';
      else if (/\b(wall|panel|art|mirror|molding|wallpaper)\b/.test(desc)) detectedCat = 'wall';

      if (detectedCat !== 'all') {
        setSelectedCategory(detectedCat);
      }

      setLensDetectedSummary(data?.description || 'Matched similar furniture pieces from showroom catalog');

      const stopWords = new Set(['the', 'and', 'with', 'for', 'this', 'that', 'from', 'into', 'exact', 'shown', 'photo', 'reference', 'furniture', 'piece']);
      const tokens = desc
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !stopWords.has(w));

      const nextScores = {};
      catalog.forEach((item) => {
        let score = 0;
        const itemText = `${item.name || ''} ${item.category || ''} ${item.material || ''} ${item.prompt || ''} ${item.color || ''}`.toLowerCase();
        if (detectedCat !== 'all' && item.category === detectedCat) score += 55;
        tokens.forEach((tok) => {
          if (itemText.includes(tok)) score += 8;
        });
        nextScores[item.id] = Math.min(98, Math.max(detectedCat !== 'all' && item.category === detectedCat ? 82 : 64, 60 + score));
      });
      setLensScoreMap(nextScores);
    } catch (e) {
      console.warn('Catalog lens search error:', e);
      setLensDetectedSummary('Matched similar furniture pieces from showroom catalog');
    } finally {
      setIsLensScanning(false);
    }
  };

  let filtered = catalog.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStore = selectedStore === 'all' || item.storeId === selectedStore;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.material?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dimensions?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesStore && matchesSearch;
  });

  if (lensSnappedPhoto && Object.keys(lensScoreMap).length > 0) {
    filtered.sort((a, b) => (lensScoreMap[b.id] || 0) - (lensScoreMap[a.id] || 0));
  } else if (sortOrder === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121110] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Top Banner (Warm Luxury Editorial) */}
      <section className="pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-b border-stone-200 dark:border-stone-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-200/70 dark:border-brand-500/30 text-brand-800 dark:text-brand-300 text-xs font-bold mb-3">
              <Store size={14} />
              <span>Partner Showroom Inventories</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Furniture Store Catalog
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-xl">
              Browse authentic physical furniture collections. Pick any item to stage directly into your living room with photorealistic spatial lighting.
            </p>
          </div>

          <button
            onClick={() => onNavigate('studio')}
            className="px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all self-start md:self-end"
          >
            <Sparkles size={16} />
            <span>Launch AI Studio</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box with Upload & In-App FurniPeek Lens Camera Icons */}
          <div className="relative w-full sm:w-80 flex items-center">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search or upload/snap furniture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl pl-9 pr-16 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 shadow-sm"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <label
                title="FurniPeek Lens: Upload furniture photo to find similar catalog items"
                aria-label="Upload furniture photo to search catalog"
                className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 border border-[#c59b63]/50 text-[#9c733b] dark:text-[#d9b37c] hover:bg-[#fbf8f3] flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Upload size={12} strokeWidth={2.2} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => handleLensCapture(ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setIsLensCameraOpen(true)}
                title="FurniPeek Lens: Snap furniture to find similar catalog items"
                aria-label="Snap furniture to search catalog"
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c59b63] to-[#a67c46] hover:from-[#b88d55] hover:to-[#966d3a] text-white flex items-center justify-center shadow-sm transition-all active:scale-95"
              >
                <Camera size={13} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Store Select */}
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none focus:border-brand-500 shrink-0 shadow-sm"
            >
              <option value="all">All Retail Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none focus:border-brand-500 shrink-0 shadow-sm"
            >
              <option value="popular">Curated Picks</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active FurniPeek Lens Visual Search Banner */}
        {lensSnappedPhoto && (
          <div className="mt-4 p-3 rounded-2xl bg-[#fbf8f3] dark:bg-stone-900 border border-[#c59b63]/50 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={lensSnappedPhoto}
                alt="Snapped Furniture"
                className="w-11 h-11 rounded-xl object-cover border border-[#c59b63]/40 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-[#8c6430] dark:text-[#d9b37c] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#c59b63]" />
                  <span>{isLensScanning ? 'FurniPeek Lens Scanning...' : 'FurniPeek Lens Visual Match Active'}</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 truncate mt-0.5">
                  {lensDetectedSummary}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLensSnappedPhoto(null);
                setLensScoreMap({});
                setSelectedCategory('all');
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-rose-500 flex items-center gap-1 shrink-0"
            >
              <X size={13} />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-white hover:bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-400 border border-stone-200 dark:border-stone-800 shadow-sm'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-6">
          <span>Showing <strong>{filtered.length}</strong> authenticated furniture pieces</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <Check size={14} /> Ready for 1-Click AI Room Staging
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-md mx-auto p-8">
            <Store className="mx-auto text-amber-500 mb-3" size={40} />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
              No Pieces Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
              {searchQuery || selectedCategory !== 'all' || selectedStore !== 'all'
                ? 'Try adjusting your search criteria or category filter.'
                : 'Showrooms are ready for catalog upload. Switch to the Store Owner (Biller) portal to add pieces.'}
            </p>
            <div className="flex justify-center gap-3">
              {(searchQuery || selectedCategory !== 'all' || selectedStore !== 'all') ? (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedStore('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl text-slate-800 dark:text-white"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('biller')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  Add Showroom Items
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col group shadow-sm hover:shadow-md"
              >
                {/* Photo Preview */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div
                    className="absolute top-3 left-3 w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: item.color || '#c59b63' }}
                    title="Material swatch"
                  />
                  <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-stone-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 shadow-sm">
                    {item.category?.toUpperCase()}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-2 space-y-1">
                      <div>Dimensions: <span className="text-stone-700 dark:text-stone-300 font-medium">{item.dimensions || 'Custom'}</span></div>
                      <div>Material: <span className="text-stone-700 dark:text-stone-300 font-medium">{item.material || 'Architectural Grade'}</span></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Showroom Price</div>
                      <div className="text-base font-serif font-bold text-emerald-600 dark:text-emerald-400">
                        ${Number(item.price || 0).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onSelectCatalogItem) onSelectCatalogItem(item);
                        onNavigate('studio');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all transform active:scale-95"
                    >
                      <Sparkles size={13} />
                      <span>Stage In Room</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CameraCaptureModal
        isOpen={isLensCameraOpen}
        onClose={() => setIsLensCameraOpen(false)}
        title="FurniPeek Lens — Visual Furniture Search"
        subtitle="Snap any furniture in the showroom to find similar catalog pieces"
        snapButtonLabel="Snap Furniture"
        confirmButtonLabel="Find Similar Furniture"
        frameHint="Center the sofa, chair, table, or lamp inside the lens frame"
        onPhotoCaptured={handleLensCapture}
      />
    </div>
  );
}
