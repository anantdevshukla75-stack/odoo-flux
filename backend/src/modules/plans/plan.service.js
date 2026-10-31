import Decimal from 'decimal.js';
import prisma from '../../config/database.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';

export class PlanService {
  /**
   * Create a new subscription plan (ADMIN only)
   */
  static async createPlan(data, adminActor) {
    const priceDecimal = new Decimal(data.price);

    const plan = await prisma.$transaction(async (tx) => {
      const p = await tx.subscriptionPlan.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          price: priceDecimal.toString(),
          billingInterval: data.billingInterval || 'MONTHLY',
          billingIntervalCount: data.billingIntervalCount || 1,
          minimumQuantity: data.minimumQuantity || 1,
          availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
          availableUntil: data.availableUntil ? new Date(data.availableUntil) : null,
          autoCloseEnabled: data.autoCloseEnabled ?? false,
          allowEarlyClose: data.allowEarlyClose ?? true,
          allowPause: data.allowPause ?? true,
          allowRenewal: data.allowRenewal ?? true,
          isActive: data.isActive ?? true
        }
      });

      // Link taxes if specified
      if (data.taxIds && data.taxIds.length > 0) {
        await tx.planTax.createMany({
          data: data.taxIds.map(taxId => ({
            planId: p.id,
            taxId
          })),
          skipDuplicates: true
        });
      }

      await tx.systemAuditLog.create({
        data: {
          action: 'PLAN_CREATED',
          entity: 'SubscriptionPlan',
          entityId: p.id,
          actorId: adminActor.id,
          metadata: { name: p.name, price: p.price.toString(), billingInterval: p.billingInterval }
        }
      });

      return p;
    });

    logger.info({ planId: plan.id, adminId: adminActor.id }, 'Subscription plan created successfully');
    return this.getPlanById(plan.id, adminActor);
  }

  /**
   * List plans with pagination and filters
   */
  static async listPlans(query, currentUser = null) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const isCustomer = !currentUser || currentUser.role === 'CUSTOMER';
    const where = {};

    if (isCustomer) {
      const now = new Date();
      where.isActive = true;
      where.AND = [
        {
          OR: [
            { availableFrom: null },
            { availableFrom: { lte: now } }
          ]
        },
        {
          OR: [
            { availableUntil: null },
            { availableUntil: { gte: now } }
          ]
        }
      ];
    } else if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.billingInterval) {
      where.billingInterval = query.billingInterval;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const [total, plans] = await Promise.all([
      prisma.subscriptionPlan.count({ where }),
      prisma.subscriptionPlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          planTaxes: {
            include: { tax: true }
          }
        }
      })
    ]);

    const formatted = plans.map(p => ({
      ...p,
      taxes: p.planTaxes.map(pt => pt.tax),
      planTaxes: undefined
    }));

    return {
      plans: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get plan by ID
   */
  static async getPlanById(planId, currentUser = null) {
    const isCustomer = !currentUser || currentUser.role === 'CUSTOMER';

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        planTaxes: {
          include: { tax: true }
        }
      }
    });

    if (!plan) {
      throw AppError.notFound('Subscription plan not found.', null, 'PLAN_NOT_FOUND');
    }

    if (isCustomer && !plan.isActive) {
      throw AppError.notFound('Subscription plan is currently unavailable.', null, 'PLAN_INACTIVE');
    }

    return {
      ...plan,
      taxes: plan.planTaxes.map(pt => pt.tax),
      planTaxes: undefined
    };
  }

  /**
   * Update plan (ADMIN only)
   */
  static async updatePlan(planId, data, adminActor) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!existing) {
      throw AppError.notFound('Subscription plan not found.', null, 'PLAN_NOT_FOUND');
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.price !== undefined) updateData.price = new Decimal(data.price).toString();
    if (data.billingInterval) updateData.billingInterval = data.billingInterval;
    if (data.billingIntervalCount !== undefined) updateData.billingIntervalCount = data.billingIntervalCount;
    if (data.minimumQuantity !== undefined) updateData.minimumQuantity = data.minimumQuantity;
    if (data.availableFrom !== undefined) updateData.availableFrom = data.availableFrom ? new Date(data.availableFrom) : null;
    if (data.availableUntil !== undefined) updateData.availableUntil = data.availableUntil ? new Date(data.availableUntil) : null;
    if (data.autoCloseEnabled !== undefined) updateData.autoCloseEnabled = data.autoCloseEnabled;
    if (data.allowEarlyClose !== undefined) updateData.allowEarlyClose = data.allowEarlyClose;
    if (data.allowPause !== undefined) updateData.allowPause = data.allowPause;
    if (data.allowRenewal !== undefined) updateData.allowRenewal = data.allowRenewal;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.$transaction(async (tx) => {
      await tx.subscriptionPlan.update({
        where: { id: planId },
        data: updateData
      });

      if (data.taxIds !== undefined) {
        await tx.planTax.deleteMany({ where: { planId } });
        if (data.taxIds.length > 0) {
          await tx.planTax.createMany({
            data: data.taxIds.map(taxId => ({ planId, taxId })),
            skipDuplicates: true
          });
        }
      }

      await tx.systemAuditLog.create({
        data: {
          action: 'PLAN_UPDATED',
          entity: 'SubscriptionPlan',
          entityId: planId,
          actorId: adminActor.id,
          metadata: { updatedFields: Object.keys(data) }
        }
      });
    });

    return this.getPlanById(planId, adminActor);
  }

  /**
   * Soft-delete / Deactivate plan (ADMIN only)
   */
  static async deletePlan(planId, adminActor) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!existing) {
      throw AppError.notFound('Subscription plan not found.', null, 'PLAN_NOT_FOUND');
    }

    const deactivated = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: false }
    });

    await prisma.systemAuditLog.create({
      data: {
        action: 'PLAN_ARCHIVED',
        entity: 'SubscriptionPlan',
        entityId: planId,
        actorId: adminActor.id
      }
    });

    return deactivated;
  }
}

export default PlanService;
