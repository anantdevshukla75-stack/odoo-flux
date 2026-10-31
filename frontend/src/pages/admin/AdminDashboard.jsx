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
    <div>
      <PageHeader
        title="Executive Revenue Dashboard"
        description="Comprehensive real-time overview of subscriptions, cashflow, and recurring billing health."
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

      {/* Metric Cards */}
      <div className="stat-card-grid">
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
          helperText="Projected annualized cashflow"
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

      {/* Visual Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recurring Revenue Growth (MRR Trend)</h3>
              <p className="card-subtitle">Monthly trajectory over the past 2 quarters</p>
            </div>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyRevenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#4F46E5" stop-opacity={0.3}/>
                    <stop offset="95%" stop-color="#4F46E5" stop-opacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'MRR']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="mrr" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Active Plan Distribution</h3>
              <p className="card-subtitle">Subscribers by package tier</p>
            </div>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.planDistribution} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={110} tickLine={false} />
                <Tooltip
                  formatter={(val) => [val, 'Subscribers']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions & Invoices Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Subscriptions</h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/admin/subscriptions')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSubscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sub.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {sub.subscriptionNumber}
                      </div>
                    </td>
                    <td>{sub.planName}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(sub.recurringAmount)}</td>
                    <td><StatusBadge status={sub.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Invoices</h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/admin/invoices')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.invoiceNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Due {formatDate(inv.dueDate)}
                      </div>
                    </td>
                    <td>{inv.customerName}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                    <td><StatusBadge status={inv.status} /></td>
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
