import React, { useState } from 'react';
import { UtensilsCrossed, Plus, Check, Clock, UserCheck, Trash2 } from 'lucide-react';
import { TableInfo } from '../types';

interface TablesManagerProps {
  tables: TableInfo[];
  onUpdateTableStatus: (tableId: string, status: TableInfo['status']) => void;
  onSelectTableForPOS: (tableName: string) => void;
  language: 'en' | 'kh';
}

export const TablesManager: React.FC<TablesManagerProps> = ({
  tables,
  onUpdateTableStatus,
  onSelectTableForPOS,
  language
}) => {
  const isKh = language === 'kh';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-indigo-600" />
            <span>{isKh ? 'គ្រប់គ្រងបញ្ជរគិតលុយ & កន្លែងលក់ (Checkout Counters)' : 'Checkout Counters & Stations'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tables.filter(t => t.status === 'occupied').length} / {tables.length} {isKh ? 'បញ្ជរកំពុងដំណើរការគិតលុយ' : 'counters actively processing sales'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {isKh ? 'ទំនេរ (Available)' : 'Available'}
          </span>
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> {isKh ? 'កំពុងលក់ (Active)' : 'Active'}
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> {isKh ? 'កក់ទុក (Reserved)' : 'Reserved'}
          </span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const isOccupied = table.status === 'occupied';
          const isReserved = table.status === 'reserved';
          const isAvailable = table.status === 'available';

          return (
            <div
              key={table.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-44 ${
                isOccupied
                  ? 'bg-rose-50/50 border-rose-200'
                  : isReserved
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-white border-slate-200/80 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-slate-800">{table.name}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  isOccupied
                    ? 'bg-rose-100 text-rose-800'
                    : isReserved
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {table.status}
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1 my-2">
                <p>Register #{table.id.replace('tbl-', '')}</p>
                <p className="text-[11px] text-slate-400">
                  {isOccupied ? (isKh ? 'កំពុងស្កេនទំនិញ' : 'Scanning & Billing') : isReserved ? (isKh ? 'សម្រាប់ VIP' : 'VIP Priority') : (isKh ? 'រួចរាល់សម្រាប់អតិថិជន' : 'Ready for billing')}
                </p>
              </div>

              {/* Status Switcher & POS Launcher */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onSelectTableForPOS(table.name)}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isKh ? 'បើកការលក់' : 'Open Register'}
                </button>
                <button
                  onClick={() => {
                    const nextStatus: TableInfo['status'] = 
                      table.status === 'available' ? 'occupied' : 
                      table.status === 'occupied' ? 'reserved' : 'available';
                    onUpdateTableStatus(table.id, nextStatus);
                  }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  title="Toggle Status"
                >
                  ↻
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
