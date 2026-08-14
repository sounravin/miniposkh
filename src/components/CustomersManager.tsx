import React, { useState } from 'react';
import { Users, Plus, Search, Phone, Mail, Award, DollarSign } from 'lucide-react';
import { Customer } from '../types';
import { formatUSD } from '../utils/currency';

interface CustomersManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  language: 'en' | 'kh';
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({
  customers,
  onAddCustomer,
  language
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isKh = language === 'kh';

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    points: 10
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      totalOrders: 1,
      totalSpent: 0,
      points: Number(formData.points || 10),
      lastVisit: new Date().toISOString().slice(0, 10)
    };

    onAddCustomer(newCust);
    setIsAddModalOpen(false);
    setFormData({ name: '', phone: '', email: '', points: 10 });
  };

  const filtered = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return q === '' || c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>{isKh ? 'គ្រប់គ្រងអតិថិជន (Customers & Loyalty)' : 'Customer Directory & Points'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {customers.length} registered loyal customers
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isKh ? 'ចុះឈ្មោះអតិថិជន' : 'Add New Customer'}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isKh ? "ស្វែងរកឈ្មោះ ឬលេខទូរស័ព្ទ..." : "Search customer name, phone number..."}
          className="w-full bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cust) => (
          <div key={cust.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {cust.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{cust.name}</h4>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {cust.phone}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                <Award className="w-3.5 h-3.5" />
                {cust.points} pts
              </span>
            </div>

            <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{cust.totalOrders} Total Orders</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatUSD(cust.totalSpent)} spent
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">Add New Customer</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Chan Sophea"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 012 345 678"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. customer@gmail.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
