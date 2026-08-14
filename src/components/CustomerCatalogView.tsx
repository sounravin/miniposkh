import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  Phone, 
  Clock, 
  ArrowLeft, 
  Send, 
  X, 
  Info,
  ChevronRight,
  Store,
  Share2,
  Check,
  PackageCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, CartItem, Order, ShopSettings } from '../types';
import { Logo } from './Logo';
import { formatUSD, formatKHR } from '../utils/currency';
import { saveOrderToFirestore } from '../lib/firestoreService';

interface CustomerCatalogViewProps {
  products: Product[];
  settings: ShopSettings;
  language: 'en' | 'kh';
  onBackToPos?: () => void;
  isStandalone?: boolean;
  storeId?: string;
  onOrderSubmitted?: (newOrder: Order) => void;
}

export const CustomerCatalogView: React.FC<CustomerCatalogViewProps> = ({
  products,
  settings,
  language: initialLanguage,
  onBackToPos,
  isStandalone = false,
  storeId,
  onOrderSubmitted
}) => {
  const [language, setLanguage] = useState<'en' | 'kh'>(initialLanguage || 'kh');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Customer Cart
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  
  // State for order submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);
  const [detailItemNote, setDetailItemNote] = useState('');

  const isKh = language === 'kh';

  // Extract Categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return ['all', ...list];
  }, [products]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        p.name.toLowerCase().includes(q) ||
        (p.nameKh && p.nameKh.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Totals - Note: Tax is completely excluded as per requirement (subtotal = grandTotal)
  const totalItemsCount = customerCart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = customerCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const grandTotalUSD = subtotal;
  const grandTotalKHR = grandTotalUSD * (settings.khrExchangeRate || 4100);

  // Cart Actions
  const handleAddToCart = (product: Product, note?: string) => {
    setCustomerCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + 1,
          itemNote: note || next[existingIdx].itemNote
        };
        return next;
      } else {
        return [...prev, { product, quantity: 1, itemNote: note }];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCustomerCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCustomerCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCustomerCart([]);
  };

  // Submit Order to Store (Fast 1-click submit without details form or tax)
  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customerCart.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderNum = `ONL-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: Order = {
        id: `ord-online-${Date.now()}`,
        userId: storeId || 'user-admin',
        orderNumber: orderNum,
        items: customerCart.map(item => ({
          product: {
            id: item.product.id,
            userId: item.product.userId || storeId || 'user-admin',
            name: item.product.name || '',
            nameKh: item.product.nameKh || '',
            category: item.product.category || 'General',
            price: Number(item.product.price) || 0,
            costPrice: Number(item.product.costPrice) || 0,
            stock: Number(item.product.stock) || 0,
            barcode: item.product.barcode || '',
            image: item.product.image || '',
            unit: item.product.unit || 'pcs'
          },
          quantity: item.quantity,
          selectedVariant: item.selectedVariant || '',
          itemNote: item.itemNote || ''
        })),
        subtotal,
        discount: 0,
        discountType: 'fixed',
        tax: 0,
        taxRate: 0,
        total: grandTotalUSD,
        totalKhr: grandTotalKHR,
        paymentMethod: 'cash',
        amountPaid: 0,
        changeDue: 0,
        tableNumber: isKh ? 'កុម្ម៉ង់ផ្ទាល់ (Self-Order)' : 'Self-Order Online',
        customerName: isKh ? 'អតិថិជនអនឡាញ (Online)' : 'Online Customer',
        customerPhone: '',
        cashierName: 'Self-Order Online',
        status: 'pending_online',
        createdAt: new Date().toISOString(),
        note: ''
      };

      // 1. Save to Cloud Firestore
      await saveOrderToFirestore(newOrder);

      // 2. Broadcast to POS window / same domain
      if (typeof window !== 'undefined') {
        try {
          const bc = new BroadcastChannel('minipos_online_orders');
          bc.postMessage({ type: 'NEW_CUSTOMER_ORDER', order: newOrder });
          bc.close();
        } catch {
          // ignore if broadcast channel not supported
        }

        try {
          localStorage.setItem('minipos_latest_online_order', JSON.stringify({
            timestamp: Date.now(),
            order: newOrder
          }));
        } catch {
          // ignore
        }
      }

      if (onOrderSubmitted) {
        onOrderSubmitted(newOrder);
      }

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSubmittedOrder(newOrder);
      setCustomerCart([]);
      setIsCartModalOpen(false);
    } catch (err) {
      console.error('Error submitting customer order:', err);
      alert(isKh ? 'មានបញ្ហាក្នុងការផ្ញើការកុម្ម៉ង់ សូមព្យាយាមម្តងទៀត!' : 'Failed to send order. Please try again!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-[max(6.5rem,calc(env(safe-area-inset-bottom,0px)+5.5rem))] selection:bg-indigo-500 selection:text-white">
      {/* 1. Top Brand Banner & Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onBackToPos && (
              <button
                onClick={onBackToPos}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="ត្រឡប់ទៅផ្ទាំងលក់ POS វិញ"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{isKh ? 'ត្រឡប់ទៅ POS' : 'Back to POS'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <Logo size={38} variant="badge" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-sm sm:text-base md:text-lg text-slate-900 tracking-tight leading-tight truncate">
                    {isKh ? settings.shopNameKh || settings.shopName : settings.shopName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {isKh ? 'បើក' : 'Open'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                  <Store className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate">{isKh ? 'ម៉ឺនុយកុម្ម៉ង់ទំនិញអនឡាញ' : 'Online Menu'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls: Language & Cart button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setLanguage('kh')}
                className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  language === 'kh' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇰🇭 ខ្មែរ
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  language === 'en' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Cart Icon Top Trigger */}
            <button
              onClick={() => setIsCartModalOpen(true)}
              className="relative p-2 sm:p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center min-w-[38px] min-h-[38px]"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Notice & Store Info */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 pb-1">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-indigo-200 text-[11px] font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isKh ? 'កុម្ម៉ង់ផ្ទាល់ខ្លួនងាយៗ ឆាប់រហ័ស' : 'Fast & Easy Self-Ordering'}</span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight">
              {isKh ? 'សូមជ្រើសរើសមុខទំនិញដែលលោកអ្នកពេញចិត្ត' : 'Choose Your Favorite Products'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed max-w-xl">
              {isKh 
                ? 'ជ្រើសរើសមុខទំនិញ បន្ទាប់មកចុចប៊ូតុង "ផ្ញើការកុម្ម៉ង់ទៅហាង" ការកុម្ម៉ង់នឹងបញ្ជូនទៅគិតលុយភ្លាមៗ!' 
                : 'Browse products, add to cart, and send directly to the store in real-time!'}
            </p>
          </div>

          {(settings.phone || settings.address) && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-indigo-100 bg-white/10 p-2.5 rounded-xl border border-white/15">
              {settings.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-indigo-300" />
                  <span>{settings.phone}</span>
                </div>
              )}
              {settings.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-300" />
                  <span className="truncate max-w-[180px]">{settings.address}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 space-y-2.5 sticky top-[58px] sm:top-[65px] z-20 bg-slate-50/95 backdrop-blur-sm">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKh ? 'ស្វែងរកឈ្មោះទំនិញ, ប្រភេទទំនិញ ឬ លេខបាកូដ...' : 'Search products, category, or barcode...'}
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x -webkit-overflow-scrolling-touch">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'all' 
              ? products.length 
              : products.filter(p => p.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 min-h-[36px] ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs scale-102'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{cat === 'all' ? (isKh ? '🌟 ទាំងអស់' : '🌟 All Items') : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Products Grid */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-2">
        {filteredProducts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {isKh ? 'រកមិនឃើញទំនិញដែលអ្នកចង់បានទេ' : 'No Products Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isKh ? 'សូមសាកល្បងស្វែងរកឈ្មោះផ្សេង ឬជ្រើសរើសប្រភេទទំនិញទាំងអស់' : 'Try a different search term or category'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isKh ? 'មើលទំនិញទាំងអស់' : 'View All Products'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
            {filteredProducts.map((product) => {
              const inCart = customerCart.find(i => i.product.id === product.id);
              const qty = inCart ? inCart.quantity : 0;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${
                    isOutOfStock ? 'opacity-70 bg-slate-50' : ''
                  }`}
                >
                  {/* Image & Badges */}
                  <div 
                    onClick={() => setActiveProductDetail(product)}
                    className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold shadow-2xs">
                        {isKh ? 'អស់ស្តុក' : 'Out of Stock'}
                      </span>
                    ) : product.stock <= 5 ? (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold shadow-2xs">
                        {isKh ? `សល់តែ ${product.stock}` : `${product.stock} left`}
                      </span>
                    ) : (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-xs text-white text-[9px] font-semibold truncate max-w-[90px]">
                        {product.category}
                      </span>
                    )}

                    {product.isPopular && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[9px] font-bold flex items-center gap-0.5 shadow-2xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        {isKh ? 'ពេញនិយម' : 'Popular'}
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1.5">
                    <div 
                      onClick={() => setActiveProductDetail(product)}
                      className="cursor-pointer"
                    >
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                        {isKh ? product.nameKh || product.name : product.name}
                      </h4>
                      {product.nameKh && isKh && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{product.name}</p>
                      )}
                    </div>

                    {/* Price in USD & KHR */}
                    <div className="pt-1 border-t border-slate-100">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-xs sm:text-sm md:text-base font-extrabold text-indigo-700">
                          {formatUSD(product.price)}
                        </span>
                        <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-slate-400">
                          {formatKHR(product.price * (settings.khrExchangeRate || 4100))}
                        </span>
                      </div>
                    </div>

                    {/* Add to Cart / Stepper */}
                    <div className="pt-1">
                      {qty === 0 ? (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(product)}
                          className="w-full min-h-[38px] py-1.5 bg-indigo-50 hover:bg-indigo-600 active:bg-indigo-700 text-indigo-700 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isKh ? 'កុម្ម៉ង់' : 'Add'}</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-indigo-600 text-white rounded-xl p-0.5 sm:p-1 shadow-2xs min-h-[38px]">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(product.id, -1)}
                            className="p-1.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors cursor-pointer"
                          >
                            {qty === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-300" /> : <Minus className="w-3.5 h-3.5" />}
                          </button>
                          <span className="font-extrabold text-xs px-1">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="p-1.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Sticky Floating Customer Cart Bar (iPhone Bottom Safe) */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-3 sm:bottom-4 inset-x-0 z-40 max-w-md mx-auto px-3 sm:px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-5 duration-200">
          <div 
            onClick={() => setIsCartModalOpen(true)}
            className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-3 sm:p-3.5 rounded-2xl shadow-xl border border-white/20 flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 bg-white/20 rounded-xl">
                <ShoppingCart className="w-4 h-4 text-white" />
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemsCount}
                </span>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-indigo-200">
                  {totalItemsCount} {isKh ? 'មុខទំនិញ' : 'item(s)'}
                </div>
                <div className="text-sm sm:text-base font-black flex items-center gap-1.5">
                  <span>{formatUSD(grandTotalUSD)}</span>
                  <span className="text-[11px] text-indigo-300 font-normal">
                    ({formatKHR(grandTotalKHR)})
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm shrink-0 min-h-[38px]"
            >
              <span>{isKh ? 'ពិនិត្យ & ផ្ញើការកុម្ម៉ង់' : 'Send Order'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Customer Checkout & Submission Drawer Modal (No Details Form & No Tax) */}
      {isCartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            
            {/* iPhone Mobile Pull Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="px-4 py-3 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                    {isKh ? 'កន្ត្រកទំនិញរបស់អ្នក' : 'Your Order Summary'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    {totalItemsCount} {isKh ? 'មុខទំនិញបានជ្រើសរើស' : 'items ready to send'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 divide-y divide-slate-100 flex-1">
              {customerCart.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">{isKh ? 'កន្ត្រកទទេស្អាត' : 'Your cart is empty'}</p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-2.5 pb-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{isKh ? 'មុខទំនិញ' : 'Selected Items'}</span>
                      <button
                        onClick={handleClearCart}
                        className="text-rose-600 hover:underline cursor-pointer text-[11px]"
                      >
                        {isKh ? 'លុបទាំងអស់' : 'Clear All'}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {customerCart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200/70 gap-2"
                        >
                          <img
                            src={item.product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-slate-800 truncate">
                              {isKh ? item.product.nameKh || item.product.name : item.product.name}
                            </h5>
                            <div className="text-[11px] text-indigo-600 font-extrabold flex items-center gap-1">
                              <span>{formatUSD(item.product.price)}</span>
                              <span className="text-slate-400 font-normal">
                                × {item.quantity} = {formatUSD(item.product.price * item.quantity)}
                              </span>
                            </div>
                            {item.itemNote && (
                              <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block truncate max-w-full">
                                📝 {item.itemNote}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.product.id, -1)}
                              className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                            >
                              {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-xs font-bold px-1 min-w-[18px] text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item.product)}
                              className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Cost Calculation (No Tax Included as requested) */}
                  <div className="pt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-baseline pt-1 text-sm font-black text-slate-900">
                      <span>{isKh ? 'ទឹកប្រាក់សរុប (Total Amount)' : 'Total Amount'}</span>
                      <div className="text-right">
                        <div className="text-base text-indigo-700 font-black">{formatUSD(grandTotalUSD)}</div>
                        <div className="text-xs text-slate-400 font-bold">{formatKHR(grandTotalKHR)}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer / 1-Click Fast Submit Action */}
            {customerCart.length > 0 && (
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setIsCartModalOpen(false)}
                  className="flex-1 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer min-h-[44px]"
                >
                  {isKh ? 'ជ្រើសបន្ថែម' : 'Add More'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitOrder()}
                  disabled={isSubmitting}
                  className="flex-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isKh ? '🚀 ផ្ញើការកុម្ម៉ង់ទៅហាង' : '🚀 Send Order to Store'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Success Order Sent Modal */}
      {submittedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-mono font-bold">
                {submittedOrder.orderNumber}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-800">
                {isKh ? 'ការកុម្ម៉ង់ត្រូវបានផ្ញើជោគជ័យ!' : 'Order Sent Successfully!'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                {isKh 
                  ? `ទំនិញរបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់ម្ចាស់ហាងផ្ទាល់រួចរាល់ហើយ។ សូមរង់ចាំបុគ្គលិករៀបចំទំនិញ និងគិតលុយ។` 
                  : `Your order has been directly received by the store checkout counter. Please wait while we prepare it.`}
              </p>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isKh ? 'អ្នកកុម្ម៉ង់:' : 'Customer:'}</span>
                <span className="font-bold text-slate-800">{submittedOrder.customerName}</span>
              </div>
              {submittedOrder.tableNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{isKh ? 'ទីតាំង / តុ:' : 'Location:'}</span>
                  <span className="font-bold text-slate-800">{submittedOrder.tableNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{isKh ? 'ចំនួនទំនិញ:' : 'Total Items:'}</span>
                <span className="font-bold text-slate-800">
                  {submittedOrder.items.reduce((s, i) => s + i.quantity, 0)} {isKh ? 'មុខ' : 'items'}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-black text-indigo-700 text-sm">
                <span>{isKh ? 'ទឹកប្រាក់ត្រូវទូទាត់:' : 'Total:'}</span>
                <span>{formatUSD(submittedOrder.total)} ({formatKHR(submittedOrder.totalKhr)})</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSubmittedOrder(null)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer"
              >
                {isKh ? 'រួចរាល់ / កុម្ម៉ង់ទំនិញផ្សេងទៀត' : 'Done / Place Another Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Single Product Details Modal */}
      {activeProductDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 space-y-3">
            <div className="relative aspect-video w-full bg-slate-100">
              <img
                src={activeProductDetail.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                alt={activeProductDetail.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveProductDetail(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                  {activeProductDetail.category}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  {isKh ? activeProductDetail.nameKh || activeProductDetail.name : activeProductDetail.name}
                </h3>
                {activeProductDetail.nameKh && isKh && (
                  <p className="text-xs text-slate-400">{activeProductDetail.name}</p>
                )}
              </div>

              <div className="flex items-baseline justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-lg font-black text-indigo-700">{formatUSD(activeProductDetail.price)}</span>
                <span className="text-xs font-bold text-slate-400">{formatKHR(activeProductDetail.price * (settings.khrExchangeRate || 4100))}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isKh ? 'ចំណាំពិសេសសម្រាប់មុខទំនិញនេះ' : 'Special Note for this item'}
                </label>
                <input
                  type="text"
                  value={detailItemNote}
                  onChange={(e) => setDetailItemNote(e.target.value)}
                  placeholder={isKh ? 'ឧទាហរណ៍: ផ្អែមតិច, ដាក់ទឹកកកច្រើន...' : 'e.g. Less spicy, extra sauce'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveProductDetail(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isKh ? 'បិទ' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(activeProductDetail, detailItemNote.trim());
                    setActiveProductDetail(null);
                    setDetailItemNote('');
                  }}
                  className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isKh ? 'បន្ថែមក្នុងកន្ត្រក' : 'Add to Cart'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
