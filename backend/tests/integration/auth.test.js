import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/database.js';
import * as cryptoUtils from '../../src/utils/crypto.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('Auth & User Management Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a customer and enforce CUSTOMER role', async () => {
      const mockCreatedUser = {
        id: 'user-uuid-1',
        fullName: 'Alice Customer',
        email: 'alice@example.com',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false,
        customerProfile: {
          id: 'profile-uuid-1',
          userId: 'user-uuid-1',
          companyName: 'Alice Enterprises'
        }
      };

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb({
          user: { create: vi.fn().mockResolvedValue(mockCreatedUser) },
          systemAuditLog: { create: vi.fn().mockResolvedValue({}) }
        });
      });
      vi.spyOn(prisma.refreshToken, 'create').mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Alice Customer',
          email: 'alice@example.com',
          password: 'Password@123!',
          role: 'ADMIN', // Attacker attempts to spoof role
          companyName: 'Alice Enterprises'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('CUSTOMER'); // Server forces CUSTOMER
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration when email already exists', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'existing-id', email: 'alice@example.com' });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Alice Duplicate',
          email: 'alice@example.com',
          password: 'Password@123!'
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('EMAIL_EXISTS');
    });

    it('should reject registration with weak password (missing special char or too short)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Weak Password User',
          email: 'weak@example.com',
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in with valid credentials', async () => {
      const hashedPassword = await cryptoUtils.hashPassword('CorrectPass@123!');
      const mockUser = {
        id: 'user-uuid-1',
        fullName: 'Alice Customer',
        email: 'alice@example.com',
        passwordHash: hashedPassword,
        role: 'CUSTOMER',
        isActive: true,
        customerProfile: null
      };

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      vi.spyOn(prisma.refreshToken, 'create').mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'CorrectPass@123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const hashedPassword = await cryptoUtils.hashPassword('CorrectPass@123!');
      const mockUser = {
        id: 'user-uuid-1',
        email: 'alice@example.com',
        passwordHash: hashedPassword,
        isActive: true
      };

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'WrongPassword@999!'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login for deactivated accounts', async () => {
      const hashedPassword = await cryptoUtils.hashPassword('CorrectPass@123!');
      const mockUser = {
        id: 'user-uuid-deactivated',
        email: 'inactive@example.com',
        passwordHash: hashedPassword,
        isActive: false
      };

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'CorrectPass@123!'
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('ACCOUNT_DEACTIVATED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 when token is missing', async () => {
      const response = await request(app).get('/api/v1/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('MISSING_TOKEN');
    });

    it('should return user profile when valid token provided', async () => {
      const token = signAccessToken({
        id: 'user-uuid-1',
        email: 'alice@example.com',
        role: 'CUSTOMER',
        fullName: 'Alice Customer'
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user-uuid-1',
        fullName: 'Alice Customer',
        email: 'alice@example.com',
        role: 'CUSTOMER',
        isActive: true,
        customerProfile: null
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('user-uuid-1');
      expect(response.body.data.email).toBe('alice@example.com');
    });
  });

  describe('POST /api/v1/users/staff (Role Authorization)', () => {
    it('should allow ADMIN to create STAFF accounts', async () => {
      const adminToken = signAccessToken({
        id: 'admin-uuid-1',
        email: 'admin@brightloopsoftware.com',
        role: 'ADMIN',
        fullName: 'Admin User'
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'admin-uuid-1',
        email: 'admin@brightloopsoftware.com',
        role: 'ADMIN',
        isActive: true
      }).mockResolvedValueOnce(null); // No duplicate email

      const mockCreatedStaff = {
        id: 'staff-uuid-1',
        fullName: 'Bob Staff',
        email: 'bob.staff@brightloopsoftware.com',
        role: 'STAFF',
        isActive: true,
        emailVerified: true
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        return cb({
          user: { create: vi.fn().mockResolvedValue(mockCreatedStaff) },
          systemAuditLog: { create: vi.fn().mockResolvedValue({}) }
        });
      });

      const response = await request(app)
        .post('/api/v1/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Bob Staff',
          email: 'bob.staff@brightloopsoftware.com',
          password: 'StaffSecret@2026!'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('STAFF');
    });

    it('should forbid STAFF or CUSTOMER from creating staff accounts', async () => {
      const customerToken = signAccessToken({
        id: 'customer-uuid-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        fullName: 'Customer User'
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'customer-uuid-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        isActive: true
      });

      const response = await request(app)
        .post('/api/v1/users/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Malicious Staff',
          email: 'malicious@example.com',
          password: 'Password@123!'
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Customer Ownership Protection (IDOR Prevention)', () => {
    it('should forbid a customer from viewing another customer profile', async () => {
      const customerOneId = '11111111-1111-1111-1111-111111111111';
      const customerTwoId = '22222222-2222-2222-2222-222222222222';

      const customerToken = signAccessToken({
        id: customerOneId,
        email: 'customer1@example.com',
        role: 'CUSTOMER',
        fullName: 'Customer One'
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: customerOneId,
        email: 'customer1@example.com',
        role: 'CUSTOMER',
        isActive: true
      });

      // Target ID belongs to customerTwo
      const response = await request(app)
        .get(`/api/v1/users/customers/${customerTwoId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('OWNERSHIP_CHECK_FAILED');
    });
  });

  describe('Password Reset Lifecycle', () => {
    it('should reject reused or expired password reset tokens', async () => {
      vi.spyOn(prisma.passwordResetToken, 'findUnique').mockResolvedValue({
        id: 'token-uuid',
        userId: 'user-uuid',
        usedAt: new Date(Date.now() - 10000), // Already used
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'user-uuid', isActive: true }
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'previously-used-token',
          password: 'NewStrongPassword@2026!'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_RESET_TOKEN');
    });
  });
});
