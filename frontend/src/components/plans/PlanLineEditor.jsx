import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, DollarSign } from 'lucide-react';
import Button from '../common/Button.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function PlanLineEditor({ lines = [], onChange }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      const prods = await mockDataService.getProducts();
      setAvailableProducts(prods);
      if (prods.length > 0) {
        setSelectedProductId(prods[0].id);
        setUnitPrice(prods[0].salesPrice);
      }
    }
    fetchProducts();
  }, []);

  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    const found = availableProducts.find(p => p.id === productId);
    if (found) {
      setUnitPrice(found.salesPrice);
    }
  };

  const handleAddLine = (e) => {
    e.preventDefault();
    const prod = availableProducts.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const price = Math.max(0, parseFloat(unitPrice) || 0);

    const newLine = {
      id: `line-${Date.now().toString().slice(-4)}`,
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice: price,
      lineTotal: qty * price
    };

    const updated = [...lines, newLine];
    onChange(updated);
    setQuantity(1);
  };

  const handleRemoveLine = (id) => {
    const updated = lines.filter(l => l.id !== id);
    onChange(updated);
  };

  const calculatedTotal = lines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Plan Product Inclusions (Plan Lines)
          </h4>
          <p className="text-xs text-slate-500">
            Specify software licenses, SLA add-ons, or event allowances bundled in this plan
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-700">
          Bundle Total:{' '}
          <span className="font-bold text-indigo-600 font-mono text-sm ml-1">
            {formatCurrency(calculatedTotal)}
          </span>
        </div>
      </div>

      {/* Add Line Control Box */}
      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
        <div className="text-xs font-semibold text-slate-700">Bundle Catalog Product</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            options={availableProducts.map(p => ({
              value: p.id,
              label: `${p.name} (${formatCurrency(p.salesPrice)})`
            }))}
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="mb-0"
          />

          <Input
            type="number"
            min="1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mb-0"
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Unit Price ($)"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="mb-0"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">
            You can override standard product pricing specifically for this subscription bundle.
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={handleAddLine}
            disabled={!selectedProductId}
          >
            Add to Bundle
          </Button>
        </div>
      </div>

      {/* Included Lines Table */}
      {lines.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-2.5">Bundled Product</th>
                <th className="px-4 py-2.5 text-center">Quantity</th>
                <th className="px-4 py-2.5">Unit Price</th>
                <th className="px-4 py-2.5 text-right">Line Total</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{l.productName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold">
                      {l.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(l.unitPrice)}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 text-right">
                    {formatCurrency(l.quantity * l.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(l.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                      title="Remove line"
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
        <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
          No bundled plan lines configured. The subscription plan will charge its base recurring fee.
        </div>
      )}
    </div>
  );
}

export default PlanLineEditor;

