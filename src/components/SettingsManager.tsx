import React from 'react';
import { Settings, Save, RotateCcw, Volume2, DollarSign, Store, Percent, Image, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { ShopSettings, User } from '../types';
import { sounds } from '../utils/audio';
import { Logo } from './Logo';

interface SettingsManagerProps {
  settings: ShopSettings;
  onUpdateSettings: (newSettings: ShopSettings) => void;
  onResetData: () => void;
  language: 'en' | 'kh';
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenProfileModal?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  language,
  currentUser,
  onLogout,
  onOpenProfileModal
}) => {
  const isKh = language === 'kh';

  const handleChange = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>{isKh ? 'ការកំណត់ប្រព័ន្ធ (System Settings)' : 'Shop & POS Configuration'}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isKh ? 'កែប្រែព័ត៌មានហាង អត្រាប្តូរប្រាក់ ពន្ធ និងសំឡេង' : 'Configure store identity, tax, exchange rates, and audio effects'}
        </p>
      </div>

      {/* Store Identity */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-sm text-slate-800">Store Information (ព័ត៌មានហាង)</h4>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            MINI MART POS
          </span>
        </div>

        {/* Logo Preview Banner */}
        <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-100 flex items-center gap-3.5">
          <Logo size={52} variant="badge" />
          <div>
            <span className="text-xs font-bold text-slate-800 block">System Logo & Branding</span>
            <span className="text-[11px] text-slate-500">Official vector artwork active for MINI MART POS</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Shop Name (English)</label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">ឈ្មោះហាងជាភាសាខ្មែរ</label>
            <input
              type="text"
              value={settings.shopNameKh}
              onChange={(e) => handleChange('shopNameKh', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Address / Location</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Financial & Currency Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-sm text-slate-800">Financial & Currency Rates</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              KHR Exchange Rate (1 USD = ? ៛)
            </label>
            <input
              type="number"
              value={settings.khrExchangeRate}
              onChange={(e) => handleChange('khrExchangeRate', parseInt(e.target.value) || 4100)}
              className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Default VAT / Sales Tax Rate
            </label>
            <select
              value={settings.taxRate}
              onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="0">0% (No Tax / Tax Inclusive)</option>
              <option value="0.05">5% VAT</option>
              <option value="0.08">8% Sales Tax (Default)</option>
              <option value="0.10">10% Standard Tax</option>
            </select>
          </div>
        </div>

        {/* Audio feedback switch */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Audio Sound Effects (Beep & Chime)</span>
          </div>
          <input
            type="checkbox"
            checked={settings.enableSound}
            onChange={(e) => {
              handleChange('enableSound', e.target.checked);
              sounds.setMuted(!e.target.checked);
            }}
            className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {/* Current User Session & Auth Card */}
      {currentUser && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-800">
                {isKh ? 'គណនីកំពុងប្រើប្រាស់ (Current User Session)' : 'Active Account & Security'}
              </h4>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              currentUser.role === 'admin' 
                ? 'bg-indigo-100 text-indigo-800' 
                : currentUser.role === 'manager'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {currentUser.role}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              <img 
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
                alt={currentUser.fullName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-200" 
              />
              <div>
                <div className="font-bold text-sm text-slate-900">{currentUser.fullName}</div>
                <div className="text-xs text-slate-500 font-mono">@{currentUser.username}</div>
                {currentUser.phone && (
                  <div className="text-[11px] text-slate-400 mt-0.5">{currentUser.phone}</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{isKh ? 'កែប្រែ Profile & រូបភាព' : 'Edit Profile & Photo'}</span>
                </button>
              )}

              {onLogout && (
                <button
                  id="settings-logout-btn"
                  type="button"
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isKh ? 'ចាកចេញពីគណនី (Logout)' : 'Sign Out Account'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset to Default Demo Data */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h5 className="font-bold text-xs text-slate-800">Reset Demo Catalog & Statistics</h5>
          <p className="text-[11px] text-slate-500">Restore default restaurant menu, sample orders, and product barcodes.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset all demo products, orders, and expenses to default?')) {
              onResetData();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-rose-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Data</span>
        </button>
      </div>
    </div>
  );
};
