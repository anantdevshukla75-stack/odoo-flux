import Decimal from 'decimal.js';
import prisma from '../config/database.js';
import AppError from '../utils/appError.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class TaxService {
  /**
   * Calculates tax for a specific amount given an array of tax rule objects or IDs
   * 
   * @param {string|number|Decimal} amount - The base or gross amount
   * @param {Array<object>} taxes - Array of Tax records (with rate, calculationMethod)
   * @returns {{ taxableAmount: Decimal, totalTaxAmount: Decimal, grossTotal: Decimal, breakdown: Array<object> }}
   */
  static calculateTaxForAmount(amount, taxes = []) {
    const baseDecimal = new Decimal(amount || 0);

    if (baseDecimal.isNegative()) {
      throw AppError.badRequest('Taxable amount cannot be negative.', null, 'INVALID_TAXABLE_AMOUNT');
    }

    if (!taxes || taxes.length === 0) {
      return {
        taxableAmount: baseDecimal,
        totalTaxAmount: new Decimal(0),
        grossTotal: baseDecimal,
        breakdown: []
      };
    }

    let runningTaxTotal = new Decimal(0);
    const breakdown = [];

    // Separate exclusive and inclusive taxes
    const exclusiveTaxes = taxes.filter(t => t.calculationMethod !== 'INCLUSIVE');
    const inclusiveTaxes = taxes.filter(t => t.calculationMethod === 'INCLUSIVE');

    let netTaxable = baseDecimal;

    // Handle Inclusive Taxes first (if any)
    // If an item price includes 18% tax: Net = Price / (1 + 0.18), Tax = Price - Net
    if (inclusiveTaxes.length > 0) {
      let combinedInclusiveRate = new Decimal(0);
      for (const t of inclusiveTaxes) {
        combinedInclusiveRate = combinedInclusiveRate.plus(new Decimal(t.rate.toString()).dividedBy(100));
      }

      const divisor = new Decimal(1).plus(combinedInclusiveRate);
      netTaxable = baseDecimal.dividedBy(divisor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      for (const t of inclusiveTaxes) {
        const rateDecimal = new Decimal(t.rate.toString()).dividedBy(100);
        const taxAmount = netTaxable.times(rateDecimal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        runningTaxTotal = runningTaxTotal.plus(taxAmount);

        breakdown.push({
          taxId: t.id,
          name: t.name,
          rate: new Decimal(t.rate.toString()),
          calculationMethod: 'INCLUSIVE',
          taxAmount
        });
      }
    }

    // Handle Exclusive Taxes
    // Tax = netTaxable * (Rate / 100)
    for (const t of exclusiveTaxes) {
      const rateDecimal = new Decimal(t.rate.toString()).dividedBy(100);
      const taxAmount = netTaxable.times(rateDecimal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      runningTaxTotal = runningTaxTotal.plus(taxAmount);

      breakdown.push({
        taxId: t.id,
        name: t.name,
        rate: new Decimal(t.rate.toString()),
        calculationMethod: 'EXCLUSIVE',
        taxAmount
      });
    }

    const grossTotal = netTaxable.plus(runningTaxTotal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      taxableAmount: netTaxable.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      totalTaxAmount: runningTaxTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      grossTotal,
      breakdown
    };
  }

  /**
   * Resolves active applicable taxes for a product or plan from database
   * 
   * @param {{ productId?: string, planId?: string }} target
   * @returns {Promise<Array<object>>}
   */
  static async resolveApplicableTaxes({ productId = null, planId = null }) {
    const now = new Date();

    const activeTaxDateFilter = {
      isActive: true,
      OR: [
        { effectiveFrom: null, effectiveUntil: null },
        { effectiveFrom: { lte: now }, effectiveUntil: null },
        { effectiveFrom: null, effectiveUntil: { gte: now } },
        { effectiveFrom: { lte: now }, effectiveUntil: { gte: now } }
      ]
    };

    let taxes = [];

    if (productId) {
      // Find taxes explicitly linked to product, or global products tax
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          productTaxes: {
            include: {
              tax: true
            }
          }
        }
      });

      if (product && product.productTaxes.length > 0) {
        taxes = product.productTaxes
          .map(pt => pt.tax)
          .filter(t => t.isActive && (!t.effectiveFrom || t.effectiveFrom <= now) && (!t.effectiveUntil || t.effectiveUntil >= now));
      } else {
        // Fallback to active taxes applicable to ALL or PRODUCTS_ONLY
        taxes = await prisma.tax.findMany({
          where: {
            ...activeTaxDateFilter,
            applicableTo: { in: ['ALL', 'PRODUCTS_ONLY'] }
          }
        });
      }
    } else if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          planTaxes: {
            include: {
              tax: true
            }
          }
        }
      });

      if (plan && plan.planTaxes.length > 0) {
        taxes = plan.planTaxes
          .map(pt => pt.tax)
          .filter(t => t.isActive && (!t.effectiveFrom || t.effectiveFrom <= now) && (!t.effectiveUntil || t.effectiveUntil >= now));
      } else {
        // Fallback to active taxes applicable to ALL or PLANS_ONLY
        taxes = await prisma.tax.findMany({
          where: {
            ...activeTaxDateFilter,
            applicableTo: { in: ['ALL', 'PLANS_ONLY'] }
          }
        });
      }
    }

    return taxes;
  }
}

export default TaxService;
