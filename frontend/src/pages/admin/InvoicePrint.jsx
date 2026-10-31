import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import Button from '../../components/common/Button.jsx';

export function InvoicePrint() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const details = await apiService.getInvoiceDetails(invoiceId);
        setInvoice(details.invoice);
        setCustomer(details.customer);
        setSubscription(details.subscription);
      } catch {
        setInvoice(null);
      }
      setLoading(false);
    }
    loadData();
  }, [invoiceId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Preparing print document...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-700">Invoice not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const items = invoice.items || [];

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4 sm:p-8 flex flex-col items-center">
      {/* Print Control Toolbar - Hidden during print */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between print:hidden bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Details</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Print layout optimized for A4 / Letter paper.
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-slate-900 text-white font-black text-lg flex items-center justify-center rounded">
                B
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-950">
                Brightloop Software
              </span>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              Subscription and billing management
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950 m-0">
              INVOICE
            </h1>
            <div className="text-base font-bold font-mono text-slate-900 mt-1">
              {invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              <div><span className="font-semibold text-slate-700">Issue Date:</span> {formatDate(invoice.issueDate)}</div>
              <div><span className="font-semibold text-slate-700">Due Date:</span> {formatDate(invoice.dueDate)}</div>
              {invoice.billingPeriod && (
                <div><span className="font-semibold text-slate-700">Billing Period:</span> {invoice.billingPeriod}</div>
              )}
              <div><span className="font-semibold text-slate-700">Status:</span> {invoice.status}</div>
            </div>
          </div>
        </div>

        {/* Customer & Billing Context */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Billed To (Customer)
            </div>
            <div className="text-base font-bold text-slate-950">
              {customer?.companyName || invoice.customerName}
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              Attn: {customer?.fullName || invoice.customerName}
            </div>
            <div className="text-xs text-slate-600 leading-relaxed mt-1">
              {customer?.billingAddress || 'Billing address not provided'}<br />
              Email: {customer?.email || '—'} | Phone: {customer?.phone || '—'}
            </div>
            {customer?.taxId && (
              <div className="text-xs text-slate-600 mt-1">
                <strong>Tax ID:</strong> {customer.taxId}
              </div>
            )}
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Subscription Context & Terms
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <div>
                <span className="font-semibold text-slate-900">Subscription Ref:</span>{' '}
                <span className="font-mono">{subscription?.subscriptionNumber || '—'}</span>
              </div>
              {subscription && (
                <>
                  <div><span className="font-semibold text-slate-900">Plan:</span> {subscription.planName}</div>
                  <div><span className="font-semibold text-slate-900">Billing Interval:</span> {subscription.billingInterval}</div>
                  <div><span className="font-semibold text-slate-900">Term:</span> {formatDate(subscription.startDate)} to {formatDate(subscription.nextBillingDate)}</div>
                </>
              )}
              <div><span className="font-semibold text-slate-900">Payment Terms:</span> {subscription?.paymentTerms || 'Due on receipt'}</div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 font-bold">Item Description</th>
                <th className="py-2.5 text-center font-bold">Qty</th>
                <th className="py-2.5 text-right font-bold">Unit Price</th>
                <th className="py-2.5 text-center font-bold">Tax</th>
                <th className="py-2.5 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-3 pr-2">
                    <div className="font-bold text-slate-950">{line.description}</div>
                  </td>
                  <td className="py-3 text-center text-slate-700 font-medium">{line.quantity}</td>
                  <td className="py-3 text-right text-slate-800 font-medium">{formatCurrency(line.unitPrice)}</td>
                  <td className="py-3 text-center text-slate-600">{formatCurrency(line.taxAmount || 0)}</td>
                  <td className="py-3 text-right font-bold text-slate-950">{formatCurrency(line.amount || (line.quantity * line.unitPrice))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Promotional Discount:</span>
                <span>- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t-2 border-slate-900">
              <span>Total Invoiced:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold pt-1">
              <span>Amount Paid:</span>
              <span>- {formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-dashed border-slate-400">
              <span className={invoice.balance > 0 ? 'text-rose-700' : 'text-slate-900'}>Balance Outstanding:</span>
              <span className={invoice.balance > 0 ? 'text-rose-700' : 'text-slate-900'}>{formatCurrency(invoice.balance)}</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-600">
          Payment reference: <strong>{invoice.invoiceNumber}</strong>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          Invoice reference: {invoice.invoiceNumber}
        </div>
      </div>
    </div>
  );
}

export default InvoicePrint;

