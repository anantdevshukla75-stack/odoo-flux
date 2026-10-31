import Decimal from 'decimal.js';
import prisma from '../../config/database.js';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';

export class ProductService {
  /**
   * Create a new product (ADMIN only)
   */
  static async createProduct(data, adminActor) {
    const salePriceDecimal = new Decimal(data.salePrice);
    const costPriceDecimal = new Decimal(data.costPrice || 0);

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          productType: data.productType,
          salePrice: salePriceDecimal.toString(),
          costPrice: costPriceDecimal.toString(),
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });

      // Link taxes if provided
      if (data.taxIds && data.taxIds.length > 0) {
        await tx.productTax.createMany({
          data: data.taxIds.map(taxId => ({
            productId: p.id,
            taxId
          })),
          skipDuplicates: true
        });
      }

      await tx.systemAuditLog.create({
        data: {
          action: 'PRODUCT_CREATED',
          entity: 'Product',
          entityId: p.id,
          actorId: adminActor.id,
          metadata: { name: p.name, salePrice: p.salePrice.toString() }
        }
      });

      return p;
    });

    logger.info({ productId: product.id, adminId: adminActor.id }, 'Product created successfully');
    return this.getProductById(product.id, adminActor);
  }

  /**
   * List products with pagination and filters
   */
  static async listProducts(query, currentUser) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {};

    // Customers can only view active products
    if (!currentUser || currentUser.role === 'CUSTOMER') {
      where.isActive = true;
    } else if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.productType) {
      where.productType = query.productType;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          variants: {
            where: (!currentUser || currentUser.role === 'CUSTOMER') ? { isActive: true } : undefined
          },
          productTaxes: {
            include: { tax: true }
          }
        }
      })
    ]);

    // Format tax relations for cleaner API responses
    const formatted = products.map(p => ({
      ...p,
      taxes: p.productTaxes.map(pt => pt.tax),
      productTaxes: undefined
    }));

    return {
      products: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId, currentUser = null) {
    const isCustomer = !currentUser || currentUser.role === 'CUSTOMER';

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          where: isCustomer ? { isActive: true } : undefined
        },
        productTaxes: {
          include: { tax: true }
        }
      }
    });

    if (!product) {
      throw AppError.notFound('Product not found.', null, 'PRODUCT_NOT_FOUND');
    }

    if (isCustomer && !product.isActive) {
      throw AppError.notFound('Product is currently not available.', null, 'PRODUCT_INACTIVE');
    }

    return {
      ...product,
      taxes: product.productTaxes.map(pt => pt.tax),
      productTaxes: undefined
    };
  }

  /**
   * Update product (ADMIN only)
   */
  static async updateProduct(productId, data, adminActor) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      throw AppError.notFound('Product not found.', null, 'PRODUCT_NOT_FOUND');
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.productType) updateData.productType = data.productType;
    if (data.salePrice !== undefined) updateData.salePrice = new Decimal(data.salePrice).toString();
    if (data.costPrice !== undefined) updateData.costPrice = new Decimal(data.costPrice).toString();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: updateData
      });

      // Update tax relations if taxIds array is supplied
      if (data.taxIds !== undefined) {
        await tx.productTax.deleteMany({ where: { productId } });
        if (data.taxIds.length > 0) {
          await tx.productTax.createMany({
            data: data.taxIds.map(taxId => ({ productId, taxId })),
            skipDuplicates: true
          });
        }
      }

      await tx.systemAuditLog.create({
        data: {
          action: 'PRODUCT_UPDATED',
          entity: 'Product',
          entityId: productId,
          actorId: adminActor.id,
          metadata: { updatedFields: Object.keys(data) }
        }
      });
    });

    return this.getProductById(productId, adminActor);
  }

  /**
   * Soft-delete / Deactivate product (ADMIN only)
   */
  static async deleteProduct(productId, adminActor) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      throw AppError.notFound('Product not found.', null, 'PRODUCT_NOT_FOUND');
    }

    // Always soft-deactivate to protect historical references
    const deactivated = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    });

    await prisma.systemAuditLog.create({
      data: {
        action: 'PRODUCT_ARCHIVED',
        entity: 'Product',
        entityId: productId,
        actorId: adminActor.id
      }
    });

    return deactivated;
  }

  // -------------------------------------------------------------
  // VARIANT METHODS
  // -------------------------------------------------------------

  /**
   * Create a variant for product (ADMIN only)
   */
  static async createVariant(productId, data, adminActor) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw AppError.notFound(`Product with ID ${productId} not found.`, null, 'PRODUCT_NOT_FOUND');
    }

    const priceAdjDecimal = new Decimal(data.priceAdjustment || 0);

    // Ensure basePrice + variantAdjustment >= 0
    const finalPrice = new Decimal(product.salePrice.toString()).plus(priceAdjDecimal);
    if (finalPrice.isNegative()) {
      throw AppError.badRequest('Variant price adjustment results in a negative final price.', null, 'INVALID_PRICE_ADJUSTMENT');
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        priceAdjustment: priceAdjDecimal.toString(),
        sku: data.sku?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });

    await prisma.systemAuditLog.create({
      data: {
        action: 'PRODUCT_VARIANT_CREATED',
        entity: 'ProductVariant',
        entityId: variant.id,
        actorId: adminActor.id,
        metadata: { productId, variantName: variant.name, priceAdjustment: variant.priceAdjustment.toString() }
      }
    });

    return variant;
  }

  /**
   * List variants for product
   */
  static async listVariants(productId, currentUser = null) {
    const isCustomer = !currentUser || currentUser.role === 'CUSTOMER';

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw AppError.notFound('Product not found.', null, 'PRODUCT_NOT_FOUND');
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
        ...(isCustomer ? { isActive: true } : {})
      },
      orderBy: { createdAt: 'asc' }
    });

    return variants;
  }

  /**
   * Update variant (ADMIN only)
   */
  static async updateVariant(variantId, data, adminActor) {
    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });

    if (!existing) {
      throw AppError.notFound('Product variant not found.', null, 'VARIANT_NOT_FOUND');
    }

    const updateData = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.sku !== undefined) updateData.sku = data.sku?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.priceAdjustment !== undefined) {
      const newAdj = new Decimal(data.priceAdjustment);
      const finalPrice = new Decimal(existing.product.salePrice.toString()).plus(newAdj);
      if (finalPrice.isNegative()) {
        throw AppError.badRequest('Variant price adjustment results in a negative final price.', null, 'INVALID_PRICE_ADJUSTMENT');
      }
      updateData.priceAdjustment = newAdj.toString();
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData
    });

    return updated;
  }

  /**
   * Soft-delete / Deactivate variant (ADMIN only)
   */
  static async deleteVariant(variantId, adminActor) {
    const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) {
      throw AppError.notFound('Product variant not found.', null, 'VARIANT_NOT_FOUND');
    }

    const deactivated = await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false }
    });

    return deactivated;
  }
}

export default ProductService;
