/**
 * Brightloop Software - Comprehensive Demonstration Data
 * 
 * NOTE: This is local demonstration data used to preview the frontend UI
 * independently before connecting to the backend API.
 */

export const DEMO_USERS = {
  admin: {
    id: 'usr-admin-01',
    fullName: 'Alexander Vance',
    email: 'admin@brightloopsoftware.com',
    role: 'ADMIN',
    isActive: true
  },
  staff: {
    id: 'usr-staff-01',
    fullName: 'Elena Rostova',
    email: 'operations@brightloopsoftware.com',
    role: 'STAFF',
    isActive: true
  },
  customer: {
    id: 'usr-cust-01',
    fullName: 'Marcus Sterling',
    email: 'marcus@acmecorp.com',
    role: 'CUSTOMER',
    isActive: true,
    companyName: 'Acme Technologies Inc.',
    phone: '+1 (555) 234-5678',
    billingAddress: '450 Mission St, Suite 1200, San Francisco, CA 94105',
    taxId: 'US-TAX-8839210'
  }
};

export const DEMO_CUSTOMERS = [
  {
    id: 'cust-001',
    userId: 'usr-cust-01',
    fullName: 'Marcus Sterling',
    email: 'marcus@acmecorp.com',
    companyName: 'Acme Technologies Inc.',
    phone: '+1 (555) 234-5678',
    billingAddress: '450 Mission St, Suite 1200, San Francisco, CA 94105',
    taxId: 'US-TAX-8839210',
    status: 'ACTIVE',
    activeSubscriptions: 2,
    totalSpent: 14200.00,
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'cust-002',
    userId: 'usr-cust-02',
    fullName: 'Sarah Chen',
    email: 'sarah@technovasoft.com',
    companyName: 'TechNova Cloud Corp',
    phone: '+1 (555) 876-5432',
    billingAddress: '100 Broadway, 18th Floor, New York, NY 10005',
    taxId: 'US-TAX-4512991',
    status: 'ACTIVE',
    activeSubscriptions: 1,
    totalSpent: 8900.00,
    createdAt: '2026-02-10T14:30:00Z'
  },
  {
    id: 'cust-003',
    userId: 'usr-cust-03',
    fullName: 'David Kalu',
    email: 'david@apexglobal.io',
    companyName: 'Apex Global Logistics',
    phone: '+44 20 7946 0991',
    billingAddress: '25 Cannon Street, London, EC4M 5SB, UK',
    taxId: 'GB-VAT-9023412',
    status: 'ACTIVE',
    activeSubscriptions: 3,
    totalSpent: 26500.00,
    createdAt: '2026-03-01T11:15:00Z'
  },
  {
    id: 'cust-004',
    userId: 'usr-cust-04',
    fullName: 'Sophia Ramirez',
    email: 'sophia@nexushealth.ai',
    companyName: 'Nexus Health Systems',
    phone: '+1 (555) 345-6789',
    billingAddress: '789 Boylston St, Boston, MA 02116',
    taxId: 'US-TAX-7712349',
    status: 'ACTIVE',
    activeSubscriptions: 1,
    totalSpent: 5400.00,
    createdAt: '2026-04-12T16:45:00Z'
  },
  {
    id: 'cust-005',
    userId: 'usr-cust-05',
    fullName: 'Vikram Joshi',
    email: 'vikram@zenithenterprises.in',
    companyName: 'Zenith FinTech Labs',
    phone: '+91 22 2650 1200',
    billingAddress: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    taxId: '27AAACZ1234F1Z8',
    status: 'ACTIVE',
    activeSubscriptions: 1,
    totalSpent: 4200.00,
    createdAt: '2026-05-20T10:00:00Z'
  }
];

