import React, { useState } from 'react';
import { ReceiptText, Plus, Search, Trash2, Calendar, DollarSign, Tag } from 'lucide-react';
import { Expense } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';

interface ExpensesManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  language: 'en' | 'kh';
  khrRate: number;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  language,
  khrRate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const isKh = language === 'kh';

  const [formData, setFormData] = useState<Partial<Expense>>({
    title: '',
    category: 'Stock Purchase',
    amount: 50.00,
    date: new Date().toISOString().slice(0, 10),
    paidBy: 'MD Atikur Rhaman',
    notes: ''
  });

  const categories = [
    'Stock Purchase',
    'Utilities',
    'Rent',
    'Staff Salary',
    'Marketing',
    'Maintenance',
    'Other'
  ] as const;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title: formData.title,
      category: formData.category as Expense['category'] || 'Stock Purchase',
      amount: Number(formData.amount),
      date: formData.date || new Date().toISOString().slice(0, 10),
      paidBy: formData.paidBy || 'Admin',
      notes: formData.notes
    };

    onAddExpense(newExpense);
    setIsModalOpen(false);
    setFormData({
      title: '',
      category: 'Stock Purchase',
      amount: 50.00,
      date: new Date().toISOString().slice(0, 10),
      paidBy: 'MD Atikur Rhaman',
      notes: ''
    });
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filtered = expenses.filter(e => {
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = q === '' || e.title.toLowerCase().includes(q) || (e.notes && e.notes.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-indigo-600" />
            <span>{isKh ? 'គ្រប់គ្រងការចំណាយ (Expense Tracker)' : 'Shop Expense Management'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isKh ? 'កត់ត្រាការទិញស្តុក ថ្លៃទឹកភ្លើង ឈ្នួល និងចំណាយផ្សេងៗ' : 'Record operational costs to accurately compute net business earnings'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isKh ? 'កត់ត្រាចំណាយថ្មី' : 'Log New Expense'}</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-md shadow-rose-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider">
            {isKh ? 'ការចំណាយសរុបទាំងអស់' : 'Total Operational Expenses'}
          </span>
          <h3 className="text-3xl font-black font-mono mt-1">
            {formatUSD(totalExpenseAmount)}
          </h3>
          <p className="text-xs text-rose-100 font-mono mt-0.5">
            {formatKHR(totalExpenseAmount, khrRate)}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKh ? "ស្វែងរកចំណងជើងចំណាយ..." : "Search expense title, notes..."}
            className="w-full bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48 bg-white text-xs font-semibold text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200/80 cursor-pointer focus:outline-none"
        >
          <option value="All">{isKh ? 'គ្រប់ប្រភេទ' : 'All Categories'}</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Paid By</th>
                <th className="py-3 px-3">Amount (USD)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                      {item.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div>{item.title}</div>
                      {item.notes && <div className="text-[11px] text-slate-400 font-normal">{item.notes}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.paidBy}</td>
                    <td className="py-3 px-3 font-bold font-mono text-rose-600">
                      -{formatUSD(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteExpense(item.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">Log New Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Vegetables & Meat Restock"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Expense['category'] })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notes / Supplier</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional supplier or receipt details..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
