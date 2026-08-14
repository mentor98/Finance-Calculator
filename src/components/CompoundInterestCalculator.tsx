import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Sparkles,
  Zap,
  RotateCcw,
  BookmarkPlus,
  ArrowRight,
  Calculator,
  Flame,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CompoundInputs, CurrencyCode, CompoundingFrequency, SavedScenario } from '../types';
import { calculateCompoundInterest } from '../utils/financeMath';
import { formatCurrency, formatPercent, exportToCSV } from '../utils/formatters';

interface CompoundInterestCalculatorProps {
  currency: CurrencyCode;
  onSaveScenario?: (scenario: SavedScenario) => void;
}

const COMPOUND_PRESETS = [
  { name: 'S&P 500 DCA (8% / 30 yrs)', principal: 10000, rate: 8.0, years: 30, contrib: 500, freq: 12 as const },
  { name: 'Aggressive Growth (10% / 25 yrs)', principal: 5000, rate: 10.0, years: 25, contrib: 750, freq: 12 as const },
  { name: 'Daily Compounding HYSA (5.0%)', principal: 25000, rate: 5.0, years: 10, contrib: 250, freq: 365 as const },
  { name: 'Lump Sum Double (7% / 20 yrs)', principal: 50000, rate: 7.0, years: 20, contrib: 0, freq: 12 as const },
];

