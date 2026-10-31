/**
 * Brightloop Software - Plans API Service
 * 
 * Maps directly to backend:
 * - GET    /plans
 * - POST   /plans
 * - GET    /plans/{id}
 * - PATCH  /plans/{id}
 */

import apiClient from '../apiClient.js';

export const plansApi = {
  /**
   * List Plans
   * Query: is_active (bool), offset (int), limit (int)
   * Returns PlanResponse[] with lines included
   */
  async listPlans(params = {}) {
    const query = {};
    if (params.is_active !== undefined && params.is_active !== null && params.is_active !== 'ALL') {
      query.is_active = Boolean(params.is_active === true || params.is_active === 'true');
    }
    if (params.offset !== undefined) query.offset = params.offset;
    if (params.limit !== undefined) query.limit = params.limit;

    return apiClient.get('/plans', query);
  },

  /**
   * Get Single Plan with Lines
   */
  async getPlan(planId) {
    return apiClient.get(`/plans/${planId}`);
  },

  /**
   * Create Plan (Admin Only)
   */
  async createPlan(data) {
    const lines = Array.isArray(data.lines)
      ? data.lines.map((l) => ({
          product_id: Number(l.product_id ?? l.productId),
          quantity: Math.max(1, Number(l.quantity) || 1),
          unit_price: String(l.unit_price ?? l.unitPrice ?? '0.00')
        }))
      : [];

    const payload = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      billing_interval: (data.billing_interval || data.billingInterval || 'monthly').toLowerCase(),
      billing_interval_count: Math.max(1, Number(data.billing_interval_count || data.billingIntervalCount) || 1),
      minimum_quantity: Math.max(1, Number(data.minimum_quantity || data.minimumQuantity) || 1),
      start_date: data.start_date || data.startDate || new Date().toISOString().split('T')[0],
      end_date: data.end_date || data.endDate || null,
      auto_close: Boolean(data.auto_close ?? data.autoClose),
      allow_early_close: Boolean(data.allow_early_close ?? data.allowEarlyClose),
      allow_pause: Boolean(data.allow_pause ?? data.allowPause),
      allow_renewal: Boolean(data.allow_renewal ?? data.allowRenewal),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : (data.isActive !== undefined ? Boolean(data.isActive) : true),
      lines
    };

    return apiClient.post('/plans', payload);
  },

  /**
   * Update Plan (Admin Only)
   * If 'lines' is passed in changes, it replaces all plan lines.
   * If 'lines' is undefined, existing lines are preserved untouched.
   */
  async updatePlan(planId, changes) {
    const payload = {};

    if (changes.name !== undefined) payload.name = changes.name.trim();
    if (changes.description !== undefined) {
      payload.description = changes.description ? changes.description.trim() : null;
    }
    if (changes.billing_interval !== undefined || changes.billingInterval !== undefined) {
      payload.billing_interval = (changes.billing_interval || changes.billingInterval).toLowerCase();
    }
    if (changes.billing_interval_count !== undefined || changes.billingIntervalCount !== undefined) {
      payload.billing_interval_count = Math.max(1, Number(changes.billing_interval_count ?? changes.billingIntervalCount) || 1);
    }
    if (changes.minimum_quantity !== undefined || changes.minimumQuantity !== undefined) {
      payload.minimum_quantity = Math.max(1, Number(changes.minimum_quantity ?? changes.minimumQuantity) || 1);
    }
    if (changes.start_date !== undefined || changes.startDate !== undefined) {
      payload.start_date = changes.start_date || changes.startDate;
    }
    if (changes.end_date !== undefined || changes.endDate !== undefined) {
      payload.end_date = changes.end_date || changes.endDate || null;
    }
    if (changes.auto_close !== undefined || changes.autoClose !== undefined) {
      payload.auto_close = Boolean(changes.auto_close ?? changes.autoClose);
    }
    if (changes.allow_early_close !== undefined || changes.allowEarlyClose !== undefined) {
      payload.allow_early_close = Boolean(changes.allow_early_close ?? changes.allowEarlyClose);
    }
    if (changes.allow_pause !== undefined || changes.allowPause !== undefined) {
      payload.allow_pause = Boolean(changes.allow_pause ?? changes.allowPause);
    }
    if (changes.allow_renewal !== undefined || changes.allowRenewal !== undefined) {
      payload.allow_renewal = Boolean(changes.allow_renewal ?? changes.allowRenewal);
    }
    if (changes.is_active !== undefined || changes.isActive !== undefined) {
      payload.is_active = Boolean(changes.is_active ?? changes.isActive);
    }

    // Only supply lines if explicitly provided (replaces lines collection)
    if (Array.isArray(changes.lines)) {
      payload.lines = changes.lines.map((l) => ({
        product_id: Number(l.product_id ?? l.productId),
        quantity: Math.max(1, Number(l.quantity) || 1),
        unit_price: String(l.unit_price ?? l.unitPrice ?? '0.00')
      }));
    }

    return apiClient.patch(`/plans/${planId}`, payload);
  }
};

export default plansApi;
