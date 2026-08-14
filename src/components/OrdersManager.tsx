import React, { useState } from 'react';
import { ShoppingCart, Search, Printer, CheckCircle, Clock, XCircle, ArrowUpRight } from 'lucide-react';
import { Order } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';

interface OrdersManagerProps {
  orders: Order[];
  onViewReceipt: (order: Order) => void;
  language: 'en' | 'kh';
  khrRate: number;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({
  orders,
  onViewReceipt,
  language,
  khrRate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft' | 'cancelled'>('all');

  const isKh = language === 'kh';

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = q === '' ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.tableNumber && o.tableNumber.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <span>{isKh ? 'ប្រវត្តិនៃការបញ្ជាទិញ (Orders History)' : 'Orders & Transactions History'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {orders.length} {isKh ? 'ប្រតិបត្តិការសរុប' : 'total recorded sales orders'}
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {(['all', 'completed', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                statusFilter === s ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isKh ? "ស្វែងរកលេខវិក្កយបត្រ, ឈ្មោះអតិថិជន, លេខតុ..." : "Search order number, customer name, table..."}
          className="w-full bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order No</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Customer / Table</th>
                <th className="py-3 px-3">Items Summary</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{order.customerName || 'Walk-in'}</div>
                        <span className="text-[11px] text-indigo-600 font-medium">{order.tableNumber || 'Takeaway'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium">{itemCount} items</span>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {formatUSD(order.total)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatKHR(order.total, khrRate)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          order.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {order.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {order.status === 'draft' && <Clock className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onViewReceipt(order)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Print / View Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
