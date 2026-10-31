import prisma from '../config/database.js';

/**
 * Generates unique formatted sequential reference numbers.
 * Format: PREFIX-YYYY-NNNNN (e.g. QT-2026-00001, SUB-2026-00001)
 * 
 * @param {'QT'|'SUB'|'INV'|'PAY'} prefix
 * @returns {Promise<string>}
 */
export async function generateNextSequenceNumber(prefix) {
  const currentYear = new Date().getUTCFullYear();
  const searchPattern = `${prefix}-${currentYear}-`;

  let totalCount = 0;

  switch (prefix) {
    case 'QT':
      totalCount = await prisma.quotation.count({
        where: { quotationNumber: { startsWith: searchPattern } }
      });
      break;
    case 'SUB':
      totalCount = await prisma.subscription.count({
        where: { subscriptionNumber: { startsWith: searchPattern } }
      });
      break;
    default:
      totalCount = 0;
  }

  const sequenceNumber = (totalCount + 1).toString().padStart(5, '0');
  const candidate = `${prefix}-${currentYear}-${sequenceNumber}`;

  return candidate;
}

export default {
  generateNextSequenceNumber
};