export const DEMO_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Brightloop Platform Core',
    productType: 'SUBSCRIPTION',
    salesPrice: 499.00,
    costPrice: 85.00,
    isActive: true,
    notes: 'Base enterprise subscription platform license',
    variants: [
      { id: 'var-001-starter', name: 'Starter Tier (Up to 5 seats)', priceAdjustment: 0.00, code: 'BL-CORE-S' },
      { id: 'var-001-pro', name: 'Pro Tier (Up to 25 seats)', priceAdjustment: 250.00, code: 'BL-CORE-P' },
      { id: 'var-001-ent', name: 'Enterprise Tier (Unlimited seats)', priceAdjustment: 750.00, code: 'BL-CORE-E' }
    ]
  },
  {
    id: 'prod-002',
    name: 'Real-Time Revenue Analytics Addon',
    productType: 'SUBSCRIPTION',
    salesPrice: 199.00,
    costPrice: 30.00,
    isActive: true,
    notes: 'Advanced predictive MRR and churn cohort reporting',
    variants: []
  },
  {
    id: 'prod-003',
    name: 'Dedicated Enterprise SLA & Support',
    productType: 'SERVICE',
    salesPrice: 350.00,
    costPrice: 120.00,
    isActive: true,
    notes: '24/7 dedicated technical account manager with 15min response SLA',
    variants: [
      { id: 'var-003-silver', name: 'Silver (9x5 business hours)', priceAdjustment: 0.00, code: 'SLA-SLV' },
      { id: 'var-003-gold', name: 'Gold (24x7 incident response)', priceAdjustment: 200.00, code: 'SLA-GLD' }
    ]
  },
  {
    id: 'prod-004',
    name: 'High-Volume API Event Metering',
    productType: 'GOODS',
    salesPrice: 99.00,
    costPrice: 15.00,
    isActive: true,
    notes: 'Pack of 1,000,000 webhook and API invoice processing events',
    variants: []
  }
];

export const DEMO_PLANS = [
  {
    id: 'plan-001',
    name: 'Scale Enterprise Monthly',
    description: 'All-inclusive monthly subscription for growing enterprise engineering teams',
    billingInterval: 'MONTHLY',
    billingIntervalCount: 1,
    minimumQuantity: 1,
    basePrice: 749.00,
    autoClose: false,
    allowPause: true,
    allowRenewal: true,
    isActive: true,
    products: [
      { productId: 'prod-001', productName: 'Brightloop Platform Core (Pro)', quantity: 1, unitPrice: 749.00 }
    ]
  },
  {
    id: 'plan-002',
    name: 'Scale Enterprise Annual',
    description: 'Full enterprise platform prepaid annually with a 2-month discount included',
    billingInterval: 'YEARLY',
    billingIntervalCount: 1,
    minimumQuantity: 1,
    basePrice: 7490.00,
    autoClose: false,
    allowPause: true,
    allowRenewal: true,
    isActive: true,
    products: [
      { productId: 'prod-001', productName: 'Brightloop Platform Core (Pro)', quantity: 1, unitPrice: 7490.00 }
    ]
  },
  {
    id: 'plan-003',
    name: 'Starter Growth Plan',
    description: 'Designed for early-stage SaaS ventures launching their first subscriptions',
    billingInterval: 'MONTHLY',
    billingIntervalCount: 1,
    minimumQuantity: 1,
    basePrice: 249.00,
    autoClose: false,
    allowPause: false,
    allowRenewal: true,
    isActive: true,
    products: [
      { productId: 'prod-001', productName: 'Brightloop Platform Core (Starter)', quantity: 1, unitPrice: 249.00 }
    ]
  }
];

export const DEMO_QUOTATION_TEMPLATES = [
  {
    id: 'tmpl-001',
    name: 'Enterprise Cloud Suite Template',
    description: 'Standard proposal for mid-to-large enterprise migrations with dedicated support SLA',
    defaultPlanId: 'plan-001',
    defaultPlanName: 'Scale Enterprise Monthly',
    validityDays: 30,
    productLines: [
      { productId: 'prod-001', productName: 'Brightloop Platform Core', quantity: 1, unitPrice: 499.00 },
      { productId: 'prod-003', productName: 'Dedicated Enterprise SLA & Support', quantity: 1, unitPrice: 350.00 }
    ]
  },
  {
    id: 'tmpl-002',
    name: 'Growth SaaS Onboarding Package',
    description: 'Fast-track proposal for early stage ventures with 1M event meter',
    defaultPlanId: 'plan-003',
    defaultPlanName: 'Starter Growth Plan',
    validityDays: 14,
    productLines: [
      { productId: 'prod-001', productName: 'Brightloop Platform Core', quantity: 1, unitPrice: 249.00 },
      { productId: 'prod-004', productName: 'High-Volume API Event Metering', quantity: 1, unitPrice: 99.00 }
    ]
  }
];

export const DEMO_TAXES = [
  {
    id: 'tax-001',
    name: 'GST - Standard Business',
    rate: 18.00,
    calculationType: 'EXCLUSIVE',
    isDefault: true,
    isActive: true
  },
  {
    id: 'tax-002',
    name: 'US Sales Tax (CA)',
    rate: 8.25,
    calculationType: 'EXCLUSIVE',
    isDefault: false,
    isActive: true
  },
  {
    id: 'tax-003',
    name: 'EU B2B Reverse Charge (0%)',
    rate: 0.00,
    calculationType: 'EXCLUSIVE',
    isDefault: false,
    isActive: true
  }
];

