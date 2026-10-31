import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FileText,
  Check,
  X,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowLeft
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function CustomerQuotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadQuotations = async () => {
    setLoading(true);
    const list = await mockDataService.getQuotations({ customerId: 'cust-001' });
    setQuotations(list);
    setLoading(false);
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleDecision = async (quotation, decision) => {
    const newStatus = decision === 'ACCEPT' ? 'ACCEPTED' : 'CANCELLED';
    await mockDataService.updateQuotationStatus(quotation.id, newStatus);
    setSelectedQuotation(null);
    await loadQuotations();

    if (decision === 'ACCEPT') {
      setFeedback({
        type: 'success',
        message: `Proposal ${quotation.quotationNumber} accepted! Subscription created and initial invoice generated in demonstration state.`
      });
    } else {
      setFeedback({
        type: 'info',
        message: `Proposal ${quotation.quotationNumber} declined in demonstration state.`
      });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Quotations & Commercial Proposals"
        description="Review custom plan terms, add-on scopes, and authorize pending software subscription agreements."
      />

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-500 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Proposals</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{quotations.length}</div>
          <div className="text-xs text-slate-500 mt-1">Issued for Acme Technologies</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-amber-700 font-semibold">Pending Authorization</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {quotations.filter(q => q.status === 'SENT').length}
          </div>
          <div className="text-xs text-amber-700 mt-1">Requires your authorization</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Active Agreements</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {quotations.filter(q => q.status === 'ACCEPTED').length}
          </div>
          <div className="text-xs text-emerald-700 mt-1">Converted to active subscription</div>
        </div>
      </div>

      {/* Quotation Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {quotations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No quotations found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Quotation Number</th>
                  <th className="py-3 px-4 font-semibold">Enrolled Plan</th>
                  <th className="py-3 px-4 font-semibold">Creation Date</th>
                  <th className="py-3 px-4 font-semibold">Expiry Date</th>
                  <th className="py-3 px-4 text-right font-semibold">Total Amount</th>
                  <th className="py-3 px-4 text-center font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map(q => {
                  const canAct = q.status === 'SENT';

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedQuotation(q)}
                          className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer font-mono text-left"
                        >
                          {q.quotationNumber}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {q.planName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(q.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(q.validUntil)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900">
                        {formatCurrency(q.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => setSelectedQuotation(q)}
                          >
                            Review
                          </Button>

                          {canAct ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                icon={Check}
                                onClick={() => handleDecision(q, 'ACCEPT')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={X}
                                onClick={() => handleDecision(q, 'DECLINE')}
                                className="text-rose-600 hover:bg-rose-50"
                              >
                                Decline
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium px-2">
                              {q.status === 'ACCEPTED' ? 'Authorized' : 'Closed'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Quotation Review Modal */}
      <Modal
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        title={`Commercial Proposal: ${selectedQuotation?.quotationNumber}`}
      >
        {selectedQuotation && (
          <div className="space-y-5 text-xs">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="text-base font-bold text-slate-900">{selectedQuotation.planName}</div>
                <div className="text-slate-500 mt-0.5">
                  Proposal issued to {selectedQuotation.customerName} on {formatDate(selectedQuotation.createdAt)}
                </div>
              </div>
              <StatusBadge status={selectedQuotation.status} />
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Included Products & Subscription Services
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedQuotation.productLines || [
                      { id: '1', productName: selectedQuotation.planName, variantName: 'Enterprise Access', quantity: 1, unitPrice: selectedQuotation.subtotal }
                    ]).map((line, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <div className="font-semibold text-slate-900">{line.productName}</div>
                          <div className="text-[10px] text-slate-500">{line.variantName}</div>
                        </td>
                        <td className="p-2 text-center">{line.quantity}</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatCurrency(line.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(selectedQuotation.subtotal)}</span>
              </div>
              {Number(selectedQuotation.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Promotional Discount:</span>
                  <span className="font-mono">- {formatCurrency(selectedQuotation.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax (GST 18%):</span>
                <span className="font-mono">{formatCurrency(selectedQuotation.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
                <span>Recurring Proposal Total:</span>
                <span className="font-mono text-indigo-700">{formatCurrency(selectedQuotation.total)}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              <strong>Validity:</strong> Valid until {formatDate(selectedQuotation.validUntil)}. Subject to Brightloop SaaS Master Subscription Terms.
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setSelectedQuotation(null)}>
                Close
              </Button>

              {selectedQuotation.status === 'SENT' ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleDecision(selectedQuotation, 'DECLINE')}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    Decline Proposal
                  </Button>
                  <Button
                    variant="primary"
                    icon={Check}
                    onClick={() => handleDecision(selectedQuotation, 'ACCEPT')}
                  >
                    Authorize & Sign Agreement
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">
                  {selectedQuotation.status === 'ACCEPTED'
                    ? '✓ This agreement is signed and active.'
                    : 'This proposal is no longer actionable.'}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CustomerQuotations;
