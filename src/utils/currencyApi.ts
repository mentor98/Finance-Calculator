import { CurrencyCode } from '../types';
import { SUPPORTED_CURRENCIES } from './formatters';

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc?: string;
}

const CACHE_KEY = 'fcs_fx_rates_cache';
const CACHE_EXPIRY = 3600 * 1000; // 1 hour

export interface LiveRatesState {
  rates: Record<string, number>; // Base: USD
  base: string;
  lastUpdated: string;
  isLoading: boolean;
  isError: boolean;
}

// Fallback rates using standard base USD
export function getInitialRates(): Record<string, number> {
  const rates: Record<string, number> = {};
  Object.values(SUPPORTED_CURRENCIES).forEach((curr) => {
    rates[curr.code] = curr.rateToUSD;
  });
  return rates;
}

export async function fetchLiveExchangeRates(): Promise<{ rates: Record<string, number>; lastUpdated: string }> {
  // Check local cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY && parsed.rates) {
        return { rates: parsed.rates, lastUpdated: parsed.lastUpdated };
      }
    }
  } catch (e) {
    // Ignore localStorage read errors
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data: ExchangeRateResponse = await response.json();
    if (data.rates) {
      const mergedRates: Record<string, number> = { ...getInitialRates(), ...data.rates };
      const lastUpdated = data.time_last_update_utc || new Date().toUTCString();
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            rates: mergedRates,
            lastUpdated,
          })
        );
      } catch (e) {
        // localStorage write error
      }
      return { rates: mergedRates, lastUpdated };
    }
  } catch (error) {
    console.warn('Could not fetch live exchange rates, falling back to built-in rates:', error);
  }

  return {
    rates: getInitialRates(),
    lastUpdated: 'Built-in reference rates',
  };
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<string, number>
): { result: number; rate: number } {
  if (from === to) return { result: amount, rate: 1.0 };
  const fromRateToUSD = rates[from] || SUPPORTED_CURRENCIES[from]?.rateToUSD || 1;
  const toRateToUSD = rates[to] || SUPPORTED_CURRENCIES[to]?.rateToUSD || 1;

  // 1 USD = fromRateToUSD [FROM]
  // 1 USD = toRateToUSD [TO]
  // Rate FROM -> TO = toRateToUSD / fromRateToUSD
  const conversionRate = toRateToUSD / fromRateToUSD;
  const converted = amount * conversionRate;

  return {
    result: converted,
    rate: conversionRate,
  };
}
