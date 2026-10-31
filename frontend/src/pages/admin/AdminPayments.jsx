import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, DollarSign, Plus, Filter, Download, ArrowUpRight, Receipt } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime, formatDate } from '../../utils/formatDate.js';

export function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [openInvoices, setOpenInvoices] = useState([]);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    note: ''
  });

  const loadData = async () => {
    const list = await mockDataService.getPayments();
    setPayments(list);

    const invList = await mockDataService.getInvoices();
    setOpenInvoices(invList.filter(i => i.balance > 0 || i.status !== 'PAID'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    const firstInv = openInvoices[0];
    setFormData({
      invoiceId: firstInv ? firstInv.id : '',
      amount: firstInv ? firstInv.balance : '',
      paymentMethod: 'BANK_TRANSFER',
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      note: firstInv ? `Payment against ${firstInv.invoiceNumber}` : ''
    });
    setIsModalOpen(true);
  };

  const handleInvoiceChange = (invId) => {
    const chosen = openInvoices.find(i => i.id === invId);
    setFormData(prev => ({
      ...prev,
      invoiceId: invId,
      amount: chosen ? chosen.balance : '',
      note: chosen ? `Payment against ${chosen.invoiceNumber}` : ''
    }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const chosen = openInvoices.find(i => i.id === formData.invoiceId);
    if (!chosen && formData.invoiceId) return;

    await mockDataService.recordPayment({
      invoiceId: chosen ? chosen.id : `inv-adhoc-${Date.now()}`,
      invoiceNumber: chosen ? chosen.invoiceNumber : 'UNLINKED',
      customerId: chosen ? chosen.customerId : 'cust-001',
      customerName: chosen ? chosen.customerName : 'General Customer',
      amount: Number(formData.amount) || 0,
      paymentMethod: formData.paymentMethod,
      reference: formData.reference || `REF-${Date.now().toString().slice(-6)}`,
      note: formData.note
    });

    setIsModalOpen(false);
    await loadData();
  };

  const filteredPayments = methodFilter === 'ALL'
    ? payments
    : payments.filter(p => p.paymentMethod === methodFilter);

  // Financial summary aggregations
  const totalVolume = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const cardVolume = payments.filter(p => p.paymentMethod === 'CARD').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const wireVolume = payments.filter(p => p.paymentMethod === 'BANK_TRANSFER').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const columns = [
    {
      header: 'Receipt #',
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={() => setSelectedReceipt(row)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontWeight: 600,
              color: 'var(--primary)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {row.paymentNumber}
          </button>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Ref: {row.reference || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Invoice Applied',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#334155' }}>
          {row.invoiceNumber}
        </span>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>{row.customerName}</span>
      )
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
      header: 'Channel',
      render: (row) => (
        <span className="badge badge-info">{row.paymentMethod}</span>
      )
    },
    {
      header: 'Settlement Time',
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
          Receipt
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Payment Settlements & Reconciliation"
        description="Comprehensive audit trail of credit card gateways, direct bank wires, and invoice balance collections."
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => alert('Exporting payment settlement journals to CSV')}
          >
            Export Ledger
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
            Record Payment
          </Button>
        </div>
      </PageHeader>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Collected
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.25rem' }}>
            {formatCurrency(totalVolume)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {payments.length} settled transactions
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Card Gateways
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {formatCurrency(cardVolume)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Stripe / Checkout card volume
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Bank Wire & ACH
          </div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {formatCurrency(wireVolume)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Direct treasury remittances
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {['ALL', 'CARD', 'BANK_TRANSFER', 'UPI', 'CASH'].map((m) => (
          <button
            key={m}
            type="button"
            className={`role-pill-btn ${methodFilter === m ? 'active' : ''}`}
            onClick={() => setMethodFilter(m)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid var(--border)',
              background: methodFilter === m ? 'var(--primary)' : 'var(--surface)',
              color: methodFilter === m ? '#FFFFFF' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            {m === 'ALL' ? 'All Channels' : m.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredPayments}
        searchPlaceholder="Search receipt #, invoice, customer, reference..."
        emptyMessage="No payment transactions match criteria."
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Manual Payment Settlement"
      >
        <form onSubmit={handleRecordPayment}>
          <div style={{ marginBottom: '1rem' }}>
            <Select
              label="Select Outstanding Invoice"
              value={formData.invoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              options={
                openInvoices.length > 0
                  ? openInvoices.map(i => ({
                      value: i.id,
                      label: `${i.invoiceNumber} — ${i.customerName} (Bal: ${formatCurrency(i.balance)})`
                    }))
                  : [{ value: '', label: 'No open invoices available' }]
              }
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Settled Amount ($)"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />

            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
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
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder="e.g. WIRE-884920"
            required
          />

          <Input
            label="Audit Notes"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Reconciliation note"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Receipt Voucher Modal */}
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
                Payment Successfully Settled & Reconciled
              </p>
            </div>

            <div style={{ padding: '1.25rem 0', fontSize: '0.875rem', lineHeight: '2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Receipt Number:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.paymentNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Invoice Applied:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedReceipt.invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Customer:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Payment Method:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>External Reference:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{selectedReceipt.reference || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Settlement Date:</span>
                <span>{formatDateTime(selectedReceipt.paymentDate)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
              <Button variant="primary" icon={Download} onClick={() => window.print()}>
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminPayments;
