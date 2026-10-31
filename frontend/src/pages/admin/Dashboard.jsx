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
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
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
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

const SUBSCRIPTION_STATUS_DATA = [
  { name: 'Active', value: 24, color: '#10B981' },
  { name: 'Paused', value: 4, color: '#0ea5e9' },
  { name: 'Closed', value: 2, color: '#94a3b8' }
];

export function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('6M');

  useEffect(() => {
    async function loadData() {
      const [m, c, s, inv, q, p] = await Promise.all([
        mockDataService.getMetrics(),
        mockDataService.getCustomers(),
        mockDataService.getSubscriptions(),
        mockDataService.getInvoices(),
        mockDataService.getQuotations(),
        mockDataService.getPayments()
      ]);

      setMetrics(m);
      setCustomers(c);
      setSubscriptions(s);
      setInvoices(inv);
      setQuotations(q);
      setPayments(p);
    }
    loadData();
  }, []);

  if (!metrics) return null;

  // Derive summary metrics from data
  const totalOutstanding = invoices.reduce((acc, i) => acc + (Number(i.balance) || 0), 0);
  const overdueList = invoices.filter(i => i.status === 'OVERDUE');
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');

  // Upcoming billing (next 30 days)
  const upcomingBilling = subscriptions.slice(0, 4);

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
          value={activeSubs.length || metrics.activeSubscriptions}
          icon={RefreshCw}
          trend="+8.4%"
          trendDirection="up"
          helperText="healthy retention"
        />
        <StatCard
          label="Revenue Collected"
          value={formatCurrency(metrics.revenueTotal)}
          icon={DollarSign}
          trend="+14.2%"
          trendDirection="up"
          helperText="vs last period"
        />
        <StatCard
          label="Outstanding Amount"
          value={formatCurrency(totalOutstanding)}
          icon={Clock}
          helperText="Receivables pending"
        />
        <StatCard
          label="Overdue Invoices"
          value={overdueList.length}
          icon={AlertTriangle}
          trend={overdueList.length > 0 ? `${overdueList.length} critical` : 'All clear'}
          trendDirection={overdueList.length > 0 ? 'down' : 'up'}
          helperText="Immediate action"
        />
        <StatCard
          label="Total Customers"
          value={customers.length}
          icon={Users}
          trend="+2 new"
          trendDirection="up"
          helperText="Enterprise accounts"
        />
        <StatCard
          label="Total Invoices"
          value={invoices.length}
          icon={Receipt}
          helperText="Issued billing cycles"
        />
      </div>

      {/* 2. Charts Section: Revenue Area Chart + Subscription Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Monthly Recurring Revenue Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Historical monthly cash collections and compounded MRR baseline
              </p>
            </div>
            {/* Date / Period Filter */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              {['6M', 'YTD', '1Y'].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setChartPeriod(period)}
                  className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                    chartPeriod === period
                      ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyRevenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v), name === 'mrr' ? 'MRR' : 'Revenue']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#areaRevenue)" />
                <Area type="monotone" dataKey="mrr" name="MRR Base" stroke="#06B6D4" strokeWidth={2} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Distribution Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Subscription Status Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Active, paused, and closed customer contracts
            </p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SUBSCRIPTION_STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {SUBSCRIPTION_STATUS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} contracts`, name]}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
            <div>
              <div className="text-slate-400">Active</div>
              <div className="font-bold text-emerald-600 text-sm">24</div>
            </div>
            <div>
              <div className="text-slate-400">Paused</div>
              <div className="font-bold text-sky-600 text-sm">4</div>
            </div>
            <div>
              <div className="text-slate-400">Closed</div>
              <div className="font-bold text-slate-500 text-sm">2</div>
            </div>
          </div>
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

