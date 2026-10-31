import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, Mail, DollarSign, CheckCircle, Eye } from 'lucide-react';
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

export function StaffOverdue() {
  const navigate = useNavigate();
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [reminderSent, setReminderSent] = useState({});
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    note: ''
  });

  const loadData = async () => {
    const list = await mockDataService.getInvoices({ status: 'OVERDUE' });
    setOverdueInvoices(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendReminder = (invoiceNumber) => {
    setReminderSent(prev => ({ ...prev, [invoiceNumber]: true }));
    alert(`Automated dunning email reminder sent for ${invoiceNumber}`);
  };

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.balance,
      paymentMethod: 'BANK_TRANSFER',
      reference: `REC-${Date.now().toString().slice(-6)}`,
      note: 'Settlement for overdue invoice'
    });
  };

  const handleConfirmPayment = async (e) => {
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
    loadData();
  };

  const columns = [
    {
      header: 'Invoice #',
      render: (row) => (
        <Link
          to={`/staff/invoices/${row.id}`}
          style={{ fontWeight: 600, color: 'var(--danger)', textDecoration: 'none' }}
        >
          {row.invoiceNumber}
        </Link>
      )
    },
    {
      header: 'Customer',
      render: (row) => row.customerName
    },
    {
      header: 'Overdue Balance',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
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
      header: 'Resolution Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => navigate(`/staff/invoices/${row.id}`)}
          >
            View
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={reminderSent[row.invoiceNumber] ? CheckCircle : Mail}
            disabled={reminderSent[row.invoiceNumber]}
            onClick={() => handleSendReminder(row.invoiceNumber)}
          >
            {reminderSent[row.invoiceNumber] ? 'Reminder Sent' : 'Send Reminder'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={DollarSign}
            onClick={() => handleOpenPayment(row)}
          >
            Collect Payment
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Overdue Invoices & Collections"
        description="Accounts receivable tracking, dunning follow-ups, and outstanding balance collections."
      />

      <DataTable
        columns={columns}
        data={overdueInvoices}
        searchPlaceholder="Search customer or invoice #..."
        emptyMessage="Congratulations! There are currently no overdue invoices."
      />

      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Record Settlement for ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleConfirmPayment}>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#FEE2E2', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>Customer:</span>
              <strong>{selectedInvoice?.customerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '4px' }}>
              <span>Total Overdue:</span>
              <strong style={{ color: 'var(--danger)' }}>{formatCurrency(selectedInvoice?.balance)}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Settlement Amount ($)"
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
                { value: 'BANK_TRANSFER', label: 'Wire / Direct Deposit' },
                { value: 'CARD', label: 'Credit Card Phone Authorisation' },
                { value: 'UPI', label: 'Instant Payment (UPI)' },
                { value: 'CASH', label: 'Cheque / Draft' }
              ]}
              required
            />
          </div>

          <Input
            label="Transaction Reference / Cheque #"
            value={paymentData.reference}
            onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
            placeholder="e.g. WIRE-SETTLE-4481"
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Settle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default StaffOverdue;