export const DEMO_DISCOUNTS = [
  {
    id: 'disc-001',
    name: 'Hackathon Growth Incentive',
    code: 'HACKATHON2026',
    description: 'Hackathon presentation incentive for new signups',
    discountType: 'PERCENTAGE',
    value: 20.00,
    minPurchase: 500.00,
    minQuantity: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 100,
    redemptionsCount: 14,
    applicability: 'SUBSCRIPTION_WIDE',
    applicableProducts: [],
    applicableSubscriptions: ['plan-001', 'plan-002', 'plan-003'],
    isActive: true
  },
  {
    id: 'disc-002',
    name: 'Enterprise Flat Concession',
    code: 'STARTUP500',
    description: 'First month flat concession on enterprise deployments',
    discountType: 'FIXED',
    value: 500.00,
    minPurchase: 2000.00,
    minQuantity: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 50,
    redemptionsCount: 4,
    applicability: 'SUBSCRIPTION_WIDE',
    applicableProducts: [],
    applicableSubscriptions: ['plan-001', 'plan-002'],
    isActive: true
  },
  {
    id: 'disc-003',
    name: 'Product Core Special',
    code: 'COREONLY',
    description: 'Exclusive 15% discount on Brightloop Platform Core only',
    discountType: 'PERCENTAGE',
    value: 15.00,
    minPurchase: 400.00,
    minQuantity: 1,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 200,
    redemptionsCount: 22,
    applicability: 'PRODUCT_SPECIFIC',
    applicableProducts: ['prod-001'],
    applicableSubscriptions: [],
    isActive: true
  },
  {
    id: 'disc-004',
    name: 'Future Launch Promo',
    code: 'LAUNCH2027',
    description: 'Upcoming campaign discount (scheduled for next year)',
    discountType: 'PERCENTAGE',
    value: 25.00,
    minPurchase: 100.00,
    minQuantity: 1,
    startDate: '2027-01-01',
    endDate: '2027-12-31',
    usageLimit: 50,
    redemptionsCount: 0,
    applicability: 'ALL',
    applicableProducts: [],
    applicableSubscriptions: [],
    isActive: true
  },
  {
    id: 'disc-005',
    name: 'Expired Summer Flash Concession',
    code: 'FLASH2025',
    description: 'Special summer discount from previous fiscal period',
    discountType: 'FIXED',
    value: 250.00,
    minPurchase: 500.00,
    minQuantity: 1,
    startDate: '2025-06-01',
    endDate: '2025-08-31',
    usageLimit: 30,
    redemptionsCount: 28,
    applicability: 'ALL',
    applicableProducts: [],
    applicableSubscriptions: [],
    isActive: true
  },
  {
    id: 'disc-006',
    name: 'Sold Out VIP Voucher',
    code: 'VIPEXHAUSTED',
    description: 'Exclusive quota-restricted discount with zero remaining capacity',
    discountType: 'PERCENTAGE',
    value: 30.00,
    minPurchase: 1000.00,
    minQuantity: 2,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 10,
    redemptionsCount: 10,
    applicability: 'ALL',
    applicableProducts: [],
    applicableSubscriptions: [],
    isActive: true
  }
];

