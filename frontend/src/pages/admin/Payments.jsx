import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Filter,
  Download,
  Receipt,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import RecordPaymentForm from './RecordPaymentForm.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime, formatDate } from '../../utils/formatDate.js';
import { useAuth } from '../../context/useAuth.js';

export function Payments() {
  const { role } = useAuth();
  const [payments, setPayments] = useState([]);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadData = async () => {
    // The API scopes customer accounts to their own payment history.
    const list = await apiService.getPayments();
    setPayments(list);
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const filteredPayments = methodFilter === 'ALL'
    ? payments
    : payments.filter(p => p.paymentMethod === methodFilter);

  const totalVolume = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const bankTransferVolume = payments.filter(p => p.paymentMethod === 'BANK_TRANSFER').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const cardVolume = payments.filter(p => p.paymentMethod === 'CARD').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const columns = [
    {
      header: 'Reference',
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={() => setSelectedReceipt(row)}
            className="font-mono font-bold text-indigo-600 hover:text-indigo-800 transition-colors text-left cursor-pointer"
          >
            {row.paymentNumber}
          </button>
          <div className="text-[11px] text-slate-500 font-mono">
            Ext: {row.reference || '—'}
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
      header: 'Invoice Number',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {row.invoiceNumber}
        </span>
      )
    },
    {
      header: 'Method',
      render: (row) => {
        let badgeStyle = 'bg-slate-100 text-slate-700';
        if (row.paymentMethod === 'CARD') badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200';
        if (row.paymentMethod === 'BANK_TRANSFER') badgeStyle = 'bg-purple-50 text-purple-700 border border-purple-200';
        if (row.paymentMethod === 'UPI') badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        if (row.paymentMethod === 'CASH') badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200';

        return (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeStyle}`}>
            {row.paymentMethod ? row.paymentMethod.replace('_', ' ') : 'OTHER'}
          </span>
        );
      }
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className="font-bold text-emerald-600 font-mono">
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: 'Date',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.paymentDate)}
        </span>
      )
    },
    {
      header: 'Note',
      render: (row) => (
        <span className="text-xs text-slate-500 truncate max-w-xs block">
          {row.note || '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Receipt}
          onClick={() => setSelectedReceipt(row)}
        >
          Receipt
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Settlements & Transactions"
        description="Audit ledger of recorded cash inflows, credit card transactions, wire transfers, and invoice clearances."
      >
        <div className="flex items-center gap-2">
          {role !== 'CUSTOMER' && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsRecordModalOpen(true)}
            >
              Record Payment
            </Button>
          )}
        </div>
      </PageHeader>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Settlements</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalVolume)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{filteredPayments.length} transactions processed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Bank Wire / ACH</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {formatCurrency(bankTransferVolume)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Direct corporate wires</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Card & Instant Channels</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {formatCurrency(cardVolume)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Recorded card settlements</div>
        </div>
      </div>

      {/* Method Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['ALL', 'BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'OTHER'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMethodFilter(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              methodFilter === m
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {m === 'ALL' ? 'All Methods' : m.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredPayments}
        searchPlaceholder="Search reference, customer, invoice, note..."
        emptyMessage="No payment transactions found."
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Payment Settlement"
      >
        <RecordPaymentForm
          onSuccess={() => {
            setIsRecordModalOpen(false);
            loadData();
          }}
          onCancel={() => setIsRecordModalOpen(false)}
        />
      </Modal>

      {/* Payment Confirmation Receipt Voucher Modal */}
      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="Payment Confirmation Voucher"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            <div className="text-center py-4 border-b border-dashed border-slate-200">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 font-mono">
                {formatCurrency(selectedReceipt.amount)}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Settled & Credited to {selectedReceipt.invoiceNumber}
              </p>
            </div>

            <div className="text-xs space-y-2 py-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Internal Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.paymentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">External Transaction Ref:</span>
                <span className="font-mono text-slate-800">{selectedReceipt.reference || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Account:</span>
                <span className="font-semibold text-slate-900">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Invoice:</span>
                <span className="font-mono font-bold text-indigo-700">{selectedReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel / Method:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Settlement Date:</span>
                <span className="text-slate-800">{formatDateTime(selectedReceipt.paymentDate)}</span>
              </div>
              {selectedReceipt.note && (
                <div className="flex justify-between border-t border-slate-100 pt-1.5">
                  <span className="text-slate-500">Audit Memo:</span>
                  <span className="text-slate-700 text-right">{selectedReceipt.note}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
              <Button variant="primary" icon={Download} onClick={() => window.print()}>
                Print Voucher
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Payments;

