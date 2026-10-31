import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Edit2,
  Power,
  Trash2,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import DiscountForm from './DiscountForm.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [isTesterModalOpen, setIsTesterModalOpen] = useState(false);
  const [testedDiscount, setTestedDiscount] = useState(null);

  // Tester Form State
  const [testParams, setTestParams] = useState({
    purchaseAmount: '600.00',
    quantity: '1',
    productId: '',
    planId: ''
  });
  const [testResult, setTestResult] = useState(null);

  const loadData = async () => {
    const [dList, pList, plList] = await Promise.all([
      mockDataService.getDiscounts(),
      mockDataService.getProducts(),
      mockDataService.getPlans()
    ]);
    setDiscounts(dList);
    setProducts(pList);
    setPlans(plList);

    if (pList.length > 0 && !testParams.productId) {
      setTestParams(prev => ({ ...prev, productId: pList[0].id }));
    }
    if (plList.length > 0 && !testParams.planId) {
      setTestParams(prev => ({ ...prev, planId: plList[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setEditingDiscount(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (discount) => {
    setEditingDiscount(discount);
    setIsFormModalOpen(true);
  };

  const handleToggleStatus = async (id) => {
    await mockDataService.toggleDiscountStatus(id);
    await loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotional discount rule?')) {
      await mockDataService.deleteDiscount(id);
      await loadData();
    }
  };

  const handleOpenTester = (discount) => {
    setTestedDiscount(discount);
    setTestResult(null);
    setIsTesterModalOpen(true);
  };

  const handleRunEligibilityTest = (e) => {
    e.preventDefault();
    if (!testedDiscount) return;

    const result = mockDataService.checkDiscountEligibility(testedDiscount, {
      purchaseAmount: parseFloat(testParams.purchaseAmount) || 0,
      quantity: parseInt(testParams.quantity, 10) || 1,
      productId: testParams.productId,
      planId: testParams.planId
    });

    let savings = 0;
    if (result.eligible) {
      const pAmt = parseFloat(testParams.purchaseAmount) || 0;
      if (testedDiscount.discountType === 'PERCENTAGE') {
        savings = pAmt * (Number(testedDiscount.value) / 100);
      } else {
        savings = Math.min(Number(testedDiscount.value), pAmt);
      }
    }

    setTestResult({
      ...result,
      savings,
      finalTotal: Math.max(0, (parseFloat(testParams.purchaseAmount) || 0) - savings)
    });
  };

  const columns = [
    {
      header: 'Name & Code',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name || row.code}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              {row.code}
            </span>
            {row.description && (
              <span className="text-xs text-slate-500 truncate max-w-xs">{row.description}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          row.discountType === 'PERCENTAGE'
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {row.discountType === 'PERCENTAGE' ? <Percent size={11} /> : <DollarSign size={11} />}
          {row.discountType}
        </span>
      )
    },
    {
      header: 'Value',
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.discountType === 'PERCENTAGE' ? `${row.value}% OFF` : `${formatCurrency(row.value)} OFF`}
        </span>
      )
    },
    {
      header: 'Validity Period',
      render: (row) => {
        const today = new Date().toISOString().split('T')[0];
        const isExpired = row.endDate && row.endDate < today;
        const isFuture = row.startDate && row.startDate > today;

        return (
          <div className="text-xs text-slate-600">
            <div>{formatDate(row.startDate)} to {formatDate(row.endDate)}</div>
            {isExpired && (
              <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 rounded">
                Expired
              </span>
            )}
            {isFuture && (
              <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded">
                Scheduled
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Usage Quota',
      render: (row) => {
        const used = row.redemptionsCount || 0;
        const limit = row.usageLimit || 0;
        const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
        const isExhausted = limit > 0 && used >= limit;

        return (
          <div className="w-28">
            <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
              <span>{used} used</span>
              <span className="text-slate-400">{limit > 0 ? `/ ${limit}` : '∞'}</span>
            </div>
            {limit > 0 && (
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isExhausted ? 'bg-rose-500' : 'bg-indigo-600'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Applicability',
      render: (row) => {
        let label = 'Universal';
        let badgeColor = 'bg-slate-100 text-slate-700';

        if (row.applicability === 'PRODUCT_SPECIFIC') {
          label = `Products (${row.applicableProducts?.length || 0})`;
          badgeColor = 'bg-purple-50 text-purple-700 border border-purple-200';
        } else if (row.applicability === 'SUBSCRIPTION_WIDE') {
          label = `Subscriptions (${row.applicableSubscriptions?.length || 0})`;
          badgeColor = 'bg-cyan-50 text-cyan-700 border border-cyan-200';
        }

        return (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
            {label}
          </span>
        );
      }
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={Sparkles}
            onClick={() => handleOpenTester(row)}
            title="Test Eligibility Criteria"
          >
            Test
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => handleEdit(row)}
            title="Edit Rule"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Power}
            onClick={() => handleToggleStatus(row.id)}
            title={row.isActive ? 'Deactivate' : 'Activate'}
            className={row.isActive ? 'text-slate-400 hover:text-amber-600' : 'text-slate-400 hover:text-emerald-600'}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => handleDelete(row.id)}
            title="Delete"
            className="text-slate-400 hover:text-rose-600"
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotional Discounts & Concessions"
        description="Administer percentage incentives, fixed contract credits, usage quotas, minimum purchases, and product applicability rules."
      >
        <Button variant="primary" icon={Plus} onClick={handleCreateNew}>
          New Discount Rule
        </Button>
      </PageHeader>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Active Coupons</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {discounts.filter(d => d.isActive).length}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Ready for quotation checkout</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Total Redemptions</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {discounts.reduce((sum, d) => sum + (d.redemptionsCount || 0), 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all historical proposals</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Eligibility Verification</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">Live Engine</div>
          <div className="text-xs text-slate-500 mt-1">Checks dates, quotas, cart minimums & scope</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={discounts}
        searchPlaceholder="Search coupon code, description, applicability..."
        emptyMessage="No promotional discounts configured."
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingDiscount ? `Edit Discount Rule: ${editingDiscount.name}` : 'Create Promotional Discount Rule'}
      >
        <DiscountForm
          isModal={true}
          initialData={editingDiscount}
          onSave={() => {
            setIsFormModalOpen(false);
            loadData();
          }}
          onCancel={() => setIsFormModalOpen(false)}
        />
      </Modal>

      {/* Demonstration Eligibility Testing Tool Modal */}
      <Modal
        isOpen={isTesterModalOpen}
        onClose={() => setIsTesterModalOpen(false)}
        title={`Discount Eligibility Simulator: ${testedDiscount?.code}`}
      >
        {testedDiscount && (
          <form onSubmit={handleRunEligibilityTest} className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Discount Code:</span>
                <span className="font-mono font-bold text-indigo-700">{testedDiscount.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Concession:</span>
                <span className="font-semibold text-slate-800">
                  {testedDiscount.discountType === 'PERCENTAGE' ? `${testedDiscount.value}% OFF` : `${formatCurrency(testedDiscount.value)} Flat OFF`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Minimum Order / Units:</span>
                <span className="text-slate-800">${testedDiscount.minPurchase || 0} / min {testedDiscount.minQuantity || 1} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quota:</span>
                <span className="text-slate-800">{testedDiscount.redemptionsCount || 0} / {testedDiscount.usageLimit || 'Unlimited'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validity Window:</span>
                <span className="text-slate-800">{testedDiscount.startDate} to {testedDiscount.endDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Simulated Cart Subtotal ($)"
                type="number"
                step="0.01"
                min="0"
                value={testParams.purchaseAmount}
                onChange={(e) => setTestParams({ ...testParams, purchaseAmount: e.target.value })}
                required
              />

              <Input
                label="Simulated Item Qty"
                type="number"
                min="1"
                value={testParams.quantity}
                onChange={(e) => setTestParams({ ...testParams, quantity: e.target.value })}
                required
              />
            </div>

            <Select
              label="Selected Product (for Product-Specific checks)"
              value={testParams.productId}
              onChange={(e) => setTestParams({ ...testParams, productId: e.target.value })}
              options={products.map(p => ({ value: p.id, label: `${p.name} ($${p.salesPrice})` }))}
            />

            <Select
              label="Selected Plan (for Subscription-Wide checks)"
              value={testParams.planId}
              onChange={(e) => setTestParams({ ...testParams, planId: e.target.value })}
              options={plans.map(pl => ({ value: pl.id, label: `${pl.name} (${pl.billingInterval})` }))}
            />

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsTesterModalOpen(false)}>
                Close
              </Button>
              <Button type="submit" variant="primary" icon={Sparkles}>
                Verify Eligibility
              </Button>
            </div>

            {/* Test Results Output */}
            {testResult && (
              <div className={`mt-4 p-4 rounded-xl border text-sm transition-all ${
                testResult.eligible
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  {testResult.eligible ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold">
                      {testResult.eligible ? 'Eligibility Confirmed: Concession Applicable' : 'Eligibility Disqualified'}
                    </div>
                    <div className="text-xs leading-relaxed">{testResult.message}</div>

                    {testResult.eligible && (
                      <div className="pt-2 mt-2 border-t border-emerald-200/60 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Original Order:</span>
                          <span className="font-semibold">{formatCurrency(testParams.purchaseAmount)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Discount Deducted:</span>
                          <span>- {formatCurrency(testResult.savings)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-950 pt-1 border-t border-emerald-200">
                          <span>Adjusted Subtotal:</span>
                          <span>{formatCurrency(testResult.finalTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}

export default Discounts;

