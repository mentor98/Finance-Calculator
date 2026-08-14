import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Landmark,
  Home,
  PiggyBank,
  TrendingUp,
  Briefcase,
  ArrowLeftRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { CalculatorType, CurrencyCode, SavedScenario } from './types';
import { Navbar } from './components/Navbar';
import { LoanCalculator } from './components/LoanCalculator';
import { MortgageCalculator } from './components/MortgageCalculator';
import { SavingsCalculator } from './components/SavingsCalculator';
import { CompoundInterestCalculator } from './components/CompoundInterestCalculator';
import { InvestmentCalculator } from './components/InvestmentCalculator';
import { CurrencyConverter } from './components/CurrencyConverter';
import { SavedCalculationsDrawer } from './components/SavedCalculationsDrawer';
import { ScenarioComparisonModal } from './components/ScenarioComparisonModal';

const STORAGE_SAVED_KEY = 'fcs_saved_scenarios';
const STORAGE_CURRENCY_KEY = 'fcs_selected_currency';

export default function App() {
  const [activeTab, setActiveTab] = useState<CalculatorType>('loan');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Load saved configurations and preferred currency on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SAVED_KEY);
      if (saved) {
        setSavedScenarios(JSON.parse(saved));
      }
      const savedCurr = localStorage.getItem(STORAGE_CURRENCY_KEY);
      if (savedCurr) {
        setCurrency(savedCurr as CurrencyCode);
      }
    } catch (e) {
      console.warn('Could not read from local storage:', e);
    }
  }, []);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    try {
      localStorage.setItem(STORAGE_CURRENCY_KEY, newCurrency);
    } catch (e) {}
  };

  const handleSaveScenario = (scenario: SavedScenario) => {
    setSavedScenarios((prev) => {
      const updated = [scenario, ...prev.filter((s) => s.id !== scenario.id)];
      try {
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleLoadScenario = (scenario: SavedScenario) => {
    setActiveTab(scenario.type);
    setIsSavedDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#1e293b] flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currency={currency}
        onChangeCurrency={handleCurrencyChange}
        savedCount={savedScenarios.length}
        onOpenSavedDrawer={() => setIsSavedDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {activeTab === 'loan' && (
              <LoanCalculator currency={currency} onSaveScenario={handleSaveScenario} />
            )}
            {activeTab === 'mortgage' && (
              <MortgageCalculator currency={currency} onSaveScenario={handleSaveScenario} />
            )}
            {activeTab === 'savings' && (
              <SavingsCalculator currency={currency} onSaveScenario={handleSaveScenario} />
            )}
            {activeTab === 'compound' && (
              <CompoundInterestCalculator currency={currency} onSaveScenario={handleSaveScenario} />
            )}
            {activeTab === 'investment' && (
              <InvestmentCalculator currency={currency} onSaveScenario={handleSaveScenario} />
            )}
            {activeTab === 'currency' && <CurrencyConverter defaultCurrency={currency} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Disclaimer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-bold text-slate-900 tracking-tight">FINANCE<span className="text-indigo-600">CORE</span></span>
            <span>•</span>
            <span>Geometric Balance Financial Suite</span>
          </div>

          <div className="text-[11px] text-slate-400 text-center sm:text-right max-w-md">
            Calculations and projections are for informational and educational purposes. Figures are estimates based on input assumptions.
          </div>
        </div>
      </footer>

      {/* Saved Scenarios Drawer */}
      <SavedCalculationsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedScenarios={savedScenarios}
        onDeleteScenario={handleDeleteScenario}
        onLoadScenario={handleLoadScenario}
        onOpenCompare={() => setIsCompareModalOpen(true)}
      />

      {/* Side-by-Side Comparison Modal */}
      <ScenarioComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        scenarios={savedScenarios}
        currency={currency}
      />
    </div>
  );
}
