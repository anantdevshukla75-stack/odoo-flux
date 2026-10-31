import React, { useState, useEffect } from 'react';
import { Plus, ShieldCheck, Mail, UserCheck, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatDate } from '../../utils/formatDate.js';

export function Staff() {
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

  const handleToggleStatus = (id) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Internal Team Management"
        description="Administer operational personnel, assign departmental billing responsibilities, and control system clearances."
        breadcrumbs={[
          { name: 'Dashboard', path: '/admin/dashboard' },
          { name: 'Team Management' }
        ]}
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Staff Member
        </Button>
      </PageHeader>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Provisioned Staff Members</h3>
          </div>
          <span className="text-xs text-slate-500">
            Total Staff: <strong className="text-slate-800">{staff.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Staff Member</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Role Level</th>
                <th className="px-6 py-3">Onboarded</th>
                <th className="px-6 py-3">Account Status</th>
                <th className="px-6 py-3 text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{member.fullName}</div>
                    <div className="text-xs text-slate-500 font-mono">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 text-xs">{member.department}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{formatDate(member.joinedDate)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={member.isActive ? 'ACTIVE' : 'DEACTIVATED'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant={member.isActive ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleStatus(member.id)}
                    >
                      {member.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <Input
            label="Staff Full Name"
            value={newStaff.fullName}
            onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
            placeholder="e.g. Liam Patel"
            required
          />

          <Input
            label="Corporate Work Email"
            type="email"
            value={newStaff.email}
            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
            placeholder="liam.p@brightloopsoftware.com"
            required
          />

          <Select
            label="Departmental Scope"
            value={newStaff.department}
            onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
            options={[
              { value: 'Customer Success & Invoicing', label: 'Customer Success & Invoicing' },
              { value: 'Billing & Accounts Receivable', label: 'Billing & Accounts Receivable' },
              { value: 'Sales & Quotation Support', label: 'Sales & Quotation Support' }
            ]}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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

export default Staff;

