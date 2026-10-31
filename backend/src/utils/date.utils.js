/**
 * Calendar-aware date calculation utility for recurring billing intervals.
 * Operates strictly in UTC to prevent timezone drifting across month boundaries.
 */

/**
 * Checks if a given year is a leap year
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns the maximum number of days in a given year and month (0-indexed month)
 * @param {number} year
 * @param {number} monthIndex - 0 for Jan, 1 for Feb, etc.
 * @returns {number}
 */
export function getDaysInMonth(year, monthIndex) {
  const daysByMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysByMonth[monthIndex];
}

/**
 * Adds a billing interval (DAILY, WEEKLY, MONTHLY, YEARLY) to a base date.
 * Implements strict calendar month-end clamping:
 * - e.g. Jan 31 + 1 month => Feb 28 (or Feb 29 on leap year)
 * - e.g. Aug 31 + 1 month => Sep 30
 * - e.g. Feb 29 2024 + 1 year => Feb 28 2025
 * 
 * @param {Date|string} fromDate - Base starting date
 * @param {'DAILY'|'WEEKLY'|'MONTHLY'|'YEARLY'} interval - Interval enum
 * @param {number} [count=1] - Multiplier count (default 1)
 * @returns {Date} - New UTC date
 */
export function addBillingInterval(fromDate, interval, count = 1) {
  const base = new Date(fromDate);
  if (isNaN(base.getTime())) {
    throw new Error('Invalid base date provided to addBillingInterval');
  }

  const multiplier = Math.max(1, count);
  const result = new Date(base.getTime());

  switch (interval) {
    case 'DAILY': {
      result.setUTCDate(result.getUTCDate() + multiplier);
      return result;
    }

    case 'WEEKLY': {
      result.setUTCDate(result.getUTCDate() + (multiplier * 7));
      return result;
    }

    case 'MONTHLY': {
      const currentYear = result.getUTCFullYear();
      const currentMonth = result.getUTCMonth();
      const originalDay = result.getUTCDate();

      // Calculate target year and month
      const totalMonths = currentMonth + multiplier;
      const targetYear = currentYear + Math.floor(totalMonths / 12);
      const targetMonth = totalMonths % 12;

      // Clamp day to maximum available days in target month
      const maxDaysInTargetMonth = getDaysInMonth(targetYear, targetMonth);
      const clampedDay = Math.min(originalDay, maxDaysInTargetMonth);

      result.setUTCFullYear(targetYear);
      result.setUTCMonth(targetMonth);
      result.setUTCDate(clampedDay);

      return result;
    }

    case 'YEARLY': {
      const currentYear = result.getUTCFullYear();
      const targetYear = currentYear + multiplier;
      const currentMonth = result.getUTCMonth();
      const originalDay = result.getUTCDate();

      // If Feb 29 in leap year moving to non-leap year, clamp to Feb 28
      const maxDaysInTarget = getDaysInMonth(targetYear, currentMonth);
      const clampedDay = Math.min(originalDay, maxDaysInTarget);

      result.setUTCFullYear(targetYear);
      result.setUTCDate(clampedDay);

      return result;
    }

    default:
      throw new Error(`Unsupported billing interval: ${interval}`);
  }
}

/**
 * Checks if a given expiry date has passed
 * @param {Date|string} expiryDate
 * @returns {boolean}
 */
export function isExpired(expiryDate) {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export default {
  isLeapYear,
  getDaysInMonth,
  addBillingInterval,
  isExpired
};
