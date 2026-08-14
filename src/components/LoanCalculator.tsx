import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Percent,
  Calendar,
  Sparkles,
  TrendingDown,
  Clock,
  ShieldCheck,
  BookmarkPlus,
  RotateCcw,
  ArrowRight,
  Info,
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
import { LoanInputs, CurrencyCode, PaymentFrequency, SavedScenario } from '../types';
import { calculateLoan } from '../utils/financeMath';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { AmortizationTable } from './AmortizationTable';

interface LoanCalculatorProps {
  currency: CurrencyCode;
  onSaveScenario?: (scenario: SavedScenario) => void;
}

const PRESETS = [
  { name: 'Auto Loan', principal: 35000, rate: 6.49, years: 5, months: 0, freq: 'monthly' as PaymentFrequency },
  { name: 'Personal Loan', principal: 15000, rate: 9.8, years: 3, months: 0, freq: 'monthly' as PaymentFrequency },
  { name: 'Student Loan', principal: 45000, rate: 5.5, years: 10, months: 0, freq: 'monthly' as PaymentFrequency },
  { name: 'Small Business', principal: 100000, rate: 7.5, years: 7, months: 0, freq: 'monthly' as PaymentFrequency },
];

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({ currency, onSaveScenario }) => {
  const [inputs, setInputs] = useState<LoanInputs>({
    principal: 25000,
    interestRate: 6.5,
    loanTermYears: 5,
    loanTermMonths: 0,
    paymentFrequency: 'monthly',
    extraPayment: 50,
    originationFeePercent: 0,
  });

  const [savedFeedback, setSavedFeedback] = useState(false);

  const results = useMemo(() => calculateLoan(inputs), [inputs]);

  const handlePreset = (preset: typeof PRESETS[0]) => {
    setInputs((prev) => ({
      ...prev,
      principal: preset.principal,
      interestRate: preset.rate,
      loanTermYears: preset.years,
      loanTermMonths: preset.months,
      paymentFrequency: preset.freq,
    }));
  };

  const handleReset = () => {
    setInputs({
      principal: 25000,
      interestRate: 6.5,
      loanTermYears: 5,
      loanTermMonths: 0,
      paymentFrequency: 'monthly',
      extraPayment: 0,
      originationFeePercent: 0,
    });
  };

  const handleSave = () => {
    if (!onSaveScenario) return;
    const scenario: SavedScenario = {
      id: `loan-${Date.now()}`,
      name: `Loan: ${formatCurrency(inputs.principal, currency)} @ ${inputs.interestRate}%`,
      type: 'loan',
      dateCreated: new Date().toISOString(),
      summary: {
        label1: 'Payment',
        value1: `${formatCurrency(results.periodicPayment, currency)} / ${inputs.paymentFrequency}`,
        label2: 'Total Interest',
        value2: formatCurrency(results.totalInterest, currency),
        label3: 'Term',
        value3: `${inputs.loanTermYears} yrs ${inputs.loanTermMonths ? inputs.loanTermMonths + ' mos' : ''}`,
      },
      payload: { inputs, results },
    };
    onSaveScenario(scenario);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Chart Data for Balance Over Time
  const chartData = useMemo(() => {
    return results.annualSchedule.map((item) => ({
      year: `Yr ${item.year}`,
      Balance: Math.round(item.endBalance),
      PrincipalPaid: Math.round(item.principalPaid + item.extraPaid),
      InterestPaid: Math.round(item.interestPaid),
    }));
  }, [results.annualSchedule]);

  const pieData = [
    { name: 'Principal', value: results.totalPrincipal, color: '#4f46e5' },
    { name: 'Interest', value: results.totalInterest, color: '#f59e0b' },
    ...(results.originationFeeAmount > 0
      ? [{ name: 'Origination Fee', value: results.originationFeeAmount, color: '#64748b' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Loan Calculator</h1>
          <p className="text-sm text-slate-500 mt-1">Model amortization schedules, fixed payments, and extra repayment savings.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="loan-reset-btn"
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            id="loan-save-scenario-btn"
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
            {savedFeedback ? 'Saved!' : 'Save Scenario'}
          </button>
        </div>
      </div>

      {/* Preset Quick-Buttons */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">Presets:</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              id={`loan-preset-${p.name.toLowerCase().replace(/\s+/g, '-')}`}
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

      {/* Main Grid: Inputs + Results Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-4 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Loan Parameters
            </h2>
            <span className="text-xs font-semibold text-slate-500">Fixed Rate</span>
          </div>

          {/* Principal Amount */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="loan-principal-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Loan Amount
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatCurrency(inputs.principal, currency)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                id="loan-principal-input"
                type="number"
                min="500"
                max="5000000"
                step="500"
                value={inputs.principal || ''}
                onChange={(e) => setInputs({ ...inputs, principal: Number(e.target.value) })}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
            <input
              id="loan-principal-slider"
              type="range"
              min="1000"
              max="200000"
              step="1000"
              value={inputs.principal}
              onChange={(e) => setInputs({ ...inputs, principal: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="loan-interest-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Interest Rate (APR)
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatPercent(inputs.interestRate)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <Percent className="w-4 h-4" />
              </span>
              <input
                id="loan-interest-input"
                type="number"
                min="0.1"
                max="40"
                step="0.05"
                value={inputs.interestRate || ''}
                onChange={(e) => setInputs({ ...inputs, interestRate: Number(e.target.value) })}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
            <input
              id="loan-interest-slider"
              type="range"
              min="1"
              max="25"
              step="0.1"
              value={inputs.interestRate}
              onChange={(e) => setInputs({ ...inputs, interestRate: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Loan Term (Years & Months) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Loan Term</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="loan-years-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Years
                </label>
                <input
                  id="loan-years-input"
                  type="number"
                  min="0"
                  max="40"
                  value={inputs.loanTermYears}
                  onChange={(e) => setInputs({ ...inputs, loanTermYears: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="loan-months-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Months
                </label>
                <input
                  id="loan-months-input"
                  type="number"
                  min="0"
                  max="11"
                  value={inputs.loanTermMonths}
                  onChange={(e) =>
                    setInputs({ ...inputs, loanTermMonths: Math.min(11, Math.max(0, Number(e.target.value))) })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Frequency */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Frequency</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['monthly', 'biweekly', 'weekly'] as PaymentFrequency[]).map((freq) => (
                <button
                  id={`loan-freq-${freq}-btn`}
                  key={freq}
                  type="button"
                  onClick={() => setInputs({ ...inputs, paymentFrequency: freq })}
                  className={`py-2 px-2 text-xs font-bold rounded-lg capitalize border transition-all ${
                    inputs.paymentFrequency === freq
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Extra Monthly Payment & Fees */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <label htmlFor="loan-extra-payment-input" className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  Extra Payment
                </label>
                <span className="font-bold text-emerald-600">{formatCurrency(inputs.extraPayment, currency)}</span>
              </div>
              <input
                id="loan-extra-payment-input"
                type="number"
                min="0"
                step="25"
                value={inputs.extraPayment || ''}
                onChange={(e) => setInputs({ ...inputs, extraPayment: Math.max(0, Number(e.target.value)) })}
                placeholder="0"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <label htmlFor="loan-origination-fee-input" className="font-bold text-slate-500 uppercase tracking-wider">
                  Origination Fee (%)
                </label>
                <span className="text-slate-500 font-bold">{formatPercent(inputs.originationFeePercent)}</span>
              </div>
              <input
                id="loan-origination-fee-input"
                type="number"
                min="0"
                max="10"
                step="0.25"
                value={inputs.originationFeePercent || ''}
                onChange={(e) =>
                  setInputs({ ...inputs, originationFeePercent: Math.max(0, Number(e.target.value)) })
                }
                placeholder="0"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Key Results & Visual Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 3 Geometric Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {inputs.paymentFrequency} Payment
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(results.periodicPayment + inputs.extraPayment, currency)}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                {inputs.extraPayment > 0 ? `Includes ${formatCurrency(inputs.extraPayment, currency)} extra` : 'Standard payment'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Interest</div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 tracking-tight">
                {formatCurrency(results.totalInterest, currency)}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                Total Cost: {formatCurrency(results.totalCost, currency)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payoff Time</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {Math.floor(results.payoffDurationMonths / 12)}y {results.payoffDurationMonths % 12}m
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1">
                {results.monthsSaved > 0 ? `Saves ${results.monthsSaved} months early` : 'On schedule'}
              </div>
            </div>
          </div>

          {/* Extra Payment Benefit Banner */}
          {inputs.extraPayment > 0 && results.interestSaved > 0 && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">Accelerated Payoff Advantage</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your extra {formatCurrency(inputs.extraPayment, currency)}/period saves{' '}
                    <span className="font-bold text-emerald-950">{formatCurrency(results.interestSaved, currency)}</span> in interest
                    and clears your debt <span className="font-bold text-emerald-950">{results.monthsSaved} months early</span>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Visual Charts: Breakdown & Balance Curve */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Pie Breakdown */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider self-start mb-2">Cost Breakdown</h3>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payoff Curve Area Chart */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Remaining Balance Over Time</h3>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="loanBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
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
                      formatter={(val: number) => [formatCurrency(val, currency), 'Balance']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                    />
                    <Area type="monotone" dataKey="Balance" stroke="#4f46e5" strokeWidth={2.5} fill="url(#loanBalanceGrad)" />
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
        title="Loan Amortization Schedule"
        hasExtraPayments={inputs.extraPayment > 0}
      />
    </div>
  );
};