export const DEMO_QUOTATIONS = [
  {
    id: 'quot-1001',
    quotationNumber: 'QT-2026-001',
    customerId: 'cust-001',
    customerName: 'Acme Technologies Inc.',
    planId: 'plan-001',
    planName: 'Scale Enterprise Monthly',
    status: 'ACCEPTED',
    subtotal: 749.00,
    taxAmount: 134.82,
    discountAmount: 0.00,
    total: 883.82,
    validUntil: '2026-11-15',
    createdAt: '2026-10-15T10:00:00Z',
    productLines: [
      { id: 'l-1', productName: 'Brightloop Platform Core', variantName: 'Enterprise Pro Tier', quantity: 1, unitPrice: 749.00 }
    ]
  },
  {
    id: 'quot-1004',
    quotationNumber: 'QT-2026-004',
    customerId: 'cust-001',
    customerName: 'Acme Technologies Inc.',
    planId: 'plan-002',
    planName: 'Scale Enterprise Annual Upgrade',
    status: 'SENT',
    subtotal: 7490.00,
    taxAmount: 1078.56,
    discountAmount: 1498.00,
    total: 7070.56,
    validUntil: '2026-11-30',
    createdAt: '2026-10-29T11:00:00Z',
    notes: 'Proposed annual contract migration featuring 2 months complimentary platform access and 24/7 dedicated engineering SLA.',
    productLines: [
      { id: 'l-1', productName: 'Brightloop Platform Core', variantName: 'Annual Enterprise Tier', quantity: 1, unitPrice: 7490.00 },
      { id: 'l-2', productName: 'Dedicated Enterprise SLA & Support', variantName: 'Tier 1 Support', quantity: 1, unitPrice: 0.00 }
    ]
  },
  {
    id: 'quot-1002',
    quotationNumber: 'QT-2026-002',
    customerId: 'cust-002',
    customerName: 'TechNova Cloud Corp',
    planId: 'plan-002',
    planName: 'Scale Enterprise Annual',
    status: 'SENT',
    subtotal: 7490.00,
    taxAmount: 617.92,
    discountAmount: 1498.00,
    total: 6609.92,
    validUntil: '2026-11-20',
    createdAt: '2026-10-22T14:00:00Z'
  },
  {
    id: 'quot-1003',
    quotationNumber: 'QT-2026-003',
    customerId: 'cust-004',
    customerName: 'Nexus Health Systems',
    planId: 'plan-003',
    planName: 'Starter Growth Plan',
    status: 'DRAFT',
    subtotal: 249.00,
    taxAmount: 20.54,
    discountAmount: 0.00,
    total: 269.54,
    validUntil: '2026-11-30',
    createdAt: '2026-10-28T09:30:00Z'
  }
];

export const DEMO_SUBSCRIPTIONS = [
  {
    id: 'sub-5001',
    subscriptionNumber: 'SUB-2026-081',
    customerId: 'cust-001',
    customerName: 'Acme Technologies Inc.',
    planId: 'plan-001',
    planName: 'Scale Enterprise Monthly',
    status: 'ACTIVE',
    startDate: '2026-01-15',
    nextBillingDate: '2026-11-15',
    recurringAmount: 883.82,
    billingInterval: 'MONTHLY',
    autoRenew: true
  },
  {
    id: 'sub-5002',
    subscriptionNumber: 'SUB-2026-082',
    customerId: 'cust-003',
    customerName: 'Apex Global Logistics',
    planId: 'plan-002',
    planName: 'Scale Enterprise Annual',
    status: 'ACTIVE',
    startDate: '2026-03-01',
    nextBillingDate: '2027-03-01',
    recurringAmount: 7490.00,
    billingInterval: 'YEARLY',
    autoRenew: true
  },
  {
    id: 'sub-5003',
    subscriptionNumber: 'SUB-2026-083',
    customerId: 'cust-002',
    customerName: 'TechNova Cloud Corp',
    planId: 'plan-003',
    planName: 'Starter Growth Plan',
    status: 'CONFIRMED',
    startDate: '2026-11-01',
    nextBillingDate: '2026-12-01',
    recurringAmount: 269.54,
    billingInterval: 'MONTHLY',
    autoRenew: true
  },
  {
    id: 'sub-5004',
    subscriptionNumber: 'SUB-2026-084',
    customerId: 'cust-005',
    customerName: 'Zenith FinTech Labs',
    planId: 'plan-001',
    planName: 'Scale Enterprise Monthly',
    status: 'PAUSED',
    startDate: '2026-05-20',
    nextBillingDate: '2026-11-20',
    recurringAmount: 883.82,
    billingInterval: 'MONTHLY',
    autoRenew: false
  }
];

