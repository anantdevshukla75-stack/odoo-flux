export const ADMIN_NAVIGATION = [
  {
    section: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' },
      { name: 'Reports & Analytics', path: '/admin/reports', icon: 'BarChart3' }
    ]
  },
  {
    section: 'Catalog & Pricing',
    items: [
      { name: 'Products & Variants', path: '/admin/products', icon: 'Package' },
      { name: 'Subscription Plans', path: '/admin/plans', icon: 'Layers' },
      { name: 'Tax Rates', path: '/admin/taxes', icon: 'Percent' },
      { name: 'Discounts & Coupons', path: '/admin/discounts', icon: 'Tag' }
    ]
  },
  {
    section: 'Revenue & Sales',
    items: [
      { name: 'Customers', path: '/admin/customers', icon: 'Users' },
      { name: 'Quotations', path: '/admin/quotations', icon: 'FileText' },
      { name: 'Subscriptions', path: '/admin/subscriptions', icon: 'RefreshCw' },
      { name: 'Invoices', path: '/admin/invoices', icon: 'Receipt' },
      { name: 'Payments', path: '/admin/payments', icon: 'CreditCard' }
    ]
  },
  {
    section: 'Administration',
    items: [
      { name: 'Staff Management', path: '/admin/team', icon: 'ShieldCheck' }
    ]
  }
];

export const STAFF_NAVIGATION = [
  {
    section: 'Operations',
    items: [
      { name: 'Dashboard', path: '/staff/dashboard', icon: 'LayoutDashboard' },
      { name: 'Customers', path: '/staff/customers', icon: 'Users' },
      { name: 'Quotations', path: '/staff/quotations', icon: 'FileText' },
      { name: 'Subscriptions', path: '/staff/subscriptions', icon: 'RefreshCw' }
    ]
  },
  {
    section: 'Billing & AR',
    items: [
      { name: 'Invoices', path: '/staff/invoices', icon: 'Receipt' },
      { name: 'Overdue Invoices', path: '/staff/overdue', icon: 'AlertTriangle' },
      { name: 'Record Payments', path: '/staff/payments', icon: 'CreditCard' }
    ]
  }
];

export const CUSTOMER_NAVIGATION = [
  {
    section: 'Customer Portal',
    items: [
      { name: 'Dashboard', path: '/customer/dashboard', icon: 'Home' },
      { name: 'My Subscriptions', path: '/customer/subscriptions', icon: 'RefreshCw' },
      { name: 'My Quotations', path: '/customer/quotations', icon: 'FileText' },
      { name: 'Invoices & Billing', path: '/customer/invoices', icon: 'Receipt' },
      { name: 'Payment History', path: '/customer/payments', icon: 'CreditCard' },
      { name: 'Company Profile', path: '/customer/profile', icon: 'Building' }
    ]
  }
];
