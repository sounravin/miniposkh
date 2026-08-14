import React, { useState, useMemo } from 'react';
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
  CheckCircle2,
  Package,
  Layers
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

  // Helper to filter dates
  const isWithinTimeRange = (dateStr: string, range: 'today' | 'week' | 'month' | 'all') => {
    if (range === 'all') return true;
    try {
      const itemDate = new Date(dateStr).getTime();
      const now = new Date();
      
      if (range === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
        return itemDate >= startOfDay && itemDate <= endOfDay;
      }
      
      if (range === 'week') {
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        return itemDate >= sevenDaysAgo;
      }
      
      if (range === 'month') {
        const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        return itemDate >= thirtyDaysAgo;
      }
      
      return true;
    } catch {
      return true;
    }
  };

  // 1. Filtered Completed Orders and Expenses based on Time Range
  const {
    filteredOrders,
    completedOrders,
    actualRevenue,
    actualCost,
    grossProfit,
    filteredExpenses,
    totalExpenses,
    netProfit,
    netMargin,
    cashTotal,
    khqrTotal,
    cardTotal,
    totalPaymentSum,
    topProducts
  } = useMemo(() => {
    const matchedOrders = orders.filter(o => isWithinTimeRange(o.createdAt, timeRange));
    const completed = matchedOrders.filter(o => o.status === 'completed');
    
    // Revenue
    const revenue = completed.reduce((sum, o) => sum + o.total, 0);

    // COGS
    let cost = 0;
    completed.forEach(o => {
      o.items.forEach(item => {
        const itemCost = item.product.costPrice ?? (item.product.price * 0.45);
        cost += itemCost * item.quantity;
      });
    });

    // Gross Profit
    const gp = revenue - cost;

    // Filtered Expenses
    const matchedExpenses = expenses.filter(e => isWithinTimeRange(e.date, timeRange));
    const expTotal = matchedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Net Profit
    const np = gp - expTotal;
    const margin = revenue > 0 ? ((np / revenue) * 100).toFixed(1) : '0';

    // Payment methods
    const cash = completed
      .filter(o => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.total, 0);

    const khqr = completed
      .filter(o => o.paymentMethod === 'khqr' || o.paymentMethod === 'aba_pay')
      .reduce((sum, o) => sum + o.total, 0);

    const card = completed
      .filter(o => o.paymentMethod === 'card')
      .reduce((sum, o) => sum + o.total, 0);

    const paySum = cash + khqr + card;

    // Top selling products in this filtered range
    const productSalesMap = new Map<string, { product: Product; quantity: number; revenue: number; profit: number }>();

    completed.forEach(o => {
      o.items.forEach(item => {
        const pId = item.product.id;
        const itemCost = item.product.costPrice ?? (item.product.price * 0.45);
        const itemRevenue = item.product.price * item.quantity;
        const itemProfit = (item.product.price - itemCost) * item.quantity;

        const existing = productSalesMap.get(pId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += itemRevenue;
          existing.profit += itemProfit;
        } else {
          productSalesMap.set(pId, {
            product: item.product,
            quantity: item.quantity,
            revenue: itemRevenue,
            profit: itemProfit
          });
        }
      });
    });

    const top = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      filteredOrders: matchedOrders,
      completedOrders: completed,
      actualRevenue: revenue,
      actualCost: cost,
      grossProfit: gp,
      filteredExpenses: matchedExpenses,
      totalExpenses: expTotal,
      netProfit: np,
      netMargin: margin,
      cashTotal: cash,
      khqrTotal: khqr,
      cardTotal: card,
      totalPaymentSum: paySum,
      topProducts: top
    };
  }, [orders, expenses, timeRange]);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Order Number,Date,Status,Table,Payment Method,Subtotal,Discount,Tax,Total (USD),Total (KHR)\n" +
      completedOrders.map(o => 
        `"${o.orderNumber}","${new Date(o.createdAt).toLocaleString()}","${o.status}","${o.tableNumber || 'Takeaway'}","${o.paymentMethod}",${o.subtotal.toFixed(2)},${o.discount.toFixed(2)},${o.tax.toFixed(2)},${o.total.toFixed(2)},${o.totalKhr.toFixed(0)}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `restodash_revenue_report_${timeRange}_${new Date().toISOString().slice(0,10)}.csv`);
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
            <span>{isKh ? 'គ្រប់គ្រងប្រាក់ចំណូល & របាយការណ៍ហិរញ្ញវត្ថុ' : 'Income & Financial Reports'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isKh ? 'តាមដានប្រាក់ចំណូលលក់ ថ្លៃដើម (COGS) ការចំណាយ និងប្រាក់ចំណេញសុទ្ធពិតប្រាកដ' : 'Real-time Sales Revenue, COGS, Expenses & Net Earnings'}
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
                {t === 'today' ? (isKh ? 'ថ្ងៃនេះ' : 'Today') :
                 t === 'week' ? (isKh ? '៧ថ្ងៃ' : '7 Days') :
                 t === 'month' ? (isKh ? '៣០ថ្ងៃ' : '30 Days') :
                 (isKh ? 'ទាំងអស់' : 'All')}
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
            <span className="text-xs font-semibold text-slate-500">
              {isKh ? 'ចំណូលលក់សរុប (Gross Revenue)' : 'Gross Sales Revenue'}
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
              <CheckCircle2 className="w-3.5 h-3.5" /> {completedOrders.length} {isKh ? 'វិក្កយបត្របានទូទាត់' : 'paid orders'}
            </span>
            <span className="text-slate-400 font-medium">
              {filteredOrders.length} {isKh ? 'សរុប' : 'total'}
            </span>
          </div>
        </div>

        {/* 2. Cost of Goods (COGS) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">
              {isKh ? 'ថ្លៃដើមទំនិញ (Cost of Goods / COGS)' : 'Cost of Goods (COGS)'}
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
            <span className="text-slate-500 font-medium">
              {actualRevenue > 0 ? `${((actualCost / actualRevenue) * 100).toFixed(1)}%` : '0%'} {isKh ? 'នៃចំណូល' : 'of revenue'}
            </span>
            <span className="text-slate-400">{isKh ? 'ថ្លៃដើមគ្រឿងផ្សំ' : 'Direct product cost'}</span>
          </div>
        </div>

        {/* 3. Shop Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">
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
            <span className="text-slate-500">{filteredExpenses.length} {isKh ? 'កំណត់ត្រាចំណាយ' : 'logged entries'}</span>
            <span className="text-slate-400">{isKh ? 'ទឹកភ្លើង/ជួល/ស្តុក' : 'Rent, bills & restock'}</span>
          </div>
        </div>

        {/* 4. Net Profit */}
        <div className={`p-5 rounded-2xl shadow-md text-white ${
          netProfit >= 0 
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-200' 
            : 'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/90">
              {isKh ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'Net Profit (Earnings)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white font-mono">
            {formatUSD(netProfit)}
          </h3>
          <p className="text-xs text-white/80 font-mono mt-0.5">
            {formatKHR(netProfit, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
            <span className="font-bold">{isKh ? 'កម្រិតចំណេញ (Margin):' : 'Margin:'} {netMargin}%</span>
            <span>{isKh ? 'ចំណេញសុទ្ធបន្ទាប់ពីកាត់ចំណាយ' : 'Revenue - COGS - Expenses'}</span>
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
              <p className="text-xs text-slate-400">
                {isKh ? 'ការបែងចែកចំណូលតាម សាច់ប្រាក់, KHQR, និង កាត' : 'Distribution across Cash, KHQR, and Card transactions'}
              </p>
            </div>
            <PieChart className="w-5 h-5 text-indigo-600" />
          </div>

          {totalPaymentSum === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {isKh ? 'មិនទាន់មានការទូទាត់ក្នុងកាលបរិច្ឆេទនេះនៅឡើយទេ' : 'No payments recorded in this time range.'}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* KHQR / ABA */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    {isKh ? 'KHQR / ធនាគារចល័ត (ABA & ACLEDA)' : 'KHQR / Mobile Banking (ABA & Bank)'}
                  </span>
                  <span className="font-mono text-slate-800 font-bold">
                    {formatUSD(khqrTotal)} ({((khqrTotal / totalPaymentSum) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
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
                    {isKh ? 'សាច់ប្រាក់សុទ្ធ ($ & ៛)' : 'Cash Payments ($ & ៛)'}
                  </span>
                  <span className="font-mono text-slate-800 font-bold">
                    {formatUSD(cashTotal)} ({((cashTotal / totalPaymentSum) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
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
                    {isKh ? 'កាតធនាគារ (Credit / Debit Card POS)' : 'Credit / Debit Card POS'}
                  </span>
                  <span className="font-mono text-slate-800 font-bold">
                    {formatUSD(cardTotal)} ({((cardTotal / totalPaymentSum) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${(cardTotal / totalPaymentSum) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Performing Menu Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                {isKh ? 'ទំនិញលក់ដាច់បំផុត (Top Selling Products)' : 'Top Performing Items'}
              </h4>
              <p className="text-xs text-slate-400">
                {isKh ? 'ចំណាត់ថ្នាក់តាមចំនួន និងចំណូលលក់ជាក់ស្តែង' : 'Ranked by total quantity sold and revenue generated'}
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {isKh ? 'មិនទាន់មានទំនិញលក់ចេញក្នុងកាលបរិច្ឆេទនេះទេ' : 'No product sales recorded in this time range.'}
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {topProducts.map((item, idx) => (
                <div key={item.product.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-xs text-slate-400 font-mono">
                      #{idx + 1}
                    </span>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-100"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">{item.product.name}</h5>
                      <span className="text-[11px] text-slate-400">
                        {item.quantity} {isKh ? 'បានលក់' : 'units sold'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {formatUSD(item.revenue)}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium font-mono">
                      +{formatUSD(item.profit)} {isKh ? 'ចំណេញ' : 'profit'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

