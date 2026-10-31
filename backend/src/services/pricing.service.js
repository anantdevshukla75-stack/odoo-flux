import Decimal from 'decimal.js';
import prisma from '../config/database.js';
import AppError from '../utils/appError.js';

// Configure Decimal precision and rounding mode (Half Up standard financial rounding)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class PricingService {
  /**
   * Calculates effective unit price of a product with optional variant adjustment.
   * Example: Base 1,000 + Adjustment 560 = 1,560
   * 
   * @param {string|number|Decimal} basePrice
   * @param {string|number|Decimal} [variantAdjustment=0]
   * @returns {Decimal}
   */
  static calculateProductUnitPrice(basePrice, variantAdjustment = 0) {
    const base = new Decimal(basePrice || 0);
    const adjustment = new Decimal(variantAdjustment || 0);
    const total = base.plus(adjustment);

    if (total.isNegative()) {
      throw AppError.badRequest('Effective product price cannot be negative.', null, 'INVALID_PRICING');
    }

    return total;
  }

  /**
   * Calculates line item subtotal: unitPrice * quantity
   * 
   * @param {string|number|Decimal} unitPrice
   * @param {number} quantity
   * @returns {Decimal}
   */
  static calculateLineSubtotal(unitPrice, quantity) {
    const price = new Decimal(unitPrice || 0);
    const qty = new Decimal(quantity || 1);

    if (qty.isNegative() || qty.isZero()) {
      throw AppError.badRequest('Quantity must be greater than zero.', null, 'INVALID_QUANTITY');
    }

    return price.times(qty);
  }

  /**
   * Resolves product and variant prices directly from database and computes line totals
   * 
   * @param {string} productId
   * @param {string} [variantId]
   * @param {number} [quantity=1]
   * @returns {Promise<{ productId: string, variantId?: string, productName: string, variantName?: string, basePrice: Decimal, variantAdjustment: Decimal, unitPrice: Decimal, quantity: number, subtotal: Decimal }>}
   */
  static async resolveProductLinePricing(productId, variantId = null, quantity = 1) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) {
      throw AppError.notFound(`Product with ID ${productId} not found.`, null, 'PRODUCT_NOT_FOUND');
    }

    if (!product.isActive) {
      throw AppError.badRequest(`Product '${product.name}' is inactive and cannot be selected.`, null, 'INACTIVE_PRODUCT');
    }

    let variantAdjustment = new Decimal(0);
    let variantName = null;

    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) {
        throw AppError.badRequest(`Variant ID ${variantId} does not belong to product '${product.name}'.`, null, 'INVALID_VARIANT');
      }
      if (!variant.isActive) {
        throw AppError.badRequest(`Variant '${variant.name}' is inactive.`, null, 'INACTIVE_VARIANT');
      }
      variantAdjustment = new Decimal(variant.priceAdjustment.toString());
      variantName = variant.name;
    }

    const basePrice = new Decimal(product.salePrice.toString());
    const unitPrice = this.calculateProductUnitPrice(basePrice, variantAdjustment);
    const subtotal = this.calculateLineSubtotal(unitPrice, quantity);

    return {
      productId: product.id,
      variantId: variantId || null,
      productName: product.name,
      variantName,
      productType: product.productType,
      basePrice,
      variantAdjustment,
      unitPrice,
      quantity,
      subtotal
    };
  }

  /**
   * Computes complete price breakdown for a subscription or quotation,
   * cleanly distinguishing recurring base plan from additional product lines.
   * 
   * @param {string} planId
   * @param {Array<{ productId: string, variantId?: string, quantity: number }>} [additionalLines=[]]
   * @returns {Promise<{ plan: object, lines: Array<object>, planAmount: Decimal, addOnAmount: Decimal, totalAmount: Decimal }>}
   */
  static async calculateSubscriptionPricing(planId, additionalLines = []) {
    // 1. Fetch Plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw AppError.notFound(`Subscription plan with ID ${planId} not found.`, null, 'PLAN_NOT_FOUND');
    }

    if (!plan.isActive) {
      throw AppError.badRequest(`Subscription plan '${plan.name}' is currently inactive.`, null, 'INACTIVE_PLAN');
    }

    // Check availability dates
    const now = new Date();
    if (plan.availableFrom && plan.availableFrom > now) {
      throw AppError.badRequest(`Plan '${plan.name}' is not yet available for subscription.`, null, 'PLAN_NOT_YET_AVAILABLE');
    }
    if (plan.availableUntil && plan.availableUntil < now) {
      throw AppError.badRequest(`Plan '${plan.name}' availability expired on ${plan.availableUntil.toISOString().split('T')[0]}.`, null, 'PLAN_EXPIRED');
    }

    // Base plan recurring amount
    const planPrice = new Decimal(plan.price.toString());
    const planMinimumQty = plan.minimumQuantity || 1;
    const planAmount = planPrice.times(planMinimumQty);

    // 2. Resolve additional product / add-on lines
    const resolvedLines = [];
    let addOnAmount = new Decimal(0);

    for (const line of additionalLines) {
      const resolvedLine = await this.resolveProductLinePricing(
        line.productId,
        line.variantId,
        line.quantity || 1
      );
      resolvedLines.push(resolvedLine);
      addOnAmount = addOnAmount.plus(resolvedLine.subtotal);
    }

    // Total = Plan recurring amount + Add-on lines
    const totalAmount = planAmount.plus(addOnAmount);

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        billingInterval: plan.billingInterval,
        unitPrice: planPrice,
        quantity: planMinimumQty,
        subtotal: planAmount
      },
      lines: resolvedLines,
      planAmount,
      addOnAmount,
      totalAmount
    };
  }
}

export default PricingService;
