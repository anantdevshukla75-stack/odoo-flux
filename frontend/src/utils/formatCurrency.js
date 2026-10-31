/**
 * Brightloop Software - Centralized Currency Configuration & Formatter
 */

export const CURRENCY_CONFIG = {
  code: 'USD',
  locale: 'en-US',
  symbol: '$',
  name: 'US Dollar'
};

/**
 * Formats a numeric value into a localized currency string.
 * Uses centralized demonstration currency configuration.
 */
export function formatCurrency(
  amount,
  currency = CURRENCY_CONFIG.code,
  locale = CURRENCY_CONFIG.locale
) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${CURRENCY_CONFIG.symbol}0.00`;
  }

  const num = Number(amount);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch {
    return `${CURRENCY_CONFIG.symbol}${num.toFixed(2)}`;
  }
}

export default formatCurrency;
