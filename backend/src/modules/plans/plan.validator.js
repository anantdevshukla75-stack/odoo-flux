import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().trim().min(2, 'Plan name must be at least 2 characters').max(100),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().min(0, 'Plan price cannot be negative'),
  billingInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  billingIntervalCount: z.coerce.number().int().min(1).default(1),
  minimumQuantity: z.coerce.number().int().min(1).default(1),
  availableFrom: z.string().datetime({ offset: true }).optional().nullable(),
  availableUntil: z.string().datetime({ offset: true }).optional().nullable(),
  autoCloseEnabled: z.boolean().default(false),
  allowEarlyClose: z.boolean().default(true),
  allowPause: z.boolean().default(true),
  allowRenewal: z.boolean().default(true),
  isActive: z.boolean().default(true),
  taxIds: z.array(z.string().uuid()).optional()
}).refine(data => {
  if (data.availableFrom && data.availableUntil) {
    return new Date(data.availableUntil) >= new Date(data.availableFrom);
  }
  return true;
}, {
  message: 'availableUntil must be on or after availableFrom',
  path: ['availableUntil']
});

export const updatePlanSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.coerce.number().min(0).optional(),
  billingInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  billingIntervalCount: z.coerce.number().int().min(1).optional(),
  minimumQuantity: z.coerce.number().int().min(1).optional(),
  availableFrom: z.string().datetime({ offset: true }).nullable().optional(),
  availableUntil: z.string().datetime({ offset: true }).nullable().optional(),
  autoCloseEnabled: z.boolean().optional(),
  allowEarlyClose: z.boolean().optional(),
  allowPause: z.boolean().optional(),
  allowRenewal: z.boolean().optional(),
  isActive: z.boolean().optional(),
  taxIds: z.array(z.string().uuid()).optional()
}).refine(data => {
  if (data.availableFrom && data.availableUntil) {
    return new Date(data.availableUntil) >= new Date(data.availableFrom);
  }
  return true;
}, {
  message: 'availableUntil must be on or after availableFrom',
  path: ['availableUntil']
});

export const planQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  billingInterval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  search: z.string().trim().optional()
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});
