import React, { useState, useEffect } from 'react';
import { Plus, Layers, Calendar, Check, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    billingInterval: 'MONTHLY',
    billingIntervalCount: 1,
    basePrice: '',
    allowPause: true,
    allowRenewal: true
  });

  const loadPlans = async () => {
    const list = await mockDataService.getPlans();
    setPlans(list);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    await mockDataService.createPlan({
      ...newPlan,
      basePrice: Number(newPlan.basePrice) || 0
    });
    setIsModalOpen(false);
    setNewPlan({
      name: '',
      description: '',
      billingInterval: 'MONTHLY',
      billingIntervalCount: 1,
      basePrice: '',
      allowPause: true,
      allowRenewal: true
    });
    loadPlans();
  };

  const columns = [
    {
      header: 'Subscription Plan',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.description}</div>
        </div>
      )
    },
    {
      header: 'Billing Frequency',
      render: (row) => (
        <span className="badge badge-info">
          Every {row.billingIntervalCount > 1 ? `${row.billingIntervalCount} ` : ''}
          {row.billingInterval.toLowerCase()}
        </span>
      )
    },
    {
      header: 'Recurring Price',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {formatCurrency(row.basePrice)}
        </span>
      )
    },
    {
      header: 'Lifecycle Policies',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
          <span style={{ color: row.allowPause ? 'var(--success)' : 'var(--text-secondary)' }}>
            {row.allowPause ? '✓ Pause enabled' : '✕ No pause'}
          </span>
          <span style={{ color: row.allowRenewal ? 'var(--success)' : 'var(--text-secondary)' }}>
            {row.allowRenewal ? '✓ Auto-renew' : '✕ Fixed-term'}
          </span>
        </div>
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
        title="Subscription Plans"
        description="Define billing cadences, pricing tiers, pause allowances, and renewal policies."
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Create Plan
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={plans}
        searchPlaceholder="Search plans by name, interval..."
        emptyMessage="No subscription plans configured."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Subscription Plan"
      >
        <form onSubmit={handleCreatePlan}>
          <Input
            label="Plan Name"
            value={newPlan.name}
            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
            placeholder="e.g. Growth Monthly"
            required
          />

          <Input
            label="Description"
            value={newPlan.description}
            onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
            placeholder="Plan terms and target audience"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Select
              label="Billing Interval"
              value={newPlan.billingInterval}
              onChange={(e) => setNewPlan({ ...newPlan, billingInterval: e.target.value })}
              options={[
                { value: 'DAILY', label: 'Daily' },
                { value: 'WEEKLY', label: 'Weekly' },
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'YEARLY', label: 'Yearly' }
              ]}
              required
            />
            <Input
              label="Recurring Price ($)"
              type="number"
              step="0.01"
              value={newPlan.basePrice}
              onChange={(e) => setNewPlan({ ...newPlan, basePrice: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newPlan.allowPause}
                onChange={(e) => setNewPlan({ ...newPlan, allowPause: e.target.checked })}
              />
              <span>Allow Customer to Pause Subscription</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newPlan.allowRenewal}
                onChange={(e) => setNewPlan({ ...newPlan, allowRenewal: e.target.checked })}
              />
              <span>Enable Automatic Renewal</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminPlans;
