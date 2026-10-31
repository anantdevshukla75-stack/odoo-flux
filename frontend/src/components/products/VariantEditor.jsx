import React, { useState } from 'react';
import { Plus, Trash2, Tag, ArrowRight, DollarSign } from 'lucide-react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function VariantEditor({ basePrice = 0, variants = [], onChange }) {
  const [newVariant, setNewVariant] = useState({
    name: '',
    code: '',
    priceAdjustment: '',
    isActive: true
  });
  const [selectedPreviewVariantId, setSelectedPreviewVariantId] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newVariant.name.trim()) return;

    const adj = Number(newVariant.priceAdjustment) || 0;
    const variantItem = {
      id: `var-${Date.now().toString().slice(-4)}`,
      name: newVariant.name.trim(),
      code: newVariant.code.trim() || `VAR-${Math.floor(100 + Math.random() * 900)}`,
      priceAdjustment: adj,
      isActive: newVariant.isActive
    };

    const updated = [...variants, variantItem];
    onChange(updated);
    setSelectedPreviewVariantId(variantItem.id);
    setNewVariant({ name: '', code: '', priceAdjustment: '', isActive: true });
  };

  const handleRemove = (id) => {
    const updated = variants.filter(v => v.id !== id);
    onChange(updated);
    if (selectedPreviewVariantId === id) {
      setSelectedPreviewVariantId(null);
    }
  };

  const handleToggleStatus = (id) => {
    const updated = variants.map(v =>
      v.id === id ? { ...v, isActive: !v.isActive } : v
    );
    onChange(updated);
  };

  // Preview selected variant calculation
  const selectedVariant = variants.find(v => v.id === selectedPreviewVariantId) || variants[0] || null;
  const previewAdjustment = selectedVariant ? Number(selectedVariant.priceAdjustment) || 0 : 0;
  const previewFinalPrice = Number(basePrice || 0) + previewAdjustment;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Product Pricing Variants
          </h4>
          <p className="text-xs text-slate-500">
            Define variant tiers (e.g. Starter, Pro, Enterprise) with price adjustments over base price
          </p>
        </div>
      </div>

      {/* Add Variant Inputs */}
      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
        <div className="text-xs font-semibold text-slate-700">Add Variant Option</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Variant Name (e.g. Pro Tier)"
            value={newVariant.name}
            onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
            className="mb-0"
          />
          <Input
            placeholder="SKU Code (e.g. CORE-PRO)"
            value={newVariant.code}
            onChange={(e) => setNewVariant({ ...newVariant, code: e.target.value })}
            className="mb-0"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Adjustment (e.g. +250 or -50)"
            value={newVariant.priceAdjustment}
            onChange={(e) => setNewVariant({ ...newVariant, priceAdjustment: e.target.value })}
            className="mb-0"
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">
            Positive amounts increase final customer price; negative amounts provide a base discount.
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={handleAdd}
            disabled={!newVariant.name.trim()}
          >
            Add Variant
          </Button>
        </div>
      </div>

      {/* Existing Variants Table */}
      {variants.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-2.5">Variant Name</th>
                <th className="px-4 py-2.5">SKU Code</th>
                <th className="px-4 py-2.5">Price Adjustment</th>
                <th className="px-4 py-2.5">Calculated Total</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.map((v) => {
                const adj = Number(v.priceAdjustment) || 0;
                const total = Number(basePrice || 0) + adj;
                const isSelected = selectedVariant?.id === v.id;

                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedPreviewVariantId(v.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {v.name}
                      {isSelected && (
                        <span className="ml-2 text-[10px] text-indigo-600 font-bold bg-indigo-100 px-1.5 py-0.5 rounded">
                          Previewing
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{v.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {adj >= 0 ? `+${formatCurrency(adj)}` : `-${formatCurrency(Math.abs(adj))}`}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(total)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(v.id);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer border ${
                          v.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {v.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(v.id);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
          No variants configured yet. This product will be sold at its standard base price.
        </div>
      )}

      {/* Real-time Pricing Preview Card */}
      {selectedVariant && (
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="font-semibold text-indigo-950">
                Live Pricing Breakdown for {selectedVariant.name}:
              </span>
              <span className="text-indigo-800 ml-1.5">
                Base ({formatCurrency(basePrice)}) {previewAdjustment >= 0 ? `+ Adjustment (${formatCurrency(previewAdjustment)})` : `- Concession (${formatCurrency(Math.abs(previewAdjustment))})`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Final Price:</span>
            <span className="text-sm font-bold text-indigo-700 font-mono">
              {formatCurrency(previewFinalPrice)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VariantEditor;

