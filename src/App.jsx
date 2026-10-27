import React, { useState, useEffect, useMemo } from 'react';
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
  Lock,
  Crown
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
import { Sheet, btnPrimary } from './components/ui';

const ALL_NAV_ITEMS = [
  { id: 'landing', label: 'Home', icon: Home },
  { id: 'studio', label: 'AI Studio', icon: Wand2 },
  { id: 'catalog', label: 'Catalog', icon: LayoutGrid },
  { id: 'biller', label: 'Showroom Store', icon: Store, tag: 'B2B', requiredRole: 'biller' },
  { id: 'admin', label: 'Super Admin', icon: Shield, tag: 'Admin', requiredRole: 'admin' },
  { id: 'auth', label: 'Sign In', icon: User, guestOnly: true }
];

const ROLE_LABEL = { 
  admin: 'Super Admin', 
  biller: 'Showroom Owner', 
  customer: 'Studio Client', 
  guest: 'Visitor' 
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
  const [selectedCatalogItemForStudio, setSelectedCatalogItemForStudio] = useState(null);
  const [profile, setProfile] = useState(null);

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

  // Verified Super Admin designation
  const isSuperAdminEmail = allClerkEmails.includes('razinshaikh3133@gmail.com');

  // Determine active effective role
  const role = isSuperAdminEmail
    ? 'admin'
    : isSignedIn
    ? (user?.publicMetadata?.role || profile?.role || 'customer')
    : 'guest';

  // Sync with Supabase on user load
  useEffect(() => {
    if (!isSignedIn || !user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    syncClerkUserWithSupabase(user).then((p) => {
      if (!cancelled && p) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user?.id]);

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

  // Whenever the user completes sign-in or sign-up, directly take them to the studio
  useEffect(() => {
    if (isLoaded && isSignedIn && ['auth', 'signin', 'signup'].includes(currentPage)) {
      navigateTo('studio');
    }
  }, [isLoaded, isSignedIn, currentPage]);

  // Current active user object (null if logged out)
  const currentUser = useMemo(() => {
    if (!isSignedIn || !user) {
      return null;
    }
    if (isSuperAdminEmail) {
      return {
        id: user.id,
        name: user.fullName || user.firstName || 'Razin Shaikh (Super Admin)',
        email: clerkEmail || 'razinshaikh3133@gmail.com',
        role: 'admin',
        imageUrl: user.imageUrl,
        credits: Math.max(profile?.credits ?? 5000, 5000),
        plan: 'Super Admin Unlimited'
      };
    }
    return {
      id: user.id,
      name: user.fullName || user.firstName || clerkEmail.split('@')[0],
      email: clerkEmail,
      role,
      imageUrl: user.imageUrl,
      credits: profile?.credits ?? 100,
      plan: profile?.plan || ROLE_LABEL[role]
    };
  }, [isSignedIn, user, clerkEmail, role, profile, isSuperAdminEmail]);

  // Role-filtered navigation items
  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) => {
      if (item.requiredRole === 'admin') return role === 'admin';
      if (item.requiredRole === 'biller') return role === 'biller' || role === 'admin';
      if (item.guestOnly) return !isSignedIn;
      return true;
    });
  }, [role, isSignedIn]);

  const mobileTabs = navItems.slice(0, 4);

  const navigateTo = (page) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.location.hash = page;
    }
    setIsAccountOpen(false);
    window.scrollTo({ top: 0 });
  };

  const handleDeductCredits = (amount = 2) => {
    setProfile((prev) => (prev ? { ...prev, credits: Math.max(0, (prev.credits || 0) - amount) } : prev));
  };

  const openStudioWith = (item) => {
    setSelectedCatalogItemForStudio(item);
    navigateTo('studio');
  };

  const isStudio = currentPage === 'studio';
  const isAuthPage = ['auth', 'signin', 'signup', 'roles'].includes(currentPage);
  const canAccess = (page) => {
    if (page === 'admin') return role === 'admin';
    if (page === 'biller') return role === 'biller' || role === 'admin';
    return true;
  };

  const creditsLabel = currentUser
    ? currentUser.credits === null
      ? '—'
      : currentUser.credits.toLocaleString()
    : '0';

  // Dedicated standalone full-page view for authentication
  if (isAuthPage) {
    return (
      <div className="min-h-[100dvh] bg-[#faf8f5] dark:bg-[#121110] text-stone-900 dark:text-stone-100 transition-colors duration-200">
        <AuthPage
          currentUser={currentUser}
          activeRole={role}
          initialTab={currentPage === 'signup' ? 'signup' : currentPage === 'roles' ? 'roles' : 'signin'}
          onNavigate={navigateTo}
        />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentUser={currentUser} activeRole={role} />
      </div>
    );
  }

  return (
    <div className={`${isStudio ? 'h-[100dvh] overflow-hidden flex flex-col lg:flex-row' : 'min-h-[100dvh] lg:flex'} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
      
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
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c59b63] to-[#8c6735] text-white font-serif font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
            FA
          </span>
          {!isStudio && (
            <span className="font-serif font-bold tracking-tight text-[17px] text-stone-900 dark:text-stone-100">
              FurnitureAura<span className="text-brand-500 font-sans ml-0.5 text-xs font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/50 border border-brand-200/60 dark:border-brand-500/30">AI</span>
            </span>
          )}
        </button>

        {/* Verified Role Badge (No fake switcher) */}
        {!isStudio && isSignedIn && (
          <div className="px-3 pb-2">
            <div className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 ${
              role === 'admin'
                ? 'bg-brand-50/70 dark:bg-brand-950/30 border-brand-200/80 dark:border-brand-500/30'
                : role === 'biller'
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/30'
                : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700'
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                role === 'admin' ? 'bg-brand-500' : role === 'biller' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              <div className="truncate">
                <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
                  Account Status
                </div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  {ROLE_LABEL[role]}
                </div>
              </div>
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
                className={`w-full flex items-center justify-between min-h-[44px] rounded-xl text-sm font-semibold transition-all ${
                  isStudio ? 'justify-center px-0' : 'px-3'
                } ${
                  active
                    ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300 font-bold shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={19} className={active ? 'text-brand-500' : ''} />
                  {!isStudio && <span>{item.label}</span>}
                </div>
                {!isStudio && item.tag && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    item.tag === 'Admin'
                      ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-300'
                      : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
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
            <IconButton label="Settings" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} />
            </IconButton>
          </div>

          {isLoaded && (
            isSignedIn ? (
              <div className={`flex items-center gap-3 ${isStudio ? 'justify-center' : 'px-1'}`}>
                <UserButton afterSignOutUrl="/" />
                {!isStudio && (
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{currentUser?.name}</div>
                    <div className="text-[11px] text-slate-500">{ROLE_LABEL[role]}</div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => navigateTo('signin')} 
                className={`${btnPrimary} w-full ${isStudio ? 'px-0' : ''}`} 
                title="Sign in"
              >
                <LogIn size={16} />
                {!isStudio && 'Sign In'}
              </button>
            )
          )}
        </div>
      </aside>

      {/* ---------- Main column ---------- */}
      <div className={`flex-1 min-w-0 min-h-0 flex flex-col ${isStudio ? 'overflow-hidden' : ''}`}>
        {/* Mobile top bar */}
        {!isStudio && (
          <header className="lg:hidden sticky top-0 z-40 safe-top bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border-b border-stone-200/80 dark:border-stone-800">
            <div className="h-14 px-4 flex items-center justify-between">
              <button onClick={() => navigateTo('landing')} className="flex items-center gap-2.5" aria-label="Home">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c59b63] to-[#8c6735] text-white font-serif font-bold text-xs flex items-center justify-center shadow-sm">
                  FA
                </span>
                <span className="font-serif font-bold tracking-tight text-base text-stone-900 dark:text-stone-100">
                  FurnitureAura<span className="text-brand-500 font-sans ml-1 text-[11px] font-bold uppercase tracking-wider">AI</span>
                </span>
              </button>

              <div className="flex items-center gap-2">
                {isSignedIn ? (
                  <button
                    onClick={() => setIsAccountOpen(true)}
                    className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-bold ${
                      role === 'admin'
                        ? 'bg-brand-50 text-brand-800 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-500/30'
                        : role === 'biller'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{ROLE_LABEL[role]}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigateTo('signin')}
                    className="h-8 px-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-brand-500/20"
                  >
                    <LogIn size={13} />
                    <span>Sign In</span>
                  </button>
                )}

                <IconButton label={isDark ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </IconButton>
              </div>
            </div>
          </header>
        )}

        <main className={`flex-1 min-h-0 flex flex-col ${isStudio ? 'overflow-hidden' : 'pb-tabbar'}`}>
          {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} onSelectCatalogItem={openStudioWith} />}

          {currentPage === 'studio' && (
            <CustomerStudio
              currentUser={currentUser}
              onDeductCredits={handleDeductCredits}
              initialCatalogItem={selectedCatalogItemForStudio}
              onNavigate={navigateTo}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
          )}

          {currentPage === 'catalog' && <StoreCatalogPage onNavigate={navigateTo} onSelectCatalogItem={openStudioWith} />}

          {currentPage === 'biller' &&
            (canAccess('biller') ? (
              <BillerAdminPage currentUser={currentUser} onNavigate={navigateTo} />
            ) : (
              <BillerAccessGate
                onSignIn={() => navigateTo('signin')}
                onBack={() => navigateTo('landing')}
              />
            ))}

          {currentPage === 'admin' &&
            (canAccess('admin') ? (
              <SuperAdminPage onNavigate={navigateTo} />
            ) : (
              <SuperAdminAccessGate
                onSignIn={() => navigateTo('signin')}
                onBack={() => navigateTo('landing')}
              />
            ))}

        </main>
      </div>

      {/* ---------- Mobile bottom tab bar ---------- */}
      {!isStudio && (
        <nav
          aria-label="Main"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800"
        >
          <div className="grid grid-cols-4 h-16">
            {mobileTabs.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <TabButton key={item.id} active={active} label={item.label} onClick={() => navigateTo(item.id)}>
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                </TabButton>
              );
            })}
          </div>
        </nav>
      )}

      {/* ---------- Mobile account sheet ---------- */}
      <Sheet open={isAccountOpen} onClose={() => setIsAccountOpen(false)} title={currentUser ? currentUser.name : 'Welcome'} subtitle={currentUser ? `${currentUser.email} · ${ROLE_LABEL[role]}` : 'Sign in to your account'}>
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

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {role === 'admin' && (
              <SheetRow icon={<Shield size={18} />} label="Super Admin Console" onClick={() => navigateTo('admin')} />
            )}
            {(role === 'biller' || role === 'admin') && (
              <SheetRow icon={<Store size={18} />} label="Showroom Store Portal" onClick={() => navigateTo('biller')} />
            )}
            <SheetRow icon={<Wand2 size={18} />} label="AI Staging Studio" onClick={() => navigateTo('studio')} />
            {!isSignedIn && (
              <SheetRow icon={<LogIn size={18} />} label="Sign In" onClick={() => navigateTo('signin')} />
            )}
            <SheetRow icon={isDark ? <Sun size={18} /> : <Moon size={18} />} label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme} />
            <SheetRow icon={<Settings size={18} />} label="Settings" onClick={() => { setIsAccountOpen(false); setIsSettingsOpen(true); }} />
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
      className={`flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors ${
        active ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-stone-500 dark:text-stone-400'
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
      className={`w-full min-h-[52px] px-4 flex items-center gap-3 text-sm font-semibold text-left hover:bg-stone-50 dark:hover:bg-stone-800/60 ${
        danger ? 'text-rose-600' : 'text-stone-800 dark:text-stone-200'
      }`}
    >
      <span className="text-stone-500 dark:text-stone-400">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={16} className="text-stone-400" />
    </button>
  );
}

function SuperAdminAccessGate({ onSignIn, onBack }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#faf8f5] dark:bg-[#121110]">
      <div className="max-w-md w-full text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-sm">
          <Shield size={32} />
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300 text-xs font-bold mb-3 border border-brand-200/50 dark:border-brand-500/30">
          <Crown size={13} className="text-brand-500" />
          <span>Platform Administrator Console</span>
        </div>

        <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Admin Access Restricted</h1>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
          This console is reserved for verified platform administrators with global telemetry and AI model management permissions.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button 
            onClick={onSignIn} 
            className="w-full py-3 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/20"
          >
            <LogIn size={15} />
            <span>Sign In with Admin Account</span>
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

function BillerAccessGate({ onSignIn, onBack }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
          <Store size={32} />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
          <span>B2B Retail Showroom Portal</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Store Owner Access Restricted</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          Manage physical showroom furniture items, real-time pricing, customer staging analytics, and quotation requests. You must have a registered showroom account to access this portal.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button 
            onClick={onSignIn} 
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20"
          >
            <LogIn size={15} />
            <span>Sign In to Showroom Account</span>
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
