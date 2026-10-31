import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import VariantEditor from '../../components/products/VariantEditor.jsx';
import { productsApi } from '../../services/api/productsApi.js';
import { mockDataService } from '../../services/mockDataService.js';
import { useAuth } from '../../context/useAuth.js';
import { ROLES } from '../../utils/roleHelpers.js';

export function ProductForm() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isEdit = Boolean(productId && productId !== 'new');

  const [formData, setFormData] = useState({
    name: '',
    productType: 'service',
    salesPrice: '',
    costPrice: '',
    notes: '',
    isActive: true,
    variants: []
  });

  const [originalProduct, setOriginalProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProduct = useCallback(async () => {
    if (isEdit) {
      try {
        const prod = await productsApi.getProduct(productId);
        if (prod) {
          setOriginalProduct(prod);
          setFormData({
            name: prod.name,
            productType: (prod.product_type || prod.productType || 'service').toLowerCase(),
            salesPrice: String(prod.sales_price ?? prod.salesPrice ?? ''),
            costPrice: String(prod.cost_price ?? prod.costPrice ?? ''),
            notes: prod.notes || '',
            isActive: Boolean(prod.is_active ?? prod.isActive),
            variants: prod.variants || []
          });
          return;
        }
      } catch {
        // Fallback to mock
      }

      const mockProd = await mockDataService.getProductById(productId);
      if (mockProd) {
        setOriginalProduct(mockProd);
        setFormData({
          name: mockProd.name,
          productType: (mockProd.productType || 'service').toLowerCase(),
          salesPrice: String(mockProd.salesPrice || ''),
          costPrice: String(mockProd.costPrice || ''),
          notes: mockProd.notes || '',
          isActive: Boolean(mockProd.isActive),
          variants: mockProd.variants || []
        });
      }
    }
  }, [productId, isEdit]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only administrators can create or modify catalog products.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        // PATCH: Send only modified fields. Never send null for required fields.
        const changes = {};
        if (formData.name.trim() !== (originalProduct?.name || '')) {
          changes.name = formData.name.trim();
        }
        const currentType = formData.productType.toLowerCase();
        const origType = (originalProduct?.product_type || originalProduct?.productType || '').toLowerCase();
        if (currentType !== origType) {
          changes.product_type = currentType;
        }
        if (String(formData.salesPrice) !== String(originalProduct?.sales_price ?? originalProduct?.salesPrice ?? '')) {
          changes.sales_price = String(formData.salesPrice);
        }
        if (String(formData.costPrice) !== String(originalProduct?.cost_price ?? originalProduct?.costPrice ?? '')) {
          changes.cost_price = String(formData.costPrice);
        }
        if (formData.notes !== (originalProduct?.notes || '')) {
          changes.notes = formData.notes.trim() ? formData.notes.trim() : null;
        }
        const currentActive = Boolean(formData.isActive);
        const origActive = Boolean(originalProduct?.is_active ?? originalProduct?.isActive);
        if (currentActive !== origActive) {
          changes.is_active = currentActive;
        }

        try {
          await productsApi.updateProduct(productId, changes);
        } catch (apiErr) {
          if (apiErr.status === 403 || apiErr.status === 422) {
            throw apiErr;
          }
          await mockDataService.updateProduct(productId, { ...formData, ...changes });
        }
      } else {
        // POST: Required: name, sales_price, cost_price
        const createPayload = {
          name: formData.name.trim(),
          product_type: formData.productType.toLowerCase(),
          sales_price: String(formData.salesPrice || '0.00'),
          cost_price: String(formData.costPrice || '0.00'),
          notes: formData.notes.trim() ? formData.notes.trim() : null,
          is_active: Boolean(formData.isActive)
        };

        try {
          await productsApi.createProduct(createPayload);
        } catch (apiErr) {
          if (apiErr.status === 403 || apiErr.status === 422) {
            throw apiErr;
          }
          await mockDataService.createProduct(createPayload);
        }
      }

      setLoading(false);
      navigate('/admin/products');
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to save product.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        type="button"
        onClick={() => navigate('/admin/products')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Products</span>
      </button>

      <PageHeader
        title={isEdit ? `Edit Product: ${formData.name}` : 'Configure New Catalog Product'}
        description="Define standard base pricing, catalog classification, and optional variant tiers."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Core Product Information Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Core Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cloud Hosting Core"
              required
            />

            <Select
              label="Product Classification"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              options={[
                { value: 'service', label: 'Service (SLA / Consulting)' },
                { value: 'goods', label: 'Goods (Hardware / Tangible)' },
                { value: 'subscription', label: 'Subscription License' }
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Sales Price ($)"
              type="number"
              step="0.01"
              value={formData.salesPrice}
              onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
              placeholder="49.00"
              required
            />

            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              placeholder="12.00"
              required
            />
          </div>

          <Input
            label="Internal Notes / Description"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Operational notes, provisioning SLAs, and technical details"
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Product is active and available in catalog</span>
            </label>
          </div>
        </div>

        {/* Product Variants (Kept isolated on demo data) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Configured Product Variants</h3>
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                Demonstration Tier Preview
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure variant tiers and price offsets (+560 Odoo preview) locally for proposal builders.
            </p>
          </div>

          <VariantEditor
            basePrice={parseFloat(formData.salesPrice) || 0}
            variants={formData.variants}
            onChange={(updatedVariants) => setFormData({ ...formData, variants: updatedVariants })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={loading}
          >
            {isEdit ? 'Save Product Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
