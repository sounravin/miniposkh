import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronDown, 
  Barcode, 
  Sparkles,
  ArrowDown,
  PackagePlus,
  PackageOpen
} from 'lucide-react';
import { Product } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import { sounds } from '../utils/audio';
import { formatUSD, formatKHR } from '../utils/currency';

interface PosViewProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  openBarcodeScanner: () => void;
  onNavigateToProducts?: () => void;
  language: 'en' | 'kh';
  khrRate: number;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  onAddToCart,
  openBarcodeScanner,
  onNavigateToProducts,
  language,
  khrRate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dropdownCategory, setDropdownCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high' | 'name'>('default');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const isKh = language === 'kh';

  // Category list
  const categories = INITIAL_CATEGORIES;

  const getCategoryLabel = (cat: string) => {
    if (!isKh) return cat;
    switch (cat) {
      case 'All Items': return 'ទំនិញទាំងអស់';
      case 'Popular': return 'ពេញនិយម';
      case 'Skin Care': return 'ថែរក្សាសម្រស់';
      case 'Wines & Liquors': return 'ប្រភេទស្រា';
      case 'Food & Groceries': return 'ចំណីអាហារ';
      case 'Beverages': return 'ភេសជ្ជៈ';
      case 'Snacks': return 'អាហារសម្រន់';
      case 'Personal Care': return 'អនាម័យខ្លួន';
      default: return cat;
    }
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter from pills
    if (selectedCategory === 'Popular') {
      list = list.filter(p => p.isPopular);
    } else if (selectedCategory !== 'All Items') {
      list = list.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Dropdown category filter
    if (dropdownCategory !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === dropdownCategory.toLowerCase());
    }

    // Search query filter (name, khmer name, barcode, description)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.nameKh && p.nameKh.includes(q)) ||
        p.barcode.includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // In-stock only filter
    if (inStockOnly) {
      list = list.filter(p => p.stock > 0);
    }

    // Sorting
    if (sortBy === 'price_low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, selectedCategory, dropdownCategory, searchQuery, inStockOnly, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const handleProductAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    onAddToCart(product);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Category Pills Header */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar touch-scroll">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`cat-tab-${cat.toLowerCase().replace(/[\s&]+/g, '-')}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setDropdownCategory('All');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-100'
                }`}
              >
                {cat === 'Popular' && <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" />}
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>

        {/* Filter Trigger Button */}
        <div className="relative">
          <button
            id="pos-filter-btn"
            onClick={() => setShowFilterModal(!showFilterModal)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showFilterModal || inStockOnly || sortBy !== 'default'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isKh ? 'តម្រង (Filter)' : 'Filter'}</span>
            {(inStockOnly || sortBy !== 'default') && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            )}
          </button>

          {/* Filter Popover */}
          {showFilterModal && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3.5 z-40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">{isKh ? 'តម្រងទំនិញ' : 'Filter Options'}</span>
                <button 
                  onClick={() => {
                    setSortBy('default');
                    setInStockOnly(false);
                  }}
                  className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {isKh ? 'រៀបតាម (Sort By)' : 'Sort By'}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="default">{isKh ? 'តាមលំដាប់ដើម' : 'Default'}</option>
                  <option value="price_low">{isKh ? 'តម្លៃទាប ទៅ ខ្ពស់' : 'Price: Low to High'}</option>
                  <option value="price_high">{isKh ? 'តម្លៃខ្ពស់ ទៅ ទាប' : 'Price: High to Low'}</option>
                  <option value="name">{isKh ? 'ឈ្មោះ (A-Z)' : 'Product Name (A-Z)'}</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-700 font-medium">
                  {isKh ? 'ទំនិញមានក្នុងស្តុក' : 'In-Stock Only'}
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                />
              </div>

              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {isKh ? 'អនុវត្ត' : 'Apply Filter'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-search bar & Categories dropdown */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="pos-menu-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKh ? "ស្វែងរកទំនិញ, Skin Care, ស្រា, អាហារ ឬស្កេនបាកូដ..." : "Search products, skin care, wine, food or scan barcode..."}
            className="w-full bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-10 py-2.5 border border-slate-100/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <button
            onClick={openBarcodeScanner}
            title="Scan Barcode"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
          >
            <Barcode className="w-4 h-4" />
          </button>
        </div>

        {/* Category selector dropdown */}
        <div className="relative shrink-0">
          <select
            id="pos-category-select-dropdown"
            value={dropdownCategory}
            onChange={(e) => {
              setDropdownCategory(e.target.value);
              setSelectedCategory('All Items');
            }}
            className="appearance-none bg-white text-xs sm:text-sm font-medium text-slate-700 pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-100/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">{isKh ? 'គ្រប់ប្រភេទទាំងអស់' : 'All Categories'}</option>
            {INITIAL_CATEGORIES.filter(c => c !== 'All Items' && c !== 'Popular').map(c => (
              <option key={c} value={c}>{c} ({getCategoryLabel(c)})</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
            <PackageOpen className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1.5">
            {isKh ? 'មិនទាន់មានទំនិញក្នុងគណនីរបស់អ្នកនៅឡើយទេ' : 'Your Product Catalog is Empty'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
            {isKh 
              ? 'គណនីរបស់អ្នកត្រូវបានបែងចែកដាច់ដោយឡែក (Empty Store)។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតមុខទំនិញដំបូងរបស់អ្នក ថតរូបពីទូរស័ព្ទ និងបង្កើតបាកូដ!' 
              : 'Your new member workspace is clean and isolated. Add your first product with photo, price, and barcode to start selling!'}
          </p>
          {onNavigateToProducts && (
            <button
              onClick={onNavigateToProducts}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <PackagePlus className="w-4 h-4" />
              <span>{isKh ? '+ បន្ថែមមុខទំនិញដំបូង' : '+ Add First Product'}</span>
            </button>
          )}
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-700 mb-1">
            {isKh ? 'រកមិនឃើញទំនិញទេ' : 'No products found'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {isKh ? 'សូមព្យាយាមស្វែងរកជាមួយពាក្យគន្លឹះផ្សេង ឬជ្រើសរើសប្រភេទផ្សេង' : 'Try adjusting your search query, clear active filters, or scan another barcode.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All Items');
              setDropdownCategory('All');
              setInStockOnly(false);
            }}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            {isKh ? 'កំណត់ឡើងវិញ' : 'Reset All Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 xl:gap-4">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              id={`product-card-${product.id}`}
              onClick={(e) => handleProductAdd(product, e)}
              className="bg-white rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer p-3 relative"
            >
              {/* Product Thumbnail with Clean backdrop */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 mb-2.5 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Popular Pill badge */}
                {product.isPopular && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-500/90 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs">
                    ★ Popular
                  </span>
                )}
                {/* Stock count badge */}
                <span className={`absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-xs ${
                  product.stock <= 5 
                    ? 'bg-rose-500/90 text-white font-bold' 
                    : 'bg-black/40 text-white'
                }`}>
                  {product.stock <= 5 ? `Low: ${product.stock}` : `Stock: ${product.stock}`}
                </span>
              </div>

              {/* Product Info */}
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors leading-snug">
                  {isKh ? (product.nameKh || product.name) : product.name}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1 font-medium leading-normal">
                  {isKh ? product.name : (product.nameKh || '')}
                </p>
              </div>

              {/* Price & Add Button Row */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                <div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {formatUSD(product.price)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formatKHR(product.price, khrRate)}
                  </div>
                </div>

                <button
                  id={`add-btn-${product.id}`}
                  onClick={(e) => handleProductAdd(product, e)}
                  title="Add to order"
                  className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center shadow-2xs transition-all active:scale-90 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {filteredProducts.length > visibleCount && (
        <div className="flex justify-center mt-6 mb-2">
          <button
            id="pos-load-more-btn"
            onClick={handleLoadMore}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>{isKh ? 'មើលបន្ថែមទៀត' : 'Load More'}</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