export const CompoundInterestCalculator: React.FC<CompoundInterestCalculatorProps> = ({
  currency,
  onSaveScenario,
}) => {
  const [inputs, setInputs] = useState<CompoundInputs>({
    principal: 10000,
    interestRate: 8.0,
    compoundingFrequency: 12,
    years: 25,
    contributionAmount: 500,
    contributionFrequency: 'monthly',
    contributionTiming: 'end',
  });

  const [savedFeedback, setSavedFeedback] = useState(false);

  const results = useMemo(() => calculateCompoundInterest(inputs), [inputs]);

  const handlePreset = (preset: typeof COMPOUND_PRESETS[0]) => {
    setInputs((prev) => ({
      ...prev,
      principal: preset.principal,
      interestRate: preset.rate,
      years: preset.years,
      contributionAmount: preset.contrib,
      compoundingFrequency: preset.freq,
    }));
  };

  const handleReset = () => {
    setInputs({
      principal: 10000,
      interestRate: 8.0,
      compoundingFrequency: 12,
      years: 25,
      contributionAmount: 500,
      contributionFrequency: 'monthly',
      contributionTiming: 'end',
    });
  };

  const handleSave = () => {
    if (!onSaveScenario) return;
    const scenario: SavedScenario = {
      id: `compound-${Date.now()}`,
      name: `Compound: ${formatCurrency(results.finalBalance, currency)} (${inputs.years} yrs @ ${inputs.interestRate}%)`,
      type: 'compound',
      dateCreated: new Date().toISOString(),
      summary: {
        label1: 'Final Balance',
        value1: formatCurrency(results.finalBalance, currency),
        label2: 'Interest Gained',
        value2: formatCurrency(results.totalInterest, currency),
        label3: 'Doubling Time',
        value3: `${results.doublingTimeYears.toFixed(1)} yrs`,
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
      'Initial Principal': s.principal.toFixed(2),
      'Total Contributions': s.totalContributions.toFixed(2),
      'Total Interest': s.compoundInterestTotal.toFixed(2),
      'Compound Total Balance': s.totalBalance.toFixed(2),
      'Simple Interest Comparison': s.simpleInterestComparison.toFixed(2),
    }));
    exportToCSV(data, 'Compound_Interest_Schedule');
  };

  // Chart data
  const chartData = useMemo(() => {
    return results.schedule.map((item) => ({
      year: `Yr ${item.year}`,
      'Compound Balance': Math.round(item.totalBalance),
      'Total Invested': Math.round(item.principal + item.totalContributions),
      'Interest Component': Math.round(item.compoundInterestTotal),
      'Simple Interest': Math.round(item.simpleInterestComparison),
    }));
  }, [results]);

  const interestMultiplier = inputs.principal + results.totalContributions > 0
    ? (results.finalBalance / (inputs.principal + results.totalContributions)).toFixed(1)
    : '1.0';

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Compound Interest</h1>
          <p className="text-sm text-slate-500 mt-1">Forecast long-term exponential growth and wealth accumulation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="compound-reset-btn"
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            id="compound-export-pdf-btn"
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            Export CSV
          </button>
          <button
            id="compound-save-btn"
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
            {savedFeedback ? 'Saved!' : 'Save Scenario'}
          </button>
        </div>
      </div>

      {/* Strategy Presets */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">Strategies:</span>
        <div className="flex flex-wrap gap-1.5">
          {COMPOUND_PRESETS.map((p) => (
            <button
              id={`compound-preset-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-4 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Parameters
            </h2>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              APY {formatPercent(results.apy)}
            </span>
          </div>

          {/* Initial Deposit */}
          <div className="space-y-1.5">
            <label htmlFor="compound-principal-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Initial Deposit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                id="compound-principal-input"
                type="number"
                min="0"
                max="10000000"
                step="1000"
                value={inputs.principal || ''}
                onChange={(e) => setInputs({ ...inputs, principal: Math.max(0, Number(e.target.value)) })}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
          </div>

          {/* Monthly Contribution */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="compound-contrib-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Regular Contribution
              </label>
              <span className="text-xs font-bold text-indigo-600">
                {formatCurrency(inputs.contributionAmount, currency)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  id="compound-contrib-input"
                  type="number"
                  min="0"
                  max="100000"
                  step="50"
                  value={inputs.contributionAmount || ''}
                  onChange={(e) => setInputs({ ...inputs, contributionAmount: Math.max(0, Number(e.target.value)) })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                />
              </div>
              <select
                id="compound-contrib-freq-select"
                value={inputs.contributionFrequency}
                onChange={(e) => setInputs({ ...inputs, contributionFrequency: e.target.value as any })}
                className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="compound-rate-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Estimated Interest Rate (%)
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatPercent(inputs.interestRate)}</span>
            </div>
            <input
              id="compound-rate-slider"
              type="range"
              min="0.5"
              max="20"
              step="0.25"
              value={inputs.interestRate}
              onChange={(e) => setInputs({ ...inputs, interestRate: Number(e.target.value) })}
              className="w-full accent-indigo-600 mb-1"
            />
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>1%</span>
              <span className="text-indigo-600">{inputs.interestRate}%</span>
              <span>20%</span>
            </div>
          </div>

          {/* Duration Horizon Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Duration (Years): <span className="text-slate-900 font-extrabold">{inputs.years}y</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 20, 30].map((y) => (
                <button
                  id={`compound-year-${y}-btn`}
                  key={y}
                  type="button"
                  onClick={() => setInputs({ ...inputs, years: y })}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    inputs.years === y
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {y}y
                </button>
              ))}
            </div>
            <input
              id="compound-years-slider"
              type="range"
              min="1"
              max="45"
              step="1"
              value={inputs.years}
              onChange={(e) => setInputs({ ...inputs, years: Number(e.target.value) })}
              className="w-full accent-indigo-600 mt-2"
            />
          </div>

          {/* Compounding Frequency */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Compounding Frequency
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Daily (365x)', value: 365 },
                { label: 'Monthly (12x)', value: 12 },
                { label: 'Quarterly (4x)', value: 4 },
                { label: 'Annually (1x)', value: 1 },
              ].map((f) => (
                <button
                  id={`compound-freq-${f.value}-btn`}
                  key={f.value}
                  type="button"
                  onClick={() => setInputs({ ...inputs, compoundingFrequency: f.value as CompoundingFrequency })}
                  className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                    inputs.compoundingFrequency === f.value
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Metrics & Visualizations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 3 Geometric Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Future Balance</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(results.finalBalance, currency)}
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <span>+{((results.totalInterest / (results.totalPrincipal + results.totalContributions || 1)) * 100).toFixed(0)}% Return</span>
                <span>• {interestMultiplier}x Multiplier</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Contributions</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(results.totalPrincipal + results.totalContributions, currency)}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                Deposit + {inputs.years} yrs regular DCA
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Interest Earned</div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 tracking-tight">
                +{formatCurrency(results.totalInterest, currency)}
              </div>
              <div className="text-xs text-indigo-600 font-bold mt-1">
                Doubles every {results.doublingTimeYears.toFixed(1)} yrs
              </div>
            </div>
          </div>

          {/* Growth Projection Over Time Chart Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Growth Projection Over Time</h3>
                <p className="text-xs text-slate-400 mt-0.5">Compound balance expansion vs invested capital</p>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-indigo-600 rounded-xs" />
                  <span>Total Balance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-slate-300 rounded-xs" />
                  <span>Contributions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-amber-500" />
                  <span>Simple Baseline</span>
                </div>
              </div>
            </div>

            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="compGradGeometric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="investedGradGeometric" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(val: number, name: string) => [formatCurrency(val, currency), name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Compound Balance"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="url(#compGradGeometric)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Total Invested"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    fill="url(#investedGradGeometric)"
                  />
                  <Line
                    type="monotone"
                    dataKey="Simple Interest"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-3 mt-2">
              <span>YEAR 1</span>
              <span>YEAR {Math.round(inputs.years * 0.25)}</span>
              <span>YEAR {Math.round(inputs.years * 0.5)}</span>
              <span>YEAR {Math.round(inputs.years * 0.75)}</span>
              <span>YEAR {inputs.years}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Schedule */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Compound Growth Amortization Schedule</h3>
            <p className="text-xs text-slate-500">Year-by-year progression of contributions, interest, and capital</p>
          </div>
          <button
            id="compound-schedule-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Year</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Initial Principal</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Total Contributions</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Total Interest Earned</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Compound Balance</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Simple Interest Baseline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.schedule.map((row) => (
                <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-slate-900">Year {row.year}</td>
                  <td className="py-2.5 px-4 text-slate-600 font-medium">{formatCurrency(row.principal, currency)}</td>
                  <td className="py-2.5 px-4 text-indigo-700 font-semibold">
                    {formatCurrency(row.totalContributions, currency)}
                  </td>
                  <td className="py-2.5 px-4 text-emerald-700 font-semibold">
                    +{formatCurrency(row.compoundInterestTotal, currency)}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {formatCurrency(row.totalBalance, currency)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-500 font-medium">
                    {formatCurrency(row.simpleInterestComparison, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
