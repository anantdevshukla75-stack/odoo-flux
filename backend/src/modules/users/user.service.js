import prisma from '../../config/database.js';
import { hashPassword, generateRandomToken } from '../../utils/crypto.js';
import AppError from '../../utils/appError.js';
import EmailService from '../../services/email.service.js';
import logger from '../../utils/logger.js';
import { assertCustomerOwnership } from '../../utils/ownership.js';

export class UserService {
  /**
   * Create a STAFF account (Only ADMIN can perform this action)
   */
  static async createStaff(data, adminActor) {
    const normalizedEmail = data.email.toLowerCase().trim();

    // 1. Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      throw AppError.conflict('An account with this email address already exists.', null, 'EMAIL_EXISTS');
    }

    // 2. Determine initial password (use supplied or generate strong temporary password)
    const rawPassword = data.password || `BrightStaff@${generateRandomToken(4)}!`;
    const passwordHash = await hashPassword(rawPassword);

    // 3. Create STAFF user in database
    const staffUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'STAFF', // Strictly STAFF, never ADMIN
          isActive: true,
          emailVerified: true
        }
      });

      // Record administrative audit trail with admin actor
      await tx.systemAuditLog.create({
        data: {
          action: 'STAFF_CREATED',
          entity: 'User',
          entityId: user.id,
          actorId: adminActor.id,
          metadata: {
            staffEmail: user.email,
            createdByAdmin: adminActor.email
          }
        }
      });

      return user;
    });

    // 4. Send invitation/welcome email with temporary password
    await EmailService.sendStaffWelcomeEmail(staffUser.email, rawPassword, staffUser.fullName);

    logger.info({ staffId: staffUser.id, adminId: adminActor.id }, 'Staff member account created by admin');

    const { passwordHash: _, ...safeStaff } = staffUser;
    return {
      user: safeStaff,
      temporaryPasswordNote: data.password ? undefined : 'A temporary password was generated and sent via email.'
    };
  }

  /**
   * List users with pagination and filtering
   */
  static async listUsers(query, currentUser) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {};

    // If STAFF is requesting, restrict query to CUSTOMERs only
    if (currentUser.role === 'STAFF') {
      where.role = 'CUSTOMER';
    } else if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          customerProfile: {
            select: {
              companyName: true,
              phone: true
            }
          }
        }
      })
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single user by ID
   */
  static async getUserById(userId, currentUser) {
    // Assert access ownership or administrative role
    assertCustomerOwnership(currentUser, userId, 'user profile');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        customerProfile: true
      }
    });

    if (!user) {
      throw AppError.notFound('User not found.', null, 'USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Update user details
   */
  static async updateUser(userId, data, currentUser) {
    assertCustomerOwnership(currentUser, userId, 'user profile');

    const updateData = {};
    if (data.fullName) updateData.fullName = data.fullName.trim();

    // Only ADMIN can change active status here
    if (data.isActive !== undefined && currentUser.role === 'ADMIN') {
      if (currentUser.id === userId && data.isActive === false) {
        throw AppError.badRequest('Administrators cannot deactivate their own account.', null, 'CANNOT_SELF_DEACTIVATE');
      }
      updateData.isActive = data.isActive;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return updated;
  }

  /**
   * Activate or Deactivate user (ADMIN only)
   */
  static async setUserStatus(userId, isActive, adminActor) {
    if (adminActor.id === userId) {
      throw AppError.badRequest('Administrators cannot deactivate their own account.', null, 'CANNOT_SELF_DEACTIVATE');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw AppError.notFound('User not found.', null, 'USER_NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      // If deactivated, revoke all active refresh tokens immediately
      if (!isActive) {
        await tx.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() }
        });
      }

      await tx.systemAuditLog.create({
        data: {
          action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entity: 'User',
          entityId: userId,
          actorId: adminActor.id,
          metadata: { targetEmail: user.email, newStatus: isActive }
        }
      });

      return u;
    });

    return updated;
  }

  /**
   * List customers specifically
   */
  static async listCustomers(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { role: 'CUSTOMER' };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { customerProfile: { companyName: { contains: query.search, mode: 'insensitive' } } }
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          createdAt: true,
          customerProfile: true
        }
      })
    ]);

    return {
      customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get customer profile
   */
  static async getCustomerProfile(targetUserId, currentUser) {
    assertCustomerOwnership(currentUser, targetUserId, 'customer profile');

    const customer = await prisma.user.findFirst({
      where: { id: targetUserId, role: 'CUSTOMER' },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        customerProfile: true
      }
    });

    if (!customer) {
      throw AppError.notFound('Customer profile not found.', null, 'CUSTOMER_NOT_FOUND');
    }

    return customer;
  }

  /**
   * Update customer profile
   */
  static async updateCustomerProfile(targetUserId, profileData, currentUser) {
    assertCustomerOwnership(currentUser, targetUserId, 'customer profile');

    const existingProfile = await prisma.customerProfile.findUnique({
      where: { userId: targetUserId }
    });

    let updatedProfile;
    if (existingProfile) {
      updatedProfile = await prisma.customerProfile.update({
        where: { userId: targetUserId },
        data: profileData
      });
    } else {
      updatedProfile = await prisma.customerProfile.create({
        data: {
          userId: targetUserId,
          ...profileData
        }
      });
    }

    return updatedProfile;
  }
}

export default UserService;
