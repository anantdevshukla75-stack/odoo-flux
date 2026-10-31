import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Check,
  X,
  Send,
  RefreshCw,
  Clock,
  Building,
  Mail,
  Phone,
  Layers,
  DollarSign
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function QuotationDetails({ backPath = '/admin/quotations' }) {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [quote, setQuote] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const isCustomerView = location.pathname.startsWith('/customer');

  const loadQuote = useCallback(async () => {
    const q = await mockDataService.getQuotationById(quotationId);
    setQuote(q);
  }, [quotationId]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  if (!quote) {
    return <LoadingState message="Loading commercial proposal details..." />;
  }

  const handleStatusTransition = async (newStatus) => {
    setLoadingAction(true);
    await mockDataService.updateQuotationStatus(quote.id, newStatus);
    await loadQuote();
    setLoadingAction(false);
  };

  const steps = [
    { key: 'DRAFT', label: 'Draft Created' },
    { key: 'SENT', label: 'Sent to Client' },
    { key: 'ACCEPTED', label: quote.status === 'REJECTED' ? 'Rejected' : 'Client Accepted' },
    { key: 'SUBSCRIPTION', label: 'Subscription Active' }
  ];

  let currentStepIndex = 0;
  if (quote.status === 'SENT') currentStepIndex = 1;
  if (quote.status === 'ACCEPTED' || quote.status === 'REJECTED') currentStepIndex = 2;

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Quotations</span>
      </button>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{quote.quotationNumber}</h1>
              <StatusBadge status={quote.status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
              <span>Customer: <strong className="text-slate-800">{quote.customerName}</strong></span>
              <span>Expires: <strong className="text-slate-800">{formatDate(quote.validUntil)}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          {quote.status === 'DRAFT' && !isCustomerView && (
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              loading={loadingAction}
              onClick={() => handleStatusTransition('SENT')}
            >
              Send to Customer
            </Button>
          )}

          {quote.status === 'SENT' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                loading={loadingAction}
                onClick={() => handleStatusTransition('ACCEPTED')}
              >
                {isCustomerView ? 'Authorize & Accept' : 'Record Acceptance'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={X}
                loading={loadingAction}
                onClick={() => handleStatusTransition('REJECTED')}
              >
                Decline Quote
              </Button>
            </>
          )}

          {quote.status === 'ACCEPTED' && (
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => navigate(isCustomerView ? '/customer/subscriptions' : '/admin/subscriptions')}
            >
              View Active Subscription
            </Button>
          )}
        </div>
      </div>

      {/* Lifecycle Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Proposal State Machine Timeline
        </div>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          {steps.map((st, i) => {
            const isCompleted = i <= currentStepIndex && quote.status !== 'REJECTED';
            const isRejected = quote.status === 'REJECTED' && i === 2;

            return (
              <div key={st.key} className="flex flex-col items-center relative z-10 bg-white px-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isRejected
                      ? 'bg-red-600 text-white'
                      : isCompleted
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Customer Details & Commercial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Target Commercial Enterprise
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Contact Person:</span>
              <span className="font-semibold text-slate-900">{quote.customerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Corporate Email:</span>
              <span className="font-mono text-slate-800">{quote.customerEmail || 'billing@acmecorp.com'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Payment Terms:</span>
              <span className="font-medium text-slate-800">{quote.paymentTerms || 'Net 15 Days'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Proposal Created:</span>
              <span className="text-slate-800">{formatDate(quote.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Quoted Subscription Package
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Plan Tier:</span>
              <span className="font-bold text-indigo-600">{quote.planName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Billing Cadence:</span>
              <span className="font-medium text-slate-800 capitalize">
                {quote.planInterval ? quote.planInterval.toLowerCase() : 'Monthly recurring'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Subtotal Valuation:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Statutory Tax (18%):</span>
              <span className="font-semibold text-slate-900">{formatCurrency(quote.taxAmount)}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-900">
            <span>Recurring Grand Total:</span>
            <span className="text-indigo-600 font-mono text-base">{formatCurrency(quote.total)}</span>
          </div>
        </div>
      </div>

      {/* Product Lines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Bundled Line Items & Entitlements</h3>
          <span className="text-xs text-slate-500">{quote.productLines?.length || 0} line items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Catalog Product</th>
                <th className="px-6 py-3">Variant Tier</th>
                <th className="px-6 py-3 text-center">Qty</th>
                <th className="px-6 py-3">Unit Valuation</th>
                <th className="px-6 py-3 text-right">Line Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quote.productLines && quote.productLines.length > 0 ? (
                quote.productLines.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-semibold text-slate-900">{l.productName}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{l.variantName || 'Standard'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{l.quantity}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(l.unitPrice)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-right">
                      {formatCurrency(l.quantity * l.unitPrice)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-400">
                    Standard plan configuration with all base entitlements included.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default QuotationDetails;

