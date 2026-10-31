import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  RefreshCw,
  AlertTriangle,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import StatCard from '../../components/common/StatCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [recentSubscriptions, setRecentSubscriptions] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    async function loadData() {
      const m = await mockDataService.getMetrics();
      const s = await mockDataService.getSubscriptions();
      const i = await mockDataService.getInvoices();
      setMetrics(m);
      setRecentSubscriptions(s.slice(0, 4));
      setRecentInvoices(i.slice(0, 4));
    }
    loadData();
  }, []);

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Revenue Dashboard"
        description="Comprehensive real-time overview of subscriptions, recurring billing cashflow, and retention health."
      >
        <Button
          variant="secondary"
          onClick={() => navigate('/admin/quotations')}
          icon={Plus}
        >
          New Quotation
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate('/admin/plans')}
          icon={Plus}
        >
          Create Plan
        </Button>
      </PageHeader>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          icon={DollarSign}
          trend={metrics.mrrGrowth}
          trendDirection="up"
          helperText="vs last month"
        />
        <StatCard
          label="Active Subscriptions"
          value={metrics.activeSubscriptions}
          icon={RefreshCw}
          trend={metrics.subscriptionsGrowth}
          trendDirection="up"
          helperText="healthy retention"
        />
        <StatCard
          label="Annual Run Rate (ARR)"
          value={formatCurrency(metrics.arr)}
          icon={DollarSign}
          helperText="Projected cashflow"
        />
        <StatCard
          label="Overdue Invoices"
          value={metrics.overdueInvoicesCount}
          icon={AlertTriangle}
          trend={formatCurrency(metrics.overdueAmount)}
          trendDirection="down"
          helperText="Action required"
        />
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Recurring Revenue Growth (MRR Trajectory)
            </h3>
            <p className="text-xs text-slate-500">
              Monthly compounding revenue across all active customer tiers
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyRevenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'MRR']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="mrr" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Active Plan Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Total subscribers by pricing package
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.planDistribution} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={100} tickLine={false} />
                <Tooltip
                  formatter={(val) => [val, 'Subscribers']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions & Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Subscriptions</h3>
            <button
              type="button"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
              onClick={() => navigate('/admin/subscriptions')}
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Subscriber</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{sub.customerName}</div>
                      <div className="text-xs text-slate-400">{sub.subscriptionNumber}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{sub.planName}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{formatCurrency(sub.recurringAmount)}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={sub.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Invoices</h3>
            <button
              type="button"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
              onClick={() => navigate('/admin/invoices')}
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-xs text-slate-400">Due {formatDate(inv.dueDate)}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{inv.customerName}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={inv.status} /></td>
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

export default AdminDashboard;
