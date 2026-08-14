import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  Globe,
  Copy,
  Check,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CurrencyCode, CurrencyInfo } from '../types';
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_LIST,
  formatCurrency,
  formatNumber,
} from '../utils/formatters';
import { fetchLiveExchangeRates, convertCurrency, getInitialRates } from '../utils/currencyApi';

interface CurrencyConverterProps {
  defaultCurrency?: CurrencyCode;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000, 5000, 10000];

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  defaultCurrency = 'USD',
}) => {
  const [amount, setAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('EUR');
  const [rates, setRates] = useState<Record<string, number>>(getInitialRates());
  const [lastUpdated, setLastUpdated] = useState<string>('Live standard rates');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [matrixSearch, setMatrixSearch] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadRates() {
      setIsLoading(true);
      const data = await fetchLiveExchangeRates();
      if (isMounted) {
        setRates(data.rates);
        setLastUpdated(data.lastUpdated);
        setIsLoading(false);
      }
    }
    loadRates();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Force refresh bypassing cache
    try {
      localStorage.removeItem('fcs_fx_rates_cache');
    } catch (e) {}
    const data = await fetchLiveExchangeRates();
    setRates(data.rates);
    setLastUpdated(data.lastUpdated);
    setIsLoading(false);
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const conversion = useMemo(() => {
    return convertCurrency(amount, fromCurrency, toCurrency, rates);
  }, [amount, fromCurrency, toCurrency, rates]);

  const inverseConversion = useMemo(() => {
    return convertCurrency(1, toCurrency, fromCurrency, rates);
  }, [fromCurrency, toCurrency, rates]);

  const fromInfo = SUPPORTED_CURRENCIES[fromCurrency] || SUPPORTED_CURRENCIES.USD;
  const toInfo = SUPPORTED_CURRENCIES[toCurrency] || SUPPORTED_CURRENCIES.EUR;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Matrix Data: Convert current amount into all other currencies
  const matrixData = useMemo(() => {
    const term = matrixSearch.toLowerCase();
    return CURRENCY_LIST.filter(
      (c) =>
        c.code !== fromCurrency &&
        (c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term))
    ).map((c) => {
      const conv = convertCurrency(amount, fromCurrency, c.code, rates);
      const singleRate = convertCurrency(1, fromCurrency, c.code, rates);
      return {
        currency: c,
        convertedAmount: conv.result,
        singleRate: singleRate.rate,
      };
    });
  }, [amount, fromCurrency, rates, matrixSearch]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Real-Time Currency Converter</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-currency foreign exchange rates, conversion matrix, and instant cross-rates.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-xs text-xs font-semibold text-slate-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lastUpdated}</span>
          </div>
          <button
            id="currency-refresh-rates-btn"
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Updating...' : 'Refresh Rates'}
          </button>
        </div>
      </div>

      {/* Main Conversion Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quick Denominations */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Quick:
            </span>
            <div className="flex gap-1.5">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  id={`currency-quick-${val}-btn`}
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    amount === val
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {fromInfo.symbol}
                  {formatNumber(val)}
                </button>
              ))}
            </div>
          </div>

          {/* From & To Selectors & Amount Input */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Amount & From Currency */}
            <div className="md:col-span-5 space-y-1.5">
              <label htmlFor="currency-amount-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                You Pay / Convert From
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                <input
                  id="currency-amount-input"
                  type="number"
                  min="0"
                  step="any"
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xl sm:text-2xl font-bold text-slate-900 bg-transparent outline-none"
                  placeholder="0.00"
                />
                <select
                  id="currency-from-select"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
                  aria-label="Convert from currency"
                  className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 shadow-xs cursor-pointer outline-none focus:border-indigo-500"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[11px] font-semibold text-slate-500">{fromInfo.name}</div>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center pt-2 md:pt-4">
              <button
                id="currency-swap-btn"
                type="button"
                onClick={handleSwap}
                className="p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl border border-slate-200 transition-all active:scale-95 shadow-xs"
                title="Swap Currencies"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Converted & To Currency */}
            <div className="md:col-span-5 space-y-1.5">
              <label htmlFor="currency-to-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                You Receive / Convert To
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div className="text-xl sm:text-2xl font-bold text-indigo-600 truncate">
                  {formatCurrency(conversion.result, toCurrency)}
                </div>
                <select
                  id="currency-to-select"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
                  aria-label="Convert to currency"
                  className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 shadow-xs cursor-pointer outline-none focus:border-indigo-500"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} - {c.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[11px] font-semibold text-slate-500">{toInfo.name}</div>
            </div>
          </div>

          {/* 3 Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exchange Rate</div>
              <div className="text-lg font-bold text-slate-900">
                1 {fromCurrency} = {conversion.rate.toFixed(4)} {toCurrency}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Current spot conversion rate
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inverse Cross Rate</div>
              <div className="text-lg font-bold text-slate-900">
                1 {toCurrency} = {inverseConversion.rate.toFixed(4)} {fromCurrency}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Reciprocal currency rate
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Copy Calculation</div>
                <div className="text-xs font-bold text-slate-700 truncate">
                  {amount} {fromCurrency} = {conversion.result.toFixed(2)} {toCurrency}
                </div>
              </div>
              <button
                id="currency-copy-result-btn"
                type="button"
                onClick={() =>
                  handleCopy(
                    `${amount} ${fromCurrency} = ${conversion.result.toFixed(2)} ${toCurrency}`,
                    'hero'
                  )
                }
                className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                {copiedCode === 'hero' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Copy Result</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Currency Conversion Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Global Currency Matrix ({fromInfo.symbol}{formatNumber(amount)})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live conversion of {fromInfo.symbol}{formatNumber(amount)} {fromCurrency} across 20+ major global currencies
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="currency-matrix-search-input"
              type="text"
              placeholder="Search currencies..."
              value={matrixSearch}
              onChange={(e) => setMatrixSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matrixData.map((item) => (
            <div
              key={item.currency.code}
              className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 rounded-xl transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{item.currency.flag}</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <span>{item.currency.code}</span>
                    <span className="text-slate-400 font-normal text-[11px] truncate">({item.currency.name})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    1 {fromCurrency} = {item.singleRate.toFixed(3)} {item.currency.symbol}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-indigo-600">
                  {formatCurrency(item.convertedAmount, item.currency.code)}
                </div>
                <button
                  id={`currency-matrix-copy-${item.currency.code}`}
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${formatCurrency(item.convertedAmount, item.currency.code)}`,
                      item.currency.code
                    )
                  }
                  className="text-[10px] text-slate-400 hover:text-indigo-600 inline-flex items-center gap-1 mt-0.5 font-bold uppercase tracking-wider"
                >
                  {copiedCode === item.currency.code ? (
                    <span className="text-indigo-600 font-bold">Copied</span>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
