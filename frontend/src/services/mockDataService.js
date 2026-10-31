/**
 * Brightloop Software - Demonstration Data Service
 * 
 * Provides an in-memory & localStorage persistent state machine for
 * customers, products, plans, quotations, subscriptions, invoices, and payments.
 * Easily swappable for real backend API calls later.
 */

import {
  DEMO_CUSTOMERS,
  DEMO_PRODUCTS,
  DEMO_PLANS,
  DEMO_TAXES,
  DEMO_DISCOUNTS,
  DEMO_QUOTATIONS,
  DEMO_SUBSCRIPTIONS,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
  DEMO_STAFF,
  DEMO_METRICS
} from '../data/demoData.js';

class MockDataService {
  constructor() {
    this._initStorage();
  }

  _initStorage() {
    if (!localStorage.getItem('bl_customers')) {
      localStorage.setItem('bl_customers', JSON.stringify(DEMO_CUSTOMERS));
    }
    if (!localStorage.getItem('bl_products')) {
      localStorage.setItem('bl_products', JSON.stringify(DEMO_PRODUCTS));
    }
    if (!localStorage.getItem('bl_plans')) {
      localStorage.setItem('bl_plans', JSON.stringify(DEMO_PLANS));
    }
    if (!localStorage.getItem('bl_taxes')) {
      localStorage.setItem('bl_taxes', JSON.stringify(DEMO_TAXES));
    }
    if (!localStorage.getItem('bl_discounts')) {
      localStorage.setItem('bl_discounts', JSON.stringify(DEMO_DISCOUNTS));
    }
    if (!localStorage.getItem('bl_quotations')) {
      localStorage.setItem('bl_quotations', JSON.stringify(DEMO_QUOTATIONS));
    }
    if (!localStorage.getItem('bl_subscriptions')) {
      localStorage.setItem('bl_subscriptions', JSON.stringify(DEMO_SUBSCRIPTIONS));
    }
    if (!localStorage.getItem('bl_invoices')) {
      localStorage.setItem('bl_invoices', JSON.stringify(DEMO_INVOICES));
    }
    if (!localStorage.getItem('bl_payments')) {
      localStorage.setItem('bl_payments', JSON.stringify(DEMO_PAYMENTS));
    }
    if (!localStorage.getItem('bl_staff')) {
      localStorage.setItem('bl_staff', JSON.stringify(DEMO_STAFF));
    }
  }

  _get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- Customers ---
  async getCustomers() {
    return this._get('bl_customers');
  }

  async getCustomerById(id) {
    const list = this._get('bl_customers');
    return list.find(c => c.id === id || c.userId === id) || null;
  }

  async createCustomer(customerData) {
    const list = this._get('bl_customers');
    const newCustomer = {
      id: `cust-${Date.now().toString().slice(-4)}`,
      status: 'ACTIVE',
      activeSubscriptions: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      ...customerData
    };
    list.unshift(newCustomer);
    this._set('bl_customers', list);
    return newCustomer;
  }

  // --- Products ---
  async getProducts() {
    return this._get('bl_products');
  }

  async createProduct(productData) {
    const list = this._get('bl_products');
    const newProduct = {
      id: `prod-${Date.now().toString().slice(-4)}`,
      isActive: true,
      variants: [],
      ...productData
    };
    list.unshift(newProduct);
    this._set('bl_products', list);
    return newProduct;
  }

  // --- Plans ---
  async getPlans() {
    return this._get('bl_plans');
  }

  async createPlan(planData) {
    const list = this._get('bl_plans');
    const newPlan = {
      id: `plan-${Date.now().toString().slice(-4)}`,
      isActive: true,
      autoClose: false,
      allowPause: true,
      allowRenewal: true,
      products: [],
      ...planData
    };
    list.unshift(newPlan);
    this._set('bl_plans', list);
    return newPlan;
  }

  // --- Quotations ---
  async getQuotations(filter = {}) {
    let list = this._get('bl_quotations');
    if (filter.customerId) {
      list = list.filter(q => q.customerId === filter.customerId);
    }
    return list;
  }

