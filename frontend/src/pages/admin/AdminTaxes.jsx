import React, { useState, useEffect } from 'react';
import { Plus, Percent } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';

export function AdminTaxes() {
  const [taxes, setTaxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTax, setNewTax] = useState({
    name: '',
    rate: '',
    calculationType: 'EXCLUSIVE'
  });

  const loadTaxes = async () => {
    const list = await mockDataService.getTaxes();
    setTaxes(list);
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const handleCreateTax = async (e) => {
    e.preventDefault();
    await mockDataService.createTax({
      ...newTax,
      rate: Number(newTax.rate) || 0
    });
    setIsModalOpen(false);
    setNewTax({ name: '', rate: '', calculationType: 'EXCLUSIVE' });
    loadTaxes();
  };

  const columns = [
    {
      header: 'Tax Rule Name',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.name}</span>
      )
    },
    {
      header: 'Tax Rate (%)',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {row.rate}%
        </span>
      )
    },
    {
      header: 'Calculation Method',
      render: (row) => (
        <span className="badge badge-info">{row.calculationType}</span>
      )
    },
    {
      header: 'Default Rule',
      render: (row) => (
        <span className={`badge ${row.isDefault ? 'badge-success' : 'badge-neutral'}`}>
          {row.isDefault ? 'Yes' : 'No'}
        </span>
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
        title="Tax Configuration"
        description="Configure jurisdictional tax rules, inclusive/exclusive calculations, and default application policies."
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Tax Rule
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={taxes}
        searchPlaceholder="Search tax rules..."
        emptyMessage="No tax rules configured."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Tax Rule"
      >
        <form onSubmit={handleCreateTax}>
          <Input
            label="Tax Label / Name"
            value={newTax.name}
            onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
            placeholder="e.g. State VAT 10%"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Percentage Rate (%)"
              type="number"
              step="0.01"
              value={newTax.rate}
              onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })}
              placeholder="18.00"
              required
            />

            <Select
              label="Calculation Type"
              value={newTax.calculationType}
              onChange={(e) => setNewTax({ ...newTax, calculationType: e.target.value })}
              options={[
                { value: 'EXCLUSIVE', label: 'Exclusive (Added to price)' },
                { value: 'INCLUSIVE', label: 'Inclusive (Included in price)' }
              ]}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Tax Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminTaxes;

