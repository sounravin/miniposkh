import React, { useState } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  CheckCircle, 
  Printer, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, PaymentMethod, Order } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';
import { sounds } from '../utils/audio';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  discountType: 'fixed' | 'percent';
  tax: number;
  taxRate: number;
  total: number;
  selectedTable: string;
  customerName: string;
  orderNote: string;
  cashierName: string;
  khrRate: number;
  language: 'en' | 'kh';
  onOrderCompleted: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discount,
  discountType,
  tax,
  taxRate,
  total,
  selectedTable,
  customerName,
  orderNote,
  cashierName,
  khrRate,
  language,
  onOrderCompleted
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>(total.toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);

  const isKh = language === 'kh';

  if (!isOpen) return null;

  const totalKhr = Math.round(total * khrRate);
  const numericTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numericTendered - total);
  const changeDueKhr = Math.round(changeDue * khrRate);

  const quickCashOptions = [
    total,
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    50,
    100
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total);

  const handleCompletePayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      sounds.playCashRegister();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe catch
      }

      const completedOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        items: [...cartItems],
        subtotal,
        discount,
        discountType,
        tax,
        taxRate,
        total,
        totalKhr,
        paymentMethod: selectedMethod,
        amountPaid: selectedMethod === 'cash' ? numericTendered : total,
        changeDue: selectedMethod === 'cash' ? changeDue : 0,
        tableNumber: selectedTable,
        customerName: customerName || (isKh ? 'អតិថិជនទូទៅ' : 'Walk-in Guest'),
        cashierName,
        status: 'completed',
        createdAt: new Date().toISOString(),
        note: orderNote
      };

      setIsProcessing(false);
      onOrderCompleted(completedOrder);
    }, 450);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/20">
                {selectedTable}
              </span>
              <h3 className="font-bold text-lg tracking-tight">
                {isKh ? 'ការទូទាត់ប្រាក់ (Checkout)' : 'Complete Payment'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {cartItems.reduce((s, i) => s + i.quantity, 0)} items • Cashier: {cashierName}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-white font-mono">
              {formatUSD(total)}
            </div>
            <div className="text-xs text-indigo-300 font-mono">
              {formatKHR(total, khrRate)}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Method Selector Pills */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2.5">
              {isKh ? 'វិធីសាស្ត្រទូទាត់ (Payment Method)' : 'Select Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Cash Option */}
              <button
                id="payment-method-cash"
                onClick={() => setSelectedMethod('cash')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedMethod === 'cash'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-600" />
                <span className="text-xs font-semibold">
                  {isKh ? 'សាច់ប្រាក់ (Cash)' : 'Cash'}
                </span>
              </button>

              {/* KHQR / ABA Option */}
              <button
                id="payment-method-khqr"
                onClick={() => setSelectedMethod('khqr')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedMethod === 'khqr'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <QrCode className="w-6 h-6 text-rose-600" />
                <span className="text-xs font-semibold">
                  {isKh ? 'ស្កេន KHQR / ABA' : 'KHQR / Mobile'}
                </span>
              </button>

              {/* Credit Card Option */}
              <button
                id="payment-method-card"
                onClick={() => setSelectedMethod('card')}
                className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <CreditCard className="w-6 h-6 text-indigo-600" />
                <span className="text-xs font-semibold">
                  {isKh ? 'កាតធនាគារ (Card)' : 'Card / POS'}
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Method Details */}
          {selectedMethod === 'cash' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {isKh ? 'ចំនួនទឹកប្រាក់ទទួល (Cash Tendered)' : 'Amount Received ($ USD)'}
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total Due: {formatUSD(total)}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min={total}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full text-xl font-bold font-mono px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                {quickCashOptions.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashTendered(amount.toFixed(2))}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer border border-slate-200/60"
                  >
                    ${amount.toFixed(2)}
                  </button>
                ))}
              </div>

              {/* Change Calculation Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    {isKh ? 'ប្រាក់អាប់ជូន (Change Due)' : 'Change Due'}
                  </span>
                  <div className="text-xs text-emerald-600 font-mono">
                    {changeDueKhr > 0 && formatKHR(changeDue, khrRate)}
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {formatUSD(changeDue)}
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'khqr' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-5 animate-in fade-in">
              {/* Dynamic QR Code graphic */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=KHQR-${total.toFixed(2)}-RESTODASH-TABLE5`}
                  alt="KHQR Code"
                  className="w-32 h-32 rounded-lg"
                />
                <span className="text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-wider">
                  Bakong KHQR
                </span>
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Instant Verification
                </div>
                <h5 className="font-bold text-sm text-slate-800">
                  {isKh ? 'ស្កេនទូទាត់ជាមួយកម្មវិធីធនាគារ' : 'Scan with ABA, ACLEDA or any Bank App'}
                </h5>
                <p className="text-xs text-slate-500">
                  Merchant: <strong className="text-slate-700">MINI-POS-KH</strong>
                </p>
                <div className="text-base font-bold text-slate-900 font-mono">
                  {formatUSD(total)} / {formatKHR(total, khrRate)}
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">{isKh ? 'ស្ថានីយទូទាត់ POS កាត' : 'Terminal Status'}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  ● Ready for Tap / Insert
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Visa / Mastercard / UnionPay</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {isKh ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            id="confirm-payment-btn"
            disabled={isProcessing || (selectedMethod === 'cash' && numericTendered < total)}
            onClick={handleCompletePayment}
            className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-95"
          >
            {isProcessing ? (
              <span className="inline-block animate-spin">⟳</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isKh ? 'បញ្ជាក់ការបង់ប្រាក់ & បោះពុម្ពវិក្កយបត្រ' : 'Confirm Payment & Print Receipt'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
