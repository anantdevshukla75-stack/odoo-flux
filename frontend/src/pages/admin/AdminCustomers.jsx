import React, { useState, useEffect } from 'react';
import { Plus, Building, Phone, Mail } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    fullName: '',
    email: '',
    companyName: '',
    phone: '',
    billingAddress: '',
    taxId: ''
  });

  const loadCustomers = async () => {
    const list = await mockDataService.getCustomers();
    setCustomers(list);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    await mockDataService.createCustomer(newCustomer);
    setIsModalOpen(false);
    setNewCustomer({
      fullName: '',
      email: '',
      companyName: '',
      phone: '',
      billingAddress: '',
      taxId: ''
    });
    loadCustomers();
  };

  const columns = [
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.email}</div>
        </div>
      )
    },
    {
      header: 'Company & Tax ID',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.companyName || '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.taxId || 'No Tax ID'}</div>
        </div>
      )
    },
    {
      header: 'Phone / Contact',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {row.phone || '—'}
        </span>
      )
    },
    {
      header: 'Subscriptions',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.activeSubscriptions || 0} active</span>
      )
    },
    {
      header: 'Total Revenue',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
          {formatCurrency(row.totalSpent || 0)}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'ACTIVE'} />
    },
    {
      header: 'Customer Since',
      render: (row) => formatDate(row.createdAt)
    }
  ];

  return (
    <div>
      <PageHeader
        title="Customer Directory"
        description="Manage enterprise customer profiles, billing addresses, and tax identifiers."
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Customer
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search by name, company, email..."
        emptyMessage="No customer accounts registered yet."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Enterprise Customer"
      >
        <form onSubmit={handleCreateCustomer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Contact Person Name"
              value={newCustomer.fullName}
              onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
              placeholder="e.g. David Vance"
              required
            />
            <Input
              label="Business Email"
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              placeholder="e.g. david@company.com"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Company Name"
              value={newCustomer.companyName}
              onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
              placeholder="e.g. Apex Corporation"
              required
            />
            <Input
              label="Phone Number"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <Input
            label="Tax Registration ID / VAT"
            value={newCustomer.taxId}
            onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
            placeholder="e.g. US-TAX-998822"
          />

          <Input
            label="Billing Address"
            value={newCustomer.billingAddress}
            onChange={(e) => setNewCustomer({ ...newCustomer, billingAddress: e.target.value })}
            placeholder="e.g. 100 Main St, Suite 400, Austin, TX"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminCustomers;
