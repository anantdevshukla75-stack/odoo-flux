import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Pause,
  Play,
  XCircle,
  Receipt,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
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

const STATUS_STEPS = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'];

export function SubscriptionDetails({ backPath = '/admin/subscriptions' }) {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [sub, setSub] = useState(null);
  const [plan, setPlan] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  const isCustomerView = location.pathname.startsWith('/customer');

  const loadData = async () => {
    const s = await mockDataService.getSubscriptionById(subscriptionId);
    if (s) {
      setSub(s);
      const [p, invList] = await Promise.all([
        mockDataService.getPlanById(s.planId),
        mockDataService.getInvoices({ customerId: s.customerId })
      ]);
      setPlan(p);
      setInvoices(invList);
    }
  };

  useEffect(() => {
    loadData();
  }, [subscriptionId]);

  if (!sub) {
    return <LoadingState message="Loading subscription contract details..." />;
  }

  const handleAction = async (newStatus) => {
    setLoadingAction(true);
    await mockDataService.updateSubscriptionStatus(sub.id, newStatus);
    await loadData();
    setLoadingAction(false);
  };

  // Check plan policies
  const allowPause = plan ? plan.allowPause !== false : true;
  const allowEarlyClose = plan ? plan.allowEarlyClose !== false : true;
  const allowRenewal = plan ? plan.allowRenewal !== false : true;

  // Compute current timeline step index
  let currentStepIdx = 3; // default 'ACTIVE'
  if (sub.status === 'DRAFT') currentStepIdx = 0;
  else if (sub.status === 'QUOTATION') currentStepIdx = 1;
  else if (sub.status === 'CONFIRMED') currentStepIdx = 2;
  else if (sub.status === 'ACTIVE' || sub.status === 'PAUSED') currentStepIdx = 3;
  else if (sub.status === 'CLOSED' || sub.status === 'CANCELLED') currentStepIdx = 4;

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Subscriptions</span>
      </button>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{sub.subscriptionNumber}</h1>
              <StatusBadge status={sub.status} />
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {sub.planName}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
              <span>Account: <strong className="text-slate-800">{sub.customerName}</strong></span>
              <span>Next Renewal: <strong className="text-slate-800">{formatDate(sub.nextBillingDate)}</strong></span>
            </div>
          </div>
        </div>

        {/* Subscription Lifecycle Action Buttons */}
        <div className="flex items-center gap-2">
          {sub.status === 'CONFIRMED' && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              loading={loadingAction}
              onClick={() => handleAction('ACTIVE')}
            >
              Activate Subscription
            </Button>
          )}

          {sub.status === 'ACTIVE' && allowPause && (
            <Button
              variant="secondary"
              size="sm"
              icon={Pause}
              loading={loadingAction}
              onClick={() => handleAction('PAUSED')}
            >
              Pause Contract
            </Button>
          )}

          {sub.status === 'PAUSED' && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              loading={loadingAction}
              onClick={() => handleAction('ACTIVE')}
            >
              Resume Billing
            </Button>
          )}

          {sub.status === 'ACTIVE' && allowRenewal && (
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={loadingAction}
              onClick={() => alert(`Simulating cycle renewal for ${sub.subscriptionNumber}`)}
            >
              Renew Cycle
            </Button>
          )}

          {sub.status !== 'CLOSED' && sub.status !== 'CANCELLED' && allowEarlyClose && (
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              loading={loadingAction}
              onClick={() => handleAction('CLOSED')}
            >
              Close Contract
            </Button>
          )}
        </div>
      </div>

      {/* Subscription Status Lifecycle Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Lifecycle Progression: DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED
        </div>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          {STATUS_STEPS.map((st, i) => {
            const isPassed = i <= currentStepIdx;
            const isCurrent = i === currentStepIdx;

            return (
              <div key={st} className="flex flex-col items-center relative z-10 bg-white px-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : isPassed
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 ${isCurrent ? 'text-emerald-700 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                  {st}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Recurring Billing"
          value={formatCurrency(sub.recurringAmount)}
          icon={DollarSign}
          helperText={`Billed ${sub.billingInterval ? sub.billingInterval.toLowerCase() : 'monthly'}`}
        />
        <StatCard
          label="Contract Commenced"
          value={formatDate(sub.startDate)}
          icon={Calendar}
          helperText="Original activation date"
        />
        <StatCard
          label="Next Billing Date"
          value={formatDate(sub.nextBillingDate)}
          icon={Clock}
          helperText="Automated charge date"
        />
        <StatCard
          label="Payment Terms"
          value={sub.paymentTerms || 'Net 15 Days'}
          icon={Receipt}
          helperText="Invoice settlement window"
        />
      </div>

      {/* Grid: Plan Entitlements & Linked Invoices History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entitlements */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Plan Policy Rules & Entitlements
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Self-Service Pause:</span>
              <span className={`font-semibold ${allowPause ? 'text-emerald-600' : 'text-slate-400'}`}>
                {allowPause ? 'Permitted by Plan Rules' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Auto-Renewal Policy:</span>
              <span className={`font-semibold ${allowRenewal ? 'text-emerald-600' : 'text-slate-400'}`}>
                {allowRenewal ? 'Automatic Renewal Enabled' : 'Expires at Term'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Early Cancellation:</span>
              <span className={`font-semibold ${allowEarlyClose ? 'text-emerald-600' : 'text-slate-400'}`}>
                {allowEarlyClose ? 'Allowed with no penalty' : 'Delinquent Only'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Subscriber Organization:</span>
              <span className="font-semibold text-slate-900">{sub.customerName}</span>
            </div>
          </div>
        </div>

        {/* Linked Invoices Billing History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Linked Invoicing History</h3>
            <span className="text-xs text-slate-500">{invoices.length} invoices</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Invoice #</th>
                  <th className="px-4 py-2.5">Due Date</th>
                  <th className="px-4 py-2.5">Total</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionDetails;

