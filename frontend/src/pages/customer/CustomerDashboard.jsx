import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Receipt, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    async function load() {
      // In demo mode, fetch for the demo customer or default
      const s = await mockDataService.getSubscriptions();
      const q = await mockDataService.getQuotations();
      const inv = await mockDataService.getInvoices();

      // Show records relevant to customer
      setSubscriptions(s.filter(item => item.customerId === 'cust-001'));
      setQuotations(q.filter(item => item.customerId === 'cust-001'));
      setInvoices(inv.filter(item => item.customerId === 'cust-001'));
    }
    load();
  }, []);

  const activeSub = subscriptions[0] || null;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.fullName || 'Customer'}`}
        description={`Account portal for ${user?.companyName || 'Acme Technologies Inc.'}. Manage subscriptions, view billing statements, and approve quotations.`}
      />

      <div className="stat-card-grid">
        <StatCard
          label="Active Subscription Tier"
          value={activeSub ? activeSub.planName : 'No Active Plan'}
          icon={RefreshCw}
          helperText={activeSub ? `Next renewal: ${formatDate(activeSub.nextBillingDate)}` : ''}
        />
        <StatCard
          label="Recurring Billing"
          value={activeSub ? formatCurrency(activeSub.recurringAmount) : '$0.00'}
          icon={Receipt}
          helperText="Billed automatically per month"
        />
        <StatCard
          label="Pending Quotations"
          value={quotations.filter(q => q.status === 'SENT').length}
          icon={FileText}
          helperText="Requires client authorization"
        />
      </div>

      {/* Main Account Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Current Active Subscription</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/customer/subscriptions')}
            >
              Subscription Details
            </Button>
          </div>

          {activeSub ? (
            <div style={{ padding: '0.5rem 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {activeSub.planName}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Subscription ID: <code>{activeSub.subscriptionNumber}</code>
                  </div>
                </div>
                <StatusBadge status={activeSub.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Billing Cadence: </span>
                  <strong>{activeSub.billingInterval.toLowerCase()}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Next Invoice: </span>
                  <strong>{formatDate(activeSub.nextBillingDate)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Recurring Total: </span>
                  <strong style={{ color: 'var(--primary)' }}>{formatCurrency(activeSub.recurringAmount)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Auto-Renewal: </span>
                  <strong style={{ color: 'var(--success)' }}>Active (Card on file)</strong>
                </div>
              </div>
            </div>
          ) : (
            <p>No active subscription found.</p>
          )}
        </div>

        {/* Recent Invoices Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Invoices</h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/customer/invoices')}
            >
              All Invoices <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {invoices.slice(0, 3).map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inv.invoiceNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Due {formatDate(inv.dueDate)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    {formatCurrency(inv.totalAmount)}
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
