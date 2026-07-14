import { useState } from 'react';
import { Store, Truck, ShieldAlert, ShoppingBag, Menu, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: 'shop' | 'track' | 'admin';
  setActiveTab: (tab: 'shop' | 'track' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  toggleCart: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  cartCount,
  toggleCart
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    {
      id: 'sidebar-nav-shop',
      label: 'Shop',
      icon: Store,
      tab: 'shop' as const,
      color: 'text-emerald-400',
      bgColor: 'hover:bg-emerald-500/10'
    },
    {
      id: 'sidebar-nav-track',
      label: 'Track Order',
      icon: Truck,
      tab: 'track' as const,
      color: 'text-blue-400',
      bgColor: 'hover:bg-blue-500/10'
    },
    {
      id: 'sidebar-nav-admin',
      label: 'Admin',
      icon: ShieldAlert,
      tab: 'admin' as const,
      color: 'text-amber-400',
      bgColor: 'hover:bg-amber-500/10'
    }
  ];

  const handleTabClick = (tab: 'shop' | 'track' | 'admin') => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-lg tracking-wider shadow-md shadow-emerald-900/30">
            G
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-teal-100 bg-clip-text text-transparent">
              GAAFOW
            </span>
            <p className="text-[9px] text-emerald-400 tracking-wider font-semibold uppercase">
              Everything Delivered Fast
            </p>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button
          id="mobile-sidebar-close"
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Menu */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <span className="px-3 text-[10px] font-black tracking-widest text-slate-500 uppercase block mb-4">
          Navigation Menu
        </span>
        
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => handleTabClick(item.tab)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer border ${
                isActive
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                  : `border-transparent text-slate-300 ${item.bgColor} hover:text-white`
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.color}`} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}

        <div className="pt-4 border-t border-slate-800/60 mt-4">
          <span className="px-3 text-[10px] font-black tracking-widest text-slate-500 uppercase block mb-4">
            Shopping Cart
          </span>
          {/* Your Shopping Cart Item */}
          <button
            id="sidebar-nav-cart"
            onClick={() => {
              toggleCart();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer border border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 shrink-0 text-teal-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="flex-1 text-left">Your Shopping Cart</span>
            {cartCount > 0 && (
              <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Footer info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 font-medium">
        <p className="font-semibold text-slate-400">GAAFOW Premium Delivery</p>
        <p className="mt-0.5">Mogadishu, Somalia</p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 shrink-0 select-none">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Mini Top Header (shows hamburger menu) */}
      <header className="md:hidden w-full bg-slate-900 border-b border-slate-800 text-white py-4 px-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="mobile-sidebar-toggle"
            onClick={() => setIsOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-extrabold text-sm shadow-md">
              G
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-100 bg-clip-text text-transparent">
              GAAFOW
            </span>
          </div>
        </div>

        {/* Mini cart widget */}
        <button
          id="mobile-header-cart"
          onClick={toggleCart}
          className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      {/* 3. Mobile Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 md:hidden shadow-2xl h-full"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
