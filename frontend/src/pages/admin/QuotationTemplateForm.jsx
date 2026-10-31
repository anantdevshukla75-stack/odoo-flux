import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, FileCode } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function QuotationTemplateForm() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(templateId && templateId !== 'new');

  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultPlanId: '',
    defaultPlanName: '',
    validityDays: 30,
    productLines: []
  });

  const [newLineProduct, setNewLineProduct] = useState('');
  const [newLineQty, setNewLineQty] = useState(1);
  const [newLinePrice, setNewLinePrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInitial() {
      try {
        const [pl, pr] = await Promise.all([
          apiService.getPlans(),
          apiService.getProducts()
        ]);
        setPlans(pl);
        setProducts(pr);

        if (pr.length > 0) {
          setNewLineProduct(String(pr[0].id));
          setNewLinePrice(pr[0].salesPrice);
        }

        if (isEdit) {
          const template = await apiService.getQuotationTemplateById(templateId);
          if (template) {
            setFormData(template);
          }
        } else if (pl.length > 0) {
          setFormData(prev => ({
            ...prev,
            defaultPlanId: pl[0].id,
            defaultPlanName: pl[0].name
          }));
        }
      } catch (err) {
        setError(err?.message || 'Could not load template form data.');
      }
    }
    loadInitial();
  }, [templateId, isEdit]);

  const handlePlanSelect = (pId) => {
    const found = plans.find(p => String(p.id) === String(pId));
    setFormData(prev => ({
      ...prev,
      defaultPlanId: pId,
      defaultPlanName: found ? found.name : ''
    }));
  };

  const handleProductSelectChange = (pId) => {
    setNewLineProduct(pId);
    const found = products.find(p => String(p.id) === String(pId));
    if (found) {
      setNewLinePrice(found.salesPrice);
    }
  };

  const handleAddProductLine = (e) => {
    e.preventDefault();
    const prod = products.find(p => String(p.id) === String(newLineProduct));
    if (!prod) return;

    const qty = parseInt(newLineQty, 10) || 1;
    const price = parseFloat(newLinePrice) || 0;

    const line = {
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice: price
    };

    setFormData(prev => ({
      ...prev,
      productLines: [...prev.productLines, line]
    }));
    setNewLineQty(1);
  };

  const handleRemoveProductLine = (index) => {
    setFormData(prev => ({
      ...prev,
      productLines: prev.productLines.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      validityDays: parseInt(formData.validityDays, 10) || 30
    };

    setError('');
    try {
      if (isEdit) {
        await apiService.updateQuotationTemplate(templateId, payload);
      } else {
        await apiService.createQuotationTemplate(payload);
      }
      navigate('/admin/quotation-templates');
    } catch (err) {
      setError(err?.message || 'Could not save the quotation template.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        type="button"
        onClick={() => navigate('/admin/quotation-templates')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Templates</span>
      </button>

      <PageHeader
        title={isEdit ? `Edit Template: ${formData.name}` : 'Configure Quotation Proposal Template'}
        description="Save reusable proposal blueprints with default plans, included license lines, and expiration timelines."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}
        {/* Core Template Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Template Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Enterprise Cloud Proposal"
              required
            />

            <Select
              label="Default Base Plan"
              value={formData.defaultPlanId}
              onChange={(e) => handlePlanSelect(e.target.value)}
              options={plans.map(p => ({
                value: p.id,
                label: `${p.name} (${formatCurrency(p.basePrice)}/${p.billingInterval.toLowerCase()})`
              }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Proposal Scope Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Target industry, license entitlements, scope summary"
            />

            <Input
              label="Proposal Validity (Days)"
              type="number"
              min="1"
              value={formData.validityDays}
              onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
              placeholder="30"
              helperText="Days before the quote proposal automatically expires"
              required
            />
          </div>
        </div>

        {/* Product Lines Inclusions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Default Bundled Product Lines
          </h3>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="text-xs font-semibold text-slate-700">Add Line Item to Blueprint</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                value={newLineProduct}
                onChange={(e) => handleProductSelectChange(e.target.value)}
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.name} (${formatCurrency(p.salesPrice)})`
                }))}
                className="mb-0"
              />
              <Input
                type="number"
                min="1"
                placeholder="Quantity"
                value={newLineQty}
                onChange={(e) => setNewLineQty(e.target.value)}
                className="mb-0"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Unit Price ($)"
                value={newLinePrice}
                onChange={(e) => setNewLinePrice(e.target.value)}
                className="mb-0"
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddProductLine}
              >
                Add Line Item
              </Button>
            </div>
          </div>

          {/* Lines Table */}
          {formData.productLines.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5 text-center">Quantity</th>
                    <th className="px-4 py-2.5">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                    <th className="px-4 py-2.5 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.productLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{line.productName}</td>
                      <td className="px-4 py-3 text-center font-bold">{line.quantity}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(line.unitPrice)}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-right">
                        {formatCurrency(line.quantity * line.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveProductLine(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">No bundled product lines attached to this template blueprint.</p>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigate('/admin/quotation-templates')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Save} loading={loading}>
            {isEdit ? 'Save Template Changes' : 'Create Quotation Template'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default QuotationTemplateForm;

