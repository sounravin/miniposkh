import React from 'react';
import { 
  Bell, 
  ShoppingCart, 
  ArrowRight, 
  Check, 
  X, 
  User, 
  MapPin, 
  Phone, 
  Clock, 
  Sparkles, 
  ChevronRight,
  Flame,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Order, CartItem } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';

interface IncomingOnlineOrdersDrawerProps {
  onlineOrders: Order[];
  onLoadOrderToPOS: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'kh';
  khrRate: number;
}

export const IncomingOnlineOrdersDrawer: React.FC<IncomingOnlineOrdersDrawerProps> = ({
  onlineOrders,
  onLoadOrderToPOS,
  onUpdateOrderStatus,
  onDeleteOrder,
  isOpen,
  onClose,
  language,
  khrRate
}) => {
  const isKh = language === 'kh';
  const pendingList = onlineOrders.filter(o => o.status === 'pending_online');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs text-amber-300">
              <Bell className="w-5 h-5 animate-swing" />
              {pendingList.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {pendingList.length}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>{isKh ? 'ការកុម្ម៉ង់អនឡាញពីអតិថិជន' : 'Incoming Online Orders'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-bold">
                  LIVE
                </span>
              </h3>
              <p className="text-xs text-indigo-200">
                {pendingList.length} {isKh ? 'ការកុម្ម៉ង់កំពុងរង់ចាំគិតលុយ' : 'pending orders in queue'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
          {pendingList.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-sm text-slate-700">
                {isKh ? 'មិនមានការកុម្ម៉ង់អនឡាញថ្មីទេ' : 'No Pending Online Orders'}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {isKh 
                  ? 'នៅពេលអតិថិជនកុម្ម៉ង់តាមតំណភ្ជាប់ម៉ឺនុយ ការកុម្ម៉ង់នឹងបង្ហាញនៅទីនេះភ្លាមៗ។' 
                  : 'When customers place orders from their phone menu, they will appear here in real-time.'}
              </p>
            </div>
          ) : (
            pendingList.map((order) => {
              const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <div
                  key={order.id}
                  className="pt-3.5 first:pt-0 bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm space-y-3 hover:border-indigo-300 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-slate-800 flex items-center gap-1.5 pt-1">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{order.customerName || (isKh ? 'អតិថិជនអនឡាញ' : 'Online Customer')}</span>
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-indigo-700">{formatUSD(order.total)}</div>
                      <div className="text-[10px] font-bold text-slate-400">{formatKHR(order.totalKhr || order.total * khrRate)}</div>
                    </div>
                  </div>

                  {/* Metadata (Phone & Table) */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    {order.tableNumber && (
                      <span className="font-semibold flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3 text-indigo-600" />
                        {order.tableNumber}
                      </span>
                    )}
                    {order.customerPhone && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {order.customerPhone}
                      </span>
                    )}
                    {order.note && (
                      <div className="w-full text-[11px] text-amber-800 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200/60 font-medium">
                        📝 ចំណាំ: {order.note}
                      </div>
                    )}
                  </div>

                  {/* Items Preview */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      {totalItems} {isKh ? 'មុខទំនិញដែលបានជ្រើស:' : 'Items in Order:'}
                    </div>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs py-0.5">
                          <span className="text-slate-700 font-medium truncate max-w-[200px]">
                            {it.quantity}× {it.product.name}
                          </span>
                          <span className="font-bold text-slate-900">{formatUSD(it.product.price * it.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High-Priority Primary Action: PUSH TO CURRENT ORDER TO CHECKOUT */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadOrderToPOS(order);
                        onClose();
                      }}
                      className="flex-1 py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{isKh ? '📥 បញ្ចូលក្នុង Current Order ដើម្បីគិតលុយ' : '📥 Push to POS & Checkout'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteOrder(order.id)}
                      title={isKh ? 'បដិសេធ / លុប' : 'Decline'}
                      className="p-2.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {pendingList.length} {isKh ? 'ការកុម្ម៉ង់សរុប' : 'total pending orders'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isKh ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
