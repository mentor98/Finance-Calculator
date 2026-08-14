import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  DollarSign,
  Percent,
  Calendar,
  Sparkles,
  TrendingUp,
  LineChart as LineChartIcon,
  RotateCcw,
  BookmarkPlus,
  ArrowRight,
  BadgePercent,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { InvestmentInputs, CurrencyCode, SavedScenario } from '../types';
import { calculateInvestmentProjection } from '../utils/financeMath';
import { formatCurrency, formatPercent, exportToCSV } from '../utils/formatters';

interface InvestmentCalculatorProps {
  currency: CurrencyCode;
  onSaveScenario?: (scenario: SavedScenario) => void;
}

const INVESTMENT_PRESETS = [
  { name: 'S&P 500 DCA', returnRate: 10.0, div: 1.5, fee: 0.03, initial: 10000, monthly: 500, years: 30 },
  { name: 'Dividend Focus', returnRate: 7.5, div: 4.2, fee: 0.08, initial: 25000, monthly: 600, years: 20 },
  { name: 'Tech Growth ETF', returnRate: 12.5, div: 0.6, fee: 0.20, initial: 5000, monthly: 750, years: 25 },
  { name: 'Conservative 60/40', returnRate: 6.5, div: 2.2, fee: 0.05, initial: 20000, monthly: 400, years: 15 },
];

