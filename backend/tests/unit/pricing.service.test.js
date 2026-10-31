import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import PricingService from '../../src/services/pricing.service.js';

describe('PricingService Unit Tests', () => {
  it('should accurately calculate variant adjusted unit price (1000 + 560 = 1560)', () => {
    const basePrice = 1000;
    const variantAdjustment = 560;

    const unitPrice = PricingService.calculateProductUnitPrice(basePrice, variantAdjustment);

    expect(unitPrice).toBeInstanceOf(Decimal);
    expect(unitPrice.toString()).toBe('1560');
  });

  it('should accurately calculate line item subtotal with high decimal precision', () => {
    const unitPrice = '1560.50';
    const quantity = 3;

    const subtotal = PricingService.calculateLineSubtotal(unitPrice, quantity);

    expect(subtotal).toBeInstanceOf(Decimal);
    expect(subtotal.toString()).toBe('4681.5');
  });

  it('should reject negative quantities or zero quantity', () => {
    expect(() => PricingService.calculateLineSubtotal(100, 0)).toThrow('Quantity must be greater than zero');
    expect(() => PricingService.calculateLineSubtotal(100, -2)).toThrow('Quantity must be greater than zero');
  });

  it('should reject variant adjustments that result in negative final price', () => {
    expect(() => PricingService.calculateProductUnitPrice(500, -600)).toThrow('cannot be negative');
  });

  it('should preserve financial precision without JS IEEE-754 floating point distortion', () => {
    // In plain JavaScript: 0.1 + 0.2 = 0.30000000000000004
    const base = '0.10';
    const adj = '0.20';
    const result = PricingService.calculateProductUnitPrice(base, adj);

    expect(result.toString()).toBe('0.3');
  });
});
