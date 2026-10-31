import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  History
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import RecordPaymentForm from './RecordPaymentForm.jsx';
import { apiService } from '../../services/apiService.js';
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
  const [error, setError] = useState('');

  // Feedback banner
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const details = await apiService.getInvoiceDetails(invoiceId);
      setInvoice(details.invoice);
      setCustomer(details.customer);
      setSubscription(details.subscription);
      setPayments(details.payments);
    } catch (err) {
      setInvoice(null);
      setError(err?.message || 'Could not load this invoice.');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Print action
  const handlePrint = () => {
    navigate(`${backPath}/${invoice.id}/print`);
  };

  // Scroll to payment history
  const handleScrollToPayments = () => {
    const el = document.getElementById('payment-history-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading invoice record...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Invoice Record Not Found</h2>
        <p className="text-slate-500 text-xs mt-1 mb-4">
          {error || `No invoice record matches identifier "${invoiceId}".`}
        </p>
        <Button variant="primary" onClick={() => navigate(backPath)}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const items = invoice.items || [];
  const paymentTerms = subscription?.paymentTerms || 'Due on receipt';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action: Print */}
          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print Layout
          </Button>

          {/* Action: View Payment History */}
          <Button
            variant="ghost"
            size="sm"
            icon={History}
            onClick={handleScrollToPayments}
          >
            Payments ({payments.length})
          </Button>

          {/* Action: Record Payment (staff only, enforced by the API) */}
          {invoice.balance > 0 && invoice.status !== 'CANCELLED' && role !== 'CUSTOMER' && (
            <Button
              variant="primary"
              size="sm"
              icon={DollarSign}
              onClick={() => setIsCollectModalOpen(true)}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Notification Banner */}
      {feedback && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-indigo-700 hover:text-indigo-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {role === 'CUSTOMER' && invoice.balance > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Online payment processing is not available in the portal yet. Contact your account representative to arrange settlement.
        </div>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Invoice State</div>
          <div className="mt-1 flex items-center gap-1.5">
            <StatusBadge status={invoice.status} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total Invoiced</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(invoice.totalAmount)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Amount Paid</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(invoice.paidAmount)}
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${
          invoice.balance > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-600">Outstanding Balance</div>
          <div className={`text-xl font-bold mt-1 ${invoice.balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {formatCurrency(invoice.balance)}
          </div>
        </div>
      </div>

      {/* Document View */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center rounded-lg">
                B
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Brightloop Software
              </span>
            </div>
            <div className="text-xs text-slate-500 leading-relaxed">
              Subscription and billing management
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h1 className="text-xl font-extrabold uppercase tracking-wider text-slate-900 m-0">
              Invoice
            </h1>
            <div className="text-base font-bold font-mono text-indigo-600 mt-0.5">
              {invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              <div><span className="font-semibold text-slate-700">Invoice Date:</span> {formatDate(invoice.issueDate)}</div>
              <div><span className="font-semibold text-slate-700">Due Date:</span> {formatDate(invoice.dueDate)}</div>
              {invoice.billingPeriod && (
                <div><span className="font-semibold text-slate-700">Billing Period:</span> {invoice.billingPeriod}</div>
              )}
              <div><span className="font-semibold text-slate-700">Terms:</span> {paymentTerms}</div>
            </div>
          </div>
        </div>

        {/* Customer & Subscription Context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Customer Details & Billing Address
            </div>
            <div className="text-sm font-bold text-slate-900">
              {customer?.companyName || invoice.customerName}
            </div>
            <div className="text-slate-700 mt-0.5 font-medium">
              Attn: {customer?.fullName || invoice.customerName}
            </div>
            <div className="text-slate-600 mt-1 leading-relaxed">
              {customer?.billingAddress || 'Billing address not provided'}<br />
              Email: {customer?.email || '—'} | Phone: {customer?.phone || '—'}
            </div>
            {customer?.taxId && (
              <div className="text-slate-600 mt-1 font-medium">
                Tax Reg / VAT: {customer.taxId}
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Subscription Context
            </div>
            <div className="text-slate-700 space-y-1">
              <div>
                <span className="font-semibold text-slate-900">Linked Subscription:</span>{' '}
                <span className="font-mono text-indigo-700">{invoice.subscriptionNumber || '—'}</span>
              </div>
              {subscription && (
                <>
                  <div><span className="font-semibold text-slate-900">Subscription Plan:</span> {subscription.planName}</div>
                  <div><span className="font-semibold text-slate-900">Cadence:</span> {subscription.billingInterval}</div>
                  <div><span className="font-semibold text-slate-900">Cycle:</span> {formatDate(subscription.startDate)} to {formatDate(subscription.nextBillingDate)}</div>
                </>
              )}
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Invoice record</span>
            </div>
          </div>
        </div>

        {/* Product Lines */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 font-semibold">Product Line</th>
                <th className="py-2.5 text-center font-semibold">Quantity</th>
                <th className="py-2.5 text-right font-semibold">Unit Price</th>
                <th className="py-2.5 text-right font-semibold">Tax</th>
                <th className="py-2.5 text-right font-semibold">Line Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-3 pr-2">
                    <div className="font-semibold text-slate-900">{line.description}</div>
                  </td>
                  <td className="py-3 text-center text-slate-700">{line.quantity}</td>
                  <td className="py-3 text-right text-slate-700 font-mono">{formatCurrency(line.unitPrice)}</td>
                  <td className="py-3 text-right text-slate-600">{formatCurrency(line.taxAmount || 0)}</td>
                  <td className="py-3 text-right font-bold text-slate-900 font-mono">
                    {formatCurrency(line.amount || (line.quantity * line.unitPrice))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown Totals */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <div className="w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 font-mono">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            {Number(invoice.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span className="font-mono">- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax:</span>
              <span className="font-semibold text-slate-900 font-mono">
                {formatCurrency(invoice.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="font-mono">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold pt-1">
              <span>Amount Paid:</span>
              <span className="font-mono">- {formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-dashed border-slate-300">
              <span className={invoice.balance > 0 ? 'text-rose-600' : 'text-slate-900'}>
                Outstanding Balance:
              </span>
              <span className={`font-mono ${invoice.balance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatCurrency(invoice.balance)}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 text-xs text-slate-500">
          Invoice reference: <span className="font-mono font-semibold">{invoice.invoiceNumber}</span>
        </div>
      </div>

      {/* Payment Settlement History Section */}
      <div id="payment-history-section" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Reconciled Payment History</h3>
            <p className="text-xs text-slate-500">Transactions credited toward {invoice.invoiceNumber}</p>
          </div>
          {invoice.balance > 0 && invoice.status !== 'CANCELLED' && role !== 'CUSTOMER' && (
            <Button
              variant="secondary"
              size="sm"
              icon={DollarSign}
              onClick={() => setIsCollectModalOpen(true)}
            >
              Record Payment
            </Button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No payments have been posted to this invoice yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5">Reference #</th>
                  <th className="py-2.5">Settlement Date</th>
                  <th className="py-2.5">Payment Method</th>
                  <th className="py-2.5 text-right">Amount</th>
                  <th className="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 font-mono font-semibold text-indigo-700">{p.paymentNumber}</td>
                    <td className="py-3 text-slate-600">{formatDateTime(p.paymentDate)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-600 font-mono">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 text-center">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin / Staff Record Payment Modal */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title={`Record Payment for ${invoice.invoiceNumber}`}
      >
        <RecordPaymentForm
          initialInvoiceId={invoice.id}
          initialCustomerId={invoice.customerId}
          onSuccess={async () => {
            setIsCollectModalOpen(false);
            await loadData();
            setFeedback('Payment recorded and invoice balance updated.');
          }}
          onCancel={() => setIsCollectModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default InvoiceDetails;
