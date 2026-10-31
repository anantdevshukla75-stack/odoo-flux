import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Eye, Search, FileText, Filter, Calendar } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/useAuth.js';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function Quotations({ basePath = '/admin/quotations' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const [quotations, setQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const pageSize = 8;

  const isCustomer = role === 'CUSTOMER' || location.pathname.startsWith('/customer');

  const loadQuotations = useCallback(async () => {
    try {
      setQuotations(await apiService.getQuotations());
      setLoadError('');
    } catch (err) {
      setLoadError(err?.message || 'Could not load quotations from the API.');
    }
  }, []);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesSearch =
        q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.planName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredQuotations.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? 'My Quotations & Commercial Proposals' : 'Commercial Quotations & Proposals'}
        description={isCustomer ? 'Review commercial proposals issued for your account and authorize activations.' : 'Draft custom pricing quotes, negotiate contracts, and track prospective subscription sales.'}
        breadcrumbs={[
          { name: 'Dashboard', path: isCustomer ? '/customer/dashboard' : basePath.startsWith('/admin') ? '/admin/dashboard' : '/staff/dashboard' },
          { name: 'Quotations' }
        ]}
      >
        {!isCustomer && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate(`${basePath}/new`)}
          >
            New Quotation
          </Button>
        )}
      </PageHeader>

      {loadError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {loadError}
        </div>
      )}

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
                placeholder="Search quotes by number, customer, plan..."
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
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Total Quotations: <strong className="text-slate-800">{filteredQuotations.length}</strong>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Quotation #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Creation Date</th>
                <th className="px-6 py-3">Expiration Date</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 font-mono text-xs">{q.quotationNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{q.customerName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                        {q.planName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(q.createdAt)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(q.validUntil)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(q.total)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`${basePath}/${q.id}`)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                    No quotation records found matching search criteria.
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

export default Quotations;

