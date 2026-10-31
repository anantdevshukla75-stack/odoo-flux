import { describe, it, expect } from 'vitest';
import { passwordSchema, registerSchema, loginSchema } from '../../src/modules/auth/auth.validator.js';

describe('Auth Validation Schemas Unit Tests', () => {
  describe('Password Complexity Validation', () => {
    it('should reject password of 8 characters or fewer', () => {
      const result = passwordSchema.safeParse('Short1!');
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toContain('more than 8 characters');
    });

    it('should reject password missing uppercase letters', () => {
      const result = passwordSchema.safeParse('alllowercase1@');
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toContain('uppercase letter');
    });

    it('should reject password missing lowercase letters', () => {
      const result = passwordSchema.safeParse('ALLUPPERCASE1@');
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toContain('lowercase letter');
    });

    it('should reject password missing special characters', () => {
      const result = passwordSchema.safeParse('NoSpecialChar123');
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toContain('special character');
    });

    it('should accept valid compliant password', () => {
      const result = passwordSchema.safeParse('ValidSecret@2026!');
      expect(result.success).toBe(true);
      expect(result.data).toBe('ValidSecret@2026!');
    });
  });

  describe('Customer Registration Schema', () => {
    it('should validate complete valid customer registration data', () => {
      const validPayload = {
        fullName: 'Jane Doe',
        email: 'JANE.DOE@example.com',
        password: 'StrongPassword#1',
        companyName: 'Acme SaaS Corp',
        phone: '+1 555 123 4567'
      };

      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('jane.doe@example.com'); // Lowercase normalization
    });

    it('should reject invalid email format', () => {
      const invalidPayload = {
        fullName: 'Jane Doe',
        email: 'invalid-email-format',
        password: 'StrongPassword#1'
      };

      const result = registerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      expect(result.error.errors[0].path).toContain('email');
    });
  });

  describe('Login Schema', () => {
    it('should require email and password', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
