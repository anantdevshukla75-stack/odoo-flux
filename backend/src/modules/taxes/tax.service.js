import Decimal from 'decimal.js';
import prisma from '../../config/database.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';

export class TaxAdminService {
  /**
   * Create a new tax rule (ADMIN only)
   */
  static async createTax(data, adminActor) {
    const rateDecimal = new Decimal(data.rate);

    const tax = await prisma.$transaction(async (tx) => {
      const t = await tx.tax.create({
        data: {
          name: data.name.trim(),
          rate: rateDecimal.toString(),
          taxType: data.taxType || 'GST',
          calculationMethod: data.calculationMethod || 'EXCLUSIVE',
          applicableTo: data.applicableTo || 'ALL',
          effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
          effectiveUntil: data.effectiveUntil ? new Date(data.effectiveUntil) : null,
          isActive: data.isActive ?? true
        }
      });

      await tx.systemAuditLog.create({
        data: {
          action: 'TAX_RULE_CREATED',
          entity: 'Tax',
          entityId: t.id,
          actorId: adminActor.id,
          metadata: { name: t.name, rate: t.rate.toString(), calculationMethod: t.calculationMethod }
        }
      });

      return t;
    });

    logger.info({ taxId: tax.id, adminId: adminActor.id }, 'Tax rule created successfully');
    return tax;
  }

  /**
   * List tax rules with pagination and filters
   */
  static async listTaxes(query, currentUser = null) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const isCustomer = !currentUser || currentUser.role === 'CUSTOMER';
    const where = {};

    if (isCustomer) {
      where.isActive = true;
    } else if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.taxType) where.taxType = query.taxType;
    if (query.calculationMethod) where.calculationMethod = query.calculationMethod;
    if (query.applicableTo) where.applicableTo = query.applicableTo;

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [total, taxes] = await Promise.all([
      prisma.tax.count({ where }),
      prisma.tax.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      taxes,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single tax rule by ID
   */
  static async getTaxById(taxId) {
    const tax = await prisma.tax.findUnique({
      where: { id: taxId }
    });

    if (!tax) {
      throw AppError.notFound('Tax rule not found.', null, 'TAX_NOT_FOUND');
    }

    return tax;
  }

  /**
   * Update tax rule (ADMIN only)
   */
  static async updateTax(taxId, data, adminActor) {
    const existing = await prisma.tax.findUnique({ where: { id: taxId } });
    if (!existing) {
      throw AppError.notFound('Tax rule not found.', null, 'TAX_NOT_FOUND');
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.rate !== undefined) updateData.rate = new Decimal(data.rate).toString();
    if (data.taxType) updateData.taxType = data.taxType;
    if (data.calculationMethod) updateData.calculationMethod = data.calculationMethod;
    if (data.applicableTo) updateData.applicableTo = data.applicableTo;
    if (data.effectiveFrom !== undefined) updateData.effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : null;
    if (data.effectiveUntil !== undefined) updateData.effectiveUntil = data.effectiveUntil ? new Date(data.effectiveUntil) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.tax.update({
        where: { id: taxId },
        data: updateData
      });

      await tx.systemAuditLog.create({
        data: {
          action: 'TAX_RULE_UPDATED',
          entity: 'Tax',
          entityId: taxId,
          actorId: adminActor.id,
          metadata: { updatedFields: Object.keys(data) }
        }
      });

      return t;
    });

    return updated;
  }

  /**
   * Soft-delete / Deactivate tax rule (ADMIN only)
   */
  static async deleteTax(taxId, adminActor) {
    const existing = await prisma.tax.findUnique({ where: { id: taxId } });
    if (!existing) {
      throw AppError.notFound('Tax rule not found.', null, 'TAX_NOT_FOUND');
    }

    const deactivated = await prisma.tax.update({
      where: { id: taxId },
      data: { isActive: false }
    });

    await prisma.systemAuditLog.create({
      data: {
        action: 'TAX_RULE_ARCHIVED',
        entity: 'Tax',
        entityId: taxId,
        actorId: adminActor.id
      }
    });

    return deactivated;
  }
}

export default TaxAdminService;
