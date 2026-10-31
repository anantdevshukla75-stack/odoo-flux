import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  RefreshCw,
  AlertTriangle,
  Receipt,
  FileText,
  CreditCard,
  Plus,
  ArrowUpRight,
  Clock,
  Calendar
} from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import StatCard from '../../components/common/StatCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

const SUBSCRIPTION_STATUS_COLORS = {
  ACTIVE: '#10B981',
  CONFIRMED: '#6366F1',
  PAUSED: '#0ea5e9',
  DRAFT: '#f59e0b',
  QUOTATION: '#8b5cf6',
  CLOSED: '#94a3b8'
};

export function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardSummary, c, s, inv, q, p] = await Promise.all([
          apiService.getDashboardSummary(),
          apiService.getCustomers(),
          apiService.getSubscriptions(),
          apiService.getInvoices(),
          mockDataService.getQuotations(),
          apiService.getPayments()
        ]);

        setSummary(dashboardSummary);
        setCustomers(c);
        setSubscriptions(s);
        setInvoices(inv);
        setQuotations(q);
        setPayments(p);
      } catch (error) {
        setLoadError(error?.message || 'Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading dashboard…</div>;
  if (loadError) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
        {loadError}
      </div>
    );
  }

  const overdueList = invoices.filter((invoice) => invoice.status === 'OVERDUE' && invoice.balance > 0);
  const subscriptionStatusData = Object.entries(
    subscriptions.reduce((counts, subscription) => {
      counts[subscription.status] = (counts[subscription.status] || 0) + 1;
      return counts;
    }, {})
  ).map(([status, value]) => ({
    name: status.charAt(0) + status.slice(1).toLowerCase(),
    value,
    color: SUBSCRIPTION_STATUS_COLORS[status] || '#64748b'
  }));

  const upcomingBilling = subscriptions
    .filter((subscription) => subscription.status === 'ACTIVE' && subscription.nextBillingDate)
    .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Revenue & Operations Dashboard"
        description="Comprehensive real-time tracking of subscription contracts, billing cycles, and cash reconciliation."
      >
        <Button
          variant="secondary"
          icon={Plus}
          onClick={() => navigate('/admin/quotations')}
        >
          New Quotation
        </Button>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/admin/plans')}
        >
          Create Plan
        </Button>
      </PageHeader>

      {/* 1. Six Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Active Subscriptions"
          value={summary.activeSubscriptions}
          icon={RefreshCw}
          helperText="Current active contracts"
        />
        <StatCard
          label="Revenue Collected"
          value={formatCurrency(summary.totalCollected)}
          icon={DollarSign}
          helperText="Payments recorded"
        />
        <StatCard
          label="Outstanding Amount"
          value={formatCurrency(summary.outstandingAmount)}
          icon={Clock}
          helperText="Unpaid billable invoices"
        />
        <StatCard
          label="Overdue Invoices"
          value={summary.overdueInvoices}
          icon={AlertTriangle}
          helperText={`${formatCurrency(summary.overdueAmount)} overdue`}
        />
        <StatCard
          label="Total Customers"
          value={customers.length}
          icon={Users}
          helperText="Customer accounts"
        />
        <StatCard
          label="Total Invoices"
          value={invoices.length}
          icon={Receipt}
          helperText="Invoices on file"
        />
      </div>

      {/* Billing totals and live subscription distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900">Billing Summary</h3>
            <p className="text-xs text-slate-500">Backend totals as of {formatDate(summary.asOf)}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Total Invoiced</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(summary.totalInvoiced)}</div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <div className="text-xs text-emerald-700">Total Collected</div>
              <div className="mt-1 text-xl font-bold text-emerald-800">{formatCurrency(summary.totalCollected)}</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <div className="text-xs text-amber-700">Outstanding</div>
              <div className="mt-1 text-xl font-bold text-amber-800">{formatCurrency(summary.outstandingAmount)}</div>
            </div>
            <div className="rounded-lg bg-rose-50 p-4">
              <div className="text-xs text-rose-700">Overdue ({summary.overdueInvoices} invoices)</div>
              <div className="mt-1 text-xl font-bold text-rose-800">{formatCurrency(summary.overdueAmount)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Subscription Status Distribution</h3>
            <p className="text-xs text-slate-500">Current contracts from the subscription API</p>
          </div>
          {subscriptionStatusData.length > 0 ? (
            <>
              <div className="h-52 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subscriptionStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {subscriptionStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} contracts`, name]} />
                    <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
                {['ACTIVE', 'PAUSED', 'CLOSED'].map((status) => (
                  <div key={status}>
                    <div className="text-slate-400">{status.charAt(0) + status.slice(1).toLowerCase()}</div>
                    <div className="font-bold text-slate-700 text-sm">
                      {subscriptions.filter((subscription) => subscription.status === status).length}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">No subscriptions to display.</div>
          )}
        </div>
      </div>

      {/* 3. Operational Tables: Upcoming Billing & Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Billing */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Upcoming Billing Cycles</h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/subscriptions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Subscription</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Next Billing</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingBilling.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900">{sub.subscriptionNumber}</td>
                    <td className="px-5 py-3 text-slate-700">{sub.customerName}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(sub.nextBillingDate)}</td>
                    <td className="px-5 py-3 font-bold text-slate-900 text-right">{formatCurrency(sub.recurringAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-red-50/40">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-semibold text-red-950">Overdue Invoices Requiring Follow-Up</h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/invoices')}
              className="text-xs font-semibold text-red-700 hover:text-red-800 inline-flex items-center gap-1 cursor-pointer"
            >
              Invoices <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueList.length > 0 ? (
                  overdueList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-semibold text-red-600">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3 text-slate-800">{inv.customerName}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3 font-bold text-red-600 text-right">{formatCurrency(inv.balance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-xs text-emerald-600 font-medium">
                      ✓ No overdue accounts at this moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Recent Activity: 4 Quadrants (Quotations, Subscriptions, Invoices, Payments) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recent Quotations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Quotes</h4>
            </div>
            <button onClick={() => navigate('/admin/quotations')} className="text-indigo-600 hover:text-indigo-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {quotations.slice(0, 3).map((q) => (
              <div key={q.id} className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 truncate max-w-[130px]">{q.customerName}</div>
                  <div className="text-[10px] text-slate-400">{q.quotationNumber}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatCurrency(q.total)}</div>
                  <StatusBadge status={q.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Subscriptions</h4>
            </div>
            <button onClick={() => navigate('/admin/subscriptions')} className="text-indigo-600 hover:text-indigo-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {subscriptions.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 truncate max-w-[130px]">{s.customerName}</div>
                  <div className="text-[10px] text-slate-400">{s.subscriptionNumber}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatCurrency(s.recurringAmount)}</div>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Invoices</h4>
            </div>
            <button onClick={() => navigate('/admin/invoices')} className="text-indigo-600 hover:text-indigo-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {invoices.slice(0, 3).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 truncate max-w-[130px]">{inv.customerName}</div>
                  <div className="text-[10px] text-slate-400">{inv.invoiceNumber}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</div>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Payments</h4>
            </div>
            <button onClick={() => navigate('/admin/payments')} className="text-indigo-600 hover:text-indigo-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {payments.slice(0, 3).map((pay) => (
              <div key={pay.id} className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 truncate max-w-[130px]">{pay.customerName}</div>
                  <div className="text-[10px] text-slate-400">{pay.paymentNumber}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">{formatCurrency(pay.amount)}</div>
                  <span className="text-[10px] text-slate-400">{pay.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

