import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';
import { mockDataService } from '../../services/mockDataService.js';
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

  const items = invoice.items || [
    {
      id: 'default-1',
      description: subscription?.planName || 'Brightloop Enterprise Cloud Platform Access',
      quantity: 1,
      unitPrice: invoice.subtotal || (invoice.totalAmount * 0.85),
      taxRate: 18,
      amount: invoice.subtotal || (invoice.totalAmount * 0.85)
    }
  ];

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
              Brightloop Cloud Technologies, Inc.<br />
              100 Innovation Way, Suite 400<br />
              San Francisco, CA 94105, United States<br />
              Tax ID / EIN: US-8829104-X | VAT ID: EU-99238411
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950 m-0">
              TAX INVOICE
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
              Attn: {customer?.name || invoice.customerName}
            </div>
            <div className="text-xs text-slate-600 leading-relaxed mt-1">
              {customer?.billingAddress?.street || '742 Evergreen Terrace'}<br />
              {customer?.billingAddress?.city || 'San Francisco'}, {customer?.billingAddress?.state || 'CA'} {customer?.billingAddress?.zip || '94107'}<br />
              Email: {customer?.email || 'billing@acme.com'} | Phone: {customer?.phone || '+1 (555) 234-5678'}
            </div>
            {customer?.taxId && (
              <div className="text-xs text-slate-600 mt-1">
                <strong>Tax Registration / VAT:</strong> {customer.taxId}
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
                <span className="font-mono">{invoice.subscriptionId || 'One-Off Contract'}</span>
              </div>
              {subscription && (
                <>
                  <div><span className="font-semibold text-slate-900">Plan:</span> {subscription.planName}</div>
                  <div><span className="font-semibold text-slate-900">Billing Interval:</span> {subscription.billingInterval}</div>
                  <div><span className="font-semibold text-slate-900">Term:</span> {formatDate(subscription.startDate)} to {formatDate(subscription.nextBillingDate)}</div>
                </>
              )}
              <div><span className="font-semibold text-slate-900">Payment Terms:</span> Net 15 Days from issuance</div>
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
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Cloud enterprise multi-region instance, dedicated tenant orchestration
                    </div>
                  </td>
                  <td className="py-3 text-center text-slate-700 font-medium">{line.quantity}</td>
                  <td className="py-3 text-right text-slate-800 font-medium">{formatCurrency(line.unitPrice)}</td>
                  <td className="py-3 text-center text-slate-600">{line.taxRate || 18}%</td>
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
              <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal || (invoice.totalAmount * 0.85))}</span>
            </div>
            {Number(invoice.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Promotional Discount:</span>
                <span>- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax (GST / VAT 18%):</span>
              <span className="font-semibold text-slate-900">{formatCurrency(invoice.taxAmount || (invoice.totalAmount * 0.15))}</span>
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

        {/* Payment Remittance & Instructions */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-[11px] text-slate-600">
          <div>
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">
              Bank Wire Remittance Instructions
            </div>
            <div className="leading-relaxed">
              Bank: Silicon Valley Commercial Bank<br />
              Account Name: Brightloop Software, Inc.<br />
              Account Number: 9812-4412-0091 | Routing: 121000358<br />
              SWIFT / BIC: SVBKUS6S<br />
              Payment Memo Reference: <strong>{invoice.invoiceNumber}</strong>
            </div>
          </div>

          <div className="text-right">
            <div className="font-bold text-slate-800 uppercase tracking-wider mb-1">
              Questions & Inquiries
            </div>
            <div className="leading-relaxed">
              Email: accounts-receivable@brightloopsoftware.com<br />
              Phone: +1 (800) 555-LOOP<br />
              Customer Portal: https://app.brightloopsoftware.com<br />
              Thank you for choosing Brightloop Software!
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          This is an official computer-generated tax invoice. All cloud software services provided under Brightloop Master Subscription Agreement.
        </div>
      </div>
    </div>
  );
}

export default InvoicePrint;

