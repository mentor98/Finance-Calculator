import React from 'react';
import {
  Landmark,
  Home,
  PiggyBank,
  TrendingUp,
  Briefcase,
  ArrowLeftRight,
  BookmarkCheck,
  Globe,
} from 'lucide-react';
import { CalculatorType, CurrencyCode } from '../types';
import { CURRENCY_LIST } from '../utils/formatters';

interface NavbarProps {
  activeTab: CalculatorType;
  onSelectTab: (tab: CalculatorType) => void;
  currency: CurrencyCode;
  onChangeCurrency: (curr: CurrencyCode) => void;
  savedCount: number;
  onOpenSavedDrawer: () => void;
}

const TABS: { id: CalculatorType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'loan', label: 'Loan Calculator', icon: Landmark },
  { id: 'mortgage', label: 'Mortgage Planner', icon: Home },
  { id: 'savings', label: 'Savings Target', icon: PiggyBank },
  { id: 'compound', label: 'Compound Interest', icon: TrendingUp },
  { id: 'investment', label: 'Investment Projection', icon: Briefcase },
  { id: 'currency', label: 'Currency Converter', icon: ArrowLeftRight },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currency,
  onChangeCurrency,
  savedCount,
  onOpenSavedDrawer,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Geometric Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center shadow-xs">
              <div className="w-4 h-4 border-2 border-white rotate-45 transform" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900">
                FINANCE<span className="text-indigo-600">CORE</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                SUITE
              </span>
            </div>
          </div>

          {/* Right actions: Currency Selector & Saved Scenarios */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Currency Pill Selector */}
            <div className="flex items-center bg-slate-100 hover:bg-slate-150 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-1.5 shrink-0" />
              <select
                id="global-currency-select"
                value={currency}
                onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
                aria-label="Global Currency"
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code} className="bg-white text-slate-900">
                    {c.flag} {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Saved Scenarios Action Button */}
            <button
              id="navbar-saved-scenarios-btn"
              type="button"
              onClick={onOpenSavedDrawer}
              className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <BookmarkCheck className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Saved Scenarios</span>
              {savedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white font-bold text-[10px]">
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Geometric Tab Navigation */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                id={`nav-tab-${tab.id}`}
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                />
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
