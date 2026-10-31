import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Layers, DollarSign, Calendar, Check, X, Tag } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function PlanDetails() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    async function load() {
      const p = await apiService.getPlanById(planId);
      setPlan(p);
    }
    load();
  }, [planId]);

  if (!plan) {
    return <LoadingState message="Loading subscription plan configuration..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate('/admin/plans')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Subscription Plans</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{plan.name}</h1>
              <StatusBadge status={plan.isActive ? 'ACTIVE' : 'INACTIVE'} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                Every {plan.billingIntervalCount > 1 ? `${plan.billingIntervalCount} ` : ''}
                {plan.billingInterval.toLowerCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{plan.description || 'No description provided'}</p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Edit}
          onClick={() => navigate(`/admin/plans/${plan.id}/edit`)}
        >
          Edit Plan
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Recurring Plan Charge"
          value={formatCurrency(plan.basePrice)}
          icon={DollarSign}
          helperText={`Billed ${plan.billingInterval.toLowerCase()}`}
        />
        <StatCard
          label="Minimum Order Volume"
          value={`${plan.minimumQuantity || 1} units`}
          icon={Tag}
          helperText="Minimum license purchase threshold"
        />
        <StatCard
          label="Contract Availability"
          value={plan.startDate ? formatDate(plan.startDate) : 'Open perpetual'}
          icon={Calendar}
          helperText={plan.endDate ? `Expires on ${formatDate(plan.endDate)}` : 'No end date'}
        />
      </div>

      {/* Lifecycle Rules Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Configured Subscription Rules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            {plan.allowPause ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
            <span className="font-medium text-slate-800">Pause Allowance:</span>
            <span className="text-slate-500">{plan.allowPause ? 'Customer can self-pause' : 'Pause disallowed'}</span>
          </div>
          <div className="flex items-center gap-2">
            {plan.allowRenewal ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
            <span className="font-medium text-slate-800">Automatic Renewal:</span>
            <span className="text-slate-500">{plan.allowRenewal ? 'Enabled by default' : 'Fixed-term expiration'}</span>
          </div>
          <div className="flex items-center gap-2">
            {plan.allowEarlyClose ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
            <span className="font-medium text-slate-800">Early Close Policy:</span>
            <span className="text-slate-500">{plan.allowEarlyClose ? 'Allowed anytime' : 'Locked till end of cycle'}</span>
          </div>
          <div className="flex items-center gap-2">
            {plan.autoClose ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />}
            <span className="font-medium text-slate-800">Auto Termination:</span>
            <span className="text-slate-500">{plan.autoClose ? 'Auto closes if delinquent' : 'Manual staff review'}</span>
          </div>
        </div>
      </div>

      {/* Bundled Plan Products */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Bundled Plan Line Items</h3>
            <p className="text-xs text-slate-500">Products, service modules, or SLAs included in this plan tier</p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {plan.products?.length || 0} line items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Catalog Product</th>
                <th className="px-6 py-3 text-center">Allocated Quantity</th>
                <th className="px-6 py-3">Unit Valuation</th>
                <th className="px-6 py-3 text-right">Bundled Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.products && plan.products.length > 0 ? (
                plan.products.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{l.productName}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">{l.quantity}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(l.unitPrice)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-right">
                      {formatCurrency(l.quantity * l.unitPrice)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-slate-400">
                    No individual bundled product lines specified.
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

export default PlanDetails;

