/**
 * Brightloop Software - Real API service
 *
 * Adapts the FastAPI responses (snake_case, lowercase enums, thin relations)
 * into the camelCase shapes the existing UI pages were built against.
 *
 * Modules without backend support (quotations, taxes, discounts, staff
 * listing) continue to use mockDataService.
 */

import apiClient from './apiClient.js';
import { formatDate } from '../utils/formatDate.js';

const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value));
const toUpper = (value) => String(value || '').toUpperCase();
const todayIso = () => new Date().toISOString().slice(0, 10);

function indexById(list) {
  return new Map((list || []).map((item) => [item.id, item]));
}

function pickCustomerName(customer) {
  if (!customer) return '';
  return customer.company_name || customer.full_name || '';
}

/* -------------------------------------------------------------------------- */
/* Raw fetchers                                                               */
/* -------------------------------------------------------------------------- */

async function rawCustomers() {
  try {
    return await apiClient.get('/customers');
  } catch (error) {
    // Customers may only read their own profile
    if (error.status === 403) {
      return [await apiClient.get('/customers/me')];
    }
    throw error;
  }
}

const rawProducts = () => apiClient.get('/products');
const rawPlans = () => apiClient.get('/plans');
const rawSubscriptions = (params) => apiClient.get('/subscriptions', params);
const rawInvoices = (params) => apiClient.get('/invoices', params);
const rawPayments = (params) => apiClient.get('/payments', params);

/* -------------------------------------------------------------------------- */
/* Normalizers                                                                */
/* -------------------------------------------------------------------------- */

function normalizeCustomer(customer) {
  return {
    id: customer.id,
    userId: customer.user_id,
    fullName: customer.full_name,
    email: customer.email,
    companyName: customer.company_name || '',
    phone: customer.phone || '',
    billingAddress: customer.billing_address || '',
    taxId: customer.tax_number || '',
    createdAt: customer.created_at,
    status: 'ACTIVE',
    activeSubscriptions: 0,
    totalSpent: 0
  };
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    productType: toUpper(product.product_type),
    salesPrice: toNumber(product.sales_price),
    costPrice: toNumber(product.cost_price),
    isActive: product.is_active,
    notes: product.notes || '',
    variants: [],
    createdAt: product.created_at
  };
}

function normalizePlan(plan, productById = new Map()) {
  const products = (plan.lines || []).map((line) => ({
    id: line.id,
    productId: line.product_id,
    productName: productById.get(line.product_id)?.name || `Product #${line.product_id}`,
    quantity: line.quantity,
    unitPrice: toNumber(line.unit_price)
  }));

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description || '',
    billingInterval: toUpper(plan.billing_interval),
    billingIntervalCount: plan.billing_interval_count,
    minimumQuantity: plan.minimum_quantity,
    basePrice: products.reduce((total, line) => total + line.unitPrice * line.quantity, 0),
    startDate: plan.start_date,
    endDate: plan.end_date,
    autoClose: plan.auto_close,
    allowEarlyClose: plan.allow_early_close,
    allowPause: plan.allow_pause,
    allowRenewal: plan.allow_renewal,
    isActive: plan.is_active,
    products,
    lines: products
  };
}

function planLinesFromProducts(products) {
  return (products || []).map((line) => ({
    product_id: line.productId,
    quantity: Number(line.quantity) || 1,
    unit_price: toNumber(line.unitPrice)
  }));
}

function planPayload(payload) {
  const body = {
    name: payload.name,
    description: payload.description || null,
    billing_interval: String(payload.billingInterval || 'MONTHLY').toLowerCase(),
    billing_interval_count: Number(payload.billingIntervalCount) || 1,
    minimum_quantity: Number(payload.minimumQuantity) || 1,
    start_date: payload.startDate || todayIso(),
    end_date: payload.endDate || null,
    auto_close: Boolean(payload.autoClose),
    allow_early_close: Boolean(payload.allowEarlyClose),
    allow_pause: Boolean(payload.allowPause),
    allow_renewal: Boolean(payload.allowRenewal),
    is_active: payload.isActive !== false
  };

  if (Array.isArray(payload.products)) {
    body.lines = planLinesFromProducts(payload.products);
  }

  return body;
}

