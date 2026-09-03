/**
 * Money utilities for Khata
 * All monetary values are stored in integer paise (₹1 = 100 paise) to eliminate floating point issues.
 * Indian numbering format (e.g. ₹1,23,456) is used.
 */

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number | string): number {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees.replace(/,/g, '')) : rupees;
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Formats paise into Indian Rupee format with ₹ symbol.
 * If includeSymbol is true: "₹1,500" or "₹1,500.50"
 */
export function formatPaise(paise: number, options: { includeSymbol?: boolean; showSign?: boolean } = {}): string {
  const { includeSymbol = true, showSign = false } = options;
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;

  // Check if fractional part exists
  const hasFraction = absPaise % 100 !== 0;

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);

  let result = formattedNumber;
  if (includeSymbol) {
    result = `₹${result}`;
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
export function formatDateTime(epochMs: number, lang: 'en' | 'bn' = 'en'): string {
  const date = new Date(epochMs);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString(lang === 'bn' ? 'bn-IN' : 'en-IN', {
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

  const dateStr = date.toLocaleDateString(lang === 'bn' ? 'bn-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  return `${dateStr}, ${timeStr}`;
}

export function formatDateHeading(epochMs: number, lang: 'en' | 'bn' = 'en'): string {
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

  return date.toLocaleDateString(lang === 'bn' ? 'bn-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
