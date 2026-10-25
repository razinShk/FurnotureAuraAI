import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home,
  Wand2,
  LayoutGrid,
  Store,
  Shield,
  User,
  Sun,
  Moon,
  Settings,
  Sparkles,
  LogIn,
  LogOut,
  ChevronRight,
  ChevronDown,
  Lock,
  Crown,
  Key,
  Check
} from 'lucide-react';
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';

import { useTheme } from './context/ThemeContext';
import { syncClerkUserWithSupabase } from './services/supabaseService';

import LandingPage from './pages/LandingPage';
import CustomerStudio from './pages/CustomerStudio';
import StoreCatalogPage from './pages/StoreCatalogPage';
import BillerAdminPage from './pages/BillerAdminPage';
import SuperAdminPage from './pages/SuperAdminPage';
import AuthPage from './pages/AuthPage';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import { Sheet, btnPrimary, btnSecondary } from './components/ui';

const NAV_ITEMS = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'studio', label: 'AI Studio', icon: Wand2, tag: 'Customer' },
  { id: 'catalog', label: 'Catalog', icon: LayoutGrid },
  { id: 'biller', label: 'My Store', icon: Store, tag: 'B2B' },
  { id: 'admin', label: 'Super Admin', icon: Shield, tag: 'Admin' },
  { id: 'auth', label: 'Sign In & Roles', icon: User }
];

