import React, { useState, useEffect } from 'react';
import { Plus, Tag } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function AdminDiscounts() {
  const [discounts, setDiscounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    value: ''
  });

  const loadDiscounts = async () => {
    const list = await mockDataService.getDiscounts();
    setDiscounts(list);
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    await mockDataService.createDiscount({
      ...newDiscount,
      code: newDiscount.code.toUpperCase().trim(),
      value: Number(newDiscount.value) || 0
    });
    setIsModalOpen(false);
    setNewDiscount({ code: '', description: '', discountType: 'PERCENTAGE', value: '' });
    loadDiscounts();
  };

  const columns = [
    {
      header: 'Promo Code',
      render: (row) => (
        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>
          {row.code}
        </span>
      )
    },
    {
      header: 'Description',
      render: (row) => row.description || '—'
    },
    {
      header: 'Concession Value',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {row.discountType === 'PERCENTAGE' ? `${row.value}% OFF` : `${formatCurrency(row.value)} Flat OFF`}
        </span>
      )
    },
    {
      header: 'Discount Mechanism',
      render: (row) => (
        <span className="badge badge-info">{row.discountType}</span>
      )
    },
    {
      header: 'Total Redemptions',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.redemptionsCount || 0} times</span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Discounts & Vouchers"
        description="Manage promotional coupons, percent-based incentives, and fixed contract concessions."
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Create Coupon
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={discounts}
        searchPlaceholder="Search coupon code..."
        emptyMessage="No promotional discounts configured."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Discount"
      >
        <form onSubmit={handleCreateDiscount}>
          <Input
            label="Promo Coupon Code"
            value={newDiscount.code}
            onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value })}
            placeholder="e.g. WELCOME20"
            required
          />

          <Input
            label="Description"
            value={newDiscount.description}
            onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
            placeholder="e.g. Special 20% discount on initial contract"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              label="Concession Type"
              value={newDiscount.discountType}
              onChange={(e) => setNewDiscount({ ...newDiscount, discountType: e.target.value })}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED', label: 'Fixed Monetary Concession ($)' }
              ]}
              required
            />

            <Input
              label="Concession Value"
              type="number"
              step="0.01"
              value={newDiscount.value}
              onChange={(e) => setNewDiscount({ ...newDiscount, value: e.target.value })}
              placeholder={newDiscount.discountType === 'PERCENTAGE' ? '20' : '250.00'}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Discount
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminDiscounts;
