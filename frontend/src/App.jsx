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
import Discounts from './pages/admin/Discounts.jsx';
import DiscountForm from './pages/admin/DiscountForm.jsx';
import Invoices from './pages/admin/Invoices.jsx';
import InvoiceDetails from './pages/admin/InvoiceDetails.jsx';
import InvoicePrint from './pages/admin/InvoicePrint.jsx';
import Payments from './pages/admin/Payments.jsx';
import AdminStaff from './pages/admin/Staff.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard.jsx';
import StaffCustomers from './pages/staff/Customers.jsx';
import StaffOverdue from './pages/staff/StaffOverdue.jsx';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import CustomerQuotations from './pages/customer/CustomerQuotations.jsx';
import CustomerSubscriptions from './pages/customer/CustomerSubscriptions.jsx';
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
              <Route path="/admin/discounts" element={<Discounts />} />
              <Route path="/admin/discounts/new" element={<DiscountForm />} />
              <Route path="/admin/discounts/:discountId/edit" element={<DiscountForm />} />
              <Route path="/admin/invoices" element={<Invoices basePath="/admin/invoices" />} />
              <Route path="/admin/invoices/:invoiceId" element={<InvoiceDetails backPath="/admin/invoices" />} />
              <Route path="/admin/payments" element={<Payments basePath="/admin/payments" />} />
              <Route path="/admin/team" element={<AdminStaff />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>
          </Route>

          {/* Dedicated Print Routes (Chrome-free print layout) */}
          <Route path="/admin/invoices/:invoiceId/print" element={<InvoicePrint />} />
          <Route path="/staff/invoices/:invoiceId/print" element={<InvoicePrint />} />
          <Route path="/customer/invoices/:invoiceId/print" element={<InvoicePrint />} />

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
              <Route path="/staff/invoices" element={<Invoices basePath="/staff/invoices" />} />
              <Route path="/staff/invoices/:invoiceId" element={<InvoiceDetails backPath="/staff/invoices" />} />
              <Route path="/staff/payments" element={<Payments basePath="/staff/payments" />} />
              <Route path="/staff/overdue" element={<StaffOverdue />} />
            </Route>
          </Route>

          {/* CUSTOMER Routes */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']} />}>
            <Route element={<AppLayout />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />

              {/* Customer Quotations & Subscriptions */}
              <Route path="/customer/quotations" element={<CustomerQuotations />} />
              <Route path="/customer/quotations/:quotationId" element={<CustomerQuotations />} />
              <Route path="/customer/subscriptions" element={<CustomerSubscriptions />} />
              <Route path="/customer/subscriptions/:subscriptionId" element={<CustomerSubscriptions />} />

              {/* Billing & Profile */}
              <Route path="/customer/invoices" element={<Invoices basePath="/customer/invoices" />} />
              <Route path="/customer/invoices/:invoiceId" element={<InvoiceDetails backPath="/customer/invoices" />} />
              <Route path="/customer/payments" element={<Payments basePath="/customer/payments" />} />
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
