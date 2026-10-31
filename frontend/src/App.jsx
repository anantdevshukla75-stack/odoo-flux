import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

// Auth Pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminCustomers from './pages/admin/Customers.jsx';
import AdminCustomerDetails from './pages/admin/CustomerDetails.jsx';
import AdminProducts from './pages/admin/Products.jsx';
import AdminProductForm from './pages/admin/ProductForm.jsx';
import AdminProductDetails from './pages/admin/ProductDetails.jsx';
import AdminPlans from './pages/admin/Plans.jsx';
import AdminPlanForm from './pages/admin/PlanForm.jsx';
import AdminPlanDetails from './pages/admin/PlanDetails.jsx';

// Quotation Templates
import QuotationTemplates from './pages/admin/QuotationTemplates.jsx';
import QuotationTemplateForm from './pages/admin/QuotationTemplateForm.jsx';
import QuotationTemplateDetails from './pages/admin/QuotationTemplateDetails.jsx';

// Quotations & Subscriptions
import Quotations from './pages/admin/Quotations.jsx';
import QuotationForm from './pages/admin/QuotationForm.jsx';
import QuotationDetails from './pages/admin/QuotationDetails.jsx';
import Subscriptions from './pages/admin/Subscriptions.jsx';
import SubscriptionDetails from './pages/admin/SubscriptionDetails.jsx';

// Invoicing, Taxes & Team
import AdminTaxes from './pages/admin/Taxes.jsx';
import AdminDiscounts from './pages/admin/AdminDiscounts.jsx';
import AdminInvoices from './pages/admin/AdminInvoices.jsx';
import InvoiceDetails from './pages/admin/InvoiceDetails.jsx';
import AdminPayments from './pages/admin/AdminPayments.jsx';
import AdminStaff from './pages/admin/Staff.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard.jsx';
import StaffCustomers from './pages/staff/Customers.jsx';
import StaffOverdue from './pages/staff/StaffOverdue.jsx';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import CustomerInvoices from './pages/customer/CustomerInvoices.jsx';
import CustomerPayments from './pages/customer/CustomerPayments.jsx';
import CustomerProfile from './pages/customer/CustomerProfile.jsx';

function RootRedirect() {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/customer/dashboard" replace />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* ADMIN Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Customer Management */}
              <Route path="/admin/customers" element={<AdminCustomers basePath="/admin/customers" />} />
              <Route path="/admin/customers/:customerId" element={<AdminCustomerDetails backPath="/admin/customers" />} />

              {/* Products & Variants */}
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/new" element={<AdminProductForm />} />
              <Route path="/admin/products/:productId" element={<AdminProductDetails />} />
              <Route path="/admin/products/:productId/edit" element={<AdminProductForm />} />

              {/* Subscription Plans */}
              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/plans/new" element={<AdminPlanForm />} />
              <Route path="/admin/plans/:planId" element={<AdminPlanDetails />} />
              <Route path="/admin/plans/:planId/edit" element={<AdminPlanForm />} />

              {/* Quotation Templates */}
              <Route path="/admin/quotation-templates" element={<QuotationTemplates />} />
              <Route path="/admin/quotation-templates/new" element={<QuotationTemplateForm />} />
              <Route path="/admin/quotation-templates/:templateId" element={<QuotationTemplateDetails />} />
              <Route path="/admin/quotation-templates/:templateId/edit" element={<QuotationTemplateForm />} />

              {/* Quotations */}
              <Route path="/admin/quotations" element={<Quotations basePath="/admin/quotations" />} />
              <Route path="/admin/quotations/new" element={<QuotationForm basePath="/admin/quotations" />} />
              <Route path="/admin/quotations/:quotationId" element={<QuotationDetails backPath="/admin/quotations" />} />

              {/* Subscriptions */}
              <Route path="/admin/subscriptions" element={<Subscriptions basePath="/admin/subscriptions" />} />
              <Route path="/admin/subscriptions/:subscriptionId" element={<SubscriptionDetails backPath="/admin/subscriptions" />} />

              {/* Invoicing, Taxes & Team */}
              <Route path="/admin/taxes" element={<AdminTaxes />} />
              <Route path="/admin/discounts" element={<AdminDiscounts />} />
              <Route path="/admin/invoices" element={<AdminInvoices basePath="/admin/invoices" />} />
              <Route path="/admin/invoices/:invoiceId" element={<InvoiceDetails backPath="/admin/invoices" />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/team" element={<AdminStaff />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>
          </Route>

          {/* STAFF Routes */}
          <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
            <Route element={<AppLayout />}>
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/customers" element={<StaffCustomers />} />
              <Route path="/staff/customers/:customerId" element={<AdminCustomerDetails backPath="/staff/customers" />} />

              {/* Staff Quotations */}
              <Route path="/staff/quotations" element={<Quotations basePath="/staff/quotations" />} />
              <Route path="/staff/quotations/new" element={<QuotationForm basePath="/staff/quotations" />} />
              <Route path="/staff/quotations/:quotationId" element={<QuotationDetails backPath="/staff/quotations" />} />

              {/* Staff Subscriptions */}
              <Route path="/staff/subscriptions" element={<Subscriptions basePath="/staff/subscriptions" />} />
              <Route path="/staff/subscriptions/:subscriptionId" element={<SubscriptionDetails backPath="/staff/subscriptions" />} />

              {/* Staff Invoices & Operations */}
              <Route path="/staff/invoices" element={<AdminInvoices basePath="/staff/invoices" />} />
              <Route path="/staff/invoices/:invoiceId" element={<InvoiceDetails backPath="/staff/invoices" />} />
              <Route path="/staff/payments" element={<AdminPayments />} />
              <Route path="/staff/overdue" element={<StaffOverdue />} />
            </Route>
          </Route>

          {/* CUSTOMER Routes */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']} />}>
            <Route element={<AppLayout />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />

              {/* Customer Quotations & Subscriptions */}
              <Route path="/customer/quotations" element={<Quotations basePath="/customer/quotations" />} />
              <Route path="/customer/quotations/:quotationId" element={<QuotationDetails backPath="/customer/quotations" />} />
              <Route path="/customer/subscriptions" element={<Subscriptions basePath="/customer/subscriptions" />} />
              <Route path="/customer/subscriptions/:subscriptionId" element={<SubscriptionDetails backPath="/customer/subscriptions" />} />

              {/* Billing & Profile */}
              <Route path="/customer/invoices" element={<CustomerInvoices />} />
              <Route path="/customer/invoices/:invoiceId" element={<InvoiceDetails backPath="/customer/invoices" />} />
              <Route path="/customer/payments" element={<CustomerPayments />} />
              <Route path="/customer/profile" element={<CustomerProfile />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
