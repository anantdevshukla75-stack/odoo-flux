import { z } from 'zod';
import { passwordSchema } from '../auth/auth.validator.js';

export const createStaffSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: passwordSchema.optional(), // If omitted, system generates temporary password
  phone: z.string().trim().max(25).optional()
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  isActive: z.boolean().optional()
});

export const updateCustomerProfileSchema = z.object({
  companyName: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().max(25).nullable().optional(),
  billingAddress: z.record(z.any()).nullable().optional(),
  shippingAddress: z.record(z.any()).nullable().optional(),
  taxId: z.string().trim().max(50).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional()
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']).optional(),
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  search: z.string().trim().optional()
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});
