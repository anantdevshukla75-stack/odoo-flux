import prisma from '../../config/database.js';
import env from '../../config/environment.js';
import { hashPassword, verifyPassword, generateRandomToken, hashToken } from '../../utils/crypto.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import AppError from '../../utils/appError.js';
import EmailService from '../../services/email.service.js';
import logger from '../../utils/logger.js';

export class AuthService {
  /**
   * Register a new customer
   */
  static async registerCustomer(data) {
    const normalizedEmail = data.email.toLowerCase().trim();

    // 1. Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      throw AppError.conflict('An account with this email address already exists.', null, 'EMAIL_EXISTS');
    }

    // 2. Hash password with Argon2id
    const passwordHash = await hashPassword(data.password);

    // 3. Create User and CustomerProfile in a single atomic transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'CUSTOMER', // Strictly enforced server-side
          isActive: true,
          emailVerified: false,
          customerProfile: {
            create: {
              companyName: data.companyName?.trim() || null,
              phone: data.phone?.trim() || null,
              billingAddress: data.billingAddress || null,
              shippingAddress: data.shippingAddress || null,
              taxId: data.taxId?.trim() || null
            }
          }
        },
        include: {
          customerProfile: true
        }
      });

      // Audit log registration
      await tx.systemAuditLog.create({
        data: {
          action: 'USER_REGISTERED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id,
          metadata: { email: user.email, role: user.role }
        }
      });

      return user;
    });

    // 4. Issue JWT access and refresh tokens
    const tokens = await this._generateTokens(newUser);

    logger.info({ userId: newUser.id, email: newUser.email }, 'Customer registered successfully');

    return {
      user: this._sanitizeUser(newUser),
      tokens
    };
  }

  /**
   * Authenticate user with email and password
   */
  static async login(email, password) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { customerProfile: true }
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password.', null, 'INVALID_CREDENTIALS');
    }

    // 2. Verify password with Argon2
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password.', null, 'INVALID_CREDENTIALS');
    }

    // 3. Check active account status
    if (!user.isActive) {
      throw AppError.forbidden('Your account has been deactivated. Please contact support.', null, 'ACCOUNT_DEACTIVATED');
    }

    // 4. Generate tokens
    const tokens = await this._generateTokens(user);

    logger.info({ userId: user.id, role: user.role }, 'User logged in successfully');

    return {
      user: this._sanitizeUser(user),
      tokens
    };
  }

  /**
   * Revoke session on logout
   */
  static async logout(userId, refreshTokenRaw = null) {
    if (refreshTokenRaw) {
      const tokenHash = hashToken(refreshTokenRaw);
      await prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    } else {
      // Invalidate all active sessions for this user
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    return true;
  }

  /**
   * Rotate refresh token and issue new access token
   */
  static async refreshTokens(rawRefreshToken) {
    // 1. Verify token signature
    const decoded = verifyRefreshToken(rawRefreshToken);
    const tokenHash = hashToken(rawRefreshToken);

    // 2. Locate stored token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { customerProfile: true } } }
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token is invalid, expired, or has been revoked.', null, 'INVALID_REFRESH_TOKEN');
    }

    const { user } = storedToken;

    if (!user.isActive) {
      throw AppError.forbidden('Account is deactivated.', null, 'ACCOUNT_DEACTIVATED');
    }

    // 3. Revoke current token (Token Rotation policy)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    // 4. Generate new token pair
    const tokens = await this._generateTokens(user);

    return {
      user: this._sanitizeUser(user),
      tokens
    };
  }

  /**
   * Get authenticated user profile
   */
  static async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerProfile: true }
    });

    if (!user) {
      throw AppError.notFound('User not found.', null, 'USER_NOT_FOUND');
    }

    return this._sanitizeUser(user);
  }

  /**
   * Request password reset link
   */
  static async requestPasswordReset(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // If user exists and is active, create single-use token and send email
    if (user && user.isActive) {
      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

      // Invalidate existing unused tokens for this user first
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() }
      });

      // Save new hashed token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        }
      });

      // Send email asynchronously
      await EmailService.sendPasswordResetEmail(user.email, rawToken, user.fullName);
    }

    // Always return constant message to prevent account enumeration
    return {
      message: 'If that email address is registered, a password reset link has been sent.'
    };
  }

  /**
   * Complete password reset
   */
  static async resetPassword(rawToken, newPassword) {
    const tokenHash = hashToken(rawToken);

    // 1. Find token
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetTokenRecord || resetTokenRecord.usedAt !== null || resetTokenRecord.expiresAt < new Date()) {
      throw AppError.badRequest('Password reset token is invalid, expired, or has already been used.', null, 'INVALID_RESET_TOKEN');
    }

    const { user } = resetTokenRecord;

    if (!user.isActive) {
      throw AppError.forbidden('User account is deactivated.', null, 'ACCOUNT_DEACTIVATED');
    }

    // 2. Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // 3. Atomically update password, consume token, and revoke all sessions
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash }
      });

      // Mark this token as used
      await tx.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: new Date() }
      });

      // Invalidate all other pending reset tokens for this user
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          id: { not: resetTokenRecord.id },
          usedAt: null
        },
        data: { usedAt: new Date() }
      });

      // Revoke all refresh tokens (log out everywhere)
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      // Audit log
      await tx.systemAuditLog.create({
        data: {
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id
        }
      });
    });

    logger.info({ userId: user.id }, 'Password reset completed successfully');

    return {
      message: 'Password has been reset successfully. You may now log in with your new password.'
    };
  }

  // -------------------------------------------------------------
  // Internal Helpers
  // -------------------------------------------------------------
  static async _generateTokens(user) {
    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    const rawRefreshToken = generateRandomToken(40);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt
      }
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    };
  }

  static _sanitizeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

export default AuthService;
