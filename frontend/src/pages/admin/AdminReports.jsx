import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  DollarSign,
  Download,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Button from '../../components/common/Button.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function AdminReports() {
  const [sourceData, setSourceData] = useState(null);
  const [timeframe, setTimeframe] = useState('6M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [summary, subscriptions, invoices, payments] = await Promise.all([
          apiService.getDashboardSummary(),
          apiService.getSubscriptions(),
          apiService.getInvoices(),
          apiService.getPayments()
        ]);
        setSourceData({ summary, subscriptions, invoices, payments });
      } catch (err) {
        setError(err?.message || 'Could not load financial report data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const buildMetrics = () => {
    if (!sourceData) return null;
    const now = new Date();
    const monthCount = timeframe === '3M' ? 3 : timeframe === 'YTD' ? now.getMonth() + 1 : timeframe === '1Y' ? 12 : 6;
    const firstMonth = timeframe === 'YTD'
      ? new Date(now.getFullYear(), 0, 1)
      : new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1);
    const monthKeys = Array.from({ length: monthCount }, (_, index) => {
      const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        month: date.toLocaleDateString('en-US', { month: 'short' })
      };
    });
    const revenueByMonth = new Map(monthKeys.map(({ key }) => [key, 0]));

    sourceData.payments.forEach((payment) => {
      const date = new Date(payment.paymentDate);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (revenueByMonth.has(key)) {
        revenueByMonth.set(key, revenueByMonth.get(key) + Number(payment.amount || 0));
      }
    });

    const activeSubscriptions = sourceData.subscriptions.filter((subscription) => subscription.status === 'ACTIVE');
    const mrr = activeSubscriptions.reduce((total, subscription) => {
      const amount = Number(subscription.recurringAmount) || 0;
      const interval = String(subscription.billingInterval || 'MONTHLY').toUpperCase();
      if (interval === 'YEARLY') return total + amount / 12;
      if (interval === 'WEEKLY') return total + amount * (52 / 12);
      if (interval === 'DAILY') return total + amount * (365 / 12);
      return total + amount;
    }, 0);

    const planCounts = new Map();
    activeSubscriptions.forEach(({ planName }) => {
      const key = planName || 'Unspecified Plan';
      planCounts.set(key, (planCounts.get(key) || 0) + 1);
    });
    const colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'];
    const planDistribution = [...planCounts].map(([name, value], index) => ({
      name,
      value,
      fill: colors[index % colors.length]
    }));

    const agingBuckets = [
      { bucket: 'Not Due', amount: 0, count: 0, color: '#10B981' },
      { bucket: '1–30 Days Past Due', amount: 0, count: 0, color: '#F59E0B' },
      { bucket: '31–60 Days Past Due', amount: 0, count: 0, color: '#F97316' },
      { bucket: '61+ Days Past Due', amount: 0, count: 0, color: '#EF4444' }
    ];
    const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
    sourceData.invoices.filter((invoice) => invoice.balance > 0).forEach((invoice) => {
      const due = new Date(`${invoice.dueDate}T00:00:00Z`);
      const daysPastDue = Math.floor((today - due) / 86400000);
      const index = daysPastDue <= 0 ? 0 : daysPastDue <= 30 ? 1 : daysPastDue <= 60 ? 2 : 3;
      agingBuckets[index].amount += Number(invoice.balance) || 0;
      agingBuckets[index].count += 1;
    });
    const receivableTotal = agingBuckets.reduce((total, item) => total + item.amount, 0);
    agingBuckets.forEach((item) => {
      item.percentage = receivableTotal ? (item.amount / receivableTotal) * 100 : 0;
    });

    return {
      revenueTotal: sourceData.summary.totalCollected,
      arr: mrr * 12,
      mrr,
      activeSubscriptions: sourceData.summary.activeSubscriptions,
      outstandingAmount: sourceData.summary.outstandingAmount,
      overdueInvoicesCount: sourceData.summary.overdueInvoices,
      overdueAmount: sourceData.summary.overdueAmount,
      monthlyRevenueChart: monthKeys.map(({ key, month }) => ({ month, revenue: revenueByMonth.get(key) || 0 })),
      planDistribution,
      arAging: agingBuckets
    };
  };

  const metrics = buildMetrics();

  const handleExportCSV = () => {
    if (!metrics) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Collected (All Time)', metrics.revenueTotal],
      ['Annual Recurring Revenue (ARR, current run rate)', metrics.arr],
      ['Monthly Recurring Revenue (MRR, current run rate)', metrics.mrr],
      ['Outstanding Receivables', metrics.outstandingAmount],
      ['Overdue Invoice Count', metrics.overdueInvoicesCount],
      ['Overdue Receivables', metrics.overdueAmount],
      ['Active Subscriptions', metrics.activeSubscriptions],
      [],
      ['Month', 'Collected Revenue ($)'],
      ...metrics.monthlyRevenueChart.map(m => [m.month, m.revenue]),
      [],
      ['Active Plan Name', 'Active Subscriptions Count'],
      ...metrics.planDistribution.map(p => [p.name, p.value]),
      [],
      ['AR Aging Bucket', 'Amount ($)', 'Invoice Count'],
      ...(metrics.arAging || []).map(a => [a.bucket, a.amount, a.count])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `brightloop_financial_intelligence_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading financial reports…</div>;
  if (error) {
    return <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">{error}</div>;
  }
  if (!metrics) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Financial & Revenue Intelligence"
        description="Payment, subscription, and receivables reporting derived from current API records."
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px' }}>
            {['3M', '6M', 'YTD', '1Y'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '0.25rem 0.625rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '6px',
                  background: timeframe === t ? '#FFFFFF' : 'transparent',
                  color: timeframe === t ? 'var(--primary)' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: timeframe === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <Button
            variant="primary"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export Financial Report
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards Strip */}
      <div className="stat-card-grid">
        <StatCard
          label="Total Collected"
          value={formatCurrency(metrics.revenueTotal)}
          icon={DollarSign}
          helperText="All recorded payments"
        />
        <StatCard
          label="Annual Recurring Run Rate"
          value={formatCurrency(metrics.arr)}
          icon={TrendingUp}
          helperText="Annualized from active subscriptions"
        />
        <StatCard
          label="Outstanding Receivables"
          value={formatCurrency(metrics.outstandingAmount)}
          icon={ShieldAlert}
          helperText="Open billable invoices"
        />
        <StatCard
          label="Overdue Invoices"
          value={metrics.overdueInvoicesCount}
          icon={PieChartIcon}
          helperText={formatCurrency(metrics.overdueAmount)}
        />
      </div>

      {/* Row 1: Monthly Cashflow & Subscription Plan Share */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem' }}>
        {/* Cashflow bar chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Collected Payments by Month</h3>
              <p className="card-subtitle">Recorded payment amounts within the selected period</p>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyRevenueChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Settled payments']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#4F46E5" name="Collected Payments" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plan Distribution Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Active Subscriptions by Plan</h3>
              <p className="card-subtitle">Current active account counts</p>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.planDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#4F46E5'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Accounts`, name]}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Receivables aging derived from open API invoices */}
      <div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Accounts Receivable Aging Schedule</h3>
              <p className="card-subtitle">Outstanding unpaid invoices grouped by aging risk category</p>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(metrics.arAging || []).map((item, idx) => (
              <div key={idx} style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                    {item.bucket}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: item.amount > 0 ? item.color : '#64748B' }}>
                      {formatCurrency(item.amount)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '0.5rem' }}>
                      ({item.count} {item.count === 1 ? 'inv' : 'invs'})
                    </span>
                  </div>
                </div>

                {/* Visual Progress Meter */}
                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${item.percentage || 0}%`,
                      background: item.color,
                      borderRadius: '9999px'
                    }}
                  />
                </div>
              </div>
            ))}

            <div style={{ padding: '0.75rem', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', fontSize: '0.75rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <ShieldAlert size={16} />
              <span>
                Total outstanding balance: <strong>{formatCurrency(metrics.outstandingAmount)}</strong> across open receivables.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