const ROLE_LABEL = { 
  admin: 'Super Admin', 
  biller: 'Store Owner', 
  customer: 'Customer', 
  guest: 'Guest' 
};

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  // Page navigation state with hash synchronization
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.replace('#', '');
      const validPages = ['landing', 'studio', 'catalog', 'biller', 'admin', 'auth', 'signin', 'signup', 'roles'];
      if (validPages.includes(h)) return h;
    }
    return 'landing';
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [selectedCatalogItemForStudio, setSelectedCatalogItemForStudio] = useState(null);
  const [profile, setProfile] = useState(null);

  const roleDropdownRef = useRef(null);

  // Active Role Persona Override
  const [demoPersona, setDemoPersona] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_demo_persona');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Extract all emails associated with Clerk user
  const clerkEmail = (
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    ''
  ).toLowerCase();

  const allClerkEmails = [
    clerkEmail,
    ...(user?.emailAddresses?.map((e) => e.emailAddress?.toLowerCase()) || []),
    ...(user?.externalAccounts?.map((a) => a.emailAddress?.toLowerCase()) || [])
  ].filter(Boolean);

  // Super Admin designation: razinshaikh3133@gmail.com has global authority
  const isClerkSuperAdmin = allClerkEmails.includes('razinshaikh3133@gmail.com');
  const isPersonaSuperAdmin = demoPersona?.email?.toLowerCase() === 'razinshaikh3133@gmail.com' || demoPersona?.role === 'admin';
  const isSuperAdminEmail = isClerkSuperAdmin || isPersonaSuperAdmin;

  // Determine active effective role
  const role = isSuperAdminEmail
    ? 'admin'
    : demoPersona
    ? demoPersona.role
    : isSignedIn
    ? (user?.publicMetadata?.role || profile?.role || 'customer')
    : 'customer';

  // Sync with Supabase on user load
  useEffect(() => {
    if (!isSignedIn || !user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    syncClerkUserWithSupabase(user, role).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user?.id, role]);

  // Sync URL hash with currentPage
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.replace('#', '');
      const validPages = ['landing', 'studio', 'catalog', 'biller', 'admin', 'auth', 'signin', 'signup', 'roles'];
      if (validPages.includes(h)) {
        setCurrentPage(h);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Close role dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Current active user object
  const currentUser = useMemo(() => {
    if (isSuperAdminEmail) {
      return {
        id: user?.id || 'user-admin-razin',
        name: user?.fullName || user?.firstName || 'Razin Shaikh (Super Admin)',
        email: 'razinshaikh3133@gmail.com',
        role: 'admin',
        imageUrl: user?.imageUrl,
        credits: Math.max(profile?.credits || 0, 5000),
        plan: 'Super Admin Unlimited'
      };
    }
    if (demoPersona) {
      return demoPersona;
    }
    if (isSignedIn && user) {
      return {
        id: user.id,
        name: user.fullName || user.firstName || clerkEmail.split('@')[0],
        email: clerkEmail,
        role,
        imageUrl: user.imageUrl,
        credits: profile?.credits ?? 100,
        plan: profile?.plan || ROLE_LABEL[role]
      };
    }
    // Default active session for instant Customer Studio access
    return {
      id: 'user-customer-studio',
      name: 'Interior Studio Client',
      email: 'client@aura.ai',
      role: 'customer',
      credits: 100,
      plan: 'Free Explorer'
    };
  }, [isSignedIn, user, clerkEmail, role, profile, isSuperAdminEmail, demoPersona]);

  // All navigation items are displayed
  const navItems = NAV_ITEMS;
  const mobileTabs = navItems.slice(0, 4);

  const navigateTo = (page) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.location.hash = page;
    }
    setIsAccountOpen(false);
    setIsRoleDropdownOpen(false);
    window.scrollTo({ top: 0 });
  };

  const handleSelectRolePersona = (persona) => {
    setDemoPersona(persona);
    if (persona) {
      localStorage.setItem('aura_demo_persona', JSON.stringify(persona));
    } else {
      localStorage.removeItem('aura_demo_persona');
    }
    setIsRoleDropdownOpen(false);
  };

  const handleDeductCredits = (amount = 2) => {
    setProfile((prev) => (prev ? { ...prev, credits: Math.max(0, (prev.credits || 0) - amount) } : prev));
    if (demoPersona) {
      const updated = { ...demoPersona, credits: Math.max(0, (demoPersona.credits || 0) - amount) };
      setDemoPersona(updated);
      localStorage.setItem('aura_demo_persona', JSON.stringify(updated));
    }
  };

  const openStudioWith = (item) => {
    setSelectedCatalogItemForStudio(item);
    navigateTo('studio');
  };

  const isStudio = currentPage === 'studio';
  const canAccess = (page) => {
    if (page === 'admin') return role === 'admin';
    if (page === 'biller') return role === 'biller' || role === 'admin';
    return true;
  };

  const creditsLabel = currentUser
    ? currentUser.credits === null
      ? '—'
      : currentUser.credits.toLocaleString()
    : '100';

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 lg:flex">
      
      {/* ---------- Desktop sidebar ---------- */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-[100dvh] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-[width] ${
          isStudio ? 'w-[76px]' : 'w-64'
        }`}
      >
        <button
          onClick={() => navigateTo('landing')}
          className={`flex items-center gap-3 h-16 ${isStudio ? 'justify-center' : 'px-5'}`}
          aria-label="FurnitureAura home"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-amber-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
            FA
          </span>
          {!isStudio && (
            <span className="font-extrabold tracking-tight text-[15px]">
              FurnitureAura<span className="text-amber-500">AI</span>
            </span>
          )}
        </button>

        {/* Desktop Quick Role Selector Badge */}
        {!isStudio && (
          <div className="px-3 pb-2" ref={roleDropdownRef}>
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  role === 'admin'
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-500/30'
                    : role === 'biller'
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    role === 'admin' ? 'bg-indigo-600' : role === 'biller' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="truncate">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      Active Role
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {ROLE_LABEL[role]}
                    </div>
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </button>

              {/* Role Dropdown Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      handleSelectRolePersona({
                        id: 'user-admin-razin',
                        name: 'Razin Shaikh (Super Admin)',
                        email: 'razinshaikh3133@gmail.com',
                        role: 'admin',
                        credits: 5000,
                        plan: 'Super Admin Unlimited'
                      });
                      navigateTo('admin');
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <Crown size={15} className="text-amber-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">Super Admin</div>
                      <div className="text-[10px] text-slate-400 font-normal">razinshaikh3133@gmail.com</div>
                    </div>
                    {role === 'admin' && <Check size={14} className="text-indigo-600" />}
                  </button>

                  <button
                    onClick={() => {
                      handleSelectRolePersona({
                        id: 'user-biller-1',
                        name: 'Showroom Retailer (Biller)',
                        email: 'biller@furnitureaura.ai',
                        role: 'biller',
                        credits: 850,
                        plan: 'Retailer Enterprise',
                        storeId: 'store-1'
                      });
                      navigateTo('biller');
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <Store size={15} className="text-amber-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">Store Owner</div>
                      <div className="text-[10px] text-slate-400 font-normal">biller@furnitureaura.ai</div>
                    </div>
                    {role === 'biller' && <Check size={14} className="text-amber-600" />}
                  </button>

                  <button
                    onClick={() => {
                      handleSelectRolePersona({
                        id: 'user-customer-studio',
                        name: 'Interior Studio Client',
                        email: 'client@aura.ai',
                        role: 'customer',
                        credits: 100,
                        plan: 'Free Explorer'
                      });
                      navigateTo('studio');
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <User size={15} className="text-emerald-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">Customer Studio</div>
                      <div className="text-[10px] text-slate-400 font-normal">100 Free Credits</div>
                    </div>
                    {role === 'customer' && <Check size={14} className="text-emerald-600" />}
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                    <button
                      onClick={() => navigateTo('signin')}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400"
                    >
                      <LogIn size={15} />
                      <span>Clerk Sign In & Roles Page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-2 space-y-1" aria-label="Main">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id || (item.id === 'auth' && ['signin', 'signup', 'roles'].includes(currentPage));
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center justify-between min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                  isStudio ? 'justify-center px-0' : 'px-3'
                } ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={19} />
                  {!isStudio && <span>{item.label}</span>}
                </div>
                {!isStudio && item.tag && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.tag === 'Admin'
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : item.tag === 'B2B'
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className={`p-3 space-y-2 border-t border-slate-200 dark:border-slate-800 ${isStudio ? 'items-center flex flex-col' : ''}`}>
          {currentUser && !isStudio && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                <Sparkles size={12} /> AI credits
              </div>
              <div className="text-xl font-extrabold tabular-nums mt-0.5">{creditsLabel}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.plan}</div>
            </div>
          )}
          
          <div className={`flex items-center gap-1 ${isStudio ? 'flex-col' : ''}`}>
            <IconButton label={isDark ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
            <IconButton label="AI settings" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} />
            </IconButton>
          </div>

          {isLoaded && (
            isSignedIn ? (
              <div className={`flex items-center gap-3 ${isStudio ? 'justify-center' : 'px-1'}`}>
                <UserButton afterSignOutUrl="/" />
                {!isStudio && (
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{ROLE_LABEL[role]}</div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigateTo('signin')} 
                className={`${btnPrimary} w-full ${isStudio ? 'px-0' : ''}`} 
                title="Sign in or select role"
              >
                <LogIn size={16} />
                {!isStudio && 'Sign In / Roles'}
              </button>
            )
          )}
        </div>
      </aside>

      {/* ---------- Main column ---------- */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        {!isStudio && (
          <header className="lg:hidden sticky top-0 z-40 safe-top bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800">
            <div className="h-14 px-4 flex items-center justify-between">
              <button onClick={() => navigateTo('landing')} className="flex items-center gap-2.5" aria-label="Home">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center">
                  FA
                </span>
                <span className="font-extrabold tracking-tight">
                  FurnitureAura<span className="text-amber-500">AI</span>
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAccountOpen(true)}
                  className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-bold ${
                    role === 'admin'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : role === 'biller'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{ROLE_LABEL[role]}</span>
                </button>

                <IconButton label={isDark ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </IconButton>
              </div>
            </div>
          </header>
        )}

        <main className={`flex-1 flex flex-col ${isStudio ? '' : 'pb-tabbar'}`}>
          {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} onSelectCatalogItem={openStudioWith} />}

          {currentPage === 'studio' && (
            <CustomerStudio
              currentUser={currentUser}
              onDeductCredits={handleDeductCredits}
              initialCatalogItem={selectedCatalogItemForStudio}
              onNavigate={navigateTo}
              onRequireAuth={() => navigateTo('signin')}
            />
          )}

          {currentPage === 'catalog' && <StoreCatalogPage onNavigate={navigateTo} onSelectCatalogItem={openStudioWith} />}

          {currentPage === 'biller' &&
            (canAccess('biller') ? (
              <BillerAdminPage currentUser={currentUser} onNavigate={navigateTo} />
            ) : (
              <BillerAccessGate
                onEnterPersona={() => {
                  handleSelectRolePersona({
                    id: 'user-biller-1',
                    name: 'Showroom Retailer (Biller)',
                    email: 'biller@furnitureaura.ai',
                    role: 'biller',
                    credits: 850,
                    plan: 'Retailer Enterprise',
                    storeId: 'store-1'
                  });
                  navigateTo('biller');
                }}
                onSignIn={() => navigateTo('signin')}
                onBack={() => navigateTo('landing')}
              />
            ))}

          {currentPage === 'admin' &&
            (canAccess('admin') ? (
              <SuperAdminPage onNavigate={navigateTo} />
            ) : (
              <SuperAdminAccessGate
                onEnterSuperAdmin={() => {
                  handleSelectRolePersona({
                    id: 'user-admin-razin',
                    name: 'Razin Shaikh (Super Admin)',
                    email: 'razinshaikh3133@gmail.com',
                    role: 'admin',
                    credits: 5000,
                    plan: 'Super Admin Unlimited'
                  });
                  navigateTo('admin');
                }}
                onSignIn={() => navigateTo('signin')}
                onBack={() => navigateTo('landing')}
              />
            ))}

          {['auth', 'signin', 'signup', 'roles'].includes(currentPage) && (
            <AuthPage
              currentUser={currentUser}
              activeRole={role}
              initialTab={currentPage === 'signup' ? 'signup' : currentPage === 'roles' ? 'roles' : 'signin'}
              onSelectRolePersona={handleSelectRolePersona}
              onNavigate={navigateTo}
            />
          )}
        </main>
      </div>

      {/* ---------- Mobile bottom tab bar ---------- */}
      {!isStudio && (
        <nav
          aria-label="Main"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800"
        >
          <div className="grid grid-cols-5 h-16">
            {mobileTabs.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <TabButton key={item.id} active={active} label={item.label} onClick={() => navigateTo(item.id)}>
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                </TabButton>
              );
            })}
            <TabButton active={isAccountOpen} label="Roles / Acc" onClick={() => setIsAccountOpen(true)}>
              <User size={22} />
            </TabButton>
          </div>
        </nav>
      )}

      {/* ---------- Mobile account sheet ---------- */}
      <Sheet open={isAccountOpen} onClose={() => setIsAccountOpen(false)} title={currentUser ? currentUser.name : 'Welcome'} subtitle={currentUser ? `${currentUser.email} · ${ROLE_LABEL[role]}` : 'Select a role or sign in'}>
        <div className="space-y-4">
          {currentUser && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20">
              <div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1"><Sparkles size={12} /> AI credits</div>
                <div className="text-2xl font-extrabold tabular-nums">{creditsLabel}</div>
              </div>
              <span className="text-xs font-semibold text-slate-500">{currentUser.plan}</span>
            </div>
          )}

          {/* Quick Persona Switcher in Sheet */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Instant Role Switcher</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  handleSelectRolePersona({
                    id: 'user-admin-razin',
                    name: 'Razin Shaikh (Super Admin)',
                    email: 'razinshaikh3133@gmail.com',
                    role: 'admin',
                    credits: 5000,
                    plan: 'Super Admin Unlimited'
                  });
                  navigateTo('admin');
                }}
                className={`p-2.5 rounded-xl border text-center text-xs font-extrabold flex flex-col items-center gap-1 ${
                  role === 'admin' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Crown size={16} />
                <span>Super Admin</span>
              </button>

              <button
                onClick={() => {
                  handleSelectRolePersona({
                    id: 'user-biller-1',
                    name: 'Showroom Retailer (Biller)',
                    email: 'biller@furnitureaura.ai',
                    role: 'biller',
                    credits: 850,
                    plan: 'Retailer Enterprise',
                    storeId: 'store-1'
                  });
                  navigateTo('biller');
                }}
                className={`p-2.5 rounded-xl border text-center text-xs font-extrabold flex flex-col items-center gap-1 ${
                  role === 'biller' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Store size={16} />
                <span>Store Owner</span>
              </button>

              <button
                onClick={() => {
                  handleSelectRolePersona({
                    id: 'user-customer-studio',
                    name: 'Interior Studio Client',
                    email: 'client@aura.ai',
                    role: 'customer',
                    credits: 100,
                    plan: 'Free Explorer'
                  });
                  navigateTo('studio');
                }}
                className={`p-2.5 rounded-xl border text-center text-xs font-extrabold flex flex-col items-center gap-1 ${
                  role === 'customer' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-200'
                }`}
              >
                <User size={16} />
                <span>Customer</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            <SheetRow icon={<Shield size={18} />} label="Super Admin Console" onClick={() => navigateTo('admin')} />
            <SheetRow icon={<Store size={18} />} label="Showroom Store Portal" onClick={() => navigateTo('biller')} />
            <SheetRow icon={<Wand2 size={18} />} label="AI Staging Studio" onClick={() => navigateTo('studio')} />
            <SheetRow icon={<LogIn size={18} />} label="Sign In & Roles Page" onClick={() => navigateTo('signin')} />
            <SheetRow icon={isDark ? <Sun size={18} /> : <Moon size={18} />} label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} />
            <SheetRow icon={<Settings size={18} />} label="AI & cloud settings" onClick={() => { setIsAccountOpen(false); setIsSettingsOpen(true); }} />
            {isSignedIn && (
              <SheetRow icon={<LogOut size={18} />} label="Sign out" danger onClick={() => { setIsAccountOpen(false); signOut(); navigateTo('landing'); }} />
            )}
          </div>
        </div>
      </Sheet>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {children}
    </button>
  );
}

function TabButton({ active, label, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
        active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function SheetRow({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[52px] px-4 flex items-center gap-3 text-sm font-semibold text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
        danger ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'
      }`}
    >
      <span className="text-slate-500 dark:text-slate-400">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={16} className="text-slate-400" />
    </button>
  );
}

