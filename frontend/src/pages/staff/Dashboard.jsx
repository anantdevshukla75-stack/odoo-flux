import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  RefreshCw,
  Receipt,
  AlertTriangle,
  CreditCard,
  Plus,
  UserPlus,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import StatCard from '../../components/common/StatCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function Dashboard() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardSummary, c, q, s, inv, p] = await Promise.all([
          apiService.getDashboardSummary(),
          apiService.getCustomers(),
          apiService.getQuotations().catch(() => []),
          apiService.getSubscriptions(),
          apiService.getInvoices(),
          apiService.getPayments()
        ]);
        setSummary(dashboardSummary);
        setCustomers(c);
        setQuotations(q);
        setSubscriptions(s);
        setInvoices(inv);
        setPayments(p);
      } catch (error) {
        setLoadError(error?.message || 'Could not load the operations dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingQuotes = quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT');
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');
  const unpaidInvoices = invoices.filter(i => i.balance > 0 && !['CANCELLED', 'PAID', 'DRAFT'].includes(i.status));
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE' && i.balance > 0);

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading operations dashboard…</div>;
  if (loadError) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations & Billing Desk"
        description="Daily operational queue for commercial proposals, customer onboarding, invoice settlements, and collection follow-ups."
      />

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Operational Quick Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/staff/quotations')}
            className="w-full justify-start py-2.5"
          >
            Create Quotation
          </Button>

          <Button
            variant="secondary"
            icon={UserPlus}
            onClick={() => navigate('/staff/customers')}
            className="w-full justify-start py-2.5"
          >
            Add Customer
          </Button>

          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => navigate('/staff/subscriptions')}
            className="w-full justify-start py-2.5"
          >
            View Subscriptions
          </Button>

          <Button
            variant="secondary"
            icon={CreditCard}
            onClick={() => navigate('/staff/payments')}
            className="w-full justify-start py-2.5"
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* 6 Operational Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Customer Accounts"
          value={customers.length}
          icon={Users}
          helperText="Customer records"
        />
        <StatCard
          label="Pending Quotes"
          value={pendingQuotes.length}
          icon={FileText}
          helperText="Awaiting customer sign-off"
        />
        <StatCard
          label="Active Subscriptions"
          value={activeSubs.length}
          icon={RefreshCw}
          helperText="Contracted services"
        />
        <StatCard
          label="Unpaid Invoices"
          value={unpaidInvoices.length}
          icon={Receipt}
          helperText="Current receivables"
        />
        <StatCard
          label="Overdue Invoices"
          value={summary?.overdueInvoices ?? overdueInvoices.length}
          icon={AlertTriangle}
          trend={overdueInvoices.length > 0 ? 'Dunning Active' : 'All clear'}
          trendDirection={overdueInvoices.length > 0 ? 'down' : 'up'}
          helperText="Follow-up needed"
        />
        <StatCard
          label="Recorded Payments"
          value={payments.length}
          icon={CreditCard}
          helperText="Payments on file"
        />
      </div>

      {/* Operational Grids: Overdue Invoices & Pending Quotations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Accounts Queue */}
        <div className="bg-white rounded-xl border border-red-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 flex items-center justify-between border-b border-red-100 bg-red-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div>
                <h3 className="text-sm font-semibold text-red-950">Overdue Invoices Requiring Outreach</h3>
                <p className="text-[11px] text-red-700">Review aged invoices and record account payments</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/staff/overdue')}
            >
              Open AR Desk
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueInvoices.length > 0 ? (
                  overdueInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900">{inv.customerName}</td>
                      <td className="px-5 py-3 text-xs text-red-600 font-mono">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3 font-bold text-red-600 text-right">{formatCurrency(inv.balance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-emerald-600 font-medium">
                      ✓ No overdue accounts in your queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Proposals Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Commercial Quotations Under Review</h3>
                <p className="text-[11px] text-slate-500">Track client decisions and quote expirations</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/staff/quotations')}
            >
              All Quotes
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Proposal #</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Total Value</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-indigo-600">{q.quotationNumber}</td>
                    <td className="px-5 py-3 text-slate-800">{q.customerName}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{formatCurrency(q.total)}</td>
                    <td className="px-5 py-3 text-right">
                      <StatusBadge status={q.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

