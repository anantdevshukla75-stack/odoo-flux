import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Receipt, Download, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime } from '../../utils/formatDate.js';

export function CustomerPayments() {
  const [payments, setPayments] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    async function load() {
      const list = await mockDataService.getPayments();
      setPayments(list.filter(p => p.customerId === 'cust-001'));
    }
    load();
  }, []);

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const columns = [
    {
      header: 'Receipt #',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedReceipt(row)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontWeight: 600,
            color: 'var(--primary)',
            cursor: 'pointer'
          }}
        >
          {row.paymentNumber}
        </button>
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
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Receipt}
          onClick={() => setSelectedReceipt(row)}
        >
          Voucher
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Payment History & Receipts"
        description="Comprehensive audit receipts for every payment completed by your organization."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Lifetime Paid
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>
            {formatCurrency(totalPaid)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {payments.length} settled payments
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Preferred Payment Method
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            Corporate Visa (•••• 4242)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Auto-charge enabled for recurring cycles
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        searchPlaceholder="Search receipts..."
        emptyMessage="No payments recorded."
      />

      {/* Customer Receipt Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Payment Confirmation Voucher"
      >
        {selectedReceipt && (
          <div>
            <div style={{ textAlign: 'center', padding: '1.25rem 0', borderBottom: '1px dashed #CBD5E1' }}>
              <div style={{ width: 44, height: 44, background: '#DCFCE7', borderRadius: '50%', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <CheckCircle2 size={26} />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {formatCurrency(selectedReceipt.amount)}
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Paid & Cleared
              </p>
            </div>

            <div style={{ padding: '1.25rem 0', fontSize: '0.875rem', lineHeight: '2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Receipt Number:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.paymentNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Invoice Settled:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedReceipt.invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment Method:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Transaction Reference:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{selectedReceipt.reference || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Date:</span>
                <span>{formatDateTime(selectedReceipt.paymentDate)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
              <Button variant="primary" icon={Download} onClick={() => window.print()}>
                Download / Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CustomerPayments;
