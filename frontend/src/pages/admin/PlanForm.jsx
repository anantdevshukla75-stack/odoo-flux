import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Layers } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import PlanLineEditor from '../../components/plans/PlanLineEditor.jsx';
import { mockDataService } from '../../services/mockDataService.js';

export function PlanForm() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(planId && planId !== 'new');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    billingInterval: 'MONTHLY',
    billingIntervalCount: 1,
    minimumQuantity: 1,
    basePrice: '',
    startDate: '',
    endDate: '',
    autoClose: false,
    allowEarlyClose: false,
    allowPause: true,
    allowRenewal: true,
    isActive: true,
    products: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      if (isEdit) {
        const p = await mockDataService.getPlanById(planId);
        if (p) {
          setFormData({
            name: p.name,
            description: p.description || '',
            billingInterval: p.billingInterval,
            billingIntervalCount: p.billingIntervalCount || 1,
            minimumQuantity: p.minimumQuantity || 1,
            basePrice: p.basePrice,
            startDate: p.startDate || '',
            endDate: p.endDate || '',
            autoClose: Boolean(p.autoClose),
            allowEarlyClose: Boolean(p.allowEarlyClose),
            allowPause: Boolean(p.allowPause),
            allowRenewal: Boolean(p.allowRenewal),
            isActive: Boolean(p.isActive),
            products: p.products || []
          });
        }
      }
    }
    loadPlan();
  }, [planId, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      billingIntervalCount: parseInt(formData.billingIntervalCount, 10) || 1,
      minimumQuantity: parseInt(formData.minimumQuantity, 10) || 1,
      basePrice: parseFloat(formData.basePrice) || 0
    };

    if (isEdit) {
      await mockDataService.updatePlan(planId, payload);
    } else {
      await mockDataService.createPlan(payload);
    }

    setLoading(false);
    navigate('/admin/plans');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        type="button"
        onClick={() => navigate('/admin/plans')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Subscription Plans</span>
      </button>

      <PageHeader
        title={isEdit ? `Edit Plan: ${formData.name}` : 'Create Subscription Plan'}
        description="Configure recurring billing frequencies, availability periods, lifecycle allowances, and bundled product lines."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Plan Details Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Plan Information & Billing Cadence
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Scale Enterprise Monthly"
              required
            />

            <Input
              label="Recurring Base Price ($)"
              type="number"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              placeholder="749.00"
              required
            />
          </div>

          <Input
            label="Plan Description & Terms"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Commercial terms, target team size, included entitlements"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Billing Interval"
              value={formData.billingInterval}
              onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value })}
              options={[
                { value: 'DAILY', label: 'Daily' },
                { value: 'WEEKLY', label: 'Weekly' },
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'YEARLY', label: 'Yearly' }
              ]}
              required
            />

            <Input
              label="Interval Multiplier"
              type="number"
              min="1"
              value={formData.billingIntervalCount}
              onChange={(e) => setFormData({ ...formData, billingIntervalCount: e.target.value })}
              helperText="e.g. 1 for every month, 3 for quarterly"
              required
            />

            <Input
              label="Minimum Order Quantity"
              type="number"
              min="1"
              value={formData.minimumQuantity}
              onChange={(e) => setFormData({ ...formData, minimumQuantity: e.target.value })}
              helperText="Minimum licenses customer must buy"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Input
              label="Availability Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              helperText="Leave empty for immediate release"
            />

            <Input
              label="Plan Expiration / End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              helperText="Leave empty for open-ended perpetual plan"
            />
          </div>
        </div>

        {/* Contract Lifecycle Rules Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Subscription Lifecycle Policies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.allowPause}
                onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <div className="font-semibold text-slate-800">Allow Customer to Pause</div>
                <div className="text-slate-500 text-[11px]">Customers can temporarily suspend billing from self-service portal</div>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.allowRenewal}
                onChange={(e) => setFormData({ ...formData, allowRenewal: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <div className="font-semibold text-slate-800">Automatic Renewal Enabled</div>
                <div className="text-slate-500 text-[11px]">Subscription will automatically rebill at cycle expiration</div>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.allowEarlyClose}
                onChange={(e) => setFormData({ ...formData, allowEarlyClose: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <div className="font-semibold text-slate-800">Allow Early Termination</div>
                <div className="text-slate-500 text-[11px]">Customer can cancel contract before billing period finishes</div>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.autoClose}
                onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <div className="font-semibold text-slate-800">Auto-Close on Expiration</div>
                <div className="text-slate-500 text-[11px]">Automatically terminate contract if unpaid after grace period</div>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Plan is published and active for commercial quotations</span>
            </label>
          </div>
        </div>

        {/* Bundled Plan Line Items */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <PlanLineEditor
            lines={formData.products}
            onChange={(updatedLines) => setFormData({ ...formData, products: updatedLines })}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/plans')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
          >
            {isEdit ? 'Save Plan Changes' : 'Create Subscription Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PlanForm;

