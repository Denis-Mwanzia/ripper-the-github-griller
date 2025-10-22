// Currency utilities for KSH (Kenyan Shilling)

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `KSH ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `KSH ${(amount / 1000).toFixed(1)}K`;
  } else {
    return `KSH ${amount.toFixed(0)}`;
  }
};

export const parseCurrency = (value: string): number => {
  // Remove KSH prefix and parse number
  const cleanValue = value.replace(/[KSH\s,]/g, '');
  return parseFloat(cleanValue) || 0;
};

// Currency symbol
export const CURRENCY_SYMBOL = 'KSH';
export const CURRENCY_CODE = 'KES';

