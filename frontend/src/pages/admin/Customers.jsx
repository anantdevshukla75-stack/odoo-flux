import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Users, Search, Filter } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function Customers({ basePath = '/admin/customers' }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // New Customer Modal State
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
    const created = await mockDataService.createCustomer(newCustomer);
    setIsModalOpen(false);
    setNewCustomer({
      fullName: '',
      email: '',
      companyName: '',
      phone: '',
      billingAddress: '',
      taxId: ''
    });
    await loadCustomers();
    navigate(`${basePath}/${created.id}`);
  };

  // Filtered and Paginated
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || (c.status || 'ACTIVE').toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="Enterprise customer profiles, subscription volume, and billing accounts directory."
        breadcrumbs={[
          { name: 'Dashboard', path: basePath.startsWith('/admin') ? '/admin/dashboard' : '/staff/dashboard' },
          { name: 'Customers' }
        ]}
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Customer
        </Button>
      </PageHeader>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by customer, company, or email..."
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Total Customers: <span className="font-semibold text-slate-800">{filteredCustomers.length}</span>
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3 text-center">Subscriptions</th>
                <th className="px-6 py-3">Outstanding</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{cust.fullName}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{cust.email}</td>
                    <td className="px-6 py-4 text-slate-800 font-medium">{cust.companyName || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{cust.phone || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        {cust.activeSubscriptions || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatCurrency(cust.totalSpent || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={cust.status || 'ACTIVE'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`${basePath}/${cust.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-slate-500">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Enterprise Customer Account"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Contact Full Name"
              value={newCustomer.fullName}
              onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
              placeholder="e.g. Rachel Adams"
              required
            />

            <Input
              label="Work Email"
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              placeholder="rachel@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Company Legal Name"
              value={newCustomer.companyName}
              onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
              placeholder="Apex Technologies Inc."
              required
            />

            <Input
              label="Phone Number"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
            />
          </div>

          <Input
            label="Tax Registration ID / VAT"
            value={newCustomer.taxId}
            onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
            placeholder="e.g. US-TAX-998822"
          />

          <Input
            label="Invoicing Billing Address"
            value={newCustomer.billingAddress}
            onChange={(e) => setNewCustomer({ ...newCustomer, billingAddress: e.target.value })}
            placeholder="Street address, Suite, City, Postal Code"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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

export default Customers;

