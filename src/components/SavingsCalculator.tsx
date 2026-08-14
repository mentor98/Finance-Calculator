import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  DollarSign,
  Percent,
  Calendar,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  RotateCcw,
  BookmarkPlus,
  ArrowRight,
  ShieldCheck,
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
  Legend,
} from 'recharts';
import { SavingsInputs, CurrencyCode, CompoundingFrequency, SavedScenario } from '../types';
import { calculateSavings } from '../utils/financeMath';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { exportToCSV } from '../utils/formatters';

interface SavingsCalculatorProps {
  currency: CurrencyCode;
  onSaveScenario?: (scenario: SavedScenario) => void;
}

const SAVINGS_PRESETS = [
  { name: 'High Yield Savings', initial: 10000, deposit: 500, apy: 4.85, years: 5, mode: 'futureValue' as const },
  { name: 'Emergency Fund ($25k)', initial: 2000, target: 25000, apy: 4.5, years: 2, mode: 'goalTarget' as const },
  { name: 'Home Down Payment ($80k)', initial: 15000, target: 80000, apy: 5.0, years: 4, mode: 'goalTarget' as const },
  { name: '10-Year Nest Egg', initial: 5000, deposit: 1000, apy: 6.0, years: 10, mode: 'futureValue' as const },
];

