import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { authService } from '../../services/authService.js';
import { formatDate } from '../../utils/formatDate.js';

export function Staff() {
  const [staff, setStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    password: '',
    department: 'Customer Success & Invoicing'
  });

  const loadStaff = useCallback(async () => {
    const list = await mockDataService.getStaff();
    setStaff(list);
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');

    if (newStaff.password.length < 8) {
      setError('Staff password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      // Connect to real POST /auth/staff (Admin only, payload: full_name, email, password)
      let backendId = null;
      try {
        const res = await authService.createStaff({
          full_name: newStaff.fullName.trim(),
          email: newStaff.email.trim(),
          password: newStaff.password
        });
        backendId = res?.id;
      } catch (apiErr) {
        if (apiErr.status === 409) {
          setError('A user with this email already exists.');
          setLoading(false);
          return;
        } else if (apiErr.status === 403) {
          setError('Admin privileges required to provision staff accounts.');
          setLoading(false);
          return;
        } else if (apiErr.status === 422) {
          setError(apiErr.message || 'Validation error: please supply valid email and password format.');
          setLoading(false);
          return;
        }
        // If API is offline, warn and continue demo record
        console.warn('[Staff] Live API unreachable, provisioning locally:', apiErr.message);
      }

      // Add to local state directory (since no GET /auth/staff exists on backend)
      const createdStaff = {
        id: backendId ? `staff-${backendId}` : `staff-${Date.now()}`,
        fullName: newStaff.fullName.trim(),
        email: newStaff.email.trim(),
        department: newStaff.department,
        role: 'Operations Specialist',
        joinedDate: new Date().toISOString(),
        isActive: true
      };

      await mockDataService.createStaff(createdStaff);
      setStaff((prev) => [createdStaff, ...prev]);

      setIsModalOpen(false);
      setNewStaff({
        fullName: '',
        email: '',
        password: '',
        department: 'Customer Success & Invoicing'
      });
    } catch (err) {
      setError(err.message || 'Failed to provision staff member.');
    } finally {
      setLoading(false);
    }
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${member.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                      {member.isActive ? 'Active Clearance' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant={member.isActive ? 'danger' : 'secondary'}
                      size="xs"
                      onClick={() => handleToggleStatus(member.id)}
                    >
                      {member.isActive ? 'Suspend' : 'Activate'}
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
        onClose={() => {
          setIsModalOpen(false);
          setError('');
        }}
        title="Provision New Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

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

          <Input
            label="Initial Account Password"
            type="password"
            value={newStaff.password}
            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
            placeholder="Minimum 8 characters"
            helperText="Staff credentials for platform access (min 8 characters)"
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
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Provision Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Staff;