export const DEMO_INVOICES = [
  {
    id: 'inv-9001',
    invoiceNumber: 'INV-2026-0045',
    subscriptionId: 'sub-5001',
    customerId: 'cust-001',
    customerName: 'Acme Technologies Inc.',
    status: 'PAID',
    subtotal: 749.00,
    taxAmount: 134.82,
    discountAmount: 0.00,
    totalAmount: 883.82,
    paidAmount: 883.82,
    balance: 0.00,
    issueDate: '2026-10-15',
    dueDate: '2026-10-30',
    billingPeriod: '15 Oct 2026 - 15 Nov 2026',
    paidAt: '2026-10-18T11:20:00Z',
    items: [
      { id: 'item-1', description: 'Scale Enterprise Monthly Platform Access', quantity: 1, unitPrice: 749.00, taxRate: 18, amount: 749.00 }
    ]
  },
  {
    id: 'inv-9002',
    invoiceNumber: 'INV-2026-0046',
    subscriptionId: 'sub-5002',
    customerId: 'cust-003',
    customerName: 'Apex Global Logistics',
    status: 'PAID',
    subtotal: 7490.00,
    taxAmount: 0.00,
    discountAmount: 0.00,
    totalAmount: 7490.00,
    paidAmount: 7490.00,
    balance: 0.00,
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    billingPeriod: '01 Mar 2026 - 01 Mar 2027',
    paidAt: '2026-10-04T15:45:00Z',
    items: [
      { id: 'item-1', description: 'Scale Enterprise Annual Prepaid License', quantity: 1, unitPrice: 7490.00, taxRate: 0, amount: 7490.00 }
    ]
  },
  {
    id: 'inv-9003',
    invoiceNumber: 'INV-2026-0047',
    subscriptionId: 'sub-5001',
    customerId: 'cust-001',
    customerName: 'Acme Technologies Inc.',
    status: 'CONFIRMED',
    subtotal: 749.00,
    taxAmount: 134.82,
    discountAmount: 0.00,
    totalAmount: 883.82,
    paidAmount: 0.00,
    balance: 883.82,
    issueDate: '2026-10-28',
    dueDate: '2026-11-12',
    billingPeriod: '15 Nov 2026 - 15 Dec 2026',
    paidAt: null,
    items: [
      { id: 'item-1', description: 'Scale Enterprise Monthly Subscription Renewal', quantity: 1, unitPrice: 749.00, taxRate: 18, amount: 749.00 }
    ]
  },
  {
    id: 'inv-9004',
    invoiceNumber: 'INV-2026-0048',
    subscriptionId: 'sub-5004',
    customerId: 'cust-005',
    customerName: 'Zenith FinTech Labs',
    status: 'OVERDUE',
    subtotal: 749.00,
    taxAmount: 134.82,
    discountAmount: 0.00,
    totalAmount: 883.82,
    paidAmount: 0.00,
    balance: 883.82,
    issueDate: '2026-09-20',
    dueDate: '2026-10-05',
    billingPeriod: '20 Sep 2026 - 20 Oct 2026',
    paidAt: null,
    items: [
      { id: 'item-1', description: 'Scale Enterprise Monthly Service Period', quantity: 1, unitPrice: 749.00, taxRate: 18, amount: 749.00 }
    ]
  },
  {
    id: 'inv-9005',
    invoiceNumber: 'INV-2026-0049',
    subscriptionId: 'sub-5003',
    customerId: 'cust-002',
    customerName: 'TechNova Cloud Corp',
    status: 'PARTIALLY_PAID',
    subtotal: 2000.00,
    taxAmount: 360.00,
    discountAmount: 200.00,
    totalAmount: 2160.00,
    paidAmount: 1000.00,
    balance: 1160.00,
    issueDate: '2026-10-10',
    dueDate: '2026-11-10',
    billingPeriod: '10 Oct 2026 - 10 Nov 2026',
    paidAt: null,
    items: [
      { id: 'item-1', description: 'Enterprise Custom Hybrid Cloud Setup', quantity: 1, unitPrice: 2000.00, taxRate: 18, amount: 2000.00 }
    ]
  },
  {
    id: 'inv-9006',
    invoiceNumber: 'INV-2026-0050',
    subscriptionId: 'sub-5003',
    customerId: 'cust-002',
    customerName: 'TechNova Cloud Corp',
    status: 'DRAFT',
    subtotal: 499.00,
    taxAmount: 89.82,
    discountAmount: 0.00,
    totalAmount: 588.82,
    paidAmount: 0.00,
    balance: 588.82,
    issueDate: '2026-10-30',
    dueDate: '2026-11-14',
    billingPeriod: '01 Nov 2026 - 01 Dec 2026',
    paidAt: null,
    items: [
      { id: 'item-1', description: 'Draft Pro-rated Cloud Migration Provisioning', quantity: 1, unitPrice: 499.00, taxRate: 18, amount: 499.00 }
    ]
  },
  {
    id: 'inv-9007',
    invoiceNumber: 'INV-2026-0051',
    subscriptionId: null,
    customerId: 'cust-004',
    customerName: 'Nexus Health Systems',
    status: 'CANCELLED',
    subtotal: 1200.00,
    taxAmount: 216.00,
    discountAmount: 0.00,
    totalAmount: 1416.00,
    paidAmount: 0.00,
    balance: 0.00,
    issueDate: '2026-09-01',
    dueDate: '2026-09-15',
    billingPeriod: 'N/A - Cancelled Scope',
    paidAt: null,
    items: [
      { id: 'item-1', description: 'Terminated Healthcare Compliance Add-on', quantity: 1, unitPrice: 1200.00, taxRate: 18, amount: 1200.00 }
    ]
  }
];

