import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Download, Receipt, CreditCard, Eye } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function CustomerInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);

  const loadInvoices = async () => {
    const list = await mockDataService.getInvoices();
    setInvoices(list.filter(i => i.customerId === 'cust-001'));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePayNow = async (invoice) => {
    await mockDataService.recordPayment({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: invoice.balance,
      paymentMethod: 'CARD',
      reference: `CARD-${Date.now().toString().slice(-6)}`,
      note: 'Online portal card payment'
    });
    alert(`Payment of ${formatCurrency(invoice.balance)} successful for invoice ${invoice.invoiceNumber}`);
    loadInvoices();
  };

  const columns = [
    {
      header: 'Invoice #',
      render: (row) => (
        <Link
          to={`/customer/invoices/${row.id}`}
          style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
        >
          {row.invoiceNumber}
        </Link>
      )
    },
    {
      header: 'Issue Date',
      render: (row) => formatDate(row.issueDate)
    },
    {
      header: 'Due Date',
      render: (row) => formatDate(row.dueDate)
    },
    {
      header: 'Total Invoiced',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(row.totalAmount)}</span>
      )
    },
    {
      header: 'Balance Outstanding',
      render: (row) => (
        <span style={{ fontWeight: 700, color: row.balance > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
          {formatCurrency(row.balance)}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => navigate(`/customer/invoices/${row.id}`)}
          >
            View
          </Button>
          {row.balance > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={() => navigate(`/customer/invoices/${row.id}`)}
            >
              Pay Now
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => navigate(`/customer/invoices/${row.id}`)}
          >
            PDF
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Billing Invoices & Statements"
        description="Access formal tax invoices, review payment settlements, and settle outstanding balances securely."
      />

      <DataTable
        columns={columns}
        data={invoices}
        searchPlaceholder="Search invoices..."
        emptyMessage="No invoices generated yet."
      />
    </div>
  );
}

export default CustomerInvoices;

