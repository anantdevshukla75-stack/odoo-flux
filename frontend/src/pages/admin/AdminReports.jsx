import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, DollarSign, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function AdminReports() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    async function load() {
      const m = await mockDataService.getMetrics();
      setMetrics(m);
    }
    load();
  }, []);

  if (!metrics) return null;

  return (
    <div>
      <PageHeader
        title="Financial & Revenue Intelligence"
        description="Comprehensive accounting analytics, revenue realization cohorts, and subscription lifecycle metrics."
      >
        <Button
          variant="secondary"
          icon={Download}
          onClick={() => alert('Exporting monthly financial report to CSV')}
        >
          Export CSV Summary
        </Button>
      </PageHeader>

      <div className="stat-card-grid">
        <StatCard
          label="Total Realized Revenue (YTD)"
          value={formatCurrency(metrics.revenueTotal)}
          icon={DollarSign}
          trend="+22.5%"
          trendDirection="up"
          helperText="YoY Growth"
        />
        <StatCard
          label="Annual Recurring Revenue"
          value={formatCurrency(metrics.arr)}
          icon={TrendingUp}
          helperText="Based on active recurring run-rate"
        />
        <StatCard
          label="Gross Churn Rate"
          value="1.2%"
          trend="-0.4%"
          trendDirection="up"
          helperText="Best in SaaS class"
        />
        <StatCard
          label="Net Revenue Retention (NRR)"
          value="118%"
          trend="+4%"
          trendDirection="up"
          helperText="Driven by tier expansion"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Monthly Cashflow Collection vs Billing</h3>
              <p className="card-subtitle">Invoiced volume vs settled payments</p>
            </div>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyRevenueChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Volume']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#4F46E5" name="Collected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mrr" fill="#93C5FD" name="MRR Base" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Subscriber Growth Trajectory</h3>
              <p className="card-subtitle">Active accounts progression</p>
            </div>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyRevenueChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Trajectory']}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="mrr" stroke="#16A34A" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;

