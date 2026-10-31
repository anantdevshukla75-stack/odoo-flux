export const ADMIN_NAVIGATION = [
  {
    section: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: 'LayoutDashboard' }
    ]
  },
  {
    section: 'Customers',
    items: [
      { name: 'Customer Directory', path: '/admin/customers', icon: 'Users' }
    ]
  },
  {
    section: 'Catalog',
    items: [
      { name: 'Products & Variants', path: '/admin/products', icon: 'Package' },
      { name: 'Subscription Plans', path: '/admin/plans', icon: 'Layers' }
    ]
  },
  {
    section: 'Sales',
    items: [
      { name: 'Quotation Templates', path: '/admin/quotation-templates', icon: 'FileCode' },
      { name: 'Quotations', path: '/admin/quotations', icon: 'FileText' }
    ]
  },
  {
    section: 'Subscriptions',
    items: [
      { name: 'All Subscriptions', path: '/admin/subscriptions', icon: 'RefreshCw' }
    ]
  },
  {
    section: 'Billing',
    items: [
      { name: 'Invoices', path: '/admin/invoices', icon: 'Receipt' },
      { name: 'Payments', path: '/admin/payments', icon: 'CreditCard' }
    ]
  },
  {
    section: 'Configuration',
    items: [
      { name: 'Tax Rates', path: '/admin/taxes', icon: 'Percent' },
      { name: 'Discounts & Promo', path: '/admin/discounts', icon: 'Tag' }
    ]
  },
  {
    section: 'Reports',
    items: [
      { name: 'Revenue Reports', path: '/admin/reports', icon: 'BarChart3' }
    ]
  },
  {
    section: 'Team',
    items: [
      { name: 'Staff Management', path: '/admin/team', icon: 'ShieldCheck' }
    ]
  }
];

export const STAFF_NAVIGATION = [
  {
    section: 'Overview',
    items: [
      { name: 'Staff Dashboard', path: '/staff/dashboard', icon: 'LayoutDashboard' }
    ]
  },
  {
    section: 'Customers',
    items: [
      { name: 'Customer Directory', path: '/staff/customers', icon: 'Users' }
    ]
  },
  {
    section: 'Sales & Subscriptions',
    items: [
      { name: 'Quotations', path: '/staff/quotations', icon: 'FileText' },
      { name: 'Subscriptions', path: '/staff/subscriptions', icon: 'RefreshCw' }
    ]
  },
  {
    section: 'Billing & AR',
    items: [
      { name: 'Invoices', path: '/staff/invoices', icon: 'Receipt' },
      { name: 'Record Payments', path: '/staff/payments', icon: 'CreditCard' },
      { name: 'Overdue Invoices', path: '/staff/overdue', icon: 'AlertTriangle' }
    ]
  }
];

export const CUSTOMER_NAVIGATION = [
  {
    section: 'Portal',
    items: [
      { name: 'Overview', path: '/customer/dashboard', icon: 'LayoutDashboard' },
      { name: 'My Quotations', path: '/customer/quotations', icon: 'FileText' },
      { name: 'My Subscriptions', path: '/customer/subscriptions', icon: 'RefreshCw' },
      { name: 'My Invoices', path: '/customer/invoices', icon: 'Receipt' },
      { name: 'Payment History', path: '/customer/payments', icon: 'CreditCard' },
      { name: 'My Profile', path: '/customer/profile', icon: 'Building' }
    ]
  }
];
