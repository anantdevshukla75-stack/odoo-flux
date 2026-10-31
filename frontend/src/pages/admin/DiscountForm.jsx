import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Tag, DollarSign, Percent, Calendar, Layers, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function DiscountForm({ initialData, onSave, onCancel, isModal = false }) {
  const navigate = useNavigate();
  const { discountId } = useParams();
  const isEditing = Boolean(discountId || (initialData && initialData.id));

  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    value: '',
    minPurchase: '',
    minQuantity: '1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: '100',
    applicability: 'ALL', // 'ALL' | 'PRODUCT_SPECIFIC' | 'SUBSCRIPTION_WIDE'
    applicableProducts: [],
    applicableSubscriptions: [],
    isActive: true
  });

  useEffect(() => {
    async function loadMetadata() {
      const [prodList, planList] = await Promise.all([
        mockDataService.getProducts(),
        mockDataService.getPlans()
      ]);
      setProducts(prodList);
      setPlans(planList);

      if (initialData) {
        setFormData({ ...initialData });
      } else if (discountId) {
        const d = await mockDataService.getDiscountById(discountId);
        if (d) {
          setFormData({
            ...d,
            applicableProducts: d.applicableProducts || [],
            applicableSubscriptions: d.applicableSubscriptions || []
          });
        }
      }
    }
    loadMetadata();
  }, [discountId, initialData]);

  const handleProductToggle = (prodId) => {
    setFormData(prev => {
      const exists = prev.applicableProducts.includes(prodId);
      return {
        ...prev,
        applicableProducts: exists
          ? prev.applicableProducts.filter(id => id !== prodId)
          : [...prev.applicableProducts, prodId]
      };
    });
  };

  const handlePlanToggle = (planId) => {
    setFormData(prev => {
      const exists = prev.applicableSubscriptions.includes(planId);
      return {
        ...prev,
        applicableSubscriptions: exists
          ? prev.applicableSubscriptions.filter(id => id !== planId)
          : [...prev.applicableSubscriptions, planId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      code: (formData.code || formData.name).toUpperCase().replace(/\s+/g, '_').trim(),
      value: parseFloat(formData.value) || 0,
      minPurchase: parseFloat(formData.minPurchase) || 0,
      minQuantity: parseInt(formData.minQuantity, 10) || 1,
      usageLimit: parseInt(formData.usageLimit, 10) || 0,
      applicableProducts: formData.applicability === 'PRODUCT_SPECIFIC' ? formData.applicableProducts : [],
      applicableSubscriptions: formData.applicability === 'SUBSCRIPTION_WIDE' ? formData.applicableSubscriptions : []
    };

    if (isEditing) {
      const targetId = discountId || initialData?.id;
      await mockDataService.updateDiscount(targetId, payload);
    } else {
      await mockDataService.createDiscount(payload);
    }

    setLoading(false);
    if (onSave) {
      onSave();
    } else {
      navigate('/admin/discounts');
    }
  };

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-600" />
          <span>General Discount Configuration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Discount Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Enterprise Expansion Incentive"
            required
          />

          <Input
            label="Promo Coupon Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. EXPAND2026"
            helperText="Uppercase alphanumeric string used for redemption"
            required
          />
        </div>

        <Input
          label="Internal Description / Terms"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g. Applies exclusively to scale enterprise plans or core platform tiers"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Concession Type"
            value={formData.discountType}
            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
            options={[
              { value: 'PERCENTAGE', label: 'Percentage (%) Off' },
              { value: 'FIXED', label: 'Fixed Monetary Concession ($) Off' }
            ]}
            required
          />

          <Input
            label={formData.discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Concession Amount ($)'}
            type="number"
            step="0.01"
            min="0"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '250.00'}
            required
          />

          <Select
            label="Discount State"
            value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
            options={[
              { value: 'ACTIVE', label: 'Active & Redeemable' },
              { value: 'INACTIVE', label: 'Deactivated' }
            ]}
          />
        </div>
      </div>

      {/* Constraints & Limits */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Redemption Conditions & Usage Restrictions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Minimum Purchase Amount ($)"
            type="number"
            step="0.01"
            min="0"
            value={formData.minPurchase}
            onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
            placeholder="0.00"
            helperText="Minimum order subtotal before discount can apply"
          />

          <Input
            label="Minimum Line Quantity"
            type="number"
            min="1"
            value={formData.minQuantity}
            onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
            placeholder="1"
            helperText="Minimum aggregate unit count required"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />

          <Input
            label="Expiry Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />

          <Input
            label="Maximum Usage Limit"
            type="number"
            min="1"
            value={formData.usageLimit}
            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
            placeholder="e.g. 50"
            helperText="Total redemptions allowed across the system"
          />
        </div>
      </div>

      {/* Scope and Applicability */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Discount Applicability & Target Scope</span>
        </h3>

        <Select
          label="Scope of Applicability"
          value={formData.applicability}
          onChange={(e) => setFormData({ ...formData, applicability: e.target.value })}
          options={[
            { value: 'ALL', label: 'Universal (Applies to all products & subscriptions)' },
            { value: 'PRODUCT_SPECIFIC', label: 'Product-Specific (Applies only to selected products)' },
            { value: 'SUBSCRIPTION_WIDE', label: 'Subscription-Wide (Applies only to selected subscription plans)' }
          ]}
        />

        {formData.applicability === 'PRODUCT_SPECIFIC' && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700">Select Applicable Products:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
              {products.map(p => {
                const checked = formData.applicableProducts.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2.5 p-2 bg-white rounded border border-slate-200 cursor-pointer text-xs font-medium text-slate-800 hover:bg-indigo-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleProductToggle(p.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{p.name} ({formatCurrency(p.salesPrice)})</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {formData.applicability === 'SUBSCRIPTION_WIDE' && (
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700">Select Applicable Subscription Plans:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
              {plans.map(pl => {
                const checked = formData.applicableSubscriptions.includes(pl.id);
                return (
                  <label key={pl.id} className="flex items-center gap-2.5 p-2 bg-white rounded border border-slate-200 cursor-pointer text-xs font-medium text-slate-800 hover:bg-indigo-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handlePlanToggle(pl.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{pl.name} ({pl.billingInterval})</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => (onCancel ? onCancel() : navigate('/admin/discounts'))}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={Save}
          loading={loading}
        >
          {isEditing ? 'Update Discount Rule' : 'Save & Publish Discount'}
        </Button>
      </div>
    </form>
  );

  if (isModal) {
    return formBody;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/admin/discounts"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Discounts Registry</span>
      </Link>

      <PageHeader
        title={isEditing ? `Edit Discount: ${formData.name || formData.code}` : 'Create Promotional Discount Rule'}
        description="Configure percentage or fixed concessions, minimum purchase conditions, product applicability, and usage quotas."
      />

      {formBody}
    </div>
  );
}

export default DiscountForm;

