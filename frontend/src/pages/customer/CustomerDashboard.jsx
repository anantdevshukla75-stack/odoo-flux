import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Receipt,
  FileText,
  CreditCard,
  ArrowRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import { useAuth } from '../../context/useAuth.js';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function CustomerDashboard() {
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomerData() {
      setLoading(true);
      const customerId = user?.customerId || user?.id || 'cust-001';
      const [sList, qList, iList, pList] = await Promise.all([
        mockDataService.getSubscriptions({ customerId }),
        mockDataService.getQuotations({ customerId }),
        mockDataService.getInvoices({ customerId }),
        mockDataService.getPayments({ customerId })
      ]);

      setSubscriptions(sList);
      setQuotations(qList);
      setInvoices(iList);
      setPayments(pList);
      setLoading(false);
    }
    loadCustomerData();
  }, [user]);

  if (loading) {
    return <LoadingState message="Loading your customer portal dashboard..." />;
  }

  const activeSub = subscriptions.find(s => s.status === 'ACTIVE') || subscriptions[0] || null;
  const pendingQuotes = quotations.filter(q => q.status === 'SENT');
  const outstandingTotal = invoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <ShieldCheck size={13} />
            <span>Customer Self-Service Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.fullName || 'Marcus Sterling'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Account portal for <span className="font-semibold text-slate-700">{user?.companyName || 'Acme Technologies Inc.'}</span>. View your active subscriptions, settle invoices, and review service proposals.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/customer/profile"
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Manage Profile
          </Link>
          {outstandingTotal > 0 && (
            <Link
              to="/customer/invoices"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              Pay Outstanding ({formatCurrency(outstandingTotal)})
            </Link>
          )}
        </div>
      </div>

      {/* Pending Proposal Alert if available */}
      {pendingQuotes.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Pending Quotation Proposal:</span> You have {pendingQuotes.length} commercial proposal ready for your authorization ({pendingQuotes[0].quotationNumber}).
            </div>
          </div>
          <Link
            to={`/customer/quotations/${pendingQuotes[0].id}`}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 transition-colors"
          >
            Review Quote
          </Link>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Subscriptions Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Subscriptions</span>
            <RefreshCw className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {subscriptions.filter(s => s.status === 'ACTIVE').length} Active
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">
            {activeSub ? activeSub.planName : 'No enrolled plan'}
          </div>
        </div>

        {/* Next Billing Date */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Next Billing Date</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {activeSub ? formatDate(activeSub.nextBillingDate) : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Automated recurring cycle
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className={`p-5 rounded-xl border shadow-xs flex flex-col justify-between ${
          outstandingTotal > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${outstandingTotal > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              Outstanding Balance
            </span>
            <Receipt className={`w-4 h-4 ${outstandingTotal > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black ${outstandingTotal > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {formatCurrency(outstandingTotal)}
          </div>
          <div className={`text-xs mt-1 ${outstandingTotal > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {outstandingTotal > 0 ? 'Pending payment settlement' : 'All accounts settled'}
          </div>
        </div>

        {/* Contracted Recurring Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recurring Rate</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {activeSub ? formatCurrency(activeSub.recurringAmount) : '$0.00'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Cadence: {activeSub?.billingInterval || 'Monthly'}
          </div>
        </div>
      </div>

      {/* Main Grid: Active Subscription Highlight & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Active Subscription Card */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Enrolled Subscription</h3>
              {activeSub && <StatusBadge status={activeSub.status} />}
            </div>

            {activeSub ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{activeSub.planName}</h4>
                  <div className="font-mono text-xs text-slate-500 mt-0.5">{activeSub.subscriptionNumber}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Billing Interval:</span>
                    <span className="font-semibold text-slate-800">{activeSub.billingInterval}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Commenced On:</span>
                    <span className="text-slate-800">{formatDate(activeSub.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Next Renewal:</span>
                    <span className="font-semibold text-indigo-700">{formatDate(activeSub.nextBillingDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auto-Renewal:</span>
                    <span className="text-emerald-700 font-semibold">{activeSub.autoRenew ? 'Active (Auto-Charge)' : 'Manual'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-[11px] text-slate-500">Included SLA:</div>
                  <div className="text-xs font-medium text-slate-800 mt-0.5">
                    99.99% Uptime Guarantee & 24/7 Priority Support
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No active software subscription found.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to="/customer/subscriptions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <span>View Subscription Management</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Billing Invoices */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Invoices</h3>
                <p className="text-xs text-slate-500">Latest recurring billing statements</p>
              </div>
              <Link
                to="/customer/invoices"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <span>View All Invoices</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No invoices issued yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2">Invoice #</th>
                      <th className="py-2">Issued</th>
                      <th className="py-2">Due Date</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 4).map(inv => (
                      <tr key={inv.id}>
                        <td className="py-3 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                        <td className="py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                        <td className="py-3 text-right font-bold font-mono text-slate-900">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="py-3 text-center">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/customer/invoices/${inv.id}`}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors inline-block"
                          >
                            {inv.balance > 0 ? 'Pay / View' : 'View'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Payment receipts and VAT invoices are ready for download.</span>
            <Link to="/customer/payments" className="font-semibold text-slate-700 hover:text-slate-900">
              Payment History →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Settled Payments Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Settled Transactions & Receipts</h3>
            <p className="text-xs text-slate-500">Verified payment receipts credited to your account</p>
          </div>
          <Link
            to="/customer/payments"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            All Receipts →
          </Link>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No payments recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {payments.slice(0, 2).map(p => (
              <div key={p.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{p.paymentNumber}</div>
                  <div className="text-slate-500 mt-0.5">
                    Invoice: <span className="font-mono text-indigo-700">{p.invoiceNumber}</span> via {p.paymentMethod}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(p.paymentDate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-600 font-mono">{formatCurrency(p.amount)}</div>
                  <StatusBadge status={p.status} className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;
