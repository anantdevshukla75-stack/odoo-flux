import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Mail,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  ShieldCheck
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function InvoiceDetails({ backPath = '/admin/invoices' }) {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReminded, setIsReminded] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    note: ''
  });

  const [cardForm, setCardForm] = useState({
    cardNumber: '•••• •••• •••• 4242',
    cardName: 'Marcus Sterling',
    expiry: '12/28',
    cvc: '883'
  });

  const loadData = async () => {
    setIsLoading(true);
    const inv = await mockDataService.getInvoiceById(invoiceId);
    if (inv) {
      setInvoice(inv);
      if (inv.customerId) {
        const cust = await mockDataService.getCustomerById(inv.customerId);
        setCustomer(cust);
      }
      if (inv.subscriptionId) {
        const sub = await mockDataService.getSubscriptionById(inv.subscriptionId);
        setSubscription(sub);
      }
      const payList = await mockDataService.getPayments({ invoiceId: inv.id });
      setPayments(payList);

      setPaymentForm(prev => ({
        ...prev,
        amount: inv.balance > 0 ? inv.balance : inv.totalAmount,
        reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        note: `Payment for ${inv.invoiceNumber}`
      }));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!invoice) return;

    await mockDataService.recordPayment({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: Number(paymentForm.amount) || 0,
      paymentMethod: paymentForm.paymentMethod,
      reference: paymentForm.reference || `REF-${Date.now().toString().slice(-6)}`,
      note: paymentForm.note
    });

    setIsCollectModalOpen(false);
    await loadData();
  };

  const handleCustomerPayNow = async (e) => {
    e.preventDefault();
    if (!invoice) return;

    await mockDataService.recordPayment({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: invoice.balance,
      paymentMethod: 'CARD',
      reference: `STRIPE-CH-${Math.floor(1000000 + Math.random() * 9000000)}`,
      note: 'Online self-service portal checkout'
    });

    setIsPayModalOpen(false);
    await loadData();
  };

  const handleSendReminder = () => {
    setIsReminded(true);
    setTimeout(() => setIsReminded(false), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading invoice details...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Invoice Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          No invoice record matches identifier "{invoiceId}".
        </p>
        <Button variant="primary" onClick={() => navigate(backPath)}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isOverdue = invoice.status === 'OVERDUE' || (invoice.balance > 0 && new Date(invoice.dueDate) < new Date());

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          Back to Invoices
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isReminded && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 500 }}>
              ✓ Reminder email sent to {customer?.email || 'customer'}!
            </span>
          )}

          {role !== 'CUSTOMER' && invoice.balance > 0 && (
            <Button variant="secondary" size="sm" icon={Mail} onClick={handleSendReminder}>
              Send Reminder
            </Button>
          )}

          <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
            Print / PDF
          </Button>

          {invoice.balance > 0 && (
            role === 'CUSTOMER' ? (
              <Button variant="primary" size="sm" icon={CreditCard} onClick={() => setIsPayModalOpen(true)}>
                Pay Now ({formatCurrency(invoice.balance)})
              </Button>
            ) : (
              <Button variant="primary" size="sm" icon={DollarSign} onClick={() => setIsCollectModalOpen(true)}>
                Record Payment
              </Button>
            )
          )}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Invoice Status
          </div>
          <div style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StatusBadge status={invoice.status} />
            {isOverdue && invoice.status !== 'PAID' && (
              <span className="badge badge-danger">Past Due</span>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Invoiced
          </div>
          <div style={{ marginTop: '0.375rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(invoice.totalAmount)}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Amount Paid
          </div>
          <div style={{ marginTop: '0.375rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
            {formatCurrency(invoice.paidAmount)}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', background: invoice.balance > 0 ? '#FEF2F2' : '#F0FDF4', borderColor: invoice.balance > 0 ? '#FECACA' : '#BBF7D0' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: invoice.balance > 0 ? '#991B1B' : '#166534', fontWeight: 600 }}>
            Remaining Balance
          </div>
          <div style={{ marginTop: '0.375rem', fontSize: '1.25rem', fontWeight: 700, color: invoice.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {formatCurrency(invoice.balance)}
          </div>
        </div>
      </div>

      {/* Formal Tax Invoice Document Card */}
      <div className="card" style={{ padding: '2.5rem', background: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: '1.75rem', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: '1.125rem' }}>
                B
              </div>
              <span style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#1E293B' }}>
                Brightloop Software
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: '1.5' }}>
              Brightloop Cloud Technologies, Inc.<br />
              100 Innovation Way, Suite 400<br />
              San Francisco, CA 94105, USA<br />
              Tax ID / EIN: US-8829104-X | VAT: EU-99238411
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tax Invoice
            </h1>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
              {invoice.invoiceNumber}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#64748B', lineHeight: '1.5' }}>
              <div><strong>Issue Date:</strong> {formatDate(invoice.issueDate)}</div>
              <div><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</div>
              <div><strong>Payment Terms:</strong> Net 15 Days</div>
            </div>
          </div>
        </div>

        {/* Client & Billing Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>
              Billed To
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
              {customer?.companyName || invoice.customerName}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#334155', marginTop: '0.25rem' }}>
              Attn: {customer?.name || invoice.customerName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '0.25rem', lineHeight: '1.4' }}>
              {customer?.billingAddress?.street || '742 Evergreen Terrace'}<br />
              {customer?.billingAddress?.city || 'San Francisco'}, {customer?.billingAddress?.state || 'CA'} {customer?.billingAddress?.zip || '94107'}<br />
              {customer?.email || 'billing@customer.com'} | {customer?.phone || '+1 (555) 234-5678'}
            </div>
            {customer?.taxId && (
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem' }}>
                <strong>Client Tax ID:</strong> {customer.taxId}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>
              Subscription & Plan Context
            </div>
            {subscription ? (
              <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.5' }}>
                <div>
                  <strong>Subscription ID:</strong>{' '}
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{subscription.subscriptionNumber}</span>
                </div>
                <div><strong>Enrolled Plan:</strong> {subscription.planName}</div>
                <div><strong>Cadence:</strong> {subscription.billingInterval} recurring</div>
                <div><strong>Current Period:</strong> {formatDate(subscription.startDate)} to {formatDate(subscription.nextBillingDate)}</div>
              </div>
            ) : (
              <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                Linked to Subscription #{invoice.subscriptionId || 'SUB-2026-081'}
              </div>
            )}

            <div style={{ marginTop: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', background: '#EEF2FF', borderRadius: '4px', fontSize: '0.75rem', color: '#4338CA', fontWeight: 600 }}>
              <ShieldCheck size={14} />
              Verified Electronic Invoice Record
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #CBD5E1', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Item & Description</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Billing Cycle</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Unit Rate</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '1rem 0.5rem' }}>
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>
                    {subscription?.planName || 'Brightloop Enterprise Cloud Suite'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                    Automated SaaS tier access, multi-tenant database provisioning & 99.99% SLA uptime
                  </div>
                </td>
                <td style={{ padding: '1rem 0.5rem', textAlign: 'center', color: '#475569' }}>
                  {subscription?.billingInterval || 'Monthly'}
                </td>
                <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 500 }}>
                  {formatCurrency(invoice.subtotal || invoice.totalAmount * 0.85)}
                </td>
                <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>1</td>
                <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 600, color: '#0F172A' }}>
                  {formatCurrency(invoice.subtotal || invoice.totalAmount * 0.85)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem', color: '#475569' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>
                {formatCurrency(invoice.subtotal || invoice.totalAmount * 0.85)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem', color: '#475569' }}>
              <span>Tax (GST / Sales Tax 18%):</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>
                {formatCurrency(invoice.taxAmount || invoice.totalAmount * 0.15)}
              </span>
            </div>
            <div style={{ borderTop: '2px solid #E2E8F0', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, color: '#0F172A' }}>
              <span>Total Invoiced:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', fontSize: '0.875rem', color: 'var(--success)' }}>
              <span>Amount Paid:</span>
              <span style={{ fontWeight: 600 }}>- {formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div style={{ borderTop: '1px dashed #CBD5E1', marginTop: '0.375rem', paddingTop: '0.375rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: invoice.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
              <span>Outstanding Balance:</span>
              <span>{formatCurrency(invoice.balance)}</span>
            </div>
          </div>
        </div>

        {/* Banking and Remittance Footer */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', fontSize: '0.75rem', color: '#64748B' }}>
          <div>
            <strong style={{ color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Remittance / Wire Transfer Details:</strong>
            Bank Name: Silicon Valley Commercial Bank<br />
            Account Name: Brightloop Software Inc.<br />
            Account Number: 9812-4412-0091 | Routing (ABA): 121000358<br />
            SWIFT/BIC: SVBKUS6S | Reference: {invoice.invoiceNumber}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong style={{ color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Customer Support:</strong>
            support@brightloopsoftware.com<br />
            Toll-Free: +1 (800) 555-LOOP<br />
            All subscriptions subject to Brightloop Master Terms of Service.
          </div>
        </div>
      </div>

      {/* Linked Reconciled Payments Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title">Payment Settlement History</h3>
            <p className="card-subtitle">Transactions credited toward this invoice</p>
          </div>
          {invoice.balance > 0 && role !== 'CUSTOMER' && (
            <Button variant="outline" size="sm" icon={DollarSign} onClick={() => setIsCollectModalOpen(true)}>
              Record Transaction
            </Button>
          )}
        </div>

        {payments.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No settled transactions recorded against this invoice yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Receipt #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Reference</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.paymentNumber}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>{formatDateTime(p.paymentDate)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="badge badge-info">{p.paymentMethod}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {p.reference || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin/Staff Record Payment Modal */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title={`Record Payment for ${invoice.invoiceNumber}`}
      >
        <form onSubmit={handleCollectPayment}>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>Customer:</span>
              <strong>{invoice.customerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '4px' }}>
              <span>Outstanding Balance:</span>
              <strong style={{ color: 'var(--danger)' }}>{formatCurrency(invoice.balance)}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Amount to Credit ($)"
              type="number"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />

            <Select
              label="Payment Channel"
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              options={[
                { value: 'BANK_TRANSFER', label: 'Bank Wire / ACH' },
                { value: 'CARD', label: 'Credit / Debit Card' },
                { value: 'UPI', label: 'UPI / Instant Pay' },
                { value: 'CASH', label: 'Cash / Manual Cheque' }
              ]}
              required
            />
          </div>

          <Input
            label="Transaction Reference / Cheque #"
            value={paymentForm.reference}
            onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            placeholder="e.g. TXN-8829104"
            required
          />

          <Input
            label="Internal Notes"
            value={paymentForm.note}
            onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
            placeholder="Reconciliation ledger note"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsCollectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm & Post Ledger
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Pay Now Checkout Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Secure Customer Checkout"
      >
        <form onSubmit={handleCustomerPayNow}>
          <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#EEF2FF', borderRadius: 'var(--radius-md)', border: '1px solid #C7D2FE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#3730A3' }}>Amount Due Now:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#312E81' }}>{formatCurrency(invoice.balance)}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4338CA', marginTop: '0.25rem' }}>
              Settling Invoice #{invoice.invoiceNumber}
            </div>
          </div>

          <Input
            label="Cardholder Name"
            value={cardForm.cardName}
            onChange={(e) => setCardForm({ ...cardForm, cardName: e.target.value })}
            required
          />

          <Input
            label="Card Number"
            value={cardForm.cardNumber}
            onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
            placeholder="4242 •••• •••• 4242"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Expiry (MM/YY)"
              value={cardForm.expiry}
              onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
              placeholder="MM/YY"
              required
            />
            <Input
              label="CVC / CVV"
              value={cardForm.cvc}
              onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
              placeholder="3 digits"
              required
            />
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.375rem', margin: '0.75rem 0 1.25rem' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            256-bit SSL encrypted. Payment will be credited immediately to your subscription.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={CreditCard}>
              Pay {formatCurrency(invoice.balance)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default InvoiceDetails;
