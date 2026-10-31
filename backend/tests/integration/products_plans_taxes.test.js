import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/database.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('Products, Variants, Plans & Taxes Integration Tests', () => {
  const adminToken = signAccessToken({
    id: 'admin-uuid-1',
    email: 'admin@brightloopsoftware.com',
    role: 'ADMIN',
    fullName: 'Admin User'
  });

  const customerToken = signAccessToken({
    id: 'customer-uuid-1',
    email: 'customer@example.com',
    role: 'CUSTOMER',
    fullName: 'Customer User'
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Products & Variants', () => {
    it('should allow ADMIN to create a product', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'admin-uuid-1',
        email: 'admin@brightloopsoftware.com',
        role: 'ADMIN',
        isActive: true
      });

      const mockProduct = {
        id: 'prod-uuid-1',
        name: 'Brightloop CRM',
        description: 'Customer Relationship Management Software',
        productType: 'SOFTWARE',
        salePrice: '1000.00',
        costPrice: '150.00',
        isActive: true,
        variants: [],
        productTaxes: []
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb({
          product: { create: vi.fn().mockResolvedValue(mockProduct) },
          systemAuditLog: { create: vi.fn().mockResolvedValue({}) }
        });
      });

      vi.spyOn(prisma.product, 'findUnique').mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Brightloop CRM',
          description: 'Customer Relationship Management Software',
          productType: 'SOFTWARE',
          salePrice: 1000,
          costPrice: 150
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Brightloop CRM');
    });

    it('should forbid CUSTOMER from creating products', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'customer-uuid-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        isActive: true
      });

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Product',
          salePrice: 500
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should create a variant with +560 price adjustment for product', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'admin-uuid-1',
        role: 'ADMIN',
        isActive: true
      });

      vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({
        id: '11111111-2222-3333-4444-555555555555',
        name: 'Base Product',
        salePrice: '1000.00',
        isActive: true
      });

      const mockVariant = {
        id: 'var-uuid-1',
        productId: '11111111-2222-3333-4444-555555555555',
        name: 'Premium Edition',
        priceAdjustment: '560.00',
        sku: 'PREM-01',
        isActive: true
      };

      vi.spyOn(prisma.productVariant, 'create').mockResolvedValue(mockVariant);
      vi.spyOn(prisma.systemAuditLog, 'create').mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/products/11111111-2222-3333-4444-555555555555/variants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Premium Edition',
          priceAdjustment: 560,
          sku: 'PREM-01'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.priceAdjustment).toBe('560.00');
    });
  });

  describe('Subscription Plans', () => {
    it('should allow ADMIN to create monthly subscription plan', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'admin-uuid-1',
        role: 'ADMIN',
        isActive: true
      });

      const mockPlan = {
        id: 'plan-uuid-1',
        name: 'Pro Monthly Plan',
        price: '2000.00',
        billingInterval: 'MONTHLY',
        billingIntervalCount: 1,
        minimumQuantity: 1,
        isActive: true,
        planTaxes: []
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb({
          subscriptionPlan: { create: vi.fn().mockResolvedValue(mockPlan) },
          systemAuditLog: { create: vi.fn().mockResolvedValue({}) }
        });
      });

      vi.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue(mockPlan);

      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pro Monthly Plan',
          price: 2000,
          billingInterval: 'MONTHLY'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.billingInterval).toBe('MONTHLY');
    });

    it('should reject plan creation when availableUntil is before availableFrom', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'admin-uuid-1',
        role: 'ADMIN',
        isActive: true
      });

      const response = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Date Plan',
          price: 1500,
          billingInterval: 'MONTHLY',
          availableFrom: '2026-12-01T00:00:00.000Z',
          availableUntil: '2026-11-01T00:00:00.000Z' // Prior to availableFrom
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Taxes', () => {
    it('should allow ADMIN to create a tax rule', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'admin-uuid-1',
        role: 'ADMIN',
        isActive: true
      });

      const mockTax = {
        id: 'tax-uuid-1',
        name: 'GST 18%',
        rate: '18.0000',
        taxType: 'GST',
        calculationMethod: 'EXCLUSIVE',
        applicableTo: 'ALL',
        isActive: true
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb({
          tax: { create: vi.fn().mockResolvedValue(mockTax) },
          systemAuditLog: { create: vi.fn().mockResolvedValue({}) }
        });
      });

      const response = await request(app)
        .post('/api/v1/taxes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'GST 18%',
          rate: 18,
          taxType: 'GST',
          calculationMethod: 'EXCLUSIVE',
          applicableTo: 'ALL'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.rate).toBe('18.0000');
    });
  });
});