export const DEMO_PAYMENTS = [
  {
    id: 'pay-7001',
    paymentNumber: 'PAY-2026-0129',
    invoiceId: 'inv-9001',
    invoiceNumber: 'INV-2026-0045',
    customerId: 'cust-001',
    customerName: 'Acme Technologies Inc.',
    amount: 883.82,
    paymentMethod: 'CARD',
    reference: 'stripe_ch_99238411',
    paymentDate: '2026-10-18T11:20:00Z',
    status: 'COMPLETED'
  },
  {
    id: 'pay-7002',
    paymentNumber: 'PAY-2026-0130',
    invoiceId: 'inv-9002',
    invoiceNumber: 'INV-2026-0046',
    customerId: 'cust-003',
    customerName: 'Apex Global Logistics',
    amount: 7490.00,
    paymentMethod: 'BANK_TRANSFER',
    reference: 'WIRE-BARC-44281',
    paymentDate: '2026-10-04T15:45:00Z',
    status: 'COMPLETED'
  }
];

export const DEMO_STAFF = [
  {
    id: 'usr-staff-01',
    fullName: 'Elena Rostova',
    email: 'operations@brightloopsoftware.com',
    role: 'STAFF',
    department: 'Customer Success & Invoicing',
    isActive: true,
    joinedDate: '2025-06-12'
  },
  {
    id: 'usr-staff-02',
    fullName: 'Liam Patel',
    email: 'liam.p@brightloopsoftware.com',
    role: 'STAFF',
    department: 'Billing & Accounts Receivable',
    isActive: true,
    joinedDate: '2025-09-01'
  }
];

export const DEMO_METRICS = {
  mrr: 18450.00,
  mrrGrowth: '+14.2%',
  arr: 221400.00,
  activeSubscriptions: 24,
  subscriptionsGrowth: '+8%',
  revenueTotal: 84250.00,
  overdueInvoicesCount: 1,
  overdueAmount: 883.82,
  monthlyRevenueChart: [
    { month: 'May', mrr: 12200, revenue: 14500 },
    { month: 'Jun', mrr: 13400, revenue: 16200 },
    { month: 'Jul', mrr: 14900, revenue: 17800 },
    { month: 'Aug', mrr: 16100, revenue: 19100 },
    { month: 'Sep', mrr: 17300, revenue: 20400 },
    { month: 'Oct', mrr: 18450, revenue: 22100 }
  ],
  planDistribution: [
    { name: 'Scale Enterprise Monthly', value: 14, fill: '#4F46E5' },
    { name: 'Scale Enterprise Annual', value: 6, fill: '#06B6D4' },
    { name: 'Starter Growth Plan', value: 4, fill: '#10B981' }
  ],
  mrrWaterfall: [
    { month: 'May', newMrr: 1500, expansionMrr: 400, churnMrr: -700, netAdd: 1200 },
    { month: 'Jun', newMrr: 1600, expansionMrr: 500, churnMrr: -900, netAdd: 1200 },
    { month: 'Jul', newMrr: 1800, expansionMrr: 600, churnMrr: -900, netAdd: 1500 },
    { month: 'Aug', newMrr: 1700, expansionMrr: 700, churnMrr: -1200, netAdd: 1200 },
    { month: 'Sep', newMrr: 1900, expansionMrr: 800, churnMrr: -1500, netAdd: 1200 },
    { month: 'Oct', newMrr: 2100, expansionMrr: 950, churnMrr: -1900, netAdd: 1150 }
  ],
  arAging: [
    { bucket: 'Current (0-30 Days)', amount: 883.82, count: 1, percentage: 50, color: '#10B981' },
    { bucket: 'Past Due (31-60 Days)', amount: 883.82, count: 1, percentage: 50, color: '#F59E0B' },
    { bucket: 'Delinquent (61-90 Days)', amount: 0.00, count: 0, percentage: 0, color: '#EF4444' },
    { bucket: 'Default Risk (90+ Days)', amount: 0.00, count: 0, percentage: 0, color: '#991B1B' }
  ]
};

