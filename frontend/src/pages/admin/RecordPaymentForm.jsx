import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShieldAlert, CheckCircle2, AlertCircle, Calendar, Hash, FileText } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function RecordPaymentForm({
  initialInvoiceId = null,
  initialCustomerId = null,
  onSuccess = null,
  onCancel = null
}) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialInvoiceId || '');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [custList, invList] = await Promise.all([
        apiService.getCustomers(),
        apiService.getInvoices()
      ]);
      setCustomers(custList);
      setInvoices(invList);

      if (initialInvoiceId) {
        const foundInv = invList.find(i => String(i.id) === String(initialInvoiceId));
        if (foundInv) {
          setSelectedInvoice(foundInv);
          setSelectedCustomerId(foundInv.customerId);
          setAmount(foundInv.balance > 0 ? foundInv.balance : foundInv.totalAmount);
          setNote(`Payment settlement for ${foundInv.invoiceNumber}`);
        }
      } else if (custList.length > 0 && !initialCustomerId) {
        setSelectedCustomerId(String(custList[0].id));
      }
    }
    loadData();
  }, [initialInvoiceId, initialCustomerId]);

  // Filter invoices for chosen customer that have balance > 0 or are not cancelled
  const customerInvoices = invoices.filter(
    inv =>
      (!selectedCustomerId || String(inv.customerId) === String(selectedCustomerId)) &&
      inv.status !== 'CANCELLED' &&
      inv.balance > 0
  );

  const handleCustomerChange = (cId) => {
    setSelectedCustomerId(cId);
    const matching = invoices.filter((i) => String(i.customerId) === String(cId) && i.balance > 0);
    if (matching.length > 0) {
      handleInvoiceChange(matching[0].id);
    } else {
      setSelectedInvoiceId('');
      setSelectedInvoice(null);
      setAmount('');
    }
  };

  const handleInvoiceChange = (invId) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => String(i.id) === String(invId));
    setSelectedInvoice(inv || null);
    if (inv) {
      setAmount(inv.balance > 0 ? inv.balance : inv.totalAmount);
      setNote(`Payment settlement for ${inv.invoiceNumber}`);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedInvoice) {
      setError('Please select an active invoice to credit.');
      return;
    }

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    // Reject overpayments before submitting; the API also validates outstanding balance.
    const outstanding = Number(selectedInvoice.balance || 0);
    if (payAmount > outstanding + 0.001) {
      setError(
        `Overpayment rejected: ${formatCurrency(payAmount)} exceeds the current invoice balance of ${formatCurrency(outstanding)}.`
      );
      return;
    }

    setLoading(true);
    try {
      await apiService.recordPayment({
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        customerId: selectedInvoice.customerId,
        customerName: selectedInvoice.customerName,
        amount: payAmount,
        paymentMethod,
        paymentDate: `${paymentDate}T12:00:00Z`,
        reference,
        note: note || 'Local demonstration settlement'
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin/payments');
      }
    } catch (err) {
      setError(err.message || 'Payment recording failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment processing notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Payment settlement:</span> Payments are recorded on the invoice ledger. Partial payments are supported; overpayments are rejected.
        </div>
      </div>

      {/* Customer & Invoice Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Select Customer"
          value={selectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          options={customers.map(c => ({
            value: String(c.id),
            label: `${c.companyName || c.fullName} (${c.email})`
          }))}
          required
        />

        <Select
          label="Select Target Invoice"
          value={selectedInvoiceId}
          onChange={(e) => handleInvoiceChange(e.target.value)}
          options={
            customerInvoices.length > 0
              ? customerInvoices.map(i => ({
                  value: String(i.id),
                  label: `${i.invoiceNumber} — Bal: ${formatCurrency(i.balance)} (${i.status})`
                }))
              : [{ value: '', label: 'No open invoices available for customer' }]
          }
          required
        />
      </div>

      {/* Invoice Financial Snapshot Box */}
      {selectedInvoice && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
            Target Invoice Financial Snapshot
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Total Invoiced</span>
              <span className="font-bold text-slate-900 text-sm">{formatCurrency(selectedInvoice.totalAmount)}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Settled Amount</span>
              <span className="font-bold text-emerald-600 text-sm">{formatCurrency(selectedInvoice.paidAmount)}</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Remaining Balance</span>
              <span className={`font-bold text-sm ${selectedInvoice.balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {formatCurrency(selectedInvoice.balance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Payment Method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={[
            { value: 'BANK_TRANSFER', label: 'Bank Transfer / Wire / ACH' },
            { value: 'CARD', label: 'Credit / Debit Card' },
            { value: 'UPI', label: 'UPI / Instant Pay' },
            { value: 'CASH', label: 'Cash' },
            { value: 'OTHER', label: 'Other' }
          ]}
          required
        />

        <Input
          label="Payment Amount ($)"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          helperText={selectedInvoice ? `Max payable: ${formatCurrency(selectedInvoice.balance)}` : ''}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Payment Date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />

        <Input
          label="Transaction Reference / Cheque #"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. WIRE-884920 or CHQ-109"
          required
        />
      </div>

      <Input
        label="Settlement Note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Partial remittance against milestone deliverables"
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={() => (onCancel ? onCancel() : navigate(-1))}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={DollarSign}
          loading={loading}
        >
          Post Payment to Ledger
        </Button>
      </div>
    </form>
  );
}

export default RecordPaymentForm;

