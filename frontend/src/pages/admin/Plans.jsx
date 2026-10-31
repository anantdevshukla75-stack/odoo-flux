import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { plansApi } from '../../services/api/plansApi.js';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { useAuth } from '../../context/useAuth.js';
import { ROLES } from '../../utils/roleHelpers.js';

export function Plans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [intervalFilter, setIntervalFilter] = useState('ALL');

  // Pagination state (Offset & Limit)
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await plansApi.listPlans({ offset, limit });
      if (Array.isArray(data) && data.length > 0) {
        setPlans(data);
      } else if (offset === 0) {
        const demoList = await mockDataService.getPlans();
        setPlans(demoList);
      } else {
        setPlans(data || []);
      }
    } catch (err) {
      console.warn('[Plans] API error, falling back to mock catalog:', err.message);
      const demoList = await mockDataService.getPlans();
      setPlans(demoList);
    } finally {
      setLoading(false);
    }
  }, [offset, limit]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleToggleStatus = async (plan) => {
    if (!isAdmin) return;
    const isCurrentlyActive = Boolean(plan.is_active ?? plan.isActive);
    try {
      await plansApi.updatePlan(plan.id, { is_active: !isCurrentlyActive });
    } catch {
      await mockDataService.togglePlanStatus(plan.id);
    }
    loadPlans();
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const pInterval = (p.billing_interval || p.billingInterval || '').toUpperCase();
      return intervalFilter === 'ALL' || pInterval === intervalFilter;
    });
  }, [plans, intervalFilter]);

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
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/admin/plans/new')}
          >
            Create Plan
          </Button>
        )}
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-white">
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400">
                    Loading subscription plans from backend API...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400">
                    No subscription plans found for this cadence.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const bInterval = (plan.billing_interval || plan.billingInterval || 'monthly').toLowerCase();
                  const bCount = plan.billing_interval_count ?? plan.billingIntervalCount ?? 1;
                  const isActive = Boolean(plan.is_active ?? plan.isActive);
                  const allowPause = Boolean(plan.allow_pause ?? plan.allowPause);
                  const allowRenewal = Boolean(plan.allow_renewal ?? plan.allowRenewal);

                  // Calculate bundled recurring price from plan lines or basePrice
                  let recurringPrice = plan.basePrice || 0;
                  if (Array.isArray(plan.lines) && plan.lines.length > 0) {
                    recurringPrice = plan.lines.reduce(
                      (sum, l) => sum + (Number(l.unit_price ?? l.unitPrice ?? 0) * (l.quantity || 1)),
                      0
                    );
                  }

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{plan.name}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">{plan.description || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          Every {bCount > 1 ? `${bCount} ` : ''}
                          {bInterval}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(recurringPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className={allowPause ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                            {allowPause ? '✓ Pause Permitted' : '✕ No Pause'}
                          </span>
                          <span className={allowRenewal ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                            {allowRenewal ? '✓ Auto-Renewal' : '✕ Fixed Term'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={isActive ? 'ACTIVE' : 'INACTIVE'} />
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
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Power}
                              onClick={() => handleToggleStatus(plan)}
                              title={isActive ? 'Deactivate' : 'Activate'}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Offset Pagination Controls */}
        <div className="p-4 sm:px-6 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
          <div>Showing offset {offset} – {offset + plans.length}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              icon={ChevronLeft}
              disabled={offset === 0}
              onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="xs"
              icon={ChevronRight}
              disabled={plans.length < limit}
              onClick={() => setOffset((prev) => prev + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Plans;