export const InvestmentCalculator: React.FC<InvestmentCalculatorProps> = ({
  currency,
  onSaveScenario,
}) => {
  const [inputs, setInputs] = useState<InvestmentInputs>({
    initialInvestment: 15000,
    monthlyContribution: 500,
    annualReturnRate: 9.0,
    annualDividendYield: 1.6,
    dividendReinvest: true,
    expenseRatio: 0.05,
    inflationRate: 2.5,
    investmentYears: 25,
    riskScenario: 'custom',
  });

  const [savedFeedback, setSavedFeedback] = useState(false);

  const results = useMemo(() => calculateInvestmentProjection(inputs), [inputs]);

  const handlePreset = (preset: typeof INVESTMENT_PRESETS[0]) => {
    setInputs((prev) => ({
      ...prev,
      annualReturnRate: preset.returnRate,
      annualDividendYield: preset.div,
      expenseRatio: preset.fee,
      initialInvestment: preset.initial,
      monthlyContribution: preset.monthly,
      investmentYears: preset.years,
    }));
  };

  const handleReset = () => {
    setInputs({
      initialInvestment: 15000,
      monthlyContribution: 500,
      annualReturnRate: 9.0,
      annualDividendYield: 1.6,
      dividendReinvest: true,
      expenseRatio: 0.05,
      inflationRate: 2.5,
      investmentYears: 25,
      riskScenario: 'custom',
    });
  };

  const handleSave = () => {
    if (!onSaveScenario) return;
    const scenario: SavedScenario = {
      id: `investment-${Date.now()}`,
      name: `Portfolio: ${formatCurrency(results.finalNominalValue, currency)} (${inputs.investmentYears} yrs @ ${inputs.annualReturnRate}%)`,
      type: 'investment',
      dateCreated: new Date().toISOString(),
      summary: {
        label1: 'Nominal Value',
        value1: formatCurrency(results.finalNominalValue, currency),
        label2: 'Real Value',
        value2: formatCurrency(results.finalRealValue, currency),
        label3: 'Annual Dividends',
        value3: `${formatCurrency(results.finalYearDividendIncome, currency)}/yr`,
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
      'Invested Capital': s.investedCapital.toFixed(2),
      'Nominal Value': s.nominalValue.toFixed(2),
      'Real Value (Inflation Adjusted)': s.realValue.toFixed(2),
      'Annual Dividends': s.annualDividends.toFixed(2),
      'Total Fees Paid': s.totalFeesPaid.toFixed(2),
      'Bear Case': s.bearCaseValue.toFixed(2),
      'Bull Case': s.bullCaseValue.toFixed(2),
    }));
    exportToCSV(data, 'Investment_Portfolio_Projections');
  };

  // Chart data
  const chartData = useMemo(() => {
    return results.schedule.map((item) => ({
      year: `Yr ${item.year}`,
      'Expected Base': Math.round(item.nominalValue),
      'Invested Capital': Math.round(item.investedCapital),
      'Real Value (Inflation Adj)': Math.round(item.realValue),
      'Bull Market (+4.5%)': Math.round(item.bullCaseValue),
      'Bear Market (-3.5%)': Math.round(item.bearCaseValue),
    }));
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Investment & Portfolio Forecaster</h1>
          <p className="text-sm text-slate-500 mt-1">Project long-term compound growth, dollar-cost averaging (DCA), dividend reinvestment, and fee drag.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="investment-reset-btn"
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            id="investment-save-btn"
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
            {savedFeedback ? 'Saved!' : 'Save Scenario'}
          </button>
        </div>
      </div>

      {/* Strategies Presets Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">Strategies:</span>
          <div className="flex flex-wrap gap-1.5">
            {INVESTMENT_PRESETS.map((p) => (
              <button
                id={`investment-preset-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
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
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Form */}
        <div className="lg:col-span-4 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Portfolio Parameters
            </h2>
            <span className="text-xs font-semibold text-slate-500">DCA & Real Return</span>
          </div>

          {/* Initial Portfolio */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="investment-initial-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Initial Investment
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatCurrency(inputs.initialInvestment, currency)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                id="investment-initial-input"
                type="number"
                min="0"
                max="5000000"
                step="1000"
                value={inputs.initialInvestment || ''}
                onChange={(e) => setInputs({ ...inputs, initialInvestment: Math.max(0, Number(e.target.value)) })}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
          </div>

          {/* Monthly DCA Contribution */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="investment-monthly-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Monthly Contribution (DCA)
              </label>
              <span className="text-xs font-bold text-indigo-600">
                {formatCurrency(inputs.monthlyContribution, currency)} / mo
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                id="investment-monthly-input"
                type="number"
                min="0"
                max="50000"
                step="50"
                value={inputs.monthlyContribution || ''}
                onChange={(e) => setInputs({ ...inputs, monthlyContribution: Math.max(0, Number(e.target.value)) })}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
            <input
              id="investment-monthly-slider"
              type="range"
              min="0"
              max="5000"
              step="50"
              value={inputs.monthlyContribution}
              onChange={(e) => setInputs({ ...inputs, monthlyContribution: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Expected Return Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="investment-return-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expected Annual Capital Growth
              </label>
              <span className="text-xs font-bold text-indigo-600">{formatPercent(inputs.annualReturnRate)}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                <Percent className="w-4 h-4" />
              </span>
              <input
                id="investment-return-input"
                type="number"
                min="-10"
                max="30"
                step="0.1"
                value={inputs.annualReturnRate || ''}
                onChange={(e) => setInputs({ ...inputs, annualReturnRate: Number(e.target.value) })}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>
          </div>

          {/* Dividend Yield & Reinvestment */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="space-y-1">
              <label htmlFor="investment-dividend-input" className="text-[11px] font-bold text-slate-500 block">
                Dividend Yield (%)
              </label>
              <input
                id="investment-dividend-input"
                type="number"
                min="0"
                max="15"
                step="0.1"
                value={inputs.annualDividendYield || ''}
                onChange={(e) => setInputs({ ...inputs, annualDividendYield: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">Reinvest DRIP?</label>
              <button
                id="investment-dividend-reinvest-btn"
                type="button"
                onClick={() => setInputs({ ...inputs, dividendReinvest: !inputs.dividendReinvest })}
                className={`w-full py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                  inputs.dividendReinvest
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {inputs.dividendReinvest ? '✓ Yes (DRIP)' : 'No (Cash Out)'}
              </button>
            </div>
          </div>

          {/* Expense Ratio & Inflation */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="investment-fee-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                Expense Ratio Fee (%)
              </label>
              <input
                id="investment-fee-input"
                type="number"
                min="0"
                max="3"
                step="0.01"
                value={inputs.expenseRatio || ''}
                onChange={(e) => setInputs({ ...inputs, expenseRatio: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="investment-inflation-input" className="text-[11px] font-bold text-slate-500 block mb-1">
                Inflation (%)
              </label>
              <input
                id="investment-inflation-input"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={inputs.inflationRate || ''}
                onChange={(e) => setInputs({ ...inputs, inflationRate: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Horizon Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="investment-horizon-slider" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Investment Horizon
              </label>
              <span className="text-xs font-bold text-slate-900">{inputs.investmentYears} Years</span>
            </div>
            <input
              id="investment-horizon-slider"
              type="range"
              min="1"
              max="45"
              step="1"
              value={inputs.investmentYears}
              onChange={(e) => setInputs({ ...inputs, investmentYears: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        {/* Right Visuals & Results */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal Portfolio Value</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(results.finalNominalValue, currency)}
              </div>
              <div className="text-xs text-indigo-600 font-bold mt-1">
                Real: {formatCurrency(results.finalRealValue, currency)} (adj. inflation)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Capital Growth</div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 tracking-tight">
                +{formatCurrency(results.totalCapitalGains, currency)}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                Invested: {formatCurrency(inputs.initialInvestment + results.totalContributions, currency)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Annual Passive Dividends</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(results.finalYearDividendIncome, currency)}/yr
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                {formatCurrency(results.finalYearDividendIncome / 12, currency)} per month in Yr {inputs.investmentYears}
              </div>
            </div>
          </div>

          {/* Dividend & Fee Drag Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wider">Passive Dividend Stream</div>
                <div className="text-slate-600 font-medium mt-1">
                  In Year {inputs.investmentYears}, your portfolio generates{' '}
                  <span className="font-bold text-indigo-600">{formatCurrency(results.finalYearDividendIncome / 12, currency)}/mo</span> in passive dividends.
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
              <div className="p-2.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl shrink-0">
                <BadgePercent className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wider">Expense Ratio Impact</div>
                <div className="text-slate-600 font-medium mt-1">
                  At <span className="font-bold text-slate-900">{inputs.expenseRatio}% fee</span>, cumulative fund fees cost{' '}
                  <span className="font-bold text-rose-600">{formatCurrency(results.totalFeesPaid, currency)}</span> over {inputs.investmentYears} years.
                </div>
              </div>
            </div>
          </div>

          {/* Volatility Bands & Real Value Projection Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Market Scenarios & Real Purchasing Power</h3>
                <p className="text-xs text-slate-400 mt-0.5">Includes Bull (+4.5%) and Bear (-3.5%) market scenario bands</p>
              </div>
            </div>

            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
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
                    formatter={(val: number, name: string) => [formatCurrency(val, currency), name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="Bull Market (+4.5%)"
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fill="url(#bullGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expected Base"
                    stroke="#4338ca"
                    strokeWidth={2.5}
                    fill="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="Bear Market (-3.5%)"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fill="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="Real Value (Inflation Adj)"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Invested Capital"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Projection Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Yearly Portfolio Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">Nominal, Real, Dividend, and Fee progression</p>
          </div>
          <button
            id="investment-export-csv-btn"
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
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Invested Capital</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Nominal Value</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Real Value (Inflation Adj)</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">Annual Dividends</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Cumulative Fees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {results.schedule.map((row) => (
                <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">Year {row.year}</td>
                  <td className="py-3 px-4 text-slate-600">{formatCurrency(row.investedCapital, currency)}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600">{formatCurrency(row.nominalValue, currency)}</td>
                  <td className="py-3 px-4 text-sky-700 font-semibold">{formatCurrency(row.realValue, currency)}</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">+{formatCurrency(row.annualDividends, currency)}</td>
                  <td className="py-3 px-4 text-right text-rose-600">-{formatCurrency(row.totalFeesPaid, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
