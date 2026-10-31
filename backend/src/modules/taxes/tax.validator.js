import { z } from 'zod';

export const createTaxSchema = z.object({
  name: z.string().trim().min(2, 'Tax name must be at least 2 characters').max(100),
  rate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%'),
  taxType: z.enum(['SALES_TAX', 'VAT', 'GST', 'CUSTOM']).default('GST'),
  calculationMethod: z.enum(['EXCLUSIVE', 'INCLUSIVE']).default('EXCLUSIVE'),
  applicableTo: z.enum(['ALL', 'PRODUCTS_ONLY', 'PLANS_ONLY']).default('ALL'),
  effectiveFrom: z.string().datetime({ offset: true }).optional().nullable(),
  effectiveUntil: z.string().datetime({ offset: true }).optional().nullable(),
  isActive: z.boolean().default(true)
}).refine(data => {
  if (data.effectiveFrom && data.effectiveUntil) {
    return new Date(data.effectiveUntil) >= new Date(data.effectiveFrom);
  }
  return true;
}, {
  message: 'effectiveUntil must be on or after effectiveFrom',
  path: ['effectiveUntil']
});

export const updateTaxSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  rate: z.coerce.number().min(0).max(100).optional(),
  taxType: z.enum(['SALES_TAX', 'VAT', 'GST', 'CUSTOM']).optional(),
  calculationMethod: z.enum(['EXCLUSIVE', 'INCLUSIVE']).optional(),
  applicableTo: z.enum(['ALL', 'PRODUCTS_ONLY', 'PLANS_ONLY']).optional(),
  effectiveFrom: z.string().datetime({ offset: true }).nullable().optional(),
  effectiveUntil: z.string().datetime({ offset: true }).nullable().optional(),
  isActive: z.boolean().optional()
}).refine(data => {
  if (data.effectiveFrom && data.effectiveUntil) {
    return new Date(data.effectiveUntil) >= new Date(data.effectiveFrom);
  }
  return true;
}, {
  message: 'effectiveUntil must be on or after effectiveFrom',
  path: ['effectiveUntil']
});

export const taxQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  taxType: z.enum(['SALES_TAX', 'VAT', 'GST', 'CUSTOM']).optional(),
  calculationMethod: z.enum(['EXCLUSIVE', 'INCLUSIVE']).optional(),
  applicableTo: z.enum(['ALL', 'PRODUCTS_ONLY', 'PLANS_ONLY']).optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  search: z.string().trim().optional()
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});
