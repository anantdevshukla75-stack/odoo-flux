import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  DollarSign,
  Download,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function AdminReports() {
  const [metrics, setMetrics] = useState(null);
  const [timeframe, setTimeframe] = useState('6M');

  useEffect(() => {
    async function load() {
      const m = await mockDataService.getMetrics();
      setMetrics(m);
    }
    load();
  }, []);

  const handleExportCSV = () => {
    if (!metrics) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Realized Revenue (YTD)', metrics.revenueTotal],
      ['Annual Recurring Revenue (ARR)', metrics.arr],
      ['Monthly Recurring Revenue (MRR)', metrics.mrr],
      ['Gross Churn Rate', '1.2%'],
      ['Net Revenue Retention (NRR)', '118%'],
      ['Active Subscriptions', metrics.activeSubscriptions],
      [],
      ['Month', 'MRR ($)', 'Collected Revenue ($)'],
      ...metrics.monthlyRevenueChart.map(m => [m.month, m.mrr, m.revenue]),
      [],
      ['Plan Name', 'Subscriptions Count'],
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

  if (!metrics) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Financial & Revenue Intelligence"
        description="Comprehensive accounting analytics, MRR waterfall cohorts, subscription distribution, and receivables aging."
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
          label="Total Realized Revenue (YTD)"
          value={formatCurrency(metrics.revenueTotal)}
          icon={DollarSign}
          trend="+22.5%"
          trendDirection="up"
          helperText="vs previous comparable period"
        />
        <StatCard
          label="Annual Recurring Revenue"
          value={formatCurrency(metrics.arr)}
          icon={TrendingUp}
          trend="+14.2%"
          trendDirection="up"
          helperText="Run-rate from active subscriptions"
        />
        <StatCard
          label="Gross Revenue Churn"
          value="1.2%"
          icon={ArrowDownRight}
          trend="-0.4%"
          trendDirection="up"
          helperText="Industry top-decile retention"
        />
        <StatCard
          label="Net Revenue Retention (NRR)"
          value="118%"
          icon={ArrowUpRight}
          trend="+4.0%"
          trendDirection="up"
          helperText="Expansion outpaces churn"
        />
      </div>

      {/* Row 1: Monthly Cashflow & Subscription Plan Share */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem' }}>
        {/* Cashflow bar chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Monthly Cashflow Collection vs MRR Baseline</h3>
              <p className="card-subtitle">Realized bank settlements alongside contracted recurring run-rate</p>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyRevenueChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip
                  formatter={(val, name) => [formatCurrency(val), name === 'revenue' ? 'Settled Cash' : 'MRR Baseline']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '0.75rem' }}
                />
                <Bar dataKey="revenue" fill="#4F46E5" name="Settled Cashflow" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mrr" fill="#93C5FD" name="Contracted MRR" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plan Distribution Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Active Revenue by Subscription Plan</h3>
              <p className="card-subtitle">Customer plan enrollment distribution</p>
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

      {/* Row 2: MRR Waterfall Cohort & AR Aging Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
        {/* MRR Waterfall Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">MRR Waterfall Dynamics (New vs Expansion vs Churn)</h3>
              <p className="card-subtitle">Monthly composition of net recurring revenue evolution</p>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.mrrWaterfall || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val, name) => [
                    formatCurrency(val),
                    name === 'newMrr' ? 'New Bookings' : name === 'expansionMrr' ? 'Tier Expansion' : 'Churned / Cancelled'
                  ]}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '0.75rem' }}
                />
                <Bar dataKey="newMrr" fill="#10B981" name="New Bookings" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expansionMrr" fill="#6366F1" name="Tier Expansion" radius={[3, 3, 0, 0]} />
                <Bar dataKey="churnMrr" fill="#EF4444" name="Contraction / Churn" radius={[0, 0, 3, 3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accounts Receivable Aging Analysis */}
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
                Total outstanding balance: <strong>{formatCurrency(metrics.overdueAmount || 883.82)}</strong> across overdue and open receivables.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
