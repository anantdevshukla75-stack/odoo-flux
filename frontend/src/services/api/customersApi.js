/**
 * Brightloop Software - Customers API Service
 * 
 * Maps directly to backend:
 * - GET    /customers
 * - GET    /customers/me
 * - GET    /customers/{id}
 * - PATCH  /customers/{id}
 * 
 * Note: Customer profiles are created upon registration. There is no POST /customers endpoint.
 */

import apiClient from '../apiClient.js';

export const customersApi = {
  /**
   * List Customers (Admin & Staff Only)
   * Query: offset (int), limit (int)
   */
  async listCustomers(params = {}) {
    const query = {};
    if (params.offset !== undefined) query.offset = params.offset;
    if (params.limit !== undefined) query.limit = params.limit;

    return apiClient.get('/customers', query);
  },

  /**
   * Get Current Authenticated Customer Profile (Customer Role Only)
   * Note: Admin and Staff accounts do not have customer rows and receive 404.
   */
  async getMyCustomer() {
    return apiClient.get('/customers/me');
  },

  /**
   * Get Customer Details by ID (Owner, Staff, or Admin)
   */
  async getCustomer(customerId) {
    return apiClient.get(`/customers/${customerId}`);
  },

  /**
   * Update Customer Profile (Owner, Staff, or Admin)
   * Editable fields: company_name, phone, billing_address, tax_number.
   * Note: email and full_name are read-only on the User model.
   */
  async updateCustomer(customerId, changes) {
    const payload = {};

    if (changes.company_name !== undefined || changes.companyName !== undefined) {
      const val = changes.company_name ?? changes.companyName;
      payload.company_name = val ? String(val).trim() : null;
    }
    if (changes.phone !== undefined) {
      payload.phone = changes.phone ? String(changes.phone).trim() : null;
    }
    if (changes.billing_address !== undefined || changes.billingAddress !== undefined) {
      const val = changes.billing_address ?? changes.billingAddress;
      payload.billing_address = val ? String(val).trim() : null;
    }
    if (changes.tax_number !== undefined || changes.taxNumber !== undefined || changes.taxId !== undefined) {
      const val = changes.tax_number ?? changes.taxNumber ?? changes.taxId;
      payload.tax_number = val ? String(val).trim() : null;
    }

    return apiClient.patch(`/customers/${customerId}`, payload);
  }
};

export default customersApi;
