import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import TaxService from '../../src/services/tax.service.js';

describe('TaxService Unit Tests', () => {
  describe('Exclusive Tax Calculation', () => {
    it('should calculate exclusive 18% tax accurately on 1,000 subtotal (Tax = 180, Total = 1,180)', () => {
      const taxes = [
        {
          id: 'tax-1',
          name: 'GST 18%',
          rate: '18.0000',
          calculationMethod: 'EXCLUSIVE'
        }
      ];

      const result = TaxService.calculateTaxForAmount('1000.00', taxes);

      expect(result.taxableAmount.toString()).toBe('1000');
      expect(result.totalTaxAmount.toString()).toBe('180');
      expect(result.grossTotal.toString()).toBe('1180');
      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].taxAmount.toString()).toBe('180');
    });

    it('should calculate multiple exclusive taxes (e.g. CGST 9% + SGST 9%)', () => {
      const taxes = [
        { id: 'cgst', name: 'CGST 9%', rate: '9.0000', calculationMethod: 'EXCLUSIVE' },
        { id: 'sgst', name: 'SGST 9%', rate: '9.0000', calculationMethod: 'EXCLUSIVE' }
      ];

      const result = TaxService.calculateTaxForAmount('1000.00', taxes);

      expect(result.taxableAmount.toString()).toBe('1000');
      expect(result.totalTaxAmount.toString()).toBe('180');
      expect(result.grossTotal.toString()).toBe('1180');
      expect(result.breakdown[0].taxAmount.toString()).toBe('90');
      expect(result.breakdown[1].taxAmount.toString()).toBe('90');
    });
  });

  describe('Inclusive Tax Calculation', () => {
    it('should extract inclusive 18% tax from 1,180 gross total (Net = 1,000, Tax = 180)', () => {
      const taxes = [
        {
          id: 'tax-inc',
          name: 'Inclusive VAT 18%',
          rate: '18.0000',
          calculationMethod: 'INCLUSIVE'
        }
      ];

      const result = TaxService.calculateTaxForAmount('1180.00', taxes);

      expect(result.taxableAmount.toString()).toBe('1000');
      expect(result.totalTaxAmount.toString()).toBe('180');
      expect(result.grossTotal.toString()).toBe('1180');
      expect(result.breakdown[0].taxAmount.toString()).toBe('180');
    });
  });

  describe('Zero and Empty Taxes', () => {
    it('should return zero tax when tax rules array is empty', () => {
      const result = TaxService.calculateTaxForAmount('500.00', []);

      expect(result.taxableAmount.toString()).toBe('500');
      expect(result.totalTaxAmount.toString()).toBe('0');
      expect(result.grossTotal.toString()).toBe('500');
      expect(result.breakdown.length).toBe(0);
    });
  });
});
