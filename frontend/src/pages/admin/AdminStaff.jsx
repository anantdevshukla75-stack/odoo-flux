import React, { useState, useEffect } from 'react';
import { Plus, ShieldCheck, Mail } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatDate } from '../../utils/formatDate.js';

export function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    department: 'Customer Success & Invoicing'
  });

  const loadStaff = async () => {
    const list = await mockDataService.getStaff();
    setStaff(list);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    await mockDataService.createStaff(newStaff);
    setIsModalOpen(false);
    setNewStaff({
      fullName: '',
      email: '',
      department: 'Customer Success & Invoicing'
    });
    loadStaff();
  };

  const columns = [
    {
      header: 'Staff Member',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.email}</div>
        </div>
      )
    },
    {
      header: 'Department / Scope',
      render: (row) => row.department
    },
    {
      header: 'Role Clearance',
      render: (row) => (
        <span className="badge badge-info">{row.role}</span>
      )
    },
    {
      header: 'Onboarded Date',
      render: (row) => formatDate(row.joinedDate)
    },
    {
      header: 'Account Status',
      render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'DEACTIVATED'} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Staff & Team Management"
        description="Administer operational personnel, assign departmental roles, and manage system access credentials."
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Staff Member
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={staff}
        searchPlaceholder="Search staff name, email..."
        emptyMessage="No staff members registered."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Staff Account"
      >
        <form onSubmit={handleCreateStaff}>
          <Input
            label="Staff Full Name"
            value={newStaff.fullName}
            onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
            placeholder="e.g. Liam Anderson"
            required
          />

          <Input
            label="Corporate Email"
            type="email"
            value={newStaff.email}
            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
            placeholder="e.g. liam@brightloopsoftware.com"
            required
          />

          <Select
            label="Operational Department"
            value={newStaff.department}
            onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
            options={[
              { value: 'Customer Success & Invoicing', label: 'Customer Success & Invoicing' },
              { value: 'Billing & Accounts Receivable', label: 'Billing & Accounts Receivable' },
              { value: 'Sales & Quotation Support', label: 'Sales & Quotation Support' }
            ]}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Provision Staff
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminStaff;

