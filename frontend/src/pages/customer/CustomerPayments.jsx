import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime } from '../../utils/formatDate.js';

export function CustomerPayments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function load() {
      const list = await mockDataService.getPayments();
      setPayments(list.filter(p => p.customerId === 'cust-001'));
    }
    load();
  }, []);

  const columns = [
    {
      header: 'Receipt #',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.paymentNumber}</span>
      )
    },
    {
      header: 'Settled Invoice',
      render: (row) => (
        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
          {row.invoiceNumber}
        </span>
      )
    },
    {
      header: 'Paid Amount',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--success)' }}>
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: 'Payment Channel',
      render: (row) => (
        <span className="badge badge-info">{row.paymentMethod}</span>
      )
    },
    {
      header: 'Transaction ID',
      render: (row) => (
        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
          {row.reference || '—'}
        </span>
      )
    },
    {
      header: 'Processed Timestamp',
      render: (row) => formatDateTime(row.paymentDate)
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Payment History & Receipts"
        description="Comprehensive audit receipts for every payment completed by your organization."
      />

      <DataTable
        columns={columns}
        data={payments}
        searchPlaceholder="Search receipts..."
        emptyMessage="No payments recorded."
      />
    </div>
  );
}

export default CustomerPayments;
