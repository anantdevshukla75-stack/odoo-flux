import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime } from '../../utils/formatDate.js';

export function AdminPayments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function loadData() {
      const list = await mockDataService.getPayments();
      setPayments(list);
    }
    loadData();
  }, []);

  const columns = [
    {
      header: 'Payment #',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.paymentNumber}</span>
      )
    },
    {
      header: 'Invoice Reference',
      render: (row) => (
        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
          {row.invoiceNumber}
        </span>
      )
    },
    {
      header: 'Customer',
      render: (row) => row.customerName
    },
    {
      header: 'Amount Collected',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--success)' }}>
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: 'Method',
      render: (row) => (
        <span className="badge badge-info">{row.paymentMethod}</span>
      )
    },
    {
      header: 'External Reference',
      render: (row) => (
        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
          {row.reference || '—'}
        </span>
      )
    },
    {
      header: 'Timestamp',
      render: (row) => formatDateTime(row.paymentDate)
    },
    {
      header: 'Reconciliation',
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Payment Transactions"
        description="Audit log of all settled incoming revenue, gateway transactions, and manual wire receipts."
      />

      <DataTable
        columns={columns}
        data={payments}
        searchPlaceholder="Search payment #, invoice, customer..."
        emptyMessage="No payments recorded."
      />
    </div>
  );
}

export default AdminPayments;
