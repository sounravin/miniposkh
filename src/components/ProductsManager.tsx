import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Barcode, 
  Package, 
  TrendingUp, 
  Check, 
  AlertTriangle,
  ArrowUpDown,
  Printer,
  Camera,
  Upload,
  Image as ImageIcon,
  Smartphone,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Product } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import { formatUSD, formatKHR } from '../utils/currency';
import { BarcodeLabelModal } from './BarcodeLabelModal';
import { BarcodeAutoCaptureModal } from './BarcodeAutoCaptureModal';
import { resizeImageFile } from '../lib/imageUtils';

interface ProductsManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  language: 'en' | 'kh';
  khrRate: number;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  language,
  khrRate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBarcodeCaptureOpen, setIsBarcodeCaptureOpen] = useState(false);
  const [barcodeLabelProduct, setBarcodeLabelProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>('10');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const isKh = language === 'kh';

  const handleImageFileSelected = async (file: File) => {
    if (!file) return;
    try {
      setIsProcessingImage(true);
      // Auto compress & resize to max 800x800 with 0.82 JPEG quality
      const result = await resizeImageFile(file, 800, 800, 0.82);
      setFormData(prev => ({ ...prev, image: result.dataUrl }));
      setImageSizeKb(result.sizeKb);
    } catch (err: any) {
      alert(isKh ? 'បរាជ័យក្នុងការបង្រួមទំហំរូបភាព: ' + err.message : 'Failed to process image: ' + err.message);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Form state for Add/Edit
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    nameKh: '',
    category: 'Skin Care',
    price: 15.00,
    costPrice: 9.00,
    stock: 30,
    barcode: '',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
    description: '',
    isPopular: false
  });

  const generateRandomBarcode = () => {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    return `885${randomSuffix}`;
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      nameKh: '',
      category: 'Skin Care',
      price: 15.00,
      costPrice: 9.00,
      stock: 30,
      barcode: generateRandomBarcode(),
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
      description: '',
      isPopular: false
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...(formData as Product),
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0)
      });
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name || 'New Product',
        nameKh: formData.nameKh,
        category: formData.category || 'Main Course',
        price: Number(formData.price),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0),
        barcode: formData.barcode || generateRandomBarcode(),
        image: formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        description: formData.description,
        isPopular: formData.isPopular || false
      };
      onAddProduct(newProd);
    }
    setIsAddModalOpen(false);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    const qty = parseInt(restockAmount, 10) || 0;
    onUpdateProduct({
      ...restockProduct,
      stock: Math.max(0, restockProduct.stock + qty)
    });
    setRestockProduct(null);
  };

  // Filtered product list
  const filtered = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = q === '' ||
      p.name.toLowerCase().includes(q) ||
      (p.nameKh && p.nameKh.includes(q)) ||
      p.barcode.includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <span>{isKh ? 'គ្រប់គ្រងបញ្ជីទំនិញ & ស្តុក' : 'Products & Inventory Management'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {products.length} {isKh ? 'មុខទំនិញសរុបក្នុងប្រព័ន្ធ' : 'total items in catalog with active barcode tracking'}
          </p>
        </div>

        <button
          id="add-new-product-btn"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isKh ? 'បន្ថែមទំនិញថ្មី' : 'Add New Product'}</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKh ? "ស្វែងរកឈ្មោះទំនិញ, លេខបាកូដ..." : "Search product name, barcode..."}
            className="w-full bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-48 bg-white text-xs font-semibold text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200/80 cursor-pointer focus:outline-none"
        >
          <option value="All">{isKh ? 'គ្រប់ប្រភេទទាំងអស់' : 'All Categories'}</option>
          {INITIAL_CATEGORIES.filter(c => c !== 'All Items' && c !== 'Popular').map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{isKh ? 'ទំនិញ' : 'Product'}</th>
                <th className="py-3 px-3">{isKh ? 'ប្រភេទ' : 'Category'}</th>
                <th className="py-3 px-3">{isKh ? 'បាកូដ' : 'Barcode'}</th>
                <th className="py-3 px-3">{isKh ? 'ថ្លៃដើម' : 'Cost'}</th>
                <th className="py-3 px-3">{isKh ? 'តម្លៃលក់' : 'Sell Price'}</th>
                <th className="py-3 px-3">{isKh ? 'ចំណេញក្នុង១' : 'Margin'}</th>
                <th className="py-3 px-3">{isKh ? 'ស្តុក' : 'Stock'}</th>
                <th className="py-3 px-4 text-right">{isKh ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="font-semibold text-slate-600 text-sm mb-1">
                        {products.length === 0 
                          ? (isKh ? 'មិនទាន់មានទំនិញក្នុងគណនីរបស់អ្នកនៅឡើយទេ' : 'Your store has no products yet')
                          : (isKh ? 'រកមិនឃើញទំនិញទេ' : 'No products match your search')}
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm mb-3">
                        {products.length === 0
                          ? (isKh ? 'គណនីរបស់អ្នកទើបចុះឈ្មោះថ្មី។ ចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតមុខទំនិញដំបូងរបស់អ្នក' : 'Your account catalog is fresh and isolated. Click below to add your first product.')
                          : (isKh ? 'សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬប្រភេទ' : 'Try adjusting your search terms or category filter.')}
                      </p>
                      {products.length === 0 && (
                        <button
                          onClick={handleOpenAddModal}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          {isKh ? '+ បន្ថែមមុខទំនិញដំបូង' : '+ Add First Product'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const profit = prod.price - prod.costPrice;
                  const profitPercent = prod.price > 0 ? ((profit / prod.price) * 100).toFixed(0) : '0';

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-800 text-xs sm:text-sm">
                              {prod.name}
                            </div>
                            {prod.nameKh && (
                              <div className="text-[11px] text-slate-400">{prod.nameKh}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {prod.category}
                        </span>
                      </td>

                      {/* Barcode with Quick Print Sticker button */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-700 font-bold text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {prod.barcode}
                          </span>
                          <button
                            onClick={() => setBarcodeLabelProduct(prod)}
                            title="Generate/Print Barcode Sticker"
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-500">
                        {formatUSD(prod.costPrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 font-mono">
                          {formatUSD(prod.price)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatKHR(prod.price, khrRate)}
                        </div>
                      </td>

                      {/* Profit Margin */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          +${profit.toFixed(2)} ({profitPercent}%)
                        </span>
                      </td>

                      {/* Stock with Restock pill */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            setRestockProduct(prod);
                            setRestockAmount('10');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold font-mono text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                            prod.stock <= 5
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                          title="Click to adjust/restock"
                        >
                          {prod.stock <= 5 && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          <span>{prod.stock}</span>
                          <span className="text-[10px] text-indigo-600 font-sans">+restock</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${prod.name}"?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct 
                  ? (isKh ? 'កែប្រែទិន្នន័យទំនិញ' : 'Edit Product') 
                  : (isKh ? 'បន្ថែមទំនិញថ្មី' : 'Add New Product')}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Product Name (EN) *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Crispy Burger"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">ឈ្មោះជាភាសាខ្មែរ (KH)</label>
                  <input
                    type="text"
                    value={formData.nameKh || ''}
                    onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })}
                    placeholder="ឧ. ប៊ឺហ្គឺស្រួយពិសេស"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {INITIAL_CATEGORIES.filter(c => c !== 'All Items' && c !== 'Popular').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Barcode / SKU *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsBarcodeCaptureOpen(true)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer border border-indigo-200/60"
                        title={isKh ? "ស្កេនចាប់បាកូដដោយកាមេរ៉ា iPhone/Android" : "Scan barcode with Camera / Macro Lens"}
                      >
                        <Camera className="w-3 h-3 text-indigo-600" />
                        <span>{isKh ? 'ស្កេនបាកូដ' : 'Scan Camera'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, barcode: generateRandomBarcode() })}
                        className="text-[10px] text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                      >
                        {isKh ? 'បង្កើតស្វ័យប្រវត្ត' : 'Auto'}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="e.g. 885100000099"
                      className="w-full text-xs font-mono font-bold p-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsBarcodeCaptureOpen(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title={isKh ? "ស្កេនចាប់បាកូដដោយកាមេរ៉ា" : "Scan Barcode with Camera"}
                    >
                      <Barcode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice || 0}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold font-mono p-2 rounded-lg bg-white border border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold font-mono p-2 rounded-lg bg-white border border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock || 0}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs font-bold font-mono p-2 rounded-lg bg-white border border-slate-200"
                  />
                </div>
              </div>

              {/* Image Upload & iPhone Camera with Smart Auto-Resize */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    {isKh ? 'រូបភាពទំនិញ (Product Image)' : 'Product Image'}
                  </label>
                  {imageSizeKb && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Auto-Resized: ~{imageSizeKb} KB
                    </span>
                  )}
                </div>

                {/* Preview Thumbnail */}
                {formData.image && (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                    <img
                      src={formData.image}
                      alt="Product Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-100 shadow-2xs shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-bold text-slate-800 block truncate">
                        {formData.name || 'Image Preview'}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {formData.image.startsWith('data:') ? 'Compressed Data URL (Ready for Cloud)' : formData.image}
                      </span>
                    </div>
                  </div>
                )}

                {/* Upload Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Direct iPhone/Mobile Camera Capture */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-4 h-4 text-indigo-600" />
                    {isKh ? 'ថតរូប (Camera)' : 'Snap Photo'}
                  </button>

                  {/* Choose from Photos / Files */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-4 h-4 text-sky-600" />
                    {isKh ? 'ជ្រើសរូបភាព' : 'Choose Photo'}
                  </button>

                  {/* Hidden File Inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageFileSelected(e.target.files[0]);
                      }
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageFileSelected(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {isProcessingImage && (
                  <div className="p-2 bg-indigo-50 text-indigo-700 text-xs rounded-lg flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isKh ? 'កំពុងបង្រួមទំហំរូបភាព...' : 'Optimizing and resizing photo...'}</span>
                  </div>
                )}

                {/* Optional URL input fallback */}
                <input
                  type="url"
                  value={formData.image?.startsWith('data:') ? '' : (formData.image || '')}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value });
                    setImageSizeKb(null);
                  }}
                  placeholder={isKh ? 'ឬបិទភ្ជាប់តំណ Link រូបភាព (https://...)' : 'Or paste image URL (https://...)'}
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="form-is-popular"
                  checked={formData.isPopular || false}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="form-is-popular" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Mark as Popular / Featured Item
                </label>
              </div>

              <div className="pt-4 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Adjustment Modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xs w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800">
                {isKh ? 'បញ្ចូលស្តុកបន្ថែម' : 'Restock Item'}
              </h4>
              <button onClick={() => setRestockProduct(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">{restockProduct.name}</p>
              <p className="text-[11px] text-slate-400">Current Stock: {restockProduct.stock} units</p>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Add Quantity (±)</label>
                <input
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full text-lg font-bold font-mono px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Apply Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Label Printable Modal */}
      {barcodeLabelProduct && (
        <BarcodeLabelModal
          product={barcodeLabelProduct}
          onClose={() => setBarcodeLabelProduct(null)}
          language={language}
        />
      )}

      {/* Auto Barcode Scanner Modal with Macro Lens Support */}
      {isBarcodeCaptureOpen && (
        <BarcodeAutoCaptureModal
          isOpen={isBarcodeCaptureOpen}
          onClose={() => setIsBarcodeCaptureOpen(false)}
          onBarcodeCaptured={(code) => {
            setFormData(prev => ({ ...prev, barcode: code }));
          }}
          language={language}
          initialBarcode={formData.barcode}
        />
      )}
    </div>
  );
};
