import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Layers, Power, Calendar, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [intervalFilter, setIntervalFilter] = useState('ALL');

  const loadPlans = async () => {
    const list = await apiService.getPlans();
    setPlans(list);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleToggleStatus = async (id) => {
    await apiService.togglePlanStatus(id);
    loadPlans();
  };

  const filteredPlans = intervalFilter === 'ALL'
    ? plans
    : plans.filter(p => p.billingInterval === intervalFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Define recurring billing intervals, minimum contract quantities, auto-renewal rules, and bundled catalog lines."
        breadcrumbs={[
          { name: 'Dashboard', path: '/admin/dashboard' },
          { name: 'Subscription Plans' }
        ]}
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/admin/plans/new')}
        >
          Create Plan
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Filter Cadence:
            </span>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              {['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setIntervalFilter(interval)}
                  className={`px-2.5 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                    intervalFilter === interval
                      ? 'bg-white text-indigo-600 font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {interval === 'ALL' ? 'All' : interval.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Total Plans: <strong className="text-slate-800">{filteredPlans.length}</strong>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Subscription Plan</th>
                <th className="px-6 py-3">Billing Interval</th>
                <th className="px-6 py-3">Recurring Price</th>
                <th className="px-6 py-3">Contract Policies</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{plan.name}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{plan.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      Every {plan.billingIntervalCount > 1 ? `${plan.billingIntervalCount} ` : ''}
                      {plan.billingInterval.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {formatCurrency(plan.basePrice)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className={plan.allowPause ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                        {plan.allowPause ? '✓ Pause Permitted' : '✕ No Pause'}
                      </span>
                      <span className={plan.allowRenewal ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                        {plan.allowRenewal ? '✓ Auto-Renewal' : '✕ Fixed Term'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={plan.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`/admin/plans/${plan.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Power}
                        onClick={() => handleToggleStatus(plan.id)}
                        title={plan.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Plans;

