import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  FileText,
  RefreshCw,
  Receipt,
  CreditCard,
  Edit,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function CustomerDetails({ backPath = '/admin/customers' }) {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    taxId: '',
    billingAddress: ''
  });

  const loadData = async () => {
    const details = await mockDataService.getCustomerDetails(customerId);
    if (details) {
      setData(details);
      setEditFormData({
        fullName: details.customer.fullName,
        companyName: details.customer.companyName || '',
        phone: details.customer.phone || '',
        taxId: details.customer.taxId || '',
        billingAddress: details.customer.billingAddress || ''
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  if (!data) {
    return <LoadingState message="Loading customer account profile..." />;
  }

  const { customer, subscriptions, invoices, quotations, payments, outstandingBalance, totalPayments } = data;

  const handleEditSubmit = (e) => {
    e.preventDefault();
    // Update local state in demo mode
    setData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        ...editFormData
      }
    }));
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
              {customer.fullName[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{customer.fullName}</h1>
                <StatusBadge status={customer.status || 'ACTIVE'} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {customer.companyName || 'No Company Registered'}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {customer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={Edit}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Subscriptions"
          value={subscriptions.filter(s => s.status === 'ACTIVE').length}
          icon={RefreshCw}
          helperText="Recurring contracts"
        />
        <StatCard
          label="Total Invoices"
          value={invoices.length}
          icon={Receipt}
          helperText="All billing cycles"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(outstandingBalance)}
          icon={Receipt}
          trend={outstandingBalance > 0 ? 'Payment pending' : 'Zero balance'}
          trendDirection={outstandingBalance > 0 ? 'down' : 'up'}
          helperText="Unsettled balance"
        />
        <StatCard
          label="Total Payments"
          value={formatCurrency(totalPayments)}
          icon={CreditCard}
          trend="Lifetime realized"
          trendDirection="up"
          helperText="Verified collections"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-sm font-medium">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'quotations', label: `Quotations (${quotations.length})` },
            { id: 'subscriptions', label: `Subscriptions (${subscriptions.length})` },
            { id: 'invoices', label: `Invoices (${invoices.length})` },
            { id: 'payments', label: `Payments (${payments.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 border-b-2 font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Billing & Statutory Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Corporate Tax Registration ID</span>
                <span className="font-mono font-medium text-slate-800">{customer.taxId || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Formal Billing Address</span>
                <span className="text-slate-800 leading-relaxed block">{customer.billingAddress || 'No billing address recorded'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Customer Onboarding Timestamp</span>
                <span className="text-slate-700 text-xs">{formatDate(customer.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Primary Commercial Plan
            </h3>
            {subscriptions.length > 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{subscriptions[0].planName}</span>
                  <StatusBadge status={subscriptions[0].status} />
                </div>
                <div className="text-xs text-slate-500">
                  Cadence: <strong className="text-slate-800 capitalize">{subscriptions[0].billingInterval.toLowerCase()}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Next Renewal: <strong className="text-slate-800">{formatDate(subscriptions[0].nextBillingDate)}</strong>
                </div>
                <div className="text-sm font-bold text-indigo-600 pt-1">
                  {formatCurrency(subscriptions[0].recurringAmount)} / cycle
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active subscriptions on file for this account.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3">Quote #</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3">Valid Until</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.length > 0 ? (
                quotations.map(q => (
                  <tr key={q.id}>
                    <td className="px-6 py-3 font-semibold text-slate-900">{q.quotationNumber}</td>
                    <td className="px-6 py-3 text-slate-700">{q.planName}</td>
                    <td className="px-6 py-3 font-bold text-slate-900">{formatCurrency(q.total)}</td>
                    <td className="px-6 py-3 text-xs text-slate-500">{formatDate(q.validUntil)}</td>
                    <td className="px-6 py-3 text-right"><StatusBadge status={q.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-xs text-slate-500">No quotation proposals on record.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3">Subscription #</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Recurring</th>
                <th className="px-6 py-3">Next Billing</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length > 0 ? (
                subscriptions.map(s => (
                  <tr key={s.id}>
                    <td className="px-6 py-3 font-semibold text-slate-900">{s.subscriptionNumber}</td>
                    <td className="px-6 py-3 text-slate-700">{s.planName}</td>
                    <td className="px-6 py-3 font-bold text-slate-900">{formatCurrency(s.recurringAmount)}</td>
                    <td className="px-6 py-3 text-xs text-slate-500">{formatDate(s.nextBillingDate)}</td>
                    <td className="px-6 py-3 text-right"><StatusBadge status={s.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-xs text-slate-500">No subscriptions created for this customer.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Issued Date</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3">Balance</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? (
                invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="px-6 py-3 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-3 text-xs text-slate-500">{formatDate(inv.issueDate)}</td>
                    <td className="px-6 py-3 text-xs text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-6 py-3 font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-6 py-3 font-semibold text-red-600">{formatCurrency(inv.balance)}</td>
                    <td className="px-6 py-3 text-right"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-slate-500">No invoices issued.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3">Payment #</th>
                <th className="px-6 py-3">Invoice Ref</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">External Ref</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length > 0 ? (
                payments.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-3 font-semibold text-slate-900">{p.paymentNumber}</td>
                    <td className="px-6 py-3 text-xs font-mono text-indigo-600">{p.invoiceNumber}</td>
                    <td className="px-6 py-3 text-xs font-medium text-slate-700">{p.paymentMethod}</td>
                    <td className="px-6 py-3 text-xs font-mono text-slate-400">{p.reference || '—'}</td>
                    <td className="px-6 py-3 font-bold text-emerald-600 text-right">{formatCurrency(p.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-xs text-slate-500">No payment records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer Profile"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Contact Full Name"
            value={editFormData.fullName}
            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
            required
          />

          <Input
            label="Company Name"
            value={editFormData.companyName}
            onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
            required
          />

          <Input
            label="Contact Phone"
            value={editFormData.phone}
            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
          />

          <Input
            label="Corporate Tax ID / VAT Registration"
            value={editFormData.taxId}
            onChange={(e) => setEditFormData({ ...editFormData, taxId: e.target.value })}
          />

          <Input
            label="Billing Invoicing Address"
            value={editFormData.billingAddress}
            onChange={(e) => setEditFormData({ ...editFormData, billingAddress: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CustomerDetails;

