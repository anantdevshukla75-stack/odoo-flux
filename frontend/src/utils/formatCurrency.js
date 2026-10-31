/**
 * Formats a numeric value into a localized currency string.
 * Uses INR (₹) or USD ($) based on configuration.
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '$0.00';
  }

  const num = Number(amount);
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch (err) {
    return `$${num.toFixed(2)}`;
  }
}

export default formatCurrency;

