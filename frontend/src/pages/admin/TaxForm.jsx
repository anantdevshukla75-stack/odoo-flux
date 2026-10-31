import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Modal from '../../components/common/Modal.jsx';

export function TaxForm({ isOpen, onClose, initialData = null, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    calculationType: 'EXCLUSIVE',
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        rate: initialData.rate,
        calculationType: initialData.calculationType || 'EXCLUSIVE',
        isDefault: Boolean(initialData.isDefault),
        isActive: Boolean(initialData.isActive)
      });
    } else {
      setFormData({
        name: '',
        rate: '',
        calculationType: 'EXCLUSIVE',
        isDefault: false,
        isActive: true
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      rate: parseFloat(formData.rate) || 0
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Statutory Tax Rule' : 'Create Tax Rule'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tax Name / Authority Label"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Standard GST, State VAT 8.25%"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Statutory Rate (%)"
            type="number"
            step="0.01"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            placeholder="18.00"
            required
          />

          <Select
            label="Calculation Method"
            value={formData.calculationType}
            onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
            options={[
              { value: 'EXCLUSIVE', label: 'Exclusive (Added to subtotal)' },
              { value: 'INCLUSIVE', label: 'Inclusive (Contained within price)' }
            ]}
            required
          />
        </div>

        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Set as default tax rule for new quotations and plans</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Rule is active and available for quotation calculations</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {initialData ? 'Save Changes' : 'Create Tax Rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TaxForm;

