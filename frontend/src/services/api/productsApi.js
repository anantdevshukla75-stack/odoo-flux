/**
 * Brightloop Software - Products API Service
 * 
 * Maps directly to backend:
 * - GET    /products
 * - POST   /products
 * - GET    /products/{id}
 * - PATCH  /products/{id}
 */

import apiClient from '../apiClient.js';

export const productsApi = {
  /**
   * List Products
   * Query: is_active (bool), offset (int), limit (int)
   */
  async listProducts(params = {}) {
    const query = {};
    if (params.is_active !== undefined && params.is_active !== null && params.is_active !== 'ALL') {
      query.is_active = Boolean(params.is_active === true || params.is_active === 'true');
    }
    if (params.offset !== undefined) query.offset = params.offset;
    if (params.limit !== undefined) query.limit = params.limit;

    return apiClient.get('/products', query);
  },

  /**
   * Get Single Product
   */
  async getProduct(productId) {
    return apiClient.get(`/products/${productId}`);
  },

  /**
   * Create Product (Admin Only)
   * Fields: name, product_type, sales_price, cost_price, notes, is_active
   */
  async createProduct(data) {
    const payload = {
      name: data.name.trim(),
      product_type: (data.product_type || data.productType || 'service').toLowerCase(),
      sales_price: String(data.sales_price ?? data.salesPrice ?? '0.00'),
      cost_price: String(data.cost_price ?? data.costPrice ?? '0.00'),
      notes: data.notes?.trim() || null,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : (data.isActive !== undefined ? Boolean(data.isActive) : true)
    };
    return apiClient.post('/products', payload);
  },

  /**
   * Update Product (Admin Only)
   * Send only modified supported fields.
   * Note: 'notes' can be null; other fields must not be null.
   */
  async updateProduct(productId, changes) {
    const payload = {};
    if (changes.name !== undefined) payload.name = changes.name.trim();
    if (changes.product_type !== undefined || changes.productType !== undefined) {
      payload.product_type = (changes.product_type || changes.productType).toLowerCase();
    }
    if (changes.sales_price !== undefined || changes.salesPrice !== undefined) {
      payload.sales_price = String(changes.sales_price ?? changes.salesPrice);
    }
    if (changes.cost_price !== undefined || changes.costPrice !== undefined) {
      payload.cost_price = String(changes.cost_price ?? changes.costPrice);
    }
    if (changes.notes !== undefined) {
      payload.notes = changes.notes ? changes.notes.trim() : null;
    }
    if (changes.is_active !== undefined || changes.isActive !== undefined) {
      payload.is_active = Boolean(changes.is_active ?? changes.isActive);
    }

    return apiClient.patch(`/products/${productId}`, payload);
  },

  /**
   * Deactivate Product via PATCH is_active: false
   */
  async deactivateProduct(productId) {
    return apiClient.patch(`/products/${productId}`, { is_active: false });
  },

  /**
   * Activate Product via PATCH is_active: true
   */
  async activateProduct(productId) {
    return apiClient.patch(`/products/${productId}`, { is_active: true });
  }
};

export default productsApi;