function productPayload(payload) {
  return {
    name: payload.name,
    product_type: String(payload.productType || 'SERVICE').toLowerCase(),
    sales_price: toNumber(payload.salesPrice),
    cost_price: toNumber(payload.costPrice),
    notes: payload.notes || null,
    is_active: payload.isActive !== false
  };
}

function normalizeSubscription(subscription, { planById = new Map(), customerById = new Map() } = {}) {
  const plan = planById.get(subscription.plan_id);
  const customer = customerById.get(subscription.customer_id);
  const lines = subscription.lines || [];

  const lineTotal = lines.reduce(
    (total, line) => total + toNumber(line.unit_price) * (line.quantity || 0),
    0
  );
  const planTotal = (plan?.lines || []).reduce(
    (total, line) => total + toNumber(line.unit_price) * (line.quantity || 0),
    0
  );
  const termsDays = subscription.payment_terms_days || 0;

  return {
    id: subscription.id,
    subscriptionNumber: subscription.subscription_number,
    customerId: subscription.customer_id,
    customerName: customer ? pickCustomerName(customer) : '',
    planId: subscription.plan_id,
    planName: plan?.name || `Plan #${subscription.plan_id}`,
    status: toUpper(subscription.status),
    startDate: subscription.start_date,
    expiryDate: subscription.expiry_date,
    nextBillingDate: subscription.next_billing_date,
    paymentTermsDays: termsDays,
    paymentTerms: termsDays > 0 ? `Net ${termsDays} Days` : 'Due on receipt',
    recurringAmount: lines.length > 0 ? lineTotal : planTotal,
    billingInterval: toUpper(plan?.billing_interval || 'MONTHLY'),
    autoRenew: plan?.allow_renewal ?? true,
    createdAt: subscription.created_at,
    lines: lines.map((line) => ({
      id: line.id,
      productId: line.product_id,
      quantity: line.quantity,
      unitPrice: toNumber(line.unit_price),
      taxRate: toNumber(line.tax_rate)
    }))
  };
}

function paidAmountsByInvoice(payments) {
  const paidByInvoice = new Map();
  (payments || []).forEach((payment) => {
    paidByInvoice.set(
      payment.invoice_id,
      (paidByInvoice.get(payment.invoice_id) || 0) + toNumber(payment.amount)
    );
  });
  return paidByInvoice;
}

function isOverdue(invoice, balance) {
  const open = ['CONFIRMED', 'PARTIALLY_PAID'].includes(toUpper(invoice.status));
  if (!open || balance <= 0) return false;
  return new Date(invoice.due_date) < new Date(todayIso());
}

function normalizeInvoice(
  invoice,
  { customerById = new Map(), paidByInvoice = new Map(), subscriptionById = new Map() } = {}
) {
  const paidAmount = paidByInvoice.get(invoice.id) || 0;
  const totalAmount = toNumber(invoice.total_amount);
  const payableStatus = ['CONFIRMED', 'PARTIALLY_PAID'].includes(toUpper(invoice.status));
  const balance = payableStatus ? Math.max(totalAmount - paidAmount, 0) : 0;
  const customer = customerById.get(invoice.customer_id);
  const subscription = subscriptionById.get(invoice.subscription_id);

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoice_number,
    subscriptionId: invoice.subscription_id,
    subscriptionNumber: subscription?.subscription_number || '',
    customerId: invoice.customer_id,
    customerName: customer ? pickCustomerName(customer) : '',
    status: isOverdue(invoice, balance) ? 'OVERDUE' : toUpper(invoice.status),
    subtotal: toNumber(invoice.subtotal),
    taxAmount: toNumber(invoice.tax_amount),
    discountAmount: toNumber(invoice.discount_amount),
    totalAmount,
    paidAmount,
    balance,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    billingPeriodStart: invoice.billing_period_start,
    billingPeriodEnd: invoice.billing_period_end,
    billingPeriod:
      invoice.billing_period_start && invoice.billing_period_end
        ? `${formatDate(invoice.billing_period_start)} – ${formatDate(invoice.billing_period_end)}`
        : '',
    createdAt: invoice.created_at,
    items: (invoice.lines || []).map((line) => ({
      id: line.id,
      productId: line.product_id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: toNumber(line.unit_price),
      taxAmount: toNumber(line.tax_amount),
      discountAmount: toNumber(line.discount_amount),
      amount: toNumber(line.line_total)
    }))
  };
}

