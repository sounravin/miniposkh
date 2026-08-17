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
  Layers,
  ShoppingBag,
  ArrowRightLeft,
  Filter,
  Search,
  Check,
  AlertCircle,
  Percent,
  Sparkles
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
  const [activeTab, setActiveTab] = useState<'overview' | 'sales_in_out' | 'expenses' | 'payments'>('overview');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

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

  // Comprehensive Financial & In/Out Calculation Engine
  const financialData = useMemo(() => {
    const matchedOrders = orders.filter(o => isWithinTimeRange(o.createdAt, timeRange));
    const completed = matchedOrders.filter(o => o.status === 'completed');
    
    // 1. Sales Out (លក់ចេញ)
    const grossRevenue = completed.reduce((sum, o) => sum + o.total, 0);
    const totalOrdersCount = completed.length;
    let totalItemsSold = 0;

    // 2. Cost of Goods Sold (COGS / ថ្លៃដើមទំនិញលក់ចេញ)
    let cogsCost = 0;
    const productSalesMap = new Map<string, {
      product: Product;
      unitsSold: number;
      revenue: number;
      cost: number;
      profit: number;
    }>();

    completed.forEach(o => {
      o.items.forEach(item => {
        const pId = item.product.id;
        const qty = item.quantity || 1;
        totalItemsSold += qty;

        // Accurate Cost Price
        const unitCost = typeof item.product.costPrice === 'number' && !isNaN(item.product.costPrice)
          ? item.product.costPrice
          : (item.product.price * 0.45);
        
        const unitPrice = item.product.price;
        const lineRevenue = unitPrice * qty;
        const lineCost = unitCost * qty;
        const lineProfit = lineRevenue - lineCost;

        cogsCost += lineCost;

        const existing = productSalesMap.get(pId);
        if (existing) {
          existing.unitsSold += qty;
          existing.revenue += lineRevenue;
          existing.cost += lineCost;
          existing.profit += lineProfit;
        } else {
          productSalesMap.set(pId, {
            product: item.product,
            unitsSold: qty,
            revenue: lineRevenue,
            cost: lineCost,
            profit: lineProfit
          });
        }
      });
    });

    // 3. Expenses & Stock Purchases (លក់ចូល / ទិញស្តុក & ចំណាយប្រតិបត្តិការ)
    const matchedExpenses = expenses.filter(e => isWithinTimeRange(e.date, timeRange));
    const stockPurchaseExpenses = matchedExpenses
      .filter(e => e.category === 'Stock Purchase')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const operatingExpenses = matchedExpenses
      .filter(e => e.category !== 'Stock Purchase')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = matchedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Profitability Math
    const grossProfit = grossRevenue - cogsCost;
    const grossMargin = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : '0';
    
    // Net profit = Gross Revenue - COGS - Operating Expenses
    const netProfit = grossProfit - operatingExpenses;
    const netMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0';
    const avgOrderValue = totalOrdersCount > 0 ? grossRevenue / totalOrdersCount : 0;

    // 5. Payment Channel distribution
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

    // 6. Complete In/Out Product Matrix
    // Include all active store products to show their current stock, sold units, in-cost and out-revenue
    const allProductsMatrix = products.map(p => {
      const sales = productSalesMap.get(p.id);
      const unitsSold = sales ? sales.unitsSold : 0;
      const unitCost = typeof p.costPrice === 'number' && !isNaN(p.costPrice) ? p.costPrice : (p.price * 0.45);
      const unitPrice = p.price;
      const totalRevenueOut = sales ? sales.revenue : 0;
      const totalCostIn = unitsSold * unitCost;
      const profit = totalRevenueOut - totalCostIn;
      const margin = totalRevenueOut > 0 ? ((profit / totalRevenueOut) * 100).toFixed(1) : '0';

      return {
        product: p,
        currentStock: p.stock,
        unitsSold,
        unitCost,
        unitPrice,
        unitMargin: unitPrice - unitCost,
        unitMarginPercent: unitPrice > 0 ? (((unitPrice - unitCost) / unitPrice) * 100).toFixed(0) : '0',
        totalRevenueOut,
        totalCostIn,
        profit,
        margin
      };
    });

    const topSelling = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return {
      matchedOrders,
      completedOrders: completed,
      grossRevenue,
      totalOrdersCount,
      totalItemsSold,
      avgOrderValue,
      cogsCost,
      stockPurchaseExpenses,
      operatingExpenses,
      totalExpenses,
      grossProfit,
      grossMargin,
      netProfit,
      netMargin,
      cashTotal: cash,
      khqrTotal: khqr,
      cardTotal: card,
      totalPaymentSum: paySum,
      allProductsMatrix,
      topSelling,
      matchedExpenses
    };
  }, [orders, expenses, products, timeRange]);

  // Export Full In/Out and Financial CSV
  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "--- FINANCIAL & SALES REPORT ---\n";
    csv += `Time Range: ${timeRange.toUpperCase()}, Generated Date: ${new Date().toISOString()}\n`;
    csv += `Gross Sales Out (Revenue): $${financialData.grossRevenue.toFixed(2)}\n`;
    csv += `Cost of Goods Sold (COGS): $${financialData.cogsCost.toFixed(2)}\n`;
    csv += `Gross Profit: $${financialData.grossProfit.toFixed(2)} (${financialData.grossMargin}%)\n`;
    csv += `Operating Expenses: $${financialData.operatingExpenses.toFixed(2)}\n`;
    csv += `Net Profit: $${financialData.netProfit.toFixed(2)} (${financialData.netMargin}%)\n\n`;

    csv += "--- ITEM-BY-ITEM SALES IN/OUT MATRIX ---\n";
    csv += "Product Name,Category,Barcode,Stock Remaining,Units Sold Out,Unit Cost ($),Unit Sell Price ($),Total Sales Out ($),Total Cost In ($),Gross Profit ($),Margin (%)\n";
    
    financialData.allProductsMatrix.forEach(row => {
      csv += `"${row.product.name}","${row.product.category}","${row.product.barcode}",${row.currentStock},${row.unitsSold},${row.unitCost.toFixed(2)},${row.unitPrice.toFixed(2)},${row.totalRevenueOut.toFixed(2)},${row.totalCostIn.toFixed(2)},${row.profit.toFixed(2)},${row.margin}%\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_in_out_report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered in/out table
  const filteredMatrix = useMemo(() => {
    return financialData.allProductsMatrix.filter(row => {
      const matchCat = categoryFilter === 'All' || row.product.category === categoryFilter;
      const q = itemSearchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        row.product.name.toLowerCase().includes(q) ||
        (row.product.nameKh && row.product.nameKh.includes(q)) ||
        row.product.barcode.includes(q) ||
        row.product.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [financialData.allProductsMatrix, categoryFilter, itemSearchQuery]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="space-y-6">
      {/* 1. Header with Time Range & Export */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                {isKh ? 'របាយការណ៍លក់ចេញ-លក់ចូល & ហិរញ្ញវត្ថុ' : 'Sales In/Out & Financial Profit Engine'}
              </h2>
              <p className="text-xs text-slate-400">
                {isKh 
                  ? 'ប្រព័ន្ធគណនាស្វ័យប្រវត្តិនូវ ចំណូលលក់ចេញ, ថ្លៃដើមទិញចូល, ចំណាយ និងប្រាក់ចំណេញសុទ្ធ' 
                  : 'Automated Sales Outflow, Cost Inflow, Operating Expenses & Real-time Net Margin'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Selector */}
          <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-semibold">
            {(['today', 'week', 'month', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
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
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isKh ? 'ទាញយក Excel/CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Core Financial KPI Metric Cards (លក់ចេញ vs លក់ចូល vs ចំណេញ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sales Out / Gross Revenue (លក់ចេញ) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {isKh ? 'ចំណូលលក់ចេញសរុប (Sales Out)' : 'Gross Sales Outflow'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatUSD(financialData.grossRevenue)}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {formatKHR(financialData.grossRevenue, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {financialData.completedOrders.length} {isKh ? 'វិក្កយបត្រ' : 'invoices'}
            </span>
            <span className="text-slate-500 font-medium">
              {financialData.totalItemsSold} {isKh ? 'ចំនួនលក់ចេញ' : 'units sold'}
            </span>
          </div>
        </div>

        {/* Card 2: Cost In / COGS (ថ្លៃដើមលក់ចូល) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {isKh ? 'ថ្លៃដើមទំនិញលក់ (COGS / In)' : 'Cost of Goods Sold (COGS)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {formatUSD(financialData.cogsCost)}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {formatKHR(financialData.cogsCost, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">
              {financialData.grossRevenue > 0 
                ? `${((financialData.cogsCost / financialData.grossRevenue) * 100).toFixed(1)}%` 
                : '0%'} {isKh ? 'នៃចំណូលលក់' : 'of revenue'}
            </span>
            <span className="text-slate-400">
              {isKh ? 'ថ្លៃដើមផលិតផល' : 'Direct product cost'}
            </span>
          </div>
        </div>

        {/* Card 3: Operating Expenses & Restock (ចំណាយ & ទិញស្តុក) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {isKh ? 'ចំណាយប្រតិបត្តិការ (Expenses)' : 'Shop Operating Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 font-mono tracking-tight">
            {formatUSD(financialData.operatingExpenses)}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {formatKHR(financialData.operatingExpenses, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              {financialData.matchedExpenses.length} {isKh ? 'ប្រតិបត្តិការចំណាយ' : 'logged entries'}
            </span>
            <span className="text-slate-400">
              {isKh ? 'ទឹក ភ្លើង ឈ្នួល បុគ្គលិក' : 'Bills, Rent & Salary'}
            </span>
          </div>
        </div>

        {/* Card 4: Net Earnings / Profit (ប្រាក់ចំណេញសុទ្ធ) */}
        <div className={`p-5 rounded-3xl shadow-md text-white ${
          financialData.netProfit >= 0 
            ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-emerald-200' 
            : 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 shadow-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/90 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isKh ? 'ប្រាក់ចំណេញសុទ្ធ (Net Profit)' : 'Real Net Profit (Earnings)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white font-mono tracking-tight">
            {formatUSD(financialData.netProfit)}
          </h3>
          <p className="text-xs text-white/80 font-mono mt-0.5">
            {formatKHR(financialData.netProfit, khrRate)}
          </p>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-white/90">
            <span className="font-extrabold">{isKh ? 'កម្រិតចំណេញ:' : 'Margin:'} {financialData.netMargin}%</span>
            <span>{isKh ? 'លក់ចេញ - ថ្លៃដើម - ចំណាយ' : 'Sales - COGS - Expenses'}</span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs for Deep Analysis */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isKh ? 'ទិដ្ឋភាពទូទៅ & ឆានែលទូទាត់' : 'Overview & Payment Channels'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sales_in_out')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sales_in_out'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{isKh ? 'តារាងគណនាលក់ចេញ-លក់ចូលតាមមុខទំនិញ' : 'Itemized Sales In/Out Matrix'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-700 font-black">
            {products.length}
          </span>
        </button>
      </div>

      {/* 4. Tab 1: Overview & Channels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {isKh ? 'ការទូទាត់តាមមធ្យោបាយ (Payment Channels)' : 'Revenue by Payment Method'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isKh ? 'ការបែងចែកចំណូលតាម សាច់ប្រាក់, KHQR/ABA, និង កាតធនាគារ' : 'Distribution across Cash, KHQR, and Card transactions'}
                </p>
              </div>
              <PieChart className="w-5 h-5 text-indigo-600" />
            </div>

            {financialData.totalPaymentSum === 0 ? (
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
                      {formatUSD(financialData.khqrTotal)} ({((financialData.khqrTotal / financialData.totalPaymentSum) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(financialData.khqrTotal / financialData.totalPaymentSum) * 100}%` }}
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
                      {formatUSD(financialData.cashTotal)} ({((financialData.cashTotal / financialData.totalPaymentSum) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(financialData.cashTotal / financialData.totalPaymentSum) * 100}%` }}
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
                      {formatUSD(financialData.cardTotal)} ({((financialData.cardTotal / financialData.totalPaymentSum) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${(financialData.cardTotal / financialData.totalPaymentSum) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Selling Products */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
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

            {financialData.topSelling.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {isKh ? 'មិនទាន់មានទំនិញលក់ចេញក្នុងកាលបរិច្ឆេទនេះទេ' : 'No product sales recorded in this time range.'}
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {financialData.topSelling.map((item, idx) => (
                  <div key={item.product.id} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
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
                          {item.unitsSold} {isKh ? 'បានលក់' : 'units sold'}
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
      )}

      {/* 5. Tab 2: Itemized Sales In/Out Matrix (តារាងគណនាលក់ចេញ-លក់ចូល) */}
      {activeTab === 'sales_in_out' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>{isKh ? 'តារាងគណនាលម្អិត៖ លក់ចេញ vs ថ្លៃដើមទិញចូល & ស្តុក' : 'Itemized Sales Out vs Cost Inflow & Profit Matrix'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isKh ? 'តាមដានថ្លៃដើមទិញចូល (Cost In), តម្លៃលក់ចេញ (Sell Price), ស្តុកនៅសល់ និងប្រាក់ចំណេញតាមមុខទំនិញ' : 'Item-level Cost In, Price Out, Stock on hand and gross margin breakdown'}
              </p>
            </div>

            {/* Filter Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  placeholder={isKh ? "ស្វែងរកទំនិញ..." : "Search items..."}
                  className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 rounded-xl pl-8 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer focus:outline-none"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">{isKh ? 'មុខទំនិញ' : 'Product Name'}</th>
                  <th className="py-3 px-2.5 text-center">{isKh ? 'ស្តុកនៅសល់' : 'Stock Left'}</th>
                  <th className="py-3 px-2.5 text-center">{isKh ? 'ចំនួនលក់ចេញ' : 'Qty Sold'}</th>
                  <th className="py-3 px-2.5">{isKh ? 'ថ្លៃដើមចូល' : 'Unit Cost (In)'}</th>
                  <th className="py-3 px-2.5">{isKh ? 'តម្លៃលក់ចេញ' : 'Unit Price (Out)'}</th>
                  <th className="py-3 px-2.5">{isKh ? 'ចំណេញ/១' : 'Margin/Unit'}</th>
                  <th className="py-3 px-3">{isKh ? 'ចំណូលលក់ចេញសរុប' : 'Total Revenue (Out)'}</th>
                  <th className="py-3 px-3">{isKh ? 'ថ្លៃដើមសរុប' : 'Total Cost (In)'}</th>
                  <th className="py-3 px-3.5 text-right">{isKh ? 'ចំណេញសុទ្ធ' : 'Net Margin'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-sans text-xs">
                      {isKh ? 'រកមិនឃើញទិន្នន័យទំនិញឡើយ' : 'No products matched your search filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((row) => (
                    <tr key={row.product.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product details */}
                      <td className="py-2.5 px-3.5 font-sans">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={row.product.image}
                            alt={row.product.name}
                            className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {row.product.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {row.product.barcode} • {row.product.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stock remaining */}
                      <td className="py-2.5 px-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                          row.currentStock <= 5 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {row.currentStock}
                        </span>
                      </td>

                      {/* Units sold */}
                      <td className="py-2.5 px-2.5 text-center font-bold text-slate-800">
                        {row.unitsSold > 0 ? (
                          <span className="text-indigo-600 font-black">+{row.unitsSold}</span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Unit Cost In */}
                      <td className="py-2.5 px-2.5 text-amber-700 font-bold">
                        {formatUSD(row.unitCost)}
                      </td>

                      {/* Unit Price Out */}
                      <td className="py-2.5 px-2.5 text-slate-900 font-bold">
                        {formatUSD(row.unitPrice)}
                      </td>

                      {/* Margin Per Unit */}
                      <td className="py-2.5 px-2.5">
                        <span className="text-emerald-700 font-bold">
                          +{formatUSD(row.unitMargin)} ({row.unitMarginPercent}%)
                        </span>
                      </td>

                      {/* Total Revenue Out */}
                      <td className="py-2.5 px-3 font-bold text-indigo-700">
                        {formatUSD(row.totalRevenueOut)}
                      </td>

                      {/* Total Cost In */}
                      <td className="py-2.5 px-3 text-slate-500">
                        {formatUSD(row.totalCostIn)}
                      </td>

                      {/* Total Net Profit */}
                      <td className="py-2.5 px-3.5 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          row.profit > 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : row.profit < 0 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'text-slate-400'
                        }`}>
                          {row.profit > 0 ? `+${formatUSD(row.profit)}` : formatUSD(row.profit)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
