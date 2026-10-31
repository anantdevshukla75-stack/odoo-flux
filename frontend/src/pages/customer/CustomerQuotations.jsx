import React, { useState, useEffect } from 'react';
import { Check, X, FileText } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function CustomerQuotations() {
  const [quotations, setQuotations] = useState([]);

  const loadQuotations = async () => {
    // Load for customer
    const list = await mockDataService.getQuotations();
    setQuotations(list.filter(q => q.customerId === 'cust-001' || q.status === 'SENT'));
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleDecision = async (id, decision) => {
    await mockDataService.updateQuotationStatus(id, decision);
    alert(
      decision === 'ACCEPTED'
        ? 'Quotation accepted! Your subscription is now activated and an invoice has been generated.'
        : 'Quotation declined.'
    );
    loadQuotations();
  };

  const columns = [
    {
      header: 'Proposal #',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.quotationNumber}</span>
      )
    },
    {
      header: 'Proposed Plan',
      render: (row) => (
        <span className="badge badge-primary">{row.planName}</span>
      )
    },
    {
      header: 'Subtotal',
      render: (row) => formatCurrency(row.subtotal)
    },
    {
      header: 'Estimated Tax',
      render: (row) => formatCurrency(row.taxAmount)
    },
    {
      header: 'Recurring Total',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {formatCurrency(row.total)}
        </span>
      )
    },
    {
      header: 'Valid Until',
      render: (row) => formatDate(row.validUntil)
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Authorization',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {row.status === 'SENT' ? (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                onClick={() => handleDecision(row.id, 'ACCEPTED')}
              >
                Accept
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={X}
                onClick={() => handleDecision(row.id, 'REJECTED')}
              >
                Decline
              </Button>
            </>
          ) : row.status === 'ACCEPTED' ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
              Confirmed & Active
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Closed
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Commercial Quotations & Proposals"
        description="Review custom software proposals, evaluate tax & discount breakdowns, and authorize activations."
      />

      <DataTable
        columns={columns}
        data={quotations}
        searchPlaceholder="Search proposals..."
        emptyMessage="No pending proposals for your organization."
      />
    </div>
  );
}

export default CustomerQuotations;

