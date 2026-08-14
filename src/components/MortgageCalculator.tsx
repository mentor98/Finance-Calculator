import React, { useState, useMemo } from 'react';
import {
  Home,
  DollarSign,
  Percent,
  Calendar,
  Shield,
  Building,
  TrendingDown,
  Sparkles,
  RotateCcw,
  BookmarkPlus,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { MortgageInputs, CurrencyCode, SavedScenario } from '../types';
import { calculateMortgage } from '../utils/financeMath';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { AmortizationTable } from './AmortizationTable';

interface MortgageCalculatorProps {
  currency: CurrencyCode;
  onSaveScenario?: (scenario: SavedScenario) => void;
}

const MORTGAGE_PRESETS = [
  { name: '30-Yr Fixed (20% Down)', price: 450000, downPct: 20, rate: 6.85, term: 30, tax: 1.2, ins: 1500, hoa: 0 },
  { name: '15-Yr Fixed (20% Down)', price: 450000, downPct: 20, rate: 6.15, term: 15, tax: 1.2, ins: 1500, hoa: 0 },
  { name: 'FHA Loan (3.5% Down)', price: 350000, downPct: 3.5, rate: 6.75, term: 30, tax: 1.1, ins: 1200, hoa: 0, pmi: 0.85 },
  { name: 'Townhome w/ HOA', price: 400000, downPct: 15, rate: 6.9, term: 30, tax: 1.25, ins: 1400, hoa: 280, pmi: 0.5 },
];

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ currency, onSaveScenario }) => {
  const [inputs, setInputs] = useState<MortgageInputs>({
    homePrice: 425000,
    downPaymentAmount: 85000,
    downPaymentPercent: 20,
    downPaymentType: 'percent',
    interestRate: 6.85,
    loanTermYears: 30,
    propertyTaxRate: 1.2, // 1.2% per year
    annualHomeInsurance: 1500,
    pmiRate: 0.65, // % per year if < 20% down
    monthlyHoa: 0,
    extraMonthlyPayment: 100,
    startDate: new Date().toISOString().substring(0, 10),
  });

  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync Down Payment Amount & Percent
  const handlePriceChange = (newPrice: number) => {
    const price = Math.max(0, newPrice);
    if (inputs.downPaymentType === 'percent') {
      const amount = (price * inputs.downPaymentPercent) / 100;
      setInputs((prev) => ({ ...prev, homePrice: price, downPaymentAmount: amount }));
    } else {
      const pct = price > 0 ? (inputs.downPaymentAmount / price) * 100 : 0;
      setInputs((prev) => ({ ...prev, homePrice: price, downPaymentPercent: Number(pct.toFixed(2)) }));
    }
  };

  const handleDownPercentChange = (pct: number) => {
    const validPct = Math.min(100, Math.max(0, pct));
    const amount = (inputs.homePrice * validPct) / 100;
    setInputs((prev) => ({
      ...prev,
      downPaymentType: 'percent',
      downPaymentPercent: validPct,
      downPaymentAmount: amount,
    }));
  };

  const handleDownAmountChange = (amount: number) => {
    const validAmount = Math.max(0, Math.min(inputs.homePrice, amount));
    const pct = inputs.homePrice > 0 ? (validAmount / inputs.homePrice) * 100 : 0;
    setInputs((prev) => ({
      ...prev,
      downPaymentType: 'amount',
      downPaymentAmount: validAmount,
      downPaymentPercent: Number(pct.toFixed(2)),
    }));
  };

  const handlePreset = (preset: typeof MORTGAGE_PRESETS[0]) => {
    const downAmt = (preset.price * preset.downPct) / 100;
    setInputs((prev) => ({
      ...prev,
      homePrice: preset.price,
      downPaymentPercent: preset.downPct,
      downPaymentAmount: downAmt,
      downPaymentType: 'percent',
      interestRate: preset.rate,
      loanTermYears: preset.term,
      propertyTaxRate: preset.tax,
      annualHomeInsurance: preset.ins,
      monthlyHoa: preset.hoa || 0,
      pmiRate: preset.pmi || 0.65,
    }));
  };

  const handleReset = () => {
    setInputs({
      homePrice: 425000,
      downPaymentAmount: 85000,
      downPaymentPercent: 20,
      downPaymentType: 'percent',
      interestRate: 6.85,
      loanTermYears: 30,
      propertyTaxRate: 1.2,
      annualHomeInsurance: 1500,
      pmiRate: 0.65,
      monthlyHoa: 0,
      extraMonthlyPayment: 0,
      startDate: new Date().toISOString().substring(0, 10),
    });
  };

  const results = useMemo(() => calculateMortgage(inputs), [inputs]);

  const handleSave = () => {
    if (!onSaveScenario) return;
    const scenario: SavedScenario = {
      id: `mortgage-${Date.now()}`,
      name: `Mortgage: ${formatCurrency(inputs.homePrice, currency)} (${inputs.loanTermYears}yr @ ${inputs.interestRate}%)`,
      type: 'mortgage',
      dateCreated: new Date().toISOString(),
      summary: {
        label1: 'Monthly Total',
        value1: formatCurrency(results.totalMonthlyPayment + inputs.extraMonthlyPayment, currency),
        label2: 'Loan Amount',
        value2: formatCurrency(results.loanAmount, currency),
        label3: 'Total Interest',
        value3: formatCurrency(results.totalLoanInterest, currency),
      },
      payload: { inputs, results },
    };
    onSaveScenario(scenario);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Pie chart breakdown for monthly payment components
  const monthlyBreakdown = [
    { name: 'Principal & Interest', value: results.monthlyPrincipalInterest, color: '#4f46e5' },
    { name: 'Property Taxes', value: results.monthlyPropertyTax, color: '#64748b' },
    { name: 'Home Insurance', value: results.monthlyInsurance, color: '#f59e0b' },
    ...(results.monthlyPmi > 0 ? [{ name: 'PMI', value: results.monthlyPmi, color: '#ec4899' }] : []),
    ...(results.monthlyHoa > 0 ? [{ name: 'HOA Fees', value: results.monthlyHoa, color: '#8b5cf6' }] : []),
  ];

  // Chart Data: Equity buildup vs Remaining Balance
  const chartData = useMemo(() => {
    const down = inputs.downPaymentType === 'percent' 
      ? (inputs.homePrice * inputs.downPaymentPercent) / 100 
      : inputs.downPaymentAmount;
    
    return results.annualSchedule.map((item) => {
      const equity = inputs.homePrice - item.endBalance;
      return {
        year: `Yr ${item.year}`,
        LoanBalance: Math.round(item.endBalance),
        HomeEquity: Math.round(Math.max(down, equity)),
      };
    });
  }, [results.annualSchedule, inputs]);

  const downPaymentValue = inputs.downPaymentType === 'percent' 
    ? (inputs.homePrice * inputs.downPaymentPercent) / 100 
    : inputs.downPaymentAmount;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Mortgage Planner</h1>
          <p className="text-sm text-slate-500 mt-1">Calculate full PITI payments, PMI thresholds, and long-term home equity growth.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="mortgage-reset-btn"
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            id="mortgage-save-btn"
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
            {savedFeedback ? 'Saved!' : 'Save Scenario'}
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">Scenarios:</span>
        <div className="flex flex-wrap gap-1.5">
          {MORTGAGE_PRESETS.map((p) => (
            <button
              id={`mortgage-preset-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              key={p.name}
              type="button"
              onClick={() => handlePreset(p)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200/80 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inputs Column */}
        <div className="lg:col-span-4 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Mortgage Details
            </h2>
            <span className="text-xs font-semibold text-slate-500">PITI + PMI + HOA</span>
          </div>

          {/* Home Price */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="mortgage-home-price-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Home Purchase Price
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatCurrency(inputs.homePrice, currency)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                id="mortgage-home-price-input"
                type="number"
                min="10000"
                max="10000000"
                step="5000"
                value={inputs.homePrice || ''}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
            <input
              id="mortgage-home-price-slider"
              type="range"
              min="50000"
              max="1500000"
              step="5000"
              value={inputs.homePrice}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Down Payment (% / $) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="mortgage-down-payment-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Down Payment ({inputs.downPaymentPercent}%)
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatCurrency(downPaymentValue, currency)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  id="mortgage-down-payment-input"
                  type="number"
                  min="0"
                  max={inputs.homePrice}
                  step="1000"
                  value={inputs.downPaymentAmount || ''}
                  onChange={(e) => handleDownAmountChange(Number(e.target.value))}
                  placeholder="Amount"
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="relative">
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-sm">
                  %
                </span>
                <input
                  id="mortgage-down-payment-pct-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={inputs.downPaymentPercent || ''}
                  onChange={(e) => handleDownPercentChange(Number(e.target.value))}
                  placeholder="Percent"
                  className="w-full pl-3 pr-7 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Quick % chips */}
            <div className="grid grid-cols-6 gap-1 pt-1">
              {[3.5, 5, 10, 15, 20, 25].map((pct) => (
                <button
                  id={`mortgage-down-chip-${pct}`}
                  key={pct}
                  type="button"
                  onClick={() => handleDownPercentChange(pct)}
                  className={`py-1 text-[10px] font-bold rounded-md border transition-all ${
                    inputs.downPaymentPercent === pct
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate & Term */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="mortgage-rate-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rate (APR)
              </label>
              <div className="relative">
                <input
                  id="mortgage-rate-input"
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.05"
                  value={inputs.interestRate || ''}
                  onChange={(e) => setInputs({ ...inputs, interestRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
                <span className="absolute right-2.5 top-2 text-slate-400 font-bold text-xs">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Term</label>
              <div className="grid grid-cols-2 gap-1">
                {[30, 15].map((term) => (
                  <button
                    id={`mortgage-term-${term}-btn`}
                    key={term}
                    type="button"
                    onClick={() => setInputs({ ...inputs, loanTermYears: term })}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      inputs.loanTermYears === term
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {term}y
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Property Taxes & Insurance & HOA */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Taxes, Insurance & Fees
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="mortgage-tax-rate-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Tax Rate (%/yr)
                </label>
                <input
                  id="mortgage-tax-rate-input"
                  type="number"
                  min="0"
                  max="5"
                  step="0.05"
                  value={inputs.propertyTaxRate || ''}
                  onChange={(e) => setInputs({ ...inputs, propertyTaxRate: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="mortgage-insurance-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Insurance ($/yr)
                </label>
                <input
                  id="mortgage-insurance-input"
                  type="number"
                  min="0"
                  step="100"
                  value={inputs.annualHomeInsurance || ''}
                  onChange={(e) => setInputs({ ...inputs, annualHomeInsurance: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="mortgage-hoa-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  HOA ($/mo)
                </label>
                <input
                  id="mortgage-hoa-input"
                  type="number"
                  min="0"
                  step="25"
                  value={inputs.monthlyHoa || ''}
                  onChange={(e) => setInputs({ ...inputs, monthlyHoa: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="mortgage-extra-payment-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Extra ($/mo)
                </label>
                <input
                  id="mortgage-extra-payment-input"
                  type="number"
                  min="0"
                  step="50"
                  value={inputs.extraMonthlyPayment || ''}
                  onChange={(e) => setInputs({ ...inputs, extraMonthlyPayment: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results & Visual Analytics Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 3 Geometric Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Monthly Payment</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(results.totalMonthlyPayment + inputs.extraMonthlyPayment, currency)}
              </div>
              <div className="text-xs text-indigo-600 font-bold mt-1">
                P&I: {formatCurrency(results.monthlyPrincipalInterest, currency)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loan Amount</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(results.loanAmount, currency)}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                Down: {formatCurrency(downPaymentValue, currency)} ({inputs.downPaymentPercent}%)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Interest</div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 tracking-tight">
                {formatCurrency(results.totalLoanInterest, currency)}
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1">
                {inputs.extraMonthlyPayment > 0 ? `Saves ${results.yearsSaved.toFixed(1)} yrs early` : '30-Yr schedule'}
              </div>
            </div>
          </div>

          {/* PMI Notice or Extra Payoff Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PMI Notification */}
            {results.monthlyPmi > 0 ? (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-amber-950">PMI Required ({formatCurrency(results.monthlyPmi, currency)}/mo)</div>
                  <div className="text-amber-800 mt-0.5">
                    Eliminates at Month #{results.pmiDropOffMonth} ({Math.ceil(results.pmiDropOffMonth / 12)} yrs) when home equity reaches 20%.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-950">No PMI Required</div>
                  <div className="text-emerald-800 mt-0.5">You put 20%+ down, saving thousands over the loan life.</div>
                </div>
              </div>
            )}

            {/* Extra payment impact */}
            {inputs.extraMonthlyPayment > 0 && results.yearsSaved > 0 ? (
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-indigo-950">Accelerated Payoff Benefit</div>
                  <div className="text-indigo-800 mt-0.5">
                    Saves <span className="font-bold">{formatCurrency(results.interestSaved, currency)}</span> in interest &{' '}
                    <span className="font-bold">{results.yearsSaved.toFixed(1)} years</span> of payments!
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <Building className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-slate-800">Taxes & Insurance Escrow</div>
                  <div className="text-slate-600 mt-0.5">
                    Taxes ({formatCurrency(results.monthlyPropertyTax, currency)}) and Insurance ({formatCurrency(results.monthlyInsurance, currency)}) are collected monthly.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Charts: Monthly Breakdown Donut & Equity Area Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Payment Donut */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider self-start mb-1">Monthly Composition</h3>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {monthlyBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Equity Buildup Area Chart */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Equity Buildup vs Balance</h3>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="balanceGradMort" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => formatCurrency(val, currency, { compact: true })}
                    />
                    <Tooltip
                      formatter={(val: number, name: string) => [formatCurrency(val, currency), name === 'HomeEquity' ? 'Home Equity' : 'Loan Balance']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                    />
                    <Area type="monotone" dataKey="HomeEquity" stroke="#4f46e5" strokeWidth={2.5} fill="url(#equityGrad)" name="HomeEquity" />
                    <Area type="monotone" dataKey="LoanBalance" stroke="#94a3b8" strokeWidth={1.5} fill="url(#balanceGradMort)" name="LoanBalance" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization Table */}
      <AmortizationTable
        schedule={results.schedule}
        annualSchedule={results.annualSchedule}
        currency={currency}
        title="Mortgage Amortization Schedule"
        hasExtraPayments={inputs.extraMonthlyPayment > 0}
      />
    </div>
  );
};
