import {
  DEMO_CUSTOMERS,
  DEMO_PRODUCTS,
  DEMO_PLANS,
  DEMO_QUOTATION_TEMPLATES,
  DEMO_TAXES,
  DEMO_DISCOUNTS,
  DEMO_QUOTATIONS,
  DEMO_SUBSCRIPTIONS,
  DEMO_INVOICES,
  DEMO_PAYMENTS,
  DEMO_STAFF,
  DEMO_METRICS
} from '../data/demoData.js';

/**
 * Calendar-aware next billing date calculation
 * Supports DAILY, WEEKLY, MONTHLY, YEARLY without hardcoded 30-day assumptions
 */
export function calculateNextBillingDate(startDate, interval = 'MONTHLY') {
  const d = new Date(startDate || Date.now());
  const normalized = String(interval).toUpperCase();

  switch (normalized) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'YEARLY':
    case 'ANNUAL':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'MONTHLY':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }

  return d.toISOString().split('T')[0];
}

/**
 * Evaluates whether an invoice is overdue based on due date, unpaid balance and status
 */
export function isInvoiceOverdue(invoice) {
  if (!invoice) return false;
  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') return false;
  const isPastDue = new Date(invoice.dueDate) < new Date();
  return Number(invoice.balance || 0) > 0 && isPastDue;
}

class MockDataService {
  constructor() {
    this._initializeStorage();
  }

