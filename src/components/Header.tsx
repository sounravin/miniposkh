import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Barcode, 
  Globe, 
  Menu, 
  X,
  Plus,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { Product, User } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  openBarcodeScanner: () => void;
  openNewProductModal: () => void;
  language: 'en' | 'kh';
  setLanguage: (lang: 'en' | 'kh') => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAdminConsole?: () => void;
  onOpenProfileModal?: () => void;
  toggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  products,
  onSelectProduct,
  openBarcodeScanner,
  openNewProductModal,
  language,
  setLanguage,
  currentUser,
  onLogout,
  onOpenAdminConsole,
  onOpenProfileModal,
  toggleMobileSidebar
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const isKh = language === 'kh';

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: isKh ? 'ការកុម្ម៉ង់បានទូទាត់ជោគជ័យ' : 'Order #ORD-1003 Completed',
      desc: isKh ? 'ការទូទាត់ $33.01 បានទទួលតាមកាត POS' : 'Payment of $33.01 received via Card POS.',
      type: 'success',
      read: false,
      time: 'Just now'
    },
    {
      id: 'n2',
      title: isKh ? 'ដំណឹងស្តុកទំនិញ៖ នំខេកសូកូឡា' : 'Stock Warning: Chocolate Cake',
      desc: isKh ? 'ស្តុកដែលនៅសល់មានចំនួន ២០ កញ្ចប់' : 'Remaining stock is 20 units.',
      type: 'warning',
      read: false,
      time: '10m ago'
    },
    {
      id: 'n3',
      title: isKh ? 'ចំណូលលក់ថ្ងៃនេះកើនឡើង' : 'Daily Sales Milestone Reached',
      desc: isKh ? 'ការលក់ថ្ងៃនេះបានកើនឡើងលើស $1,000.00!' : 'Today sales crossed $1,000.00 milestone!',
      type: 'info',
      read: false,
      time: '1h ago'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Live timer clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl + K / Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered search results
  const searchResults = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.nameKh && p.nameKh.includes(searchQuery)) ||
    p.barcode.includes(searchQuery) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <header className="bg-white border-b border-slate-100 px-3 sm:px-6 py-2 sm:py-3.5 pt-safe flex items-center justify-between sticky top-0 z-30 w-full max-w-full">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-2xl min-w-0">
        {/* Mobile menu trigger & Mobile Brand Logo */}
        <div className="flex items-center gap-1 sm:gap-2 md:hidden shrink-0">
          {toggleMobileSidebar && (
            <button 
              onClick={toggleMobileSidebar}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Logo size={28} variant="badge" />
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 min-w-0 max-w-xs sm:max-w-md">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 sm:left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="header-global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder={isKh ? "ស្វែងរកទំនិញ..." : "Search product..."}
              className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl pl-7 sm:pl-9 pr-7 sm:pr-14 py-1.5 sm:py-2 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery ? (
              <button 
                onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                {isKh ? 'លទ្ធផលស្វែងរក' : 'Matching Products'}
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto touch-scroll">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectProduct(item);
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50/60 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                          {item.name} {item.nameKh && <span className="text-xs font-normal text-slate-400">({item.nameKh})</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                          <span className="font-mono">#{item.barcode}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">${item.price.toFixed(2)}</div>
                      <div className="text-[10px] sm:text-[11px] text-emerald-600 font-medium">Stock: {item.stock}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barcode Quick Action Button in Header */}
        <button
          id="header-scan-barcode-button"
          onClick={openBarcodeScanner}
          title={isKh ? "ស្កេនបាកូដដោយកាមេរ៉ា" : "Scan Barcode with Camera"}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:bg-indigo-200 rounded-xl border border-indigo-100 transition-colors cursor-pointer shrink-0"
        >
          <Barcode className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">{isKh ? "ស្កេនបាកូដ" : "Scan Barcode"}</span>
        </button>

        {/* Add Product Shortcut */}
        <button
          id="header-add-product-btn"
          onClick={openNewProductModal}
          title={isKh ? "បន្ថែមទំនិញថ្មី" : "Add New Product"}
          className="hidden lg:flex items-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isKh ? "ថែមទំនិញ" : "Add Product"}</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 ml-2">
        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'en' ? 'EN' : 'ខ្មែរ'}</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            id="header-notification-btn"
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-100 p-3.5 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    {isKh ? 'ការជូនដំណឹង (Notifications)' : 'Recent Alerts'}
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  {isKh ? 'សម្គាល់ថាបានអាន' : 'Mark all read'}
                </button>
              </div>

              <div className="py-2 space-y-2 text-xs max-h-72 overflow-y-auto touch-scroll">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    {isKh ? 'គ្មានការជូនដំណឹងថ្មីទេ' : 'No notifications'}
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => removeNotification(n.id)}
                      className={`p-2.5 rounded-xl border flex flex-col gap-0.5 cursor-pointer transition-all ${
                        n.type === 'success' ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950 hover:bg-emerald-100/80' :
                        n.type === 'warning' ? 'bg-amber-50/70 border-amber-100 text-amber-950 hover:bg-amber-100/80' :
                        'bg-indigo-50/70 border-indigo-100 text-indigo-950 hover:bg-indigo-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                      </div>
                      <span className="text-[11px] opacity-80 leading-relaxed">{n.desc}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Date & Time Widget */}
        <div className="hidden xl:flex flex-col text-right pl-1 pr-2 border-r border-slate-200">
          <span className="text-xs font-semibold text-slate-800">{formattedDate}</span>
          <span className="text-[11px] font-mono text-slate-400">{formattedTime}</span>
        </div>

        {/* User Profile Section with Direct Click Handlers */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="relative" ref={profileMenuRef}>
              <button
                id="header-user-profile-button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-2xl hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer text-left group"
                aria-label="User Profile"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.fullName}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-200/80 group-hover:ring-indigo-400 shrink-0 transition-all"
                />
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate block">
                      {currentUser.fullName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md ${
                      currentUser.role === 'admin' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : currentUser.role === 'manager'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="p-2.5 bg-slate-50 rounded-xl mb-2 flex items-center gap-3">
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={currentUser.fullName}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">{currentUser.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">@{currentUser.username}</div>
                      {currentUser.phone && (
                        <div className="text-[10px] text-slate-500 truncate">{currentUser.phone}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {onOpenProfileModal && (
                      <button
                        id="dropdown-edit-profile-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenProfileModal();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-indigo-600" />
                        <span>{isKh ? 'កែប្រែ Profile & Upload រូបថត' : 'Edit Profile & Photo'}</span>
                      </button>
                    )}

                    {currentUser.role === 'admin' && onOpenAdminConsole && (
                      <button
                        id="dropdown-admin-console-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenAdminConsole();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>{isKh ? 'បើកផ្ទាំង Admin Console' : 'Open Admin Console'}</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        id="dropdown-logout-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-100 mt-1 pt-2"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>{isKh ? 'ចាកចេញពីគណនី (Logout)' : 'Sign Out'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
