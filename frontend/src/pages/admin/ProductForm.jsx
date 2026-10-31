import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import VariantEditor from '../../components/products/VariantEditor.jsx';
import { mockDataService } from '../../services/mockDataService.js';

export function ProductForm() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(productId && productId !== 'new');

  const [formData, setFormData] = useState({
    name: '',
    productType: 'SUBSCRIPTION',
    salesPrice: '',
    costPrice: '',
    notes: '',
    isActive: true,
    variants: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (isEdit) {
        const prod = await mockDataService.getProductById(productId);
        if (prod) {
          setFormData({
            name: prod.name,
            productType: prod.productType,
            salesPrice: prod.salesPrice,
            costPrice: prod.costPrice || '',
            notes: prod.notes || '',
            isActive: prod.isActive,
            variants: prod.variants || []
          });
        }
      }
    }
    loadProduct();
  }, [productId, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      salesPrice: Number(formData.salesPrice) || 0,
      costPrice: Number(formData.costPrice) || 0
    };

    if (isEdit) {
      await mockDataService.updateProduct(productId, payload);
    } else {
      await mockDataService.createProduct(payload);
    }

    setLoading(false);
    navigate('/admin/products');
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
              placeholder="e.g. Brightloop Core Platform"
              required
            />

            <Select
              label="Product Type"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              options={[
                { value: 'SUBSCRIPTION', label: 'Subscription License' },
                { value: 'SERVICE', label: 'Service / Support SLA' },
                { value: 'GOODS', label: 'Metered Consumption Goods' }
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
              placeholder="499.00"
              required
            />

            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              placeholder="85.00"
              helperText="Internal cost of delivery or server compute"
            />
          </div>

          <Input
            label="Commercial Description & Internal Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Details regarding SLA terms, licensing rights, or delivery scope"
          />

          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Product is active and available for quotation sales</span>
            </label>
          </div>
        </div>

        {/* Product Variant Management Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <VariantEditor
            basePrice={Number(formData.salesPrice) || 0}
            variants={formData.variants}
            onChange={(updatedVariants) => setFormData({ ...formData, variants: updatedVariants })}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
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
            {isEdit ? 'Save Product Changes' : 'Create Catalog Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;

