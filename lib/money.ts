/**
 * Money utilities for Khata
 * All monetary values are stored in integer paisa/poisha (1 unit = 100 poisha/paise) to eliminate floating point issues.
 * Supports Taka (৳), Rupee (₹), Dollar ($). Default is Taka (৳).
 */

export type CurrencySymbol = '৳' | '₹' | '$';

export function getCurrencySymbol(): CurrencySymbol {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('khata_currency') as CurrencySymbol;
    if (saved && (saved === '৳' || saved === '₹' || saved === '$')) return saved;
  }
  return '৳';
}

export function setCurrencySymbol(symbol: CurrencySymbol): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('khata_currency', symbol);
    window.dispatchEvent(new Event('currencychange'));
  }
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number | string): number {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees.replace(/,/g, '')) : rupees;
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Formats paise/poisha into clean localized format with currency symbol.
 * Example: "৳ ১,৫০০" or "৳ 1,500.50"
 */
export function formatPaise(
  paise: number,
  options: { includeSymbol?: boolean; showSign?: boolean; currency?: string } = {}
): string {
  const { includeSymbol = true, showSign = false, currency } = options;
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const amount = absPaise / 100;

  // Check if fractional part exists
  const hasFraction = absPaise % 100 !== 0;

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);

  const sym = currency || getCurrencySymbol();
  let result = formattedNumber;

  if (includeSymbol) {
    result = `${sym} ${result}`;
  }

  if (isNegative) {
    result = `-${result}`;
  } else if (showSign && paise > 0) {
    result = `+${result}`;
  }

  return result;
}

/**
 * Format relative date/time cleanly
 */
export function formatDateTime(epochMs: number, lang: 'en' | 'bn' = 'bn'): string {
  const date = new Date(epochMs);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return lang === 'bn' ? `আজ, ${timeStr}` : `Today, ${timeStr}`;
  }
  if (isYesterday) {
    return lang === 'bn' ? `গতকাল, ${timeStr}` : `Yesterday, ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  return `${dateStr}, ${timeStr}`;
}

export function formatDateHeading(epochMs: number, lang: 'en' | 'bn' = 'bn'): string {
  const date = new Date(epochMs);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return lang === 'bn' ? 'আজ' : 'Today';
  }
  if (isYesterday) {
    return lang === 'bn' ? 'গতকাল' : 'Yesterday';
  }

  return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