export const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({ currency, onSaveScenario }) => {
  const [inputs, setInputs] = useState<SavingsInputs>({
    mode: 'futureValue',
    initialDeposit: 10000,
    regularDeposit: 500,
    depositFrequency: 'monthly',
    annualInterestRate: 4.85,
    compoundingFrequency: 12,
    timeYears: 5,
    timeMonths: 0,
    targetGoalAmount: 50000,
    inflationRate: 2.5,
  });

  const [adjustInflation, setAdjustInflation] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const results = useMemo(() => calculateSavings(inputs), [inputs]);

  const handlePreset = (preset: typeof SAVINGS_PRESETS[0]) => {
    setInputs((prev) => ({
      ...prev,
      mode: preset.mode,
      initialDeposit: preset.initial,
      regularDeposit: preset.deposit || 500,
      targetGoalAmount: preset.target || 50000,
      annualInterestRate: preset.apy,
      timeYears: preset.years,
      timeMonths: 0,
    }));
  };

  const handleReset = () => {
    setInputs({
      mode: 'futureValue',
      initialDeposit: 10000,
      regularDeposit: 500,
      depositFrequency: 'monthly',
      annualInterestRate: 4.85,
      compoundingFrequency: 12,
      timeYears: 5,
      timeMonths: 0,
      targetGoalAmount: 50000,
      inflationRate: 2.5,
    });
  };

  const handleSave = () => {
    if (!onSaveScenario) return;
    const scenario: SavedScenario = {
      id: `savings-${Date.now()}`,
      name:
        inputs.mode === 'futureValue'
          ? `Savings: ${formatCurrency(results.finalBalance, currency)} in ${inputs.timeYears} yrs`
          : `Goal: Target ${formatCurrency(inputs.targetGoalAmount || 0, currency)}`,
      type: 'savings',
      dateCreated: new Date().toISOString(),
      summary: {
        label1: inputs.mode === 'futureValue' ? 'Final Balance' : 'Required Monthly',
        value1:
          inputs.mode === 'futureValue'
            ? formatCurrency(results.finalBalance, currency)
            : formatCurrency(results.requiredMonthlyDeposit || 0, currency),
        label2: 'Total Interest',
        value2: formatCurrency(results.totalInterestEarned, currency),
        label3: 'APY',
        value3: formatPercent(results.effectiveApy),
      },
      payload: { inputs, results },
    };
    onSaveScenario(scenario);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleExportCSV = () => {
    const data = results.schedule.map((s) => ({
      Year: s.year,
      'Starting Balance': s.startingBalance.toFixed(2),
      'Deposits Added': s.deposits.toFixed(2),
      'Interest Earned': s.interestEarned.toFixed(2),
      'Ending Balance': s.endingBalance.toFixed(2),
      'Total Contributions': s.totalDeposits.toFixed(2),
      'Total Interest': s.totalInterest.toFixed(2),
      'Purchasing Power (Real)': s.purchasingPower.toFixed(2),
    }));
    exportToCSV(data, 'Savings_Growth_Schedule');
  };

  // Stacked Area Chart data
  const chartData = useMemo(() => {
    return results.schedule.map((item) => ({
      year: `Yr ${item.year}`,
      'Initial Deposit': Math.round(results.totalInitial),
      'Regular Deposits': Math.round(item.totalDeposits - results.totalInitial),
      'Interest Earned': Math.round(item.totalInterest),
      'Purchasing Power': Math.round(item.purchasingPower),
    }));
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Savings & Goal Planner</h1>
          <p className="text-sm text-slate-500 mt-1">Forecast deposit growth, compound interest accumulation, and milestone timelines.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="savings-reset-btn"
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            id="savings-save-btn"
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
            {savedFeedback ? 'Saved!' : 'Save Scenario'}
          </button>
        </div>
      </div>

      {/* Presets & Mode Selector Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {SAVINGS_PRESETS.map((p) => (
              <button
                id={`savings-preset-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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

        {/* Mode Switcher Segmented Control */}
        <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 shrink-0">
          <button
            id="savings-mode-future-value-btn"
            type="button"
            onClick={() => setInputs({ ...inputs, mode: 'futureValue' })}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
              inputs.mode === 'futureValue'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            Grow Balance
          </button>
          <button
            id="savings-mode-goal-target-btn"
            type="button"
            onClick={() => setInputs({ ...inputs, mode: 'goalTarget' })}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
              inputs.mode === 'goalTarget'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            Reach Goal
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-4 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Savings Parameters
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {inputs.mode === 'futureValue' ? 'Balance Projection' : 'Target Goal Solver'}
            </span>
          </div>

          {/* Goal Target Amount (If Goal mode) */}
          {inputs.mode === 'goalTarget' && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="savings-target-amount-input" className="font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  Target Savings Goal
                </label>
                <span className="font-bold text-indigo-600">
                  {formatCurrency(inputs.targetGoalAmount || 50000, currency)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  id="savings-target-amount-input"
                  type="number"
                  min="1000"
                  max="5000000"
                  step="1000"
                  value={inputs.targetGoalAmount || ''}
                  onChange={(e) => setInputs({ ...inputs, targetGoalAmount: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          {/* Initial Deposit */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="savings-initial-deposit-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Starting Deposit
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatCurrency(inputs.initialDeposit, currency)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                id="savings-initial-deposit-input"
                type="number"
                min="0"
                max="1000000"
                step="500"
                value={inputs.initialDeposit || ''}
                onChange={(e) => setInputs({ ...inputs, initialDeposit: Math.max(0, Number(e.target.value)) })}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
          </div>

          {/* Regular Contribution (Only in Future Value mode) */}
          {inputs.mode === 'futureValue' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="savings-regular-deposit-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Regular Contribution
                </label>
                <span className="text-xs font-bold text-indigo-600">
                  {formatCurrency(inputs.regularDeposit, currency)} / {inputs.depositFrequency}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <input
                    id="savings-regular-deposit-input"
                    type="number"
                    min="0"
                    max="100000"
                    step="50"
                    value={inputs.regularDeposit || ''}
                    onChange={(e) => setInputs({ ...inputs, regularDeposit: Math.max(0, Number(e.target.value)) })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <select
                  id="savings-deposit-frequency-select"
                  value={inputs.depositFrequency}
                  onChange={(e) => setInputs({ ...inputs, depositFrequency: e.target.value as any })}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>
          )}

          {/* APY / Annual Interest Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="savings-apy-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Annual Interest Rate (APY)
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatPercent(inputs.annualInterestRate)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <Percent className="w-4 h-4" />
              </span>
              <input
                id="savings-apy-input"
                type="number"
                min="0"
                max="30"
                step="0.05"
                value={inputs.annualInterestRate || ''}
                onChange={(e) => setInputs({ ...inputs, annualInterestRate: Number(e.target.value) })}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
            <input
              id="savings-apy-slider"
              type="range"
              min="0.5"
              max="15"
              step="0.1"
              value={inputs.annualInterestRate}
              onChange={(e) => setInputs({ ...inputs, annualInterestRate: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Time Duration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Saving Duration</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="savings-years-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Years
                </label>
                <input
                  id="savings-years-input"
                  type="number"
                  min="0"
                  max="60"
                  value={inputs.timeYears}
                  onChange={(e) => setInputs({ ...inputs, timeYears: Math.max(0, Number(e.target.value)) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="savings-months-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Months
                </label>
                <input
                  id="savings-months-input"
                  type="number"
                  min="0"
                  max="11"
                  value={inputs.timeMonths}
                  onChange={(e) =>
                    setInputs({ ...inputs, timeMonths: Math.min(11, Math.max(0, Number(e.target.value))) })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Compounding & Inflation Options */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="savings-compounding-frequency-select" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Compounding
                </label>
                <select
                  id="savings-compounding-frequency-select"
                  value={inputs.compoundingFrequency}
                  onChange={(e) =>
                    setInputs({ ...inputs, compoundingFrequency: Number(e.target.value) as CompoundingFrequency })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value={365}>Daily (365/yr)</option>
                  <option value={12}>Monthly (12/yr)</option>
                  <option value={4}>Quarterly (4/yr)</option>
                  <option value={1}>Annually (1/yr)</option>
                </select>
              </div>

              <div>
                <label htmlFor="savings-inflation-rate-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                  Inflation (%)
                </label>
                <input
                  id="savings-inflation-rate-input"
                  type="number"
                  min="0"
                  max="15"
                  step="0.1"
                  value={inputs.inflationRate}
                  onChange={(e) => setInputs({ ...inputs, inflationRate: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Results & Visuals */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 3 Geometric Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {inputs.mode === 'futureValue' ? 'Projected Balance' : 'Required Monthly'}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {inputs.mode === 'futureValue'
                  ? formatCurrency(results.finalBalance, currency)
                  : formatCurrency(results.requiredMonthlyDeposit || 0, currency)}
              </div>
              <div className="text-xs text-indigo-600 font-bold mt-1">
                {inputs.mode === 'futureValue'
                  ? `Effective APY: ${formatPercent(results.effectiveApy)}`
                  : `Target: ${formatCurrency(inputs.targetGoalAmount || 0, currency)}`}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Interest Earned</div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 tracking-tight">
                +{formatCurrency(results.totalInterestEarned, currency)}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                Total Deposits: {formatCurrency(results.totalDeposited, currency)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Real Purchasing Power</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(results.purchasingPower, currency)}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                At {inputs.inflationRate}% annual inflation
              </div>
            </div>
          </div>

          {/* Growth Area Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Savings Growth Trajectory</h3>
              <button
                id="savings-inflation-toggle-btn"
                type="button"
                onClick={() => setAdjustInflation(!adjustInflation)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  adjustInflation
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {adjustInflation ? '✓ Real Purchasing Power' : 'Show Inflation Adjusted'}
              </button>
            </div>

            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="initialGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1} />
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
                    formatter={(val: number, name: string) => [formatCurrency(val, currency), name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                  <Area type="monotone" stackId="1" dataKey="Initial Deposit" fill="url(#initialGrad)" stroke="#94a3b8" />
                  <Area type="monotone" stackId="1" dataKey="Regular Deposits" fill="url(#contribGrad)" stroke="#818cf8" />
                  <Area type="monotone" stackId="1" dataKey="Interest Earned" fill="url(#interestGrad)" stroke="#4f46e5" />
                  {adjustInflation && (
                    <Area type="monotone" dataKey="Purchasing Power" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="4 4" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Milestones Achieved List */}
          {results.milestones.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Estimated Milestone Timeline
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {results.milestones.map((m) => (
                  <div key={m.amount} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-xs font-bold text-slate-900">{formatCurrency(m.amount, currency)}</div>
                    <div className="text-[11px] text-indigo-600 font-bold mt-0.5">{m.reachedDate}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Month #{m.reachedMonth}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yearly Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Yearly Savings Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">Year-over-year balance and compound interest breakdown</p>
          </div>
          <button
            id="savings-export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Year</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Start Balance</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Annual Deposits</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Interest Earned</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">End Balance</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Real Purchasing Power</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {results.schedule.map((row) => (
                <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">Year {row.year}</td>
                  <td className="py-3 px-4 text-slate-600">{formatCurrency(row.startingBalance, currency)}</td>
                  <td className="py-3 px-4 text-indigo-600 font-bold">{formatCurrency(row.deposits, currency)}</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">+{formatCurrency(row.interestEarned, currency)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(row.endingBalance, currency)}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{formatCurrency(row.purchasingPower, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