function normalizePayment(payment, invoiceById = new Map()) {
  const invoice = invoiceById.get(payment.invoice_id);

  return {
    id: payment.id,
    paymentNumber: `PAY-${String(payment.id).padStart(6, '0')}`,
    invoiceId: payment.invoice_id,
    invoiceNumber: invoice?.invoice_number || `INV #${payment.invoice_id}`,
    customerId: invoice?.customer_id,
    amount: toNumber(payment.amount),
    paymentMethod: toUpper(payment.payment_method),
    reference: payment.reference || '',
    note: payment.note || '',
    paymentDate: payment.payment_date,
    status: 'COMPLETED'
  };
}

/* -------------------------------------------------------------------------- */
/* Subscriptions                                                              */
/* -------------------------------------------------------------------------- */

async function subscriptionLookups() {
  const [customers, plans] = await Promise.all([
    rawCustomers().catch(() => []),
    rawPlans()
  ]);

  return { customerById: indexById(customers), planById: indexById(plans) };
}

export async function getSubscriptions(filters = {}) {
  const params = {};
  if (filters.customerId !== undefined && filters.customerId !== null) {
    params.customer_id = filters.customerId;
  }
  if (filters.status) params.status = String(filters.status).toLowerCase();

  const [subscriptions, lookups] = await Promise.all([
    rawSubscriptions(params),
    subscriptionLookups()
  ]);

  return subscriptions.map((subscription) => normalizeSubscription(subscription, lookups));
}

export async function getSubscriptionById(id) {
  const [subscription, lookups] = await Promise.all([
    apiClient.get(`/subscriptions/${id}`),
    subscriptionLookups()
  ]);

  return normalizeSubscription(subscription, lookups);
}

const SUBSCRIPTION_ACTIONS = {
  CONFIRMED: 'confirm',
  ACTIVE: 'activate',
  PAUSED: 'pause',
  CLOSED: 'close'
};

export async function updateSubscriptionStatus(id, status) {
  const action = SUBSCRIPTION_ACTIONS[toUpper(status)];

  if (!action) {
    throw new Error(`Unsupported subscription status: ${status}`);
  }

  await apiClient.post(`/subscriptions/${id}/${action}`);
  return getSubscriptionById(id);
}

