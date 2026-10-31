import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Mail,
  DollarSign,
  CheckCircle,
  Eye,
  Calendar,
  Clock,
  ShieldAlert,
  Filter
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import RecordPaymentForm from '../admin/RecordPaymentForm.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function StaffOverdue() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [agingFilter, setAgingFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [reminderSent, setReminderSent] = useState({});
  const [demoNotice, setDemoNotice] = useState(null);

  const loadData = async () => {
    const list = await mockDataService.getInvoices();
    // Overdue includes status === 'OVERDUE' or any invoice with balance > 0 and dueDate in past
    const today = new Date();
    const overdueList = list.filter(i => {
      if (i.status === 'CANCELLED' || i.status === 'PAID') return false;
      const isPastDue = new Date(i.dueDate) < today;
      return i.status === 'OVERDUE' || (i.balance > 0 && isPastDue);
    });
    setInvoices(overdueList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateDaysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const handleSendReminder = (inv) => {
    setReminderSent(prev => ({ ...prev, [inv.id]: true }));
    setDemoNotice(`Demonstration action: Dunning email notice simulated for ${inv.invoiceNumber} to ${inv.customerName}. No real external email was sent.`);
    setTimeout(() => setDemoNotice(null), 5000);
  };

  // Filter based on days overdue
  const filteredInvoices = invoices.filter(inv => {
    const days = calculateDaysOverdue(inv.dueDate);
    if (agingFilter === '1_15') return days >= 1 && days <= 15;
    if (agingFilter === '16_30') return days >= 16 && days <= 30;
    if (agingFilter === '30_PLUS') return days > 30;
    return true;
  });

  const totalOverdueBalance = invoices.reduce((sum, i) => sum + (Number(i.balance) || 0), 0);

  const columns = [
    {
      header: 'Invoice Number',
      render: (row) => (
        <div>
          <Link
            to={`/staff/invoices/${row.id}`}
            className="font-bold text-rose-600 hover:text-rose-800 transition-colors"
          >
            {row.invoiceNumber}
          </Link>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Ref: {row.subscriptionId || 'Direct'}
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
      header: 'Due Date',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.dueDate)}
        </span>
      )
    },
    {
      header: 'Days Overdue',
      render: (row) => {
        const days = calculateDaysOverdue(row.dueDate);
        let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
        if (days > 30) badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';

        return (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${badgeColor}`}>
            <Clock size={11} />
            <span>{days} {days === 1 ? 'day' : 'days'}</span>
          </span>
        );
      }
    },
    {
      header: 'Outstanding Amount',
      render: (row) => (
        <span className="font-bold text-rose-600 font-mono text-sm">
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
            onClick={() => navigate(`/staff/invoices/${row.id}`)}
          >
            Details
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={reminderSent[row.id] ? CheckCircle : Mail}
            onClick={() => handleSendReminder(row)}
            disabled={reminderSent[row.id]}
          >
            {reminderSent[row.id] ? 'Reminded' : 'Send Dunning'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={DollarSign}
            onClick={() => setSelectedInvoice(row)}
          >
            Collect
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overdue Accounts & Collections"
        description="Monitor aged receivables, issue dunning notices, and record delinquent payments."
      />

      {demoNotice && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{demoNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDemoNotice(null)}
            className="text-indigo-700 hover:text-indigo-950 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-rose-700 font-semibold">Total Overdue Receivables</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {formatCurrency(totalOverdueBalance)}
          </div>
          <div className="text-xs text-rose-600 mt-1">Across {invoices.length} delinquent accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Critical Delinquencies (&gt;30 Days)</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {invoices.filter(i => calculateDaysOverdue(i.dueDate) > 30).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">High priority collection queue</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Collection Rate (MTD)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">94.8%</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">Settled within grace threshold</div>
        </div>
      </div>

      {/* Aging Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Overdue' },
          { key: '1_15', label: '1 - 15 Days' },
          { key: '16_30', label: '16 - 30 Days' },
          { key: '30_PLUS', label: '30+ Days (Critical)' }
        ].map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setAgingFilter(filter.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              agingFilter === filter.key
                ? 'bg-rose-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredInvoices}
        searchPlaceholder="Search overdue invoice, customer name..."
        emptyMessage="No overdue invoices match the selected aging filter."
      />

      {/* Collect Payment Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Collect Payment: ${selectedInvoice?.invoiceNumber}`}
      >
        {selectedInvoice && (
          <RecordPaymentForm
            initialInvoiceId={selectedInvoice.id}
            initialCustomerId={selectedInvoice.customerId}
            onSuccess={() => {
              setSelectedInvoice(null);
              loadData();
              setDemoNotice(`Payment successfully posted for ${selectedInvoice.invoiceNumber}. Balance updated.`);
            }}
            onCancel={() => setSelectedInvoice(null)}
          />
        )}
      </Modal>
    </div>
  );
}

export default StaffOverdue;
