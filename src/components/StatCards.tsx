import React from 'react';
import { ShoppingBag, ShoppingCart, Users, Banknote, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react';
import { Order, Customer, Expense } from '../types';

interface StatCardsProps {
  orders: Order[];
  customers: Customer[];
  expenses: Expense[];
  language: 'en' | 'kh';
}

export const StatCards: React.FC<StatCardsProps> = ({
  orders,
  customers,
  expenses,
  language
}) => {
  const isKh = language === 'kh';

  // Helper to check if date is today
  const isToday = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Helper to check if date is yesterday
  const isYesterday = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      return (
        d.getDate() === yest.getDate() &&
        d.getMonth() === yest.getMonth() &&
        d.getFullYear() === yest.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // 1. Today's Completed Sales calculation
  const completedOrders = orders.filter(o => o.status === 'completed');
  const todayCompletedOrders = completedOrders.filter(o => isToday(o.createdAt));
  const yesterdayCompletedOrders = completedOrders.filter(o => isYesterday(o.createdAt));

  const todaySales = todayCompletedOrders.reduce((sum, o) => sum + o.total, 0);
  const yesterdaySales = yesterdayCompletedOrders.reduce((sum, o) => sum + o.total, 0);

  // If there are completed orders today vs yesterday, calculate percent change
  let salesGrowthPercent = 0;
  if (yesterdaySales > 0) {
    salesGrowthPercent = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
  } else if (todaySales > 0) {
    salesGrowthPercent = 100;
  }

  // 2. Total Orders calculation
  const totalOrdersCount = orders.length;
  const todayOrdersCount = orders.filter(o => isToday(o.createdAt)).length;
  const completedOrdersCount = completedOrders.length;

  // 3. Customers calculation
  const totalCustomersCount = customers.length;
  // Calculate active customers with orders
  const activeCustomersCount = customers.filter(c => c.totalOrders > 0).length;

  // 4. Total Due (Unpaid / Pending / Draft orders)
  const pendingOrders = orders.filter(o => o.status === 'draft');
  const totalDueFromOrders = pendingOrders.reduce((sum, o) => sum + o.total, 0);

  // Total Due calculation (Pending orders awaiting payment)
  const totalDue = totalDueFromOrders;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6 w-full max-w-full">
      {/* 1. Today's Sales Card */}
      <div 
        id="stat-card-today-sales"
        className="bg-white p-3 sm:p-4.5 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4"
      >
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
          <ShoppingBag className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-[13px] text-slate-600 font-semibold truncate leading-snug">
            {isKh ? 'ចំណូលលក់ថ្ងៃនេះ' : "Today's Sales"}
          </p>
          <div className="flex items-baseline gap-1 sm:gap-2 mt-0.5">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-slate-800 tracking-tight font-mono truncate">
              ${todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            {salesGrowthPercent !== 0 && (
              <span className={`hidden sm:inline-flex items-center text-[10px] sm:text-xs font-semibold px-1 py-0.5 rounded ${
                salesGrowthPercent >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
              }`}>
                {salesGrowthPercent >= 0 ? (
                  <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />
                )}
                {Math.abs(salesGrowthPercent).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
            {todayCompletedOrders.length} {isKh ? 'វិក្កយបត្របានបញ្ចប់' : 'completed today'}
          </p>
        </div>
      </div>

      {/* 2. Total Orders Card */}
      <div 
        id="stat-card-total-orders"
        className="bg-white p-3 sm:p-4.5 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4"
      >
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <ShoppingCart className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-[13px] text-slate-600 font-semibold truncate leading-snug">
            {isKh ? 'ការកុម្ម៉ង់សរុប' : 'Total Orders'}
          </p>
          <div className="flex items-baseline gap-1 sm:gap-2 mt-0.5">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-slate-800 tracking-tight font-mono">
              {totalOrdersCount}
            </h3>
            <span className="hidden sm:inline-flex items-center text-[10px] sm:text-xs font-medium text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
              {completedOrdersCount} {isKh ? 'ជោគជ័យ' : 'paid'}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
            <span>{todayOrdersCount} {isKh ? 'ការកុម្ម៉ង់ថ្ងៃនេះ' : 'orders created today'}</span>
          </p>
        </div>
      </div>

      {/* 3. Customers Card */}
      <div 
        id="stat-card-customers"
        className="bg-white p-3 sm:p-4.5 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4"
      >
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <Users className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-[13px] text-slate-600 font-semibold truncate leading-snug">
            {isKh ? 'ចំនួនអតិថិជន' : 'Total Customers'}
          </p>
          <div className="flex items-baseline gap-1 sm:gap-2 mt-0.5">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-slate-800 tracking-tight font-mono">
              {totalCustomersCount}
            </h3>
            {activeCustomersCount > 0 && (
              <span className="hidden sm:inline-flex items-center text-[10px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">
                {activeCustomersCount} {isKh ? 'ទិញញឹកញាប់' : 'active'}
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
            {isKh ? 'សមាជិកចុះឈ្មោះក្នុងប្រព័ន្ធ' : 'Registered customer profiles'}
          </p>
        </div>
      </div>

      {/* 4. Total Due / Expense Card */}
      <div 
        id="stat-card-total-due"
        className="bg-white p-3 sm:p-4.5 rounded-2xl border border-slate-100/90 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4"
      >
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
          <Banknote className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-[13px] text-slate-600 font-semibold truncate leading-snug">
            {isKh ? 'ត្រូវទូទាត់ (Due)' : 'Total Due'}
          </p>
          <div className="flex items-baseline gap-1 sm:gap-2 mt-0.5">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-slate-800 tracking-tight font-mono truncate">
              ${totalDue.toFixed(2)}
            </h3>
            {pendingOrders.length > 0 && (
              <span className="hidden sm:inline-flex items-center text-[10px] sm:text-xs font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                <Clock className="w-2.5 h-2.5 mr-0.5" />
                {pendingOrders.length} {isKh ? 'រង់ចាំ' : 'draft'}
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
            {pendingOrders.length > 0 
              ? (isKh ? `${pendingOrders.length} វិក្កយបត្រមិនទាន់ទូទាត់` : `${pendingOrders.length} unpaid / pending drafts`)
              : (isKh ? 'គ្មានបំណុលដែលត្រូវទូទាត់' : 'No pending dues')}
          </p>
        </div>
      </div>
    </div>
  );
};