  async createQuotation(data) {
    const list = this._get('bl_quotations');
    const newQuot = {
      id: `quot-${Date.now().toString().slice(-4)}`,
      quotationNumber: `QT-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      ...data
    };
    list.unshift(newQuot);
    this._set('bl_quotations', list);
    return newQuot;
  }

  async updateQuotationStatus(id, newStatus) {
    const list = this._get('bl_quotations');
    const index = list.findIndex(q => q.id === id);
    if (index !== -1) {
      list[index].status = newStatus;
      this._set('bl_quotations', list);

      // If accepted, generate a subscription automatically!
      if (newStatus === 'ACCEPTED') {
        await this.createSubscriptionFromQuotation(list[index]);
      }
      return list[index];
    }
    return null;
  }

  // --- Subscriptions ---
  async getSubscriptions(filter = {}) {
    let list = this._get('bl_subscriptions');
    if (filter.customerId) {
      list = list.filter(s => s.customerId === filter.customerId);
    }
    return list;
  }

  async createSubscriptionFromQuotation(quotation) {
    const list = this._get('bl_subscriptions');
    const newSub = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      subscriptionNumber: `SUB-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      planId: quotation.planId,
      planName: quotation.planName,
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recurringAmount: quotation.total,
      billingInterval: 'MONTHLY',
      autoRenew: true
    };
    list.unshift(newSub);
    this._set('bl_subscriptions', list);

    // Also generate an invoice!
    await this.createInvoice({
      subscriptionId: newSub.id,
      customerId: newSub.customerId,
      customerName: newSub.customerName,
      subtotal: quotation.subtotal,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.total,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    return newSub;
  }

  async updateSubscriptionStatus(id, status) {
    const list = this._get('bl_subscriptions');
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list[index].status = status;
      this._set('bl_subscriptions', list);
      return list[index];
    }
    return null;
  }

  // --- Invoices ---
  async getInvoices(filter = {}) {
    let list = this._get('bl_invoices');
    if (filter.customerId) {
      list = list.filter(i => i.customerId === filter.customerId);
    }
    if (filter.status) {
      list = list.filter(i => i.status === filter.status);
    }
    return list;
  }

  async createInvoice(invoiceData) {
    const list = this._get('bl_invoices');
    const newInvoice = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'OPEN',
      paidAmount: 0.00,
      balance: invoiceData.totalAmount,
      issueDate: new Date().toISOString().split('T')[0],
      paidAt: null,
      ...invoiceData
    };
    list.unshift(newInvoice);
    this._set('bl_invoices', list);
    return newInvoice;
  }

  // --- Payments ---
  async getPayments(filter = {}) {
    let list = this._get('bl_payments');
    if (filter.customerId) {
      list = list.filter(p => p.customerId === filter.customerId);
    }
    return list;
  }

  async recordPayment(paymentData) {
    const list = this._get('bl_payments');
    const newPayment = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      paymentNumber: `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentDate: new Date().toISOString(),
      status: 'COMPLETED',
      ...paymentData
    };
    list.unshift(newPayment);
    this._set('bl_payments', list);

    // Update invoice balance and status
    const invoices = this._get('bl_invoices');
    const invIndex = invoices.findIndex(i => i.id === paymentData.invoiceId || i.invoiceNumber === paymentData.invoiceNumber);
    if (invIndex !== -1) {
      const inv = invoices[invIndex];
      const newPaid = Number(inv.paidAmount || 0) + Number(paymentData.amount);
      const newBalance = Math.max(0, Number(inv.totalAmount) - newPaid);
      inv.paidAmount = newPaid;
      inv.balance = newBalance;
      if (newBalance <= 0) {
        inv.status = 'PAID';
        inv.paidAt = new Date().toISOString();
      }
      this._set('bl_invoices', invoices);
    }

    return newPayment;
  }

  // --- Taxes & Discounts ---
  async getTaxes() {
    return this._get('bl_taxes');
  }

  async createTax(data) {
    const list = this._get('bl_taxes');
    const newTax = {
      id: `tax-${Date.now().toString().slice(-4)}`,
      isActive: true,
      isDefault: false,
      ...data
    };
    list.unshift(newTax);
    this._set('bl_taxes', list);
    return newTax;
  }

  async getDiscounts() {
    return this._get('bl_discounts');
  }

  async createDiscount(data) {
    const list = this._get('bl_discounts');
    const newDiscount = {
      id: `disc-${Date.now().toString().slice(-4)}`,
      isActive: true,
      redemptionsCount: 0,
      ...data
    };
    list.unshift(newDiscount);
    this._set('bl_discounts', list);
    return newDiscount;
  }

  // --- Staff ---
  async getStaff() {
    return this._get('bl_staff');
  }

  async createStaff(data) {
    const list = this._get('bl_staff');
    const newStaff = {
      id: `usr-staff-${Date.now().toString().slice(-4)}`,
      role: 'STAFF',
      isActive: true,
      joinedDate: new Date().toISOString().split('T')[0],
      ...data
    };
    list.unshift(newStaff);
    this._set('bl_staff', list);
    return newStaff;
  }

  // --- Metrics ---
  async getMetrics() {
    return DEMO_METRICS;
  }
}

export const mockDataService = new MockDataService();
export default mockDataService;
