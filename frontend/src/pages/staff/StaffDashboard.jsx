import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertTriangle, RefreshCw, Plus, CheckCircle, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function StaffDashboard() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    async function load() {
      const q = await mockDataService.getQuotations();
      const inv = await mockDataService.getInvoices({ status: 'OVERDUE' });
      const sub = await mockDataService.getSubscriptions();
      setQuotations(q.filter(item => item.status === 'SENT' || item.status === 'DRAFT'));
      setOverdueInvoices(inv);
      setSubscriptions(sub.filter(s => s.status === 'ACTIVE'));
    }
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Operations & Billing Desk"
        description="Daily operational workspace for quotations, active accounts, and accounts receivable follow-ups."
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/staff/quotations')}
        >
          Draft Quotation
        </Button>
      </PageHeader>

      <div className="stat-card-grid">
        <StatCard
          label="Pending Quotations"
          value={quotations.length}
          icon={FileText}
          helperText="Awaiting customer sign-off"
        />
        <StatCard
          label="Overdue Invoices"
          value={overdueInvoices.length}
          icon={AlertTriangle}
          trend={overdueInvoices.length > 0 ? 'Action Needed' : 'All clear'}
          trendDirection={overdueInvoices.length > 0 ? 'down' : 'up'}
          helperText="Receivables past due date"
        />
        <StatCard
          label="Active Accounts"
          value={subscriptions.length}
          icon={RefreshCw}
          helperText="Healthy recurring billings"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Overdue Alert Box */}
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ color: 'var(--danger)' }}>
                Urgent: Overdue Accounts
              </h3>
              <p className="card-subtitle">Invoices requiring immediate customer contact</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/staff/overdue')}
            >
              Open AR Center
            </Button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>Overdue Amount</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.length > 0 ? (
                  overdueInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600 }}>{inv.customerName}</td>
                      <td>{inv.invoiceNumber}</td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>
                        {formatCurrency(inv.balance)}
                      </td>
                      <td>{formatDate(inv.dueDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--success)' }}>
                      ✓ No overdue accounts at this moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Quotations */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Pending Quotes</h3>
              <p className="card-subtitle">Proposals out for approval</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/staff/quotations')}
            >
              All Quotes
            </Button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quote #</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600 }}>{q.quotationNumber}</td>
                    <td>{q.customerName}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(q.total)}</td>
                    <td><StatusBadge status={q.status} /></td>
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

export default StaffDashboard;

