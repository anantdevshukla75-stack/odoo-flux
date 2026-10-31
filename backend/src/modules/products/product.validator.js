import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').max(150),
  description: z.string().trim().max(2000).optional(),
  productType: z.enum(['SOFTWARE', 'SERVICE', 'ADD_ON', 'OTHER']).default('SOFTWARE'),
  salePrice: z.coerce.number().min(0, 'Sale price cannot be negative'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').default(0),
  isActive: z.boolean().default(true),
  taxIds: z.array(z.string().uuid()).optional()
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  productType: z.enum(['SOFTWARE', 'SERVICE', 'ADD_ON', 'OTHER']).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  taxIds: z.array(z.string().uuid()).optional()
});

export const createVariantSchema = z.object({
  name: z.string().trim().min(2, 'Variant name must be at least 2 characters').max(100),
  description: z.string().trim().max(1000).optional(),
  priceAdjustment: z.coerce.number().default(0), // Can be positive or negative adjustment, but final price cannot be negative
  sku: z.string().trim().max(50).optional(),
  isActive: z.boolean().default(true)
});

export const updateVariantSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  priceAdjustment: z.coerce.number().optional(),
  sku: z.string().trim().max(50).nullable().optional(),
  isActive: z.boolean().optional()
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  productType: z.enum(['SOFTWARE', 'SERVICE', 'ADD_ON', 'OTHER']).optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  search: z.string().trim().optional()
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

export const productVariantParamSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  id: z.string().uuid('Invalid variant ID format').optional()
});
