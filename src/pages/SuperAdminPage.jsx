import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Sparkles, 
  Cpu, 
  Activity, 
  Plus, 
  Minus, 
  Store, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Clock, 
  ArrowUpRight, 
  Database 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchStores, fetchCatalogItems } from '../services/supabaseService';

export default function SuperAdminPage({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [customCreditModalUser, setCustomCreditModalUser] = useState(null);
  const [customCreditInput, setCustomCreditInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchAdminMetrics = async () => {
    try {
      // 1. Fetch from Supabase
      const [profilesRes, storesRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('stores').select('*'),
        supabase.from('prediction_logs').select('*').order('created_at', { ascending: false }).limit(30)
      ]);

      const uList = profilesRes.data || [];
      const sList = storesRes.data || [];
      const lList = logsRes.data || [];

      setUsers(uList);
      setStores(sList);
      setLogs(lList);
      setMetrics({
        totalUsers: uList.length,
        totalBillers: sList.length,
        totalCatalogItems: 0,
        totalStagingEvents: 0,
        totalCreditsAllocated: uList.reduce((acc, u) => acc + (u.credits || 0), 0),
        totalGenerations: lList.length,
        models: {
          vision: 'Replicate Spatial Vision',
          generation: 'Replicate Neural Diffusion'
        }
      });
      return;
    } catch (sErr) {
      console.warn('Supabase admin telemetry notice:', sErr.message);
    }
  };

  const handleAdjustCredits = async (userId, creditsToAdd) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      const newCredits = Math.max(0, (targetUser?.credits || 0) + Number(creditsToAdd));

      // Update directly in Supabase
      const { error } = await supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);
      if (error) throw error;

      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, credits: newCredits } : u)));
      showFeedback(`Updated credits for ${targetUser?.name || 'User'}: ${newCredits} remaining`);
    } catch (err) {
      console.error('Error adjusting credits:', err);
    }
  };

  const handleSetCustomCredits = async (e) => {
    e.preventDefault();
    if (!customCreditModalUser) return;
    const targetTotal = Number(customCreditInput);

    try {
      // Update directly in Supabase
      const { error } = await supabase.from('profiles').update({ credits: targetTotal }).eq('id', customCreditModalUser.id);
      if (error) throw error;

      setUsers(prev => prev.map(u => (u.id === customCreditModalUser.id ? { ...u, credits: targetTotal } : u)));
      showFeedback(`Set exact credits for ${customCreditModalUser.name} to ${targetTotal}`);
      setCustomCreditModalUser(null);
      setCustomCreditInput('');
    } catch (err) {
      console.error('Error setting credits:', err);
    }
  };

  const showFeedback = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 3000);
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#121110] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Top Admin Header */}
      <section className="pt-8 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-b border-stone-200 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
              <Shield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight font-serif">
                  Super Admin Console
                </h1>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-extrabold border border-brand-200 dark:border-brand-500/30">
                  Global Telemetry & Credits
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Oversee platform users, manage AI credit balances, inspect store billers, and track Replicate pipelines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminMetrics}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RefreshCw size={13} />
              <span>Refresh Metrics</span>
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-bold transition-colors shadow-md shadow-brand-500/25"
            >
              Back to Studio
            </button>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
            <CheckCircle size={16} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* 4 System Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
              <span>Total Active Users</span>
              <Users size={16} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-white font-serif">{users.length}</div>
            <div className="text-[10px] text-stone-400 mt-1">Customers & Store Billers</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
              <span>Total AI Credits Allocated</span>
              <Sparkles size={16} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {users.reduce((acc, u) => acc + (u.credits || 0), 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Available across user accounts</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Showroom Billers</span>
              <Store size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stores.length}</div>
            <div className="text-[10px] text-slate-400 mt-1">Registered furniture retailers</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>AI Predictions Logged</span>
              <Cpu size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{logs.length}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Replicate Neural Pipeline</div>
          </div>
        </div>
      </section>

      {/* Main Admin Tables */}
      <section className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        {/* User & AI Credits Management Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Users & AI Credit Allocations</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly top up, adjust, or inspect credit balances for customers and store owners
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search user by name, email, or role..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">AI Generations</th>
                    <th className="px-6 py-4">Credit Balance</th>
                    <th className="px-6 py-4 text-right">Credit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                        No registered users yet. As users authenticate via Clerk, their profiles sync here.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                            <span>{u.name || u.email?.split('@')[0] || 'User'}</span>
                            {u.role === 'admin' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" title="Super Admin" />
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">{u.email}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                              u.role === 'admin'
                                ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-500/40'
                                : u.role === 'biller'
                                  ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40'
                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-stone-600 dark:text-stone-300 font-medium">{u.plan || 'Free Explorer'}</td>

                        <td className="px-6 py-4 font-mono text-stone-500 dark:text-stone-400">{u.total_generations || u.totalGenerations || 0}</td>

                        <td className="px-6 py-4">
                          <div className="font-extrabold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <Sparkles size={13} />
                            <span>{u.credits?.toLocaleString() || 0} Credits</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAdjustCredits(u.id, 50)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-bold transition-colors"
                              title="Add 50 Credits"
                            >
                              +50
                            </button>
                            <button
                              onClick={() => handleAdjustCredits(u.id, 200)}
                              className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 text-[11px] font-bold transition-colors"
                              title="Add 200 Credits"
                            >
                              +200
                            </button>
                            <button
                              onClick={() => {
                                setCustomCreditModalUser(u);
                                setCustomCreditInput(String(u.credits || 0));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-semibold transition-colors"
                            >
                              Set...
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Showroom Stores Overview */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Registered Furniture Showrooms (Billers)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of connected store owners and showroom inventory status
            </p>
          </div>

          {stores.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm max-w-md mx-auto">
              <Store className="mx-auto text-amber-500 mb-2" size={32} />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No showroom billers registered yet. Retailers can onboard via the Biller portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <Store size={24} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{store.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{store.location || 'Global'}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                      Active Showroom
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Location</div>
                      <div className="text-xs font-extrabold text-slate-800 dark:text-white truncate">{store.location || 'Global'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Store Credits</div>
                      <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">{store.credits || 850}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Owner</div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{store.ownerEmail?.split('@')[0] || 'retailer'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prediction Logs Stream */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">AI Model Generation & Prediction Logs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of Replicate spatial vision and neural staging executions
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Model Pipeline</th>
                    <th className="px-6 py-4">Task Description</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Latency</th>
                    <th className="px-6 py-4">Credit Cost</th>
                    <th className="px-6 py-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No prediction logs recorded yet. When staging operations occur, they stream here live.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-3 font-mono font-bold text-brand-700 dark:text-brand-300 text-[11px]">
                          {log.model}
                        </td>
                        <td className="px-6 py-3 text-stone-700 dark:text-stone-300">{log.task}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200 dark:border-emerald-500/30">
                            {log.status || 'succeeded'}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-stone-500 dark:text-stone-400">{log.duration_ms || log.durationMs || 1420}ms</td>
                        <td className="px-6 py-3 font-bold text-amber-600 dark:text-amber-400">-{log.credits_cost || log.creditsCost || 2} cr</td>
                        <td className="px-6 py-3 text-right text-stone-400 font-mono text-[11px]">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Just now'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Set Custom Credits Modal */}
      {customCreditModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-base text-stone-900 dark:text-white font-serif">
              Set Exact Credits for {customCreditModalUser.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Current balance: <span className="text-amber-600 dark:text-amber-400 font-bold">{customCreditModalUser.credits || 0}</span>
            </p>

            <form onSubmit={handleSetCustomCredits} className="space-y-4">
              <input
                type="number"
                min="0"
                required
                value={customCreditInput}
                onChange={(e) => setCustomCreditInput(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-base font-bold text-stone-900 dark:text-white focus:outline-none focus:border-brand-500 shadow-sm"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomCreditModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
                >
                  Apply Credits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
