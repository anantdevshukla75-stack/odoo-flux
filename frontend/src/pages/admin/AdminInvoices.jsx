import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Receipt, DollarSign, Download, Filter, Eye } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function AdminInvoices({ basePath = '/admin/invoices' }) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    note: ''
  });

  const loadInvoices = async () => {
    const list = await mockDataService.getInvoices();
    setInvoices(list);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = filterStatus === 'ALL'
    ? invoices
    : invoices.filter(i => i.status === filterStatus);

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.balance > 0 ? invoice.balance : invoice.totalAmount,
      paymentMethod: 'BANK_TRANSFER',
      reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      note: `Payment towards ${invoice.invoiceNumber}`
    });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    await mockDataService.recordPayment({
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      amount: Number(paymentData.amount) || 0,
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference,
      note: paymentData.note
    });

    setSelectedInvoice(null);
    loadInvoices();
  };

  const columns = [
    {
      header: 'Invoice #',
      render: (row) => (
        <div>
          <Link
            to={`${basePath}/${row.id}`}
            style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
          >
            {row.invoiceNumber}
          </Link>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Issued {formatDate(row.issueDate)}
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>{row.customerName}</span>
      )
    },
    {
      header: 'Total Invoiced',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(row.totalAmount)}</span>
      )
    },
    {
      header: 'Paid Amount',
      render: (row) => (
        <span style={{ color: 'var(--success)', fontWeight: 500 }}>
          {formatCurrency(row.paidAmount)}
        </span>
      )
    },
    {
      header: 'Outstanding Balance',
      render: (row) => (
        <span style={{ fontWeight: 700, color: row.balance > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
          {formatCurrency(row.balance)}
        </span>
      )
    },
    {
      header: 'Due Date',
      render: (row) => formatDate(row.dueDate)
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
            onClick={() => navigate(`${basePath}/${row.id}`)}
          >
            View
          </Button>
          {row.balance > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={DollarSign}
              onClick={() => handleOpenPaymentModal(row)}
            >
              Collect
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => navigate(`${basePath}/${row.id}`)}
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
        title="Invoice Registry"
        description="Track generated recurring invoices, payment reconciliations, and receivables balances."
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'OPEN', 'OVERDUE', 'PAID'].map((status) => (
            <button
              key={status}
              type="button"
              className={`role-pill-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
              style={{
                border: '1px solid var(--border)',
                background: filterStatus === status ? 'var(--primary)' : 'var(--surface)',
                color: filterStatus === status ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filteredInvoices}
        searchPlaceholder="Search invoice #, customer name..."
        emptyMessage="No invoices found matching criteria."
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Record Payment for ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleRecordPayment}>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>Customer:</span>
              <strong>{selectedInvoice?.customerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '4px' }}>
              <span>Outstanding Balance:</span>
              <strong style={{ color: 'var(--danger)' }}>{formatCurrency(selectedInvoice?.balance)}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Amount to Record ($)"
              type="number"
              step="0.01"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              required
            />

            <Select
              label="Payment Channel"
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              options={[
                { value: 'BANK_TRANSFER', label: 'Bank Wire / ACH' },
                { value: 'CARD', label: 'Credit / Debit Card' },
                { value: 'UPI', label: 'UPI / Instant Pay' },
                { value: 'CASH', label: 'Cash / Other' }
              ]}
              required
            />
          </div>

          <Input
            label="Transaction Reference / Cheque #"
            value={paymentData.reference}
            onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
            placeholder="e.g. TXN-99882211"
            required
          />

          <Input
            label="Audit Notes"
            value={paymentData.note}
            onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
            placeholder="Reconciliation note"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminInvoices;

