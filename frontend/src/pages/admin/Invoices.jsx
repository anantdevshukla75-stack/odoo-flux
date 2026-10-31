import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Receipt, DollarSign, Download, Filter, Eye, Printer, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function Invoices({ basePath = '/admin/invoices' }) {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadInvoices = async () => {
    let list = await mockDataService.getInvoices();
    if (role === 'CUSTOMER') {
      list = list.filter(i => i.customerId === 'cust-001');
    }
    setInvoices(list);
  };

  useEffect(() => {
    loadInvoices();
  }, [role]);

  // Display status filter support: Draft, Confirmed, Partially paid, Paid, Overdue, Cancelled
  const filteredInvoices = filterStatus === 'ALL'
    ? invoices
    : invoices.filter(i => i.status === filterStatus);

  const filterTabs = [
    { key: 'ALL', label: 'All Invoices' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { key: 'PAID', label: 'Paid' },
    { key: 'OVERDUE', label: 'Overdue' },
    { key: 'CANCELLED', label: 'Cancelled' }
  ];

  // Summary Metrics
  const totalInvoiced = filteredInvoices.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0);
  const totalOutstanding = filteredInvoices.reduce((acc, i) => acc + (Number(i.balance) || 0), 0);
  const totalPaid = filteredInvoices.reduce((acc, i) => acc + (Number(i.paidAmount) || 0), 0);

  const columns = [
    {
      header: 'Invoice Number',
      render: (row) => (
        <div>
          <Link
            to={`${basePath}/${row.id}`}
            className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {row.invoiceNumber}
          </Link>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Issued: {formatDate(row.issueDate)}
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.customerName}</span>
      )
    },
    {
      header: 'Subscription',
      render: (row) => (
        <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {row.subscriptionId || 'One-Off / Adhoc'}
        </span>
      )
    },
    {
      header: 'Invoice Date',
      render: (row) => formatDate(row.issueDate)
    },
    {
      header: 'Due Date',
      render: (row) => {
        const isPast = row.balance > 0 && new Date(row.dueDate) < new Date();
        return (
          <div className={`text-xs ${isPast ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
            {formatDate(row.dueDate)}
            {isPast && row.status !== 'PAID' && row.status !== 'CANCELLED' && (
              <span className="block text-[10px] text-rose-500">Overdue</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Total',
      render: (row) => (
        <span className="font-bold text-slate-900">{formatCurrency(row.totalAmount)}</span>
      )
    },
    {
      header: 'Amount Paid',
      render: (row) => (
        <span className="font-semibold text-emerald-600">{formatCurrency(row.paidAmount)}</span>
      )
    },
    {
      header: 'Outstanding',
      render: (row) => (
        <span className={`font-bold ${row.balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {formatCurrency(row.balance)}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => navigate(`${basePath}/${row.id}`)}
          >
            Details
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Printer}
            onClick={() => navigate(`${basePath}/${row.id}/print`)}
            title="Print Friendly Invoice"
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Billing Statements"
        description="Monitor recurring subscription invoices, review payment settlements, and manage receivable balances."
      />

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Invoiced Volume</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{filteredInvoices.length} invoices matching filter</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Settled Collections</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">Realized into accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Receivables Outstanding</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Awaiting client payment settlement</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        {filterTabs.map((tab) => {
          const isActive = filterStatus === tab.key;
          const count = tab.key === 'ALL'
            ? invoices.length
            : invoices.filter(i => i.status === tab.key).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={filteredInvoices}
        searchPlaceholder="Search invoice #, customer name, subscription..."
        emptyMessage="No invoices found matching current filter."
      />
    </div>
  );
}

export default Invoices;