function SuperAdminAccessGate({ onEnterSuperAdmin, onSignIn, onBack }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
          <Shield size={32} />
        </div>
        
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-2">
          <Crown size={13} className="text-amber-500" />
          <span>Platform Administrator Console</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Super Admin Access</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Full platform privileges are designated for <strong className="text-indigo-600 dark:text-indigo-400">razinshaikh3133@gmail.com</strong> with 5,000 AI credits, global database telemetry, and AI model controls.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button 
            onClick={onEnterSuperAdmin} 
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
          >
            <Crown size={15} />
            <span>Enter as Super Admin (razinshaikh3133@gmail.com)</span>
          </button>

          <button 
            onClick={onSignIn} 
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn size={15} />
            <span>Sign In with Clerk / Google</span>
          </button>

          <button 
            onClick={onBack} 
            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function BillerAccessGate({ onEnterPersona, onSignIn, onBack }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
          <Store size={32} />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
          <span>B2B Retail Showroom Portal</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Store Owner Access</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Manage physical showroom furniture items, real-time pricing, customer staging analytics, and quotation requests.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button 
            onClick={onEnterPersona} 
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Store size={15} />
            <span>Enter as Showroom Store Owner</span>
          </button>

          <button 
            onClick={onSignIn} 
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn size={15} />
            <span>Sign In / Register Showroom</span>
          </button>

          <button 
            onClick={onBack} 
            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
