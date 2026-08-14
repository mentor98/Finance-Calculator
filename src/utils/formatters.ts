import { CurrencyCode, CurrencyInfo } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rateToUSD: 1.0 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToUSD: 0.92 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rateToUSD: 0.79 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', rateToUSD: 1.36 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rateToUSD: 1.52 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rateToUSD: 154.5 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rateToUSD: 83.4 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', rateToUSD: 0.90 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rateToUSD: 7.23 },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', rateToUSD: 5.15 },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽', rateToUSD: 16.8 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rateToUSD: 1.35 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', rateToUSD: 7.82 },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', rateToUSD: 1.66 },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', rateToUSD: 10.8 },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', rateToUSD: 1375.0 },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rateToUSD: 18.5 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪', rateToUSD: 3.67 },
  SAR: { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', flag: '🇸🇦', rateToUSD: 3.75 },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', rateToUSD: 32.4 },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', rateToUSD: 3.98 },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', rateToUSD: 10.9 },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', rateToUSD: 6.9 },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', rateToUSD: 36.8 },
};

export const CURRENCY_LIST = Object.values(SUPPORTED_CURRENCIES);

export function formatCurrency(
  value: number,
  currencyCode: CurrencyCode = 'USD',
  options?: {
    compact?: boolean;
    decimals?: number;
    showSymbol?: boolean;
  }
): string {
  if (isNaN(value) || !isFinite(value)) return '$0';
  
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const decimals = options?.decimals !== undefined 
    ? options.decimals 
    : (currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2);
  
  if (options?.compact && Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${currency.symbol}${millions.toFixed(1)}M`;
  }
  if (options?.compact && Math.abs(value) >= 100_000) {
    const thousands = value / 1_000;
    return `${currency.symbol}${thousands.toFixed(0)}k`;
  }

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  if (options?.showSymbol === false) {
    return formattedNum;
  }

  return `${currency.symbol}${formattedNum}`;
}

export function formatPercent(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return '0.00%';
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals: number = 0): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const val = item[header];
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return val ?? '';
    }).join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
