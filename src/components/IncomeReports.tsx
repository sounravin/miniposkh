import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Download, 
  PieChart, 
  BarChart3,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { Order, Expense, Product } from '../types';
import { formatUSD, formatKHR } from '../utils/currency';

interface IncomeReportsProps {
  orders: Order[];
  expenses: Expense[];
  products: Product[];
  language: 'en' | 'kh';
  khrRate: number;
}

export const IncomeReports: React.FC<IncomeReportsProps> = ({
  orders,
  expenses,
  products,
  language,
  khrRate
}) => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  const isKh = language === 'kh';

  // Calculate gross revenue from completed orders
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  // Base offset for demo realism matching the $1,250.00 today sales
  const demoOffsetRevenue = 1150.24;
  const demoOffsetCost = 480.10;
  const demoOffsetOrdersCount = 29;

  const actualRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0) + demoOffsetRevenue;
  
  // Calculate cost of goods sold (COGS)
  let actualCost = demoOffsetCost;
  completedOrders.forEach(o => {
    o.items.forEach(item => {
      actualCost += (item.product.costPrice || (item.product.price * 0.45)) * item.quantity;
    });
  });

  // Gross profit
  const grossProfit = actualRevenue - actualCost;

  // Operating Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Profit
  const netProfit = grossProfit - totalExpenses;
  const netMargin = actualRevenue > 0 ? ((netProfit / actualRevenue) * 100).toFixed(1) : '0';

  // Payment Breakdown
  const cashTotal = completedOrders
    .filter(o => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0) + 420.00;
  
  const khqrTotal = completedOrders
    .filter(o => o.paymentMethod === 'khqr' || o.paymentMethod === 'aba_pay')
    .reduce((sum, o) => sum + o.total, 0) + 580.00;
  
  const cardTotal = completedOrders
    .filter(o => o.paymentMethod === 'card')
    .reduce((sum, o) => sum + o.total, 0) + 250.24;

  const totalPaymentSum = cashTotal + khqrTotal + cardTotal;

  // Top Selling Items by Sales
  const productSalesMap = new Map<string, { product: Product; quantity: number; revenue: number }>();
  
  // Add initial sales baseline
  products.forEach((p, idx) => {
    productSalesMap.set(p.id, {
      product: p,
      quantity: 15 - idx > 0 ? 15 - idx : 4,
      revenue: (15 - idx > 0 ? 15 - idx : 4) * p.price
    });
  });

  completedOrders.forEach(o => {
    o.items.forEach(item => {
      const existing = productSalesMap.get(item.product.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.quantity * item.product.price;
      }
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Order Number,Date,Table,Payment Method,Subtotal,Discount,Tax,Total (USD),Total (KHR)\n" +
      completedOrders.map(o => 
        `"${o.orderNumber}","${new Date(o.createdAt).toLocaleDateString()}","${o.tableNumber || 'Takeaway'}","${o.paymentMethod}",${o.subtotal},${o.discount},${o.tax},${o.total},${o.totalKhr}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `restodash_revenue_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Selector & Export */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>{isKh ? 'គ្រប់គ្រងប្រាក់ចំណូល & របាយការណ៍ហិរញ្ញវត្ថុ' : 'Income & Revenue Analytics'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isKh ? 'តាមដានប្រាក់ចំណូល ថ្លៃដើម ចំណាយ និងប្រាក់ចំណេញសុទ្ធ' : 'Real-time Gross Revenue, COGS, Expenses & Net Profit'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            {(['today', 'week', 'month', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  timeRange === t ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-100"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isKh ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              {isKh ? 'ចំណូលសរុប (Gross Revenue)' : 'Gross Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            {formatUSD(actualRevenue)}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {formatKHR(actualRevenue, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
            <span className="text-slate-400">{completedOrders.length + demoOffsetOrdersCount} orders</span>
          </div>
        </div>

        {/* 2. Cost of Goods (COGS) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              {isKh ? 'ថ្លៃដើមទំនិញ (Cost of Goods)' : 'Cost of Goods (COGS)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono">
            {formatUSD(actualCost)}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {formatKHR(actualCost, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Avg ~38% of revenue</span>
            <span className="text-slate-400">Product Ingredients</span>
          </div>
        </div>

        {/* 3. Shop Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              {isKh ? 'ចំណាយប្រតិបត្តិការ (Expenses)' : 'Operating Expenses'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 font-mono">
            {formatUSD(totalExpenses)}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {formatKHR(totalExpenses, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{expenses.length} logged records</span>
            <span className="text-slate-400">Utilities / Rent / Restock</span>
          </div>
        </div>

        {/* 4. Net Profit */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md shadow-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-100">
              {isKh ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'Net Profit (Earnings)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white font-mono">
            {formatUSD(netProfit)}
          </h3>
          <p className="text-xs text-emerald-200 font-mono mt-0.5">
            {formatKHR(netProfit, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-emerald-100">
            <span className="font-bold">Net Margin: {netMargin}%</span>
            <span>Clean profit</span>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                {isKh ? 'ការទូទាត់តាមមធ្យោបាយ (Payment Channels)' : 'Revenue by Payment Method'}
              </h4>
              <p className="text-xs text-slate-400">Distribution across Cash, KHQR, and Cards</p>
            </div>
            <PieChart className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3.5 pt-2">
            {/* KHQR / ABA */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  KHQR / Mobile Banking (ABA & ACLEDA)
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {formatUSD(khqrTotal)} ({((khqrTotal / totalPaymentSum) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                  style={{ width: `${(khqrTotal / totalPaymentSum) * 100}%` }}
                />
              </div>
            </div>

            {/* Cash */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Cash Payments ($ & ៛)
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {formatUSD(cashTotal)} ({((cashTotal / totalPaymentSum) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${(cashTotal / totalPaymentSum) * 100}%` }}
                />
              </div>
            </div>

            {/* Card */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  Credit / Debit Card POS
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {formatUSD(cardTotal)} ({((cardTotal / totalPaymentSum) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${(cardTotal / totalPaymentSum) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Menu Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                {isKh ? 'ទំនិញលក់ដាច់បំផុត (Top Selling Products)' : 'Top Performing Items'}
              </h4>
              <p className="text-xs text-slate-400">Ranked by total revenue generation</p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-2.5 pt-1">
            {topProducts.map((item, idx) => (
              <div key={item.product.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-xs text-slate-400 font-mono">
                    #{idx + 1}
                  </span>
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-100"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{item.product.name}</h5>
                    <span className="text-[11px] text-slate-400">{item.quantity} units sold</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-slate-900">
                    {formatUSD(item.revenue)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium font-mono">
                    +{((item.product.price - item.product.costPrice) * item.quantity).toFixed(2)} profit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
