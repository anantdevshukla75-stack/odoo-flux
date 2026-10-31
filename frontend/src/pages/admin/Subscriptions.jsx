import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Search, RefreshCw, Filter, Pause, Play, XCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function Subscriptions({ basePath = '/admin/subscriptions' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const isCustomer = role === 'CUSTOMER' || location.pathname.startsWith('/customer');

  const loadSubscriptions = async () => {
    const list = await mockDataService.getSubscriptions();
    if (isCustomer) {
      setSubscriptions(list.filter(s => s.customerId === 'cust-001'));
    } else {
      setSubscriptions(list);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [isCustomer]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchesSearch =
        s.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.planName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredSubscriptions.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubscriptions.slice(start, start + pageSize);
  }, [filteredSubscriptions, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? 'My Subscriptions' : 'Subscription Contracts'}
        description={isCustomer ? 'Manage your recurring platform licenses, track upcoming renewals, and control active status.' : 'Monitor automated recurring billing cycles, pause requests, and active customer contracts.'}
        breadcrumbs={[
          { name: 'Dashboard', path: isCustomer ? '/customer/dashboard' : basePath.startsWith('/admin') ? '/admin/dashboard' : '/staff/dashboard' },
          { name: 'Subscriptions' }
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-white">
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
                placeholder="Search by subscription #, customer, plan..."
              />
            </div>

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
              <option value="CONFIRMED">Confirmed</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed / Cancelled</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Total Subscriptions: <strong className="text-slate-800">{filteredSubscriptions.length}</strong>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Subscription #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">Next Billing Date</th>
                <th className="px-6 py-3">Payment Terms</th>
                <th className="px-6 py-3">Recurring Price</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 font-mono text-xs">{s.subscriptionNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{s.customerName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                        {s.planName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(s.startDate)}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-800">{formatDate(s.nextBillingDate)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{s.paymentTerms || 'Net 15 Days'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(s.recurringAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`${basePath}/${s.id}`)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-slate-400">
                    No active or historical subscriptions found.
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
    </div>
  );
}

export default Subscriptions;

