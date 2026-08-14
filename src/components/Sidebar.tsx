import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  ReceiptText, 
  Settings, 
  QrCode,
  Sparkles,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { ActiveView, User } from '../types';
import { Logo } from './Logo';
import { LogOut, X } from 'lucide-react';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  openBarcodeScanner: () => void;
  ordersCount: number;
  productsCount: number;
  language: 'en' | 'kh';
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenProfileModal?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  openBarcodeScanner,
  ordersCount,
  productsCount,
  language,
  currentUser,
  onLogout,
  onOpenProfileModal,
  onCloseMobile
}) => {
  const isKh = language === 'kh';

  const navItems = [
    {
      id: 'pos' as ActiveView,
      label: isKh ? 'ផ្ទាំងលក់ POS' : 'Overview / POS',
      icon: LayoutDashboard,
      badge: null
    },
    ...(currentUser?.role === 'admin' ? [{
      id: 'admin_console' as ActiveView,
      label: isKh ? 'Admin Console' : 'Admin Console',
      icon: ShieldCheck,
      badge: isKh ? 'ADMIN' : 'ADMIN'
    }] : []),
    {
      id: 'products' as ActiveView,
      label: isKh ? 'គ្រប់គ្រងទំនិញ' : 'Products & Catalog',
      icon: Package,
      badge: productsCount
    },
    {
      id: 'orders' as ActiveView,
      label: isKh ? 'បញ្ជីលក់ & វិក្កយបត្រ' : 'Sales Orders',
      icon: ShoppingCart,
      badge: ordersCount > 0 ? ordersCount : null
    },
    {
      id: 'income_reports' as ActiveView,
      label: isKh ? 'ចំណូល & របាយការណ៍' : 'Income & Reports',
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'expenses' as ActiveView,
      label: isKh ? 'គ្រប់គ្រងចំណាយ' : 'Expenses',
      icon: ReceiptText,
      badge: null
    },
    {
      id: 'customers' as ActiveView,
      label: isKh ? 'អតិថិជន & សមាជិក' : 'Customers & Loyalty',
      icon: Users,
      badge: null
    },
    {
      id: 'settings' as ActiveView,
      label: isKh ? 'ការកំណត់' : 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-72 md:w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none pt-safe pb-safe overflow-y-auto touch-scroll">
      {/* Brand Header */}
      <div>
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100/80 bg-slate-50/40">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={42} variant="badge" />
            <div className="min-w-0">
              <h1 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-1.5 leading-tight truncate">
                MINI-POS-KH
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
                {isKh ? 'ប្រព័ន្ធគ្រប់គ្រងការលក់' : 'Retail POS System'}
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Barcode Quick Scanner CTA Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            id="sidebar-scan-barcode-btn"
            onClick={openBarcodeScanner}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>{isKh ? 'ស្កេនបាកូដ (Scan Barcode)' : 'Quick Scan Barcode'}</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>MINI-POS v2.5</span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">ONLINE</span>
        </div>
      </div>
    </aside>
  );
};
