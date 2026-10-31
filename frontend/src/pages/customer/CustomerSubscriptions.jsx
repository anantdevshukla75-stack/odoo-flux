import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  RefreshCw,
  Pause,
  Play,
  RotateCw,
  XCircle,
  Eye,
  Calendar,
  Layers,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function CustomerSubscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [subInvoices, setSubInvoices] = useState([]);
  const [subProducts, setSubProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'PRODUCTS' | 'BILLING'
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    const [sList, pList] = await Promise.all([
      mockDataService.getSubscriptions({ customerId: 'cust-001' }),
      mockDataService.getPlans()
    ]);
    setSubscriptions(sList);
    setPlans(pList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetails = async (sub) => {
    setSelectedSub(sub);
    setActiveTab('OVERVIEW');

    // Load related invoices
    const allInvoices = await mockDataService.getInvoices({ customerId: 'cust-001' });
    const relatedInv = allInvoices.filter(i => i.subscriptionId === sub.id || i.subscriptionId === sub.subscriptionNumber);
    setSubInvoices(relatedInv);

    // Find plan products
    const plan = plans.find(p => p.id === sub.planId || p.name === sub.planName);
    if (plan && plan.products) {
      setSubProducts(plan.products);
    } else {
      setSubProducts([
        { productName: sub.planName, quantity: 1, unitPrice: sub.recurringAmount }
      ]);
    }
  };

  const handleAction = async (actionType) => {
    if (!selectedSub) return;
    const plan = plans.find(p => p.id === selectedSub.planId || p.name === selectedSub.planName);

    try {
      if (actionType === 'PAUSE') {
        if (plan && plan.allowPause === false) {
          alert('This plan agreement does not allow temporary suspension.');
          return;
        }
        await mockDataService.updateSubscriptionStatus(selectedSub.id, 'PAUSED');
        setFeedback('Subscription paused in demonstration state.');
      } else if (actionType === 'RESUME') {
        await mockDataService.updateSubscriptionStatus(selectedSub.id, 'ACTIVE');
        setFeedback('Subscription resumed in demonstration state.');
      } else if (actionType === 'RENEW') {
        const nextDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const subs = mockDataService._get('bl_subscriptions');
        const idx = subs.findIndex(s => s.id === selectedSub.id);
        if (idx !== -1) {
          subs[idx].nextBillingDate = nextDate;
          mockDataService._set('bl_subscriptions', subs);
        }
        setFeedback(`Subscription term renewed. Next billing date extended to ${formatDate(nextDate)}.`);
      } else if (actionType === 'CLOSE') {
        if (window.confirm('Are you sure you want to cancel and close this subscription?')) {
          await mockDataService.updateSubscriptionStatus(selectedSub.id, 'CLOSED');
          setFeedback('Subscription closed in demonstration state.');
        }
      }

      await loadData();
      // Re-fetch updated selected sub
      const updated = await mockDataService.getSubscriptionById(selectedSub.id);
      setSelectedSub(updated);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      alert(err.message);
    }
  };

  const planOfSelected = selectedSub ? plans.find(p => p.id === selectedSub.planId || p.name === selectedSub.planName) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Subscriptions"
        description="Manage your active software subscriptions, review recurring billing schedules, and self-service lifecycle settings."
      />

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active subscriptions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Subscription Number</th>
                  <th className="py-3 px-4 font-semibold">Plan</th>
                  <th className="py-3 px-4 font-semibold">Billing Interval</th>
                  <th className="py-3 px-4 font-semibold">Start Date</th>
                  <th className="py-3 px-4 font-semibold">Next Billing Date</th>
                  <th className="py-3 px-4 text-right font-semibold">Rate</th>
                  <th className="py-3 px-4 text-center font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(sub)}
                        className="font-bold text-indigo-600 hover:text-indigo-800 font-mono text-left cursor-pointer"
                      >
                        {sub.subscriptionNumber}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {sub.planName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {sub.billingInterval}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(sub.startDate)}
                    </td>
                    <td className="py-3.5 px-4 text-indigo-700 font-medium">
                      {formatDate(sub.nextBillingDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-900">
                      {formatCurrency(sub.recurringAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleOpenDetails(sub)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Subscription Details Modal with 3 Tabs */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title={`Subscription Details: ${selectedSub?.subscriptionNumber}`}
      >
        {selectedSub && (
          <div className="space-y-4">
            {/* Header Strip */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedSub.planName}</h4>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedSub.subscriptionNumber}</div>
              </div>
              <StatusBadge status={selectedSub.status} />
            </div>

            {/* 3 Detail Tabs: Overview, Products, Billing History */}
            <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('OVERVIEW')}
                className={`pb-2 transition-colors cursor-pointer ${
                  activeTab === 'OVERVIEW'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Overview & Cadence
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PRODUCTS')}
                className={`pb-2 transition-colors cursor-pointer ${
                  activeTab === 'PRODUCTS'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Included Products ({subProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BILLING')}
                className={`pb-2 transition-colors cursor-pointer ${
                  activeTab === 'BILLING'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Invoices & Billing ({subInvoices.length})
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Recurring Rate:</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{formatCurrency(selectedSub.recurringAmount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Billing Cadence:</span>
                    <span className="font-semibold text-slate-800">{selectedSub.billingInterval}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Commencement Date:</span>
                    <span className="text-slate-800">{formatDate(selectedSub.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Next Renewal Cycle:</span>
                    <span className="font-semibold text-indigo-700">{formatDate(selectedSub.nextBillingDate)}</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-[11px] leading-relaxed">
                  <strong>Plan Policy Settings:</strong> Pause permitted:{' '}
                  <span className="font-semibold">{planOfSelected?.allowPause !== false ? 'Yes' : 'No'}</span> | Renewal permitted:{' '}
                  <span className="font-semibold">{planOfSelected?.allowRenewal !== false ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}

            {/* Tab 2: Products */}
            {activeTab === 'PRODUCTS' && (
              <div className="space-y-2 text-xs">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="p-2">Component / Line</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Unit Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium text-slate-900">{p.productName}</td>
                          <td className="p-2 text-center">{p.quantity}</td>
                          <td className="p-2 text-right font-mono font-semibold">{formatCurrency(p.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Billing History */}
            {activeTab === 'BILLING' && (
              <div className="space-y-2 text-xs">
                {subInvoices.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No invoices generated for this subscription yet.</div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="p-2">Invoice #</th>
                          <th className="p-2">Issued</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subInvoices.map(inv => (
                          <tr key={inv.id}>
                            <td className="p-2 font-mono font-semibold text-indigo-700">{inv.invoiceNumber}</td>
                            <td className="p-2 text-slate-500">{formatDate(inv.issueDate)}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                            <td className="p-2 text-center"><StatusBadge status={inv.status} /></td>
                            <td className="p-2 text-right">
                              <Link
                                to={`/customer/invoices/${inv.id}`}
                                className="text-indigo-600 font-semibold hover:underline"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Self-Service Actions Strip */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <Button variant="secondary" onClick={() => setSelectedSub(null)}>
                Close
              </Button>

              <div className="flex items-center gap-2">
                {/* Pause Action: Allowed if status === ACTIVE and plan allows pause */}
                {selectedSub.status === 'ACTIVE' && planOfSelected?.allowPause !== false && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Pause}
                    onClick={() => handleAction('PAUSE')}
                  >
                    Pause Subscription
                  </Button>
                )}

                {/* Resume Action: Allowed if status === PAUSED */}
                {selectedSub.status === 'PAUSED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Play}
                    onClick={() => handleAction('RESUME')}
                  >
                    Resume Subscription
                  </Button>
                )}

                {/* Renew Action: Allowed if status !== CLOSED and plan allows renewal */}
                {selectedSub.status !== 'CLOSED' && planOfSelected?.allowRenewal !== false && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RotateCw}
                    onClick={() => handleAction('RENEW')}
                  >
                    Renew Term
                  </Button>
                )}

                {/* Close Action: Allowed if status !== CLOSED */}
                {selectedSub.status !== 'CLOSED' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleAction('CLOSE')}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    Cancel Plan
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CustomerSubscriptions;