  _initializeStorage() {
    if (!localStorage.getItem('bl_customers')) {
      localStorage.setItem('bl_customers', JSON.stringify(DEMO_CUSTOMERS));
    }
    if (!localStorage.getItem('bl_products')) {
      localStorage.setItem('bl_products', JSON.stringify(DEMO_PRODUCTS));
    }
    if (!localStorage.getItem('bl_plans')) {
      localStorage.setItem('bl_plans', JSON.stringify(DEMO_PLANS));
    }
    if (!localStorage.getItem('bl_quotation_templates')) {
      localStorage.setItem('bl_quotation_templates', JSON.stringify(DEMO_QUOTATION_TEMPLATES));
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
    } catch {
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

  async getCustomerDetails(id) {
    const customer = await this.getCustomerById(id);
    if (!customer) return null;

    const subscriptions = await this.getSubscriptions({ customerId: customer.id });
    const invoices = await this.getInvoices({ customerId: customer.id });
    const quotations = await this.getQuotations({ customerId: customer.id });
    const payments = await this.getPayments({ customerId: customer.id });

    const outstandingBalance = invoices.reduce((acc, inv) => acc + (Number(inv.balance) || 0), 0);
    const totalPayments = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    return {
      customer,
      subscriptions,
      invoices,
      quotations,
      payments,
      outstandingBalance,
      totalPayments
    };
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

  async updateCustomer(id, data) {
    const list = this._get('bl_customers');
    const index = list.findIndex(c => c.id === id || c.userId === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      this._set('bl_customers', list);
      return list[index];
    }
    return null;
  }

  // --- Products ---
  async getProducts() {
    return this._get('bl_products');
  }

  async getProductById(id) {
    const list = this._get('bl_products');
    return list.find(p => p.id === id) || null;
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

  async updateProduct(id, productData) {
    const list = this._get('bl_products');
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...productData };
      this._set('bl_products', list);
      return list[index];
    }
    return null;
  }

  async toggleProductStatus(id) {
    const list = this._get('bl_products');
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      list[index].isActive = !list[index].isActive;
      this._set('bl_products', list);
      return list[index];
    }
    return null;
  }

  // --- Product Variants ---
  async addProductVariant(productId, variantData) {
    const list = this._get('bl_products');
    const index = list.findIndex(p => p.id === productId);
    if (index !== -1) {
      const prod = list[index];
      const newVar = {
        id: `var-${Date.now().toString().slice(-4)}`,
        priceAdjustment: 0,
        ...variantData
      };
      prod.variants = prod.variants || [];
      prod.variants.push(newVar);
      this._set('bl_products', list);
      return newVar;
    }
    return null;
  }

  async removeProductVariant(productId, variantId) {
    const list = this._get('bl_products');
    const index = list.findIndex(p => p.id === productId);
    if (index !== -1) {
      list[index].variants = (list[index].variants || []).filter(v => v.id !== variantId);
      this._set('bl_products', list);
      return true;
    }
    return false;
  }

  // --- Plans ---
  async getPlans() {
    return this._get('bl_plans');
  }

  async getPlanById(id) {
    const list = this._get('bl_plans');
    return list.find(p => p.id === id) || null;
  }

  async createPlan(planData) {
    const list = this._get('bl_plans');
    const newPlan = {
      id: `plan-${Date.now().toString().slice(-4)}`,
      isActive: true,
      billingInterval: 'MONTHLY',
      billingIntervalCount: 1,
      products: [],
      ...planData
    };
    list.unshift(newPlan);
    this._set('bl_plans', list);
    return newPlan;
  }

  async updatePlan(id, planData) {
    const list = this._get('bl_plans');
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...planData };
      this._set('bl_plans', list);
      return list[index];
    }
    return null;
  }

  async togglePlanStatus(id) {
    const list = this._get('bl_plans');
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      list[index].isActive = !list[index].isActive;
      this._set('bl_plans', list);
      return list[index];
    }
    return null;
  }

  // --- Taxes ---
  async getTaxes() {
    return this._get('bl_taxes');
  }

  async getTaxById(id) {
    const list = this._get('bl_taxes');
    return list.find(t => t.id === id) || null;
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

  async updateTax(id, taxData) {
    const list = this._get('bl_taxes');
    const index = list.findIndex(t => t.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...taxData };
      this._set('bl_taxes', list);
      return list[index];
    }
    return null;
  }

  async toggleTaxStatus(id) {
    const list = this._get('bl_taxes');
    const index = list.findIndex(t => t.id === id);
    if (index !== -1) {
      list[index].isActive = !list[index].isActive;
      this._set('bl_taxes', list);
      return list[index];
    }
    return null;
  }

  // --- Quotation Templates ---
  async getQuotationTemplates() {
    return this._get('bl_quotation_templates');
  }

  async getQuotationTemplateById(id) {
    const list = this._get('bl_quotation_templates');
    return list.find(t => t.id === id) || null;
  }

  async createQuotationTemplate(data) {
    const list = this._get('bl_quotation_templates');
    const newTemplate = {
      id: `tmpl-${Date.now().toString().slice(-4)}`,
      productLines: [],
      ...data
    };
    list.unshift(newTemplate);
    this._set('bl_quotation_templates', list);
    return newTemplate;
  }

  async updateQuotationTemplate(id, data) {
    const list = this._get('bl_quotation_templates');
    const index = list.findIndex(t => t.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      this._set('bl_quotation_templates', list);
      return list[index];
    }
    return null;
  }

  // --- Quotations & Subscription Lifecycle ---
  async getQuotations(filter = {}) {
    let list = this._get('bl_quotations');
    if (filter.customerId) {
      list = list.filter(q => q.customerId === filter.customerId);
    }
    return list;
  }

  async getQuotationById(id) {
    const list = this._get('bl_quotations');
    return list.find(q => q.id === id || q.quotationNumber === id) || null;
  }

  async createQuotation(data) {
    const list = this._get('bl_quotations');
    const newQuot = {
      id: `quot-${Date.now().toString().slice(-4)}`,
      quotationNumber: `QT-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: data.status || 'DRAFT',
      createdAt: new Date().toISOString(),
      ...data
    };
    list.unshift(newQuot);
    this._set('bl_quotations', list);
    return newQuot;
  }

  /**
   * Defined Subscription & Quotation Lifecycle:
   * DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED
   * Note: Accepting a quotation moves it to CONFIRMED.
   * Does NOT auto-convert to ACTIVE and does NOT automatically generate an invoice.
   */
  async updateQuotationStatus(id, newStatus) {
    const list = this._get('bl_quotations');
    const index = list.findIndex(q => q.id === id);
    if (index !== -1) {
      const q = list[index];
      q.status = newStatus;
      this._set('bl_quotations', list);

      if (newStatus === 'ACCEPTED' || newStatus === 'CONFIRMED') {
        q.status = 'CONFIRMED';
        this._set('bl_quotations', list);
        await this.createSubscriptionFromQuotation(q);
      }
      return q;
    }
    return null;
  }

  // --- Subscriptions ---
  async getSubscriptions(filter = {}) {
    let list = this._get('bl_subscriptions');
    if (filter.customerId) {
      list = list.filter(s => s.customerId === filter.customerId);
    }
    if (filter.status) {
      list = list.filter(s => s.status === filter.status);
    }
    return list;
  }

  async getSubscriptionById(id) {
    const list = this._get('bl_subscriptions');
    return list.find(s => s.id === id || s.subscriptionNumber === id) || null;
  }

  async createSubscriptionFromQuotation(quotation) {
    const list = this._get('bl_subscriptions');
    const interval = quotation.planInterval || 'MONTHLY';
    const startDate = new Date().toISOString().split('T')[0];
    const nextBillingDate = calculateNextBillingDate(startDate, interval);

    // Initial status is CONFIRMED (awaiting explicit activation)
    const newSub = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      subscriptionNumber: `SUB-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      planId: quotation.planId,
      planName: quotation.planName,
      status: 'CONFIRMED',
      startDate,
      nextBillingDate,
      recurringAmount: quotation.total,
      billingInterval: interval,
      autoRenew: true
    };
    list.unshift(newSub);
    this._set('bl_subscriptions', list);

    return newSub;
  }

  /**
   * Lifecycle transitions:
   * CONFIRMED -> ACTIVE
   * ACTIVE <-> PAUSED
   * ACTIVE / PAUSED -> CLOSED
   */
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

  /**
   * Explicit billing simulation action:
   * Generates a CONFIRMED invoice for a subscription and advances the next billing date
   */
  async generateSubscriptionInvoice(subscriptionId) {
    const sub = await this.getSubscriptionById(subscriptionId);
    if (!sub) throw new Error('Subscription not found.');

    const subtotal = Number((sub.recurringAmount * 0.85).toFixed(2));
    const taxAmount = Number((sub.recurringAmount - subtotal).toFixed(2));

    const newInvoice = await this.createInvoice({
      subscriptionId: sub.id,
      customerId: sub.customerId,
      customerName: sub.customerName,
      subtotal,
      taxAmount,
      totalAmount: sub.recurringAmount,
      status: 'CONFIRMED',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingPeriod: `${sub.startDate} - ${sub.nextBillingDate}`,
      items: [
        {
          id: `item-${Date.now()}`,
          description: `${sub.planName} (${sub.billingInterval} Service Fee)`,
          quantity: 1,
          unitPrice: sub.recurringAmount,
          taxRate: 18,
          amount: sub.recurringAmount
        }
      ]
    });

    // Advance next billing date using calendar-aware calculation
    const subs = this._get('bl_subscriptions');
    const idx = subs.findIndex(s => s.id === sub.id);
    if (idx !== -1) {
      subs[idx].nextBillingDate = calculateNextBillingDate(subs[idx].nextBillingDate, subs[idx].billingInterval);
      this._set('bl_subscriptions', subs);
    }

    return newInvoice;
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

  async getInvoiceById(id) {
    const list = this._get('bl_invoices');
    return list.find(i => i.id === id || i.invoiceNumber === id) || null;
  }

  async createInvoice(invoiceData) {
    const list = this._get('bl_invoices');
    const newInvoice = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: invoiceData.status || 'CONFIRMED',
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

  async updateInvoiceStatus(id, newStatus) {
    const list = this._get('bl_invoices');
    const index = list.findIndex(i => i.id === id || i.invoiceNumber === id);
    if (index !== -1) {
      list[index].status = newStatus;
      // Do NOT erase outstanding balance on cancellation
      this._set('bl_invoices', list);
      return list[index];
    }
    return null;
  }

  async updateInvoice(id, invoiceData) {
    const list = this._get('bl_invoices');
    const index = list.findIndex(i => i.id === id || i.invoiceNumber === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...invoiceData };
      this._set('bl_invoices', list);
      return list[index];
    }
    return null;
  }

  // --- Payments ---
  async getPayments(filter = {}) {
    let list = this._get('bl_payments');
    if (filter.customerId) {
      list = list.filter(p => p.customerId === filter.customerId);
    }
    if (filter.invoiceId) {
      list = list.filter(p => p.invoiceId === filter.invoiceId);
    }
    return list;
  }

  async getPaymentById(id) {
    const list = this._get('bl_payments');
    return list.find(p => p.id === id || p.paymentNumber === id) || null;
  }

  async recordPayment(paymentData) {
    const invoices = this._get('bl_invoices');
    const invIndex = invoices.findIndex(
      i => i.id === paymentData.invoiceId || i.invoiceNumber === paymentData.invoiceNumber
    );

    // 1. Verify invoice exists
    if (invIndex === -1) {
      throw new Error(`Invoice "${paymentData.invoiceNumber || paymentData.invoiceId}" does not exist. Cannot record payment.`);
    }

    const inv = invoices[invIndex];

    // 2. Verify invoice can receive payment
    if (inv.status === 'CANCELLED') {
      throw new Error(`Invoice ${inv.invoiceNumber} is cancelled and cannot receive payments.`);
    }
    if (inv.status === 'PAID' || Number(inv.balance || 0) <= 0.001) {
      throw new Error(`Invoice ${inv.invoiceNumber} has already been settled in full.`);
    }

    const payAmount = Number(paymentData.amount) || 0;
    if (payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const currentBalance = Number(inv.balance || 0);

    // 3. Reject payments exceeding outstanding balance
    if (payAmount > currentBalance + 0.001) {
      throw new Error(
        `Overpayment Rejected: Entered payment of $${payAmount.toFixed(2)} exceeds current outstanding balance of $${currentBalance.toFixed(2)}.`
      );
    }

    // 4. Update invoice balance and status
    const newPaid = Number(inv.paidAmount || 0) + payAmount;
    const newBalance = Math.max(0, Number(inv.totalAmount) - newPaid);
    inv.paidAmount = Number(newPaid.toFixed(2));
    inv.balance = Number(newBalance.toFixed(2));

    if (newBalance <= 0.01) {
      inv.status = 'PAID';
      inv.paidAt = new Date().toISOString();
    } else {
      inv.status = 'PARTIALLY_PAID';
    }
    this._set('bl_invoices', invoices);

    // 5. Preserve payment record
    const list = this._get('bl_payments');
    const newPayment = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      paymentNumber: `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      status: 'COMPLETED',
      ...paymentData,
      amount: payAmount,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName
    };
    list.unshift(newPayment);
    this._set('bl_payments', list);

    return newPayment;
  }

  // --- Discounts ---
  async getDiscounts() {
    return this._get('bl_discounts');
  }

  async getDiscountById(id) {
    const list = this._get('bl_discounts');
    return list.find(d => d.id === id || d.code === id) || null;
  }

  async createDiscount(data) {
    const list = this._get('bl_discounts');
    const newDiscount = {
      id: `disc-${Date.now().toString().slice(-4)}`,
      isActive: true,
      redemptionsCount: 0,
      minPurchase: 0,
      minQuantity: 1,
      applicability: 'ALL',
      applicableProducts: [],
      applicableSubscriptions: [],
      ...data
    };
    list.unshift(newDiscount);
    this._set('bl_discounts', list);
    return newDiscount;
  }

  async updateDiscount(id, data) {
    const list = this._get('bl_discounts');
    const index = list.findIndex(d => d.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      this._set('bl_discounts', list);
      return list[index];
    }
    return null;
  }

  async toggleDiscountStatus(id) {
    const list = this._get('bl_discounts');
    const index = list.findIndex(d => d.id === id);
    if (index !== -1) {
      list[index].isActive = !list[index].isActive;
      this._set('bl_discounts', list);
      return list[index];
    }
    return null;
  }

  async deleteDiscount(id) {
    let list = this._get('bl_discounts');
    list = list.filter(d => d.id !== id);
    this._set('bl_discounts', list);
    return true;
  }

  checkDiscountEligibility(discount, { purchaseAmount = 0, quantity = 1, productId = null, planId = null } = {}) {
    if (!discount.isActive) {
      return { eligible: false, message: 'Discount is currently deactivated / inactive.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (discount.startDate && discount.startDate > todayStr) {
      return { eligible: false, message: `Not yet active. (Begins on ${discount.startDate})` };
    }

    if (discount.endDate && discount.endDate < todayStr) {
      return { eligible: false, message: `Expired. (Ended on ${discount.endDate})` };
    }

    if (discount.usageLimit && (discount.redemptionsCount || 0) >= discount.usageLimit) {
      return { eligible: false, message: `Usage limit exhausted. (Limit of ${discount.usageLimit} reached)` };
    }

    if (discount.minPurchase && purchaseAmount < discount.minPurchase) {
      return {
        eligible: false,
        message: `Minimum purchase not reached. Requires order total of at least $${discount.minPurchase.toFixed(2)}.`
      };
    }

    if (discount.minQuantity && quantity < discount.minQuantity) {
      return {
        eligible: false,
        message: `Minimum quantity of ${discount.minQuantity} items not reached.`
      };
    }

    if (discount.applicability === 'PRODUCT_SPECIFIC') {
      if (!productId || !(discount.applicableProducts || []).includes(productId)) {
        return { eligible: false, message: 'Product not eligible for this coupon.' };
      }
    }

    if (discount.applicability === 'SUBSCRIPTION_WIDE') {
      if (planId && (discount.applicableSubscriptions || []).length > 0 && !discount.applicableSubscriptions.includes(planId)) {
        return { eligible: false, message: 'Subscription plan not eligible for this concession.' };
      }
    }

    return { eligible: true, message: 'Coupon eligible! Concession successfully calculated.' };
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

  // --- Dynamic Dashboard Metrics ---
  async getMetrics() {
    const subscriptions = this._get('bl_subscriptions');
    const invoices = this._get('bl_invoices');
    const payments = this._get('bl_payments');

    const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');

    // Calendar & interval normalized MRR
    const mrr = activeSubs.reduce((sum, s) => {
      const amt = Number(s.recurringAmount) || 0;
      const interval = (s.billingInterval || 'MONTHLY').toUpperCase();
      if (interval === 'YEARLY' || interval === 'ANNUAL') return sum + (amt / 12);
      if (interval === 'WEEKLY') return sum + (amt * 4.33);
      if (interval === 'DAILY') return sum + (amt * 30);
      return sum + amt;
    }, 0);

    const arr = mrr * 12;

    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const overdueInvoices = invoices.filter(i => isInvoiceOverdue(i));
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (Number(i.balance) || 0), 0);

    // Plan distribution from subscriptions
    const planCounts = {};
    subscriptions.forEach(s => {
      const name = s.planName || 'Standard Plan';
      planCounts[name] = (planCounts[name] || 0) + 1;
    });

    const planColors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'];
    const planDistribution = Object.keys(planCounts).map((name, i) => ({
      name,
      value: planCounts[name],
      fill: planColors[i % planColors.length]
    }));

    // Dynamic 6-month chart
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const monthlyRevenueChart = months.map((m, idx) => {
      const factor = (idx + 1) / months.length;
      return {
        month: m,
        mrr: Math.round(mrr * (0.7 + (factor * 0.3))),
        revenue: Math.round((totalRevenue / months.length) * (0.8 + (factor * 0.4)))
      };
    });

    return {
      mrr: Number(mrr.toFixed(2)),
      mrrGrowth: '+14.2%',
      arr: Number(arr.toFixed(2)),
      activeSubscriptions: activeSubs.length,
      subscriptionsGrowth: '+8%',
      revenueTotal: Number(totalRevenue.toFixed(2)),
      overdueInvoicesCount: overdueInvoices.length,
      overdueAmount: Number(overdueAmount.toFixed(2)),
      monthlyRevenueChart,
      planDistribution: planDistribution.length > 0 ? planDistribution : DEMO_METRICS.planDistribution,
      mrrWaterfall: DEMO_METRICS.mrrWaterfall,
      arAging: [
        { bucket: 'Current (0-30 Days)', amount: Number((overdueAmount * 0.6).toFixed(2)), count: Math.ceil(overdueInvoices.length * 0.6), percentage: 60, color: '#10B981' },
        { bucket: 'Past Due (31-60 Days)', amount: Number((overdueAmount * 0.4).toFixed(2)), count: Math.floor(overdueInvoices.length * 0.4), percentage: 40, color: '#F59E0B' },
        { bucket: 'Delinquent (61-90 Days)', amount: 0.00, count: 0, percentage: 0, color: '#EF4444' },
        { bucket: 'Default Risk (90+ Days)', amount: 0.00, count: 0, percentage: 0, color: '#991B1B' }
      ]
    };
  }
}

export const mockDataService = new MockDataService();
export default mockDataService;
