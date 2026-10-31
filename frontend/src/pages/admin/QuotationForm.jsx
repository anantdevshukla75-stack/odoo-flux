import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Send, FileText, CheckCircle2, DollarSign } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function QuotationForm({ basePath = '/admin/quotations' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateIdParam = searchParams.get('templateId');

  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateIdParam || '');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [productLines, setProductLines] = useState([]);
  const [validityDays, setValidityDays] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState('Net 15 Days');
  const [notes, setNotes] = useState('Subject to Brightloop standard software terms of service.');

  // Discount state
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');

  // Add Product Line local state
  const [lineProductId, setLineProductId] = useState('');
  const [lineVariantId, setLineVariantId] = useState('');
  const [lineQty, setLineQty] = useState(1);
  const [linePrice, setLinePrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [cList, pList, prodList, tList, dList] = await Promise.all([
        mockDataService.getCustomers(),
        mockDataService.getPlans(),
        mockDataService.getProducts(),
        mockDataService.getQuotationTemplates(),
        mockDataService.getDiscounts()
      ]);

      setCustomers(cList);
      setPlans(pList);
      setProducts(prodList);
      setTemplates(tList);
      setAvailableDiscounts(dList);

      if (cList.length > 0) {
        setSelectedCustomerId(cList[0].id);
        setSelectedCustomer(cList[0]);
      }

      if (prodList.length > 0) {
        setLineProductId(prodList[0].id);
        setLinePrice(prodList[0].salesPrice);
      }

      // If templateId provided, apply template defaults
      if (templateIdParam) {
        const tmpl = tList.find(t => t.id === templateIdParam);
        if (tmpl) {
          applyTemplate(tmpl, pList);
        }
      } else if (pList.length > 0) {
        setSelectedPlanId(pList[0].id);
        setSelectedPlan(pList[0]);
      }
    }
    loadData();
  }, [templateIdParam]);

  const applyTemplate = (tmpl, currentPlans = plans) => {
    setSelectedTemplateId(tmpl.id);
    if (tmpl.defaultPlanId) {
      setSelectedPlanId(tmpl.defaultPlanId);
      const planFound = currentPlans.find(p => p.id === tmpl.defaultPlanId);
      setSelectedPlan(planFound || null);
    }
    if (tmpl.validityDays) {
      setValidityDays(tmpl.validityDays);
    }
    if (tmpl.productLines && tmpl.productLines.length > 0) {
      const mapped = tmpl.productLines.map(l => ({
        id: `line-${Date.now()}-${Math.random()}`,
        productId: l.productId,
        productName: l.productName,
        variantName: 'Base License',
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: 18
      }));
      setProductLines(mapped);
    }
  };

  const handleCustomerChange = (cId) => {
    setSelectedCustomerId(cId);
    const found = customers.find(c => c.id === cId);
    setSelectedCustomer(found || null);
  };

  const handlePlanChange = (pId) => {
    setSelectedPlanId(pId);
    const found = plans.find(p => p.id === pId);
    setSelectedPlan(found || null);
  };

  const handleTemplateChange = (tId) => {
    setSelectedTemplateId(tId);
    const tmpl = templates.find(t => t.id === tId);
    if (tmpl) {
      applyTemplate(tmpl);
    }
  };

  const handleProductSelect = (pId) => {
    setLineProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setLinePrice(prod.salesPrice);
      setLineVariantId('');
    }
  };

  const handleVariantSelect = (vId) => {
    setLineVariantId(vId);
    const prod = products.find(p => p.id === lineProductId);
    if (prod) {
      const v = prod.variants?.find(item => item.id === vId);
      const adj = v ? Number(v.priceAdjustment || 0) : 0;
      setLinePrice(Number(prod.salesPrice) + adj);
    }
  };

  const handleAddLine = (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === lineProductId);
    if (!prod) return;

    const variant = prod.variants?.find(v => v.id === lineVariantId);
    const qty = parseInt(lineQty, 10) || 1;
    const price = parseFloat(linePrice) || 0;

    const newLine = {
      id: `line-${Date.now()}-${Math.random().toString().slice(-4)}`,
      productId: prod.id,
      productName: prod.name,
      variantName: variant ? variant.name : 'Standard Tier',
      quantity: qty,
      unitPrice: price,
      taxRate: 18
    };

    setProductLines([...productLines, newLine]);
    setLineQty(1);
  };

  const handleRemoveLine = (id) => {
    setProductLines(productLines.filter(l => l.id !== id));
  };

  const handleApplyCoupon = (e) => {
    if (e) e.preventDefault();
    if (!couponCode.trim()) {
      setAppliedDiscount(null);
      setDiscountError('');
      return;
    }
    const found = availableDiscounts.find(
      d => d.code.toUpperCase() === couponCode.trim().toUpperCase() && d.isActive
    );
    if (found) {
      setAppliedDiscount(found);
      setDiscountError('');
    } else {
      setAppliedDiscount(null);
      setDiscountError('Coupon code not found or inactive.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponCode('');
    setDiscountError('');
  };

  // Financial Calculations
  const planBase = selectedPlan ? Number(selectedPlan.basePrice || 0) : 0;
  const linesSubtotal = productLines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
  const subtotal = planBase + linesSubtotal;

  let discountAmount = 0.00;
  if (appliedDiscount) {
    if (appliedDiscount.discountType === 'PERCENTAGE') {
      discountAmount = Number((subtotal * (Number(appliedDiscount.value) / 100)).toFixed(2));
    } else {
      discountAmount = Math.min(Number(appliedDiscount.value) || 0, subtotal);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxes = Number((taxableAmount * 0.18).toFixed(2));
  const grandTotal = taxableAmount + taxes;

  const expirationDate = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const handleSaveQuotation = async (status = 'DRAFT') => {
    if (!selectedCustomer || !selectedPlan) {
      alert('Please select both a customer and subscription plan.');
      return;
    }

    setLoading(true);
    const newQuote = await mockDataService.createQuotation({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.companyName || selectedCustomer.fullName,
      customerEmail: selectedCustomer.email,
      customerPhone: selectedCustomer.phone,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planInterval: selectedPlan.billingInterval,
      productLines,
      subtotal,
      taxAmount: taxes,
      discountAmount: discountAmount,
      couponCode: appliedDiscount ? appliedDiscount.code : null,
      total: grandTotal,
      validityDays,
      validUntil: expirationDate,
      paymentTerms,
      notes,
      status
    });

    setLoading(false);
    navigate(`${basePath}/${newQuote.id}`);
  };

  const activeProduct = products.find(p => p.id === lineProductId);

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate(basePath)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Quotations</span>
      </button>

      <PageHeader
        title="Quotation Commercial Proposal Builder"
        description="Draft prospective subscription terms, configure bundled product lines, and issue proposals for customer sign-off."
      />

      <div className="space-y-6">
        {/* Template & Customer Selector Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              1. Customer & Proposal Blueprint
            </h3>
            {templates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Apply Template:</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg focus:outline-none"
                >
                  <option value="">Choose Saved Template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Target Customer"
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              options={customers.map(c => ({
                value: c.id,
                label: `${c.fullName} - ${c.companyName || 'Private Account'}`
              }))}
              required
            />

            <Input
              label="Company Legal Name"
              value={selectedCustomer?.companyName || '—'}
              disabled
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Corporate Contact Email"
              value={selectedCustomer?.email || '—'}
              disabled
            />

            <Input
              label="Direct Telephone"
              value={selectedCustomer?.phone || '—'}
              disabled
            />
          </div>
        </div>

        {/* Plan Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            2. Selected Subscription Plan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Base Subscription Plan"
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              options={plans.map(p => ({
                value: p.id,
                label: `${p.name} - ${formatCurrency(p.basePrice)} / ${p.billingInterval.toLowerCase()}`
              }))}
              required
            />

            <div className="flex flex-col justify-center bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span>Billing Frequency:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {selectedPlan?.billingInterval.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Base Plan Price:</span>
                <span className="font-bold text-indigo-600 text-sm">
                  {formatCurrency(selectedPlan?.basePrice || 0)}
                </span>
              </div>
            </div>
          </div>

          {selectedPlan?.description && (
            <p className="text-xs text-slate-500 italic bg-slate-50/50 p-2.5 rounded border border-slate-100">
              "{selectedPlan.description}"
            </p>
          )}
        </div>

        {/* Product Lines Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            3. Add Additional Products & Services
          </h3>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Select
                label="Product"
                value={lineProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.name} (${formatCurrency(p.salesPrice)})`
                }))}
                className="mb-0"
              />

              <Select
                label="Pricing Variant"
                value={lineVariantId}
                onChange={(e) => handleVariantSelect(e.target.value)}
                options={[
                  { value: '', label: 'Standard Base' },
                  ...(activeProduct?.variants || []).map(v => ({
                    value: v.id,
                    label: `${v.name} (+${formatCurrency(v.priceAdjustment)})`
                  }))
                ]}
                className="mb-0"
              />

              <Input
                label="Quantity"
                type="number"
                min="1"
                value={lineQty}
                onChange={(e) => setLineQty(e.target.value)}
                className="mb-0"
              />

              <Input
                label="Unit Price ($)"
                type="number"
                step="0.01"
                value={linePrice}
                onChange={(e) => setLinePrice(e.target.value)}
                className="mb-0"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddLine}
              >
                Insert Line Item
              </Button>
            </div>
          </div>

          {/* Product Lines Table */}
          {productLines.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Variant</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5">Unit Price</th>
                    <th className="px-4 py-2.5 text-center">Tax</th>
                    <th className="px-4 py-2.5 text-right">Line Total</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productLines.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{l.productName}</td>
                      <td className="px-4 py-3 text-slate-600">{l.variantName}</td>
                      <td className="px-4 py-3 text-center font-bold">{l.quantity}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(l.unitPrice)}</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-mono">18% GST</td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-right">
                        {formatCurrency(l.quantity * l.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(l.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">
              No extra catalog items attached. Only base subscription plan will be quoted.
            </p>
          )}
        </div>

        {/* Quotation Commercial Settings & Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terms & Notes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
              4. Commercial Terms & Validity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Validity (Days)"
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value, 10) || 1)}
                helperText={`Expires on ${expirationDate}`}
              />

              <Input
                label="Payment Terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Net 15 Days / Immediate"
              />
            </div>

            <Input
              label="Proposal Notes & Assumptions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Terms and conditions notes"
            />
          </div>

          {/* Financial Breakdown Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
              5. Financial Summary (Calculated Preview)
            </h3>

            <div className="space-y-2.5 py-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Base Plan Charge:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(planBase)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Add-on Products & Lines:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(linesSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between font-medium text-slate-700 pt-1 border-t border-slate-100">
                <span>Net Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Jurisdictional Taxes (18%):</span>
                <span className="font-semibold text-slate-900">{formatCurrency(taxes)}</span>
              </div>

              {/* Coupon / Concession row */}
              {appliedDiscount ? (
                <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span>Coupon ({appliedDiscount.code}):</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-emerald-800 underline hover:text-emerald-950 cursor-pointer ml-1"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="font-bold font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon Code (e.g. WELCOME20)"
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-md uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-2.5 py-1 bg-slate-800 text-white text-xs font-medium rounded-md hover:bg-slate-700 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {discountError && (
                    <div className="text-[11px] text-red-600 mt-1">{discountError}</div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-base font-bold text-slate-900 pt-3 border-t-2 border-slate-100">
                <span className="text-indigo-950">Grand Total Valuation:</span>
                <span className="text-indigo-600 font-mono text-lg">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Submission triggers */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => handleSaveQuotation('DRAFT')}
                loading={loading}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                icon={Send}
                onClick={() => handleSaveQuotation('SENT')}
                loading={loading}
              >
                Send Proposal to Client
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuotationForm;

