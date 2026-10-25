import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Users, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  DollarSign,
  Search,
  ChevronRight,
  X
} from 'lucide-react';
import { 
  fetchStores, 
  fetchCatalogItems, 
  fetchStagingEvents, 
  addCatalogItem, 
  deleteCatalogItem,
  createStore
} from '../services/supabaseService';

export default function BillerAdminPage({ currentUser, onNavigate }) {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('store-1');
  const [catalog, setCatalog] = useState([]);
  const [stagingEvents, setStagingEvents] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);
  const [searchEventQuery, setSearchEventQuery] = useState('');
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'catalog'

  // New Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('sofa');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDimensions, setNewItemDimensions] = useState('');
  const [newItemMaterial, setNewItemMaterial] = useState('');
  const [newItemPrompt, setNewItemPrompt] = useState('');
  const [newItemColor, setNewItemColor] = useState('#4f46e5');
  const [newItemImage, setNewItemImage] = useState('');

  // New Store Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreTagline, setNewStoreTagline] = useState('');
  const [newStoreLocation, setNewStoreLocation] = useState('');

  useEffect(() => {
    fetchBillerData();
  }, [selectedStoreId]);

  const fetchBillerData = async () => {
    try {
      const storeList = await fetchStores();
      setStores(storeList || []);

      const activeStoreId = selectedStoreId || storeList?.[0]?.id || 'store-1';
      if (!selectedStoreId && storeList?.[0]?.id) {
        setSelectedStoreId(storeList[0].id);
      }

      const [catList, eventsList] = await Promise.all([
        fetchCatalogItems({ storeId: activeStoreId }),
        fetchStagingEvents(activeStoreId)
      ]);

      setCatalog(catList || []);
      setStagingEvents(eventsList || []);
    } catch (e) {
      console.warn('Error fetching biller data:', e);
    }
  };

  const handleCreateFurniture = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;

    try {
      await addCatalogItem({
        storeId: selectedStoreId,
        name: newItemName,
        category: newItemCategory,
        price: Number(newItemPrice),
        dimensions: newItemDimensions || 'Standard Showroom Sizing',
        material: newItemMaterial || 'Architectural Grade Fabric / Hardwood',
        prompt: newItemPrompt || `a luxury modern ${newItemName}`,
        color: newItemColor,
        imageUrl: newItemImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'
      });

      setIsAddModalOpen(false);
      // Reset form
      setNewItemName('');
      setNewItemPrice('');
      setNewItemDimensions('');
      setNewItemMaterial('');
      setNewItemPrompt('');
      setNewItemImage('');
      fetchBillerData();
    } catch (err) {
      console.error('Error creating furniture item:', err);
    }
  };

  const handleCreateNewStore = async (e) => {
    e.preventDefault();
    if (!newStoreName) return;

    try {
      const store = await createStore({
        name: newStoreName,
        tagline: newStoreTagline || 'Luxury Architectural Collections',
        ownerId: currentUser?.id || 'biller-user',
        ownerEmail: currentUser?.email || 'owner@showroom.com',
        location: newStoreLocation || 'Global',
        avatar: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80'
      });

      if (store) {
        setSelectedStoreId(store.id);
      }
      setIsNewStoreModalOpen(false);
      setNewStoreName('');
      setNewStoreTagline('');
      setNewStoreLocation('');
      fetchBillerData();
    } catch (err) {
      console.error('Error creating store:', err);
    }
  };

  const handleDeleteFurniture = async (id) => {
    if (!confirm('Are you sure you want to remove this piece from your showroom catalog?')) return;
    try {
      await deleteCatalogItem(id);
      setCatalog(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting furniture:', err);
    }
  };

  const currentStore = stores.find(s => s.id === selectedStoreId) || stores[0] || {
    id: 'store-1',
    name: 'Showroom Retailer',
    tagline: 'Private Showroom Catalog & Staging Telemetry',
    credits: currentUser?.credits || 850
  };

  const filteredEvents = stagingEvents.filter(e =>
    (e.customerName || '').toLowerCase().includes(searchEventQuery.toLowerCase()) ||
    (e.furnitureName || '').toLowerCase().includes(searchEventQuery.toLowerCase()) ||
    (e.customerEmail || '').toLowerCase().includes(searchEventQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Biller Header (White Theme Default) */}
      <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-b border-slate-200 dark:border-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <Store size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {currentStore.name}
                </h1>
                <span className="text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-200 dark:border-amber-500/30">
                  Store Owner Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentStore.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Store Switcher */}
            {stores.length > 0 && (
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500 shadow-sm"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    Showroom: {s.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setIsNewStoreModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <Plus size={14} />
              <span>New Showroom</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus size={16} />
              <span>Add Furniture Item</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards (Clean Production Analytics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>Customer Staging Sessions</span>
              <Eye size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stagingEvents.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Live customer room placements</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>Active Catalog Pieces</span>
              <ShoppingBag size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{catalog.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Available for 1-click room staging</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>Customer Inquiries & Quotes</span>
              <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stagingEvents.filter(e => e.action === 'inquired_quote').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Staged-to-consultation leads</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>Store AI Credits Balance</span>
              <Sparkles size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{currentStore.credits || currentUser?.credits || 850}</div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">Retailer Quota Active</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-4 mt-8 border-b border-slate-200 dark:border-slate-900">
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users size={15} />
            <span>Customer Staging Activity ({stagingEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Manage Showroom Inventory ({catalog.length})</span>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {activeTab === 'customers' ? (
          <div>
            {/* Search customer events */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer, email, or furniture piece..."
                  value={searchEventQuery}
                  onChange={(e) => setSearchEventQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Real-time telemetry of customers placing your furniture in their rooms
              </div>
            </div>

            {/* Customers Staging Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Staged Furniture Piece</th>
                      <th className="px-6 py-4">Showroom Price</th>
                      <th className="px-6 py-4">Customer Room Context</th>
                      <th className="px-6 py-4">Interaction Status</th>
                      <th className="px-6 py-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No customer staging interactions recorded yet. When customers touch your furniture in the studio, they appear here live.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">{evt.customerName || 'Studio Client'}</div>
                            <div className="text-[11px] text-slate-500">{evt.customerEmail || '—'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>{evt.furnitureName || 'Showroom Piece'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">ID: {evt.furnitureId || '—'}</div>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                            ${Number(evt.furniturePrice || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                            {evt.roomType || 'Living Room'}
                          </td>
                          <td className="px-6 py-4">
                            {evt.action === 'inquired_quote' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                <CheckCircle size={12} /> Consultation Inquired
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                                <Sparkles size={12} /> Staged in Room
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500 font-mono text-[11px]">
                            {evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Catalog Manager Tab */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Live Showroom Items ({catalog.length})
              </h3>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span>Add Item to Store</span>
              </button>
            </div>

            {catalog.length === 0 ? (
              <div className="py-16 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm max-w-md mx-auto">
                <ShoppingBag className="mx-auto text-amber-500 mb-3" size={36} />
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">Your Showroom Catalog is Empty</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Add your authentic furniture pieces so interior designers and clients can stage them.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  Add First Furniture Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalog.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-slate-200 dark:border-slate-800 shadow-sm">
                        {item.category?.toUpperCase()}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">{item.name}</h4>
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">${item.price}</div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{item.prompt || item.material}</p>
                      <div className="text-[10px] text-slate-400">
                        Dimensions: <span className="text-slate-700 dark:text-slate-300">{item.dimensions || 'Standard'}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                      </span>
                      <button
                        onClick={() => handleDeleteFurniture(item.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal: Add New Furniture Item (White Theme Default) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Add New Showroom Furniture Piece</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFurniture} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Furniture Piece Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto Solid Oak Low Lounge Table"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                  >
                    <option value="sofa">Sofa / Sectional</option>
                    <option value="table">Coffee / Dining Table</option>
                    <option value="chair">Accent Lounge Chair</option>
                    <option value="floor">Flooring / Tiles</option>
                    <option value="wall">Wall Panel / Texture</option>
                    <option value="lamp">Floor / Arc Lamp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    required
                    placeholder="1850"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Dimensions</label>
                  <input
                    type="text"
                    placeholder="84W x 36D x 30H"
                    value={newItemDimensions}
                    onChange={(e) => setNewItemDimensions(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Materials</label>
                  <input
                    type="text"
                    placeholder="Italian Top Leather & Oak"
                    value={newItemMaterial}
                    onChange={(e) => setNewItemMaterial(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  AI Staging Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. an Italian top-grain cognac tan leather mid-century modern luxury sofa with bronze tapered legs"
                  value={newItemPrompt}
                  onChange={(e) => setNewItemPrompt(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Photo / Thumbnail URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newItemImage}
                  onChange={(e) => setNewItemImage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20"
                >
                  Save Piece to Showroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Showroom Store */}
      {isNewStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Register Showroom Store</h3>
              <button
                onClick={() => setIsNewStoreModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewStore} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Showroom / Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nordic Form Studios"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Scandinavian Oak, Bouclé Textures & Sculptural Lighting"
                  value={newStoreTagline}
                  onChange={(e) => setNewStoreTagline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Location / Flagship</label>
                <input
                  type="text"
                  placeholder="e.g. New York / Milan"
                  value={newStoreLocation}
                  onChange={(e) => setNewStoreLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20"
                >
                  Create Showroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