export async function generateSubscriptionInvoice(subscriptionId) {
  const created = await apiClient.post('/billing/generate', {
    subscription_id: Number(subscriptionId)
  });

  if (!Array.isArray(created) || created.length === 0) {
    throw new Error('No invoice was generated for this subscription.');
  }

  return created[0];
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                   */
/* -------------------------------------------------------------------------- */

async function invoiceLookups() {
  const [customers, subscriptions, payments] = await Promise.all([
    rawCustomers().catch(() => []),
    rawSubscriptions().catch(() => []),
    rawPayments()
  ]);

  return {
    customerById: indexById(customers),
    subscriptionById: indexById(subscriptions),
    paidByInvoice: paidAmountsByInvoice(payments)
  };
}

export async function getInvoices(filters = {}) {
  const params = {};
  const requestedStatus = toUpper(filters.status);
  if (filters.customerId !== undefined && filters.customerId !== null) {
    params.customer_id = filters.customerId;
  }
  if (filters.subscriptionId !== undefined && filters.subscriptionId !== null) {
    params.subscription_id = filters.subscriptionId;
  }
  // OVERDUE is a UI-derived status; the API only exposes persisted invoice states.
  if (filters.status && requestedStatus !== 'OVERDUE') {
    params.status = String(filters.status).toLowerCase();
  }

  const [invoices, lookups] = await Promise.all([rawInvoices(params), invoiceLookups()]);

  const normalized = invoices.map((invoice) => normalizeInvoice(invoice, lookups));
  return requestedStatus === 'OVERDUE'
    ? normalized.filter((invoice) => invoice.status === 'OVERDUE')
    : normalized;
}

export async function getInvoiceById(id) {
  const [invoice, lookups] = await Promise.all([apiClient.get(`/invoices/${id}`), invoiceLookups()]);
  return normalizeInvoice(invoice, lookups);
}

export async function getInvoiceDetails(id) {
  const invoice = await apiClient.get(`/invoices/${id}`);

  const [customer, subscription, payments, plans] = await Promise.all([
    apiClient.get(`/customers/${invoice.customer_id}`),
    apiClient.get(`/subscriptions/${invoice.subscription_id}`),
    rawPayments({ invoice_id: invoice.id }),
    rawPlans()
  ]);

  const subscriptionById = new Map([[invoice.subscription_id, subscription]]);
  const invoiceById = new Map([[invoice.id, invoice]]);
  const normalizedInvoice = normalizeInvoice(invoice, {
    customerById: new Map([[customer.id, customer]]),
    subscriptionById,
    paidByInvoice: paidAmountsByInvoice(payments)
  });

  return {
    invoice: normalizedInvoice,
    customer: normalizeCustomer(customer),
    subscription: normalizeSubscription(subscription, {
      planById: indexById(plans),
      customerById: new Map([[customer.id, customer]])
    }),
    payments: payments.map((payment) => normalizePayment(payment, invoiceById))
  };
}

/* -------------------------------------------------------------------------- */
/* Payments                                                                   */
/* -------------------------------------------------------------------------- */

export async function getPayments(filters = {}) {
  const params = {};
  if (filters.invoiceId !== undefined && filters.invoiceId !== null) {
    params.invoice_id = filters.invoiceId;
  }
  if (filters.paymentMethod) {
    params.payment_method = String(filters.paymentMethod).toLowerCase();
  }

  const [payments, invoices, customers] = await Promise.all([
    rawPayments(params),
    rawInvoices(),
    rawCustomers().catch(() => [])
  ]);

  const invoiceById = indexById(invoices);
  const customerById = indexById(customers);

  return payments.map((payment) => {
    const normalized = normalizePayment(payment, invoiceById);
    const customer = customerById.get(normalized.customerId);
    normalized.customerName = customer ? pickCustomerName(customer) : '';
    return normalized;
  });
}

export async function recordPayment(data) {
  const body = {
    invoice_id: Number(data.invoiceId),
    payment_method: String(data.paymentMethod || 'bank_transfer').toLowerCase(),
    amount: toNumber(data.amount),
    reference: data.reference || null,
    note: data.note || null
  };

  if (data.paymentDate) {
    body.payment_date =
      String(data.paymentDate).length === 10
        ? `${data.paymentDate}T12:00:00Z`
        : data.paymentDate;
  }

  const created = await apiClient.post('/payments', body);
  const invoices = await rawInvoices();
  return normalizePayment(created, indexById(invoices));
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export async function getCustomers() {
  const [customers, subscriptions, invoices, payments] = await Promise.all([
    rawCustomers(),
    rawSubscriptions(),
    rawInvoices(),
    rawPayments()
  ]);

  const paidByInvoice = new Map();
  payments.forEach((payment) => {
    paidByInvoice.set(
      payment.invoice_id,
      (paidByInvoice.get(payment.invoice_id) || 0) + toNumber(payment.amount)
    );
  });

  return customers.map((customer) => {
    const normalized = normalizeCustomer(customer);
    const customerSubs = subscriptions.filter((sub) => sub.customer_id === customer.id);
    const customerInvoices = invoices.filter((inv) => inv.customer_id === customer.id);

    normalized.activeSubscriptions = customerSubs.filter(
      (sub) => sub.status === 'active'
    ).length;
    normalized.totalSpent = customerInvoices.reduce(
      (total, inv) => total + (paidByInvoice.get(inv.id) || 0),
      0
    );

    return normalized;
  });
}

export async function getCustomerById(id) {
  const raw = await apiClient.get(`/customers/${id}`);
  return normalizeCustomer(raw);
}

export async function getCustomerDetails(id) {
  const [customer, rawSubs, rawInvoices_, payments, plans, allCustomers] = await Promise.all([
    getCustomerById(id),
    rawSubscriptions({ customer_id: id }),
    rawInvoices({ customer_id: id }),
    rawPayments(),
    rawPlans(),
    rawCustomers()
  ]);

  const planById = indexById(plans);
  const customerById = indexById(allCustomers);
  const subscriptionById = indexById(rawSubs);
  const invoiceIds = new Set(rawInvoices_.map((inv) => inv.id));
  const customerPayments = payments.filter((payment) => invoiceIds.has(payment.invoice_id));

  const paidByInvoice = paidAmountsByInvoice(customerPayments);
  const invoices = rawInvoices_.map((inv) =>
    normalizeInvoice(inv, { customerById, paidByInvoice, subscriptionById })
  );
  const subscriptions = rawSubs.map((sub) =>
    normalizeSubscription(sub, { planById, customerById })
  );
  const invoiceById = indexById(rawInvoices_);
  const normalizedPayments = customerPayments.map((payment) =>
    normalizePayment(payment, invoiceById)
  );

  const outstandingBalance = invoices.reduce((total, inv) => total + inv.balance, 0);
  const totalPayments = normalizedPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  return {
    customer,
    subscriptions,
    invoices,
    quotations: [],
    payments: normalizedPayments,
    outstandingBalance,
    totalPayments
  };
}

export async function getMyCustomer() {
  const raw = await apiClient.get('/customers/me');
  return normalizeCustomer(raw);
}

export async function createCustomer(customerData) {
  await apiClient.post('/auth/register', {
    email: customerData.email,
    password: customerData.password || 'Password123!',
    full_name: customerData.fullName
  });

  const customers = await rawCustomers();
  const created = customers.find(
    (customer) => customer.email.toLowerCase() === customerData.email.toLowerCase()
  );

  if (!created) {
    throw new Error('Customer account was created but could not be located.');
  }

  const updated = await apiClient.patch(`/customers/${created.id}`, {
    company_name: customerData.companyName || null,
    phone: customerData.phone || null,
    billing_address: customerData.billingAddress || null,
    tax_number: customerData.taxId || null
  });

  return normalizeCustomer(updated);
}

export async function updateCustomer(id, data) {
  const updated = await apiClient.patch(`/customers/${id}`, {
    company_name: data.companyName ?? data.company_name ?? null,
    phone: data.phone ?? null,
    billing_address: data.billingAddress ?? data.billing_address ?? null,
    tax_number: data.taxId ?? data.tax_number ?? null
  });

  return normalizeCustomer(updated);
}

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export async function getProducts() {
  const products = await rawProducts();
  return products.map(normalizeProduct);
}

export async function getProductById(id) {
  return normalizeProduct(await apiClient.get(`/products/${id}`));
}

export async function createProduct(productData) {
  return normalizeProduct(await apiClient.post('/products', productPayload(productData)));
}

export async function updateProduct(id, productData) {
  const body = productPayload(productData);
  // Name/type/prices are required on create only; partial updates are fine
  return normalizeProduct(await apiClient.patch(`/products/${id}`, body));
}

export async function toggleProductStatus(id) {
  const current = await apiClient.get(`/products/${id}`);
  return normalizeProduct(
    await apiClient.patch(`/products/${id}`, { is_active: !current.is_active })
  );
}

/* -------------------------------------------------------------------------- */
/* Plans                                                                      */
/* -------------------------------------------------------------------------- */

export async function getPlans() {
  const [plans, products] = await Promise.all([rawPlans(), rawProducts()]);
  const productById = indexById(products);
  return plans.map((plan) => normalizePlan(plan, productById));
}

export async function getPlanById(id) {
  const [plan, products] = await Promise.all([
    apiClient.get(`/plans/${id}`),
    rawProducts()
  ]);
  return normalizePlan(plan, indexById(products));
}

export async function createPlan(planData) {
  const created = await apiClient.post('/plans', planPayload(planData));
  return getPlanById(created.id);
}

export async function updatePlan(id, planData) {
  await apiClient.patch(`/plans/${id}`, planPayload(planData));
  return getPlanById(id);
}

export async function togglePlanStatus(id) {
  const current = await apiClient.get(`/plans/${id}`);
  await apiClient.patch(`/plans/${id}`, { is_active: !current.is_active });
  return getPlanById(id);
}

export const apiService = {
  getCustomers,
  getCustomerById,
  getCustomerDetails,
  getMyCustomer,
  createCustomer,
  updateCustomer,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  togglePlanStatus,
  getSubscriptions,
  getSubscriptionById,
  updateSubscriptionStatus,
  generateSubscriptionInvoice,
  getInvoices,
  getInvoiceById,
  getInvoiceDetails,
  getPayments,
  recordPayment
};

export default apiService;
