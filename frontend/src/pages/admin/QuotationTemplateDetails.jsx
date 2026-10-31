import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, FileCode, ArrowRight, Clock, Layers, DollarSign } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function QuotationTemplateDetails() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setTemplate(await apiService.getQuotationTemplateById(templateId));
      } catch (err) {
        setError(err?.message || 'Could not load this quotation template.');
      }
    }
    load();
  }, [templateId]);

  if (!template) {
    return error
      ? <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">{error}</div>
      : <LoadingState message="Loading quotation template blueprint..." />;
  }

  const bundledTotal = template.productLines?.reduce(
    (acc, l) => acc + (l.quantity * l.unitPrice),
    0
  ) || 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate('/admin/quotation-templates')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Quotation Templates</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{template.name}</h1>
            <p className="text-xs text-slate-500 mt-1">{template.description || 'No description provided'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Edit}
            onClick={() => navigate(`/admin/quotation-templates/${template.id}/edit`)}
          >
            Edit Blueprint
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate(`/admin/quotations/new?templateId=${template.id}`)}
          >
            Draft Quote with Template
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Default Subscription Plan"
          value={template.defaultPlanName}
          icon={Layers}
          helperText="Automatically assigned to proposal"
        />
        <StatCard
          label="Proposal Validity"
          value={`${template.validityDays} Days`}
          icon={Clock}
          helperText="Automated expiration deadline"
        />
        <StatCard
          label="Bundled Lines Value"
          value={formatCurrency(bundledTotal)}
          icon={DollarSign}
          helperText={`${template.productLines?.length || 0} catalog products included`}
        />
      </div>

      {/* Product Lines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Pre-configured Product Lines</h3>
          <span className="text-xs font-medium text-slate-500">
            {template.productLines?.length || 0} line items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Catalog Product</th>
                <th className="px-6 py-3 text-center">Standard Quantity</th>
                <th className="px-6 py-3">Blueprint Unit Valuation</th>
                <th className="px-6 py-3 text-right">Bundled Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {template.productLines && template.productLines.length > 0 ? (
                template.productLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{line.productName}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">{line.quantity}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-right">
                      {formatCurrency(line.quantity * line.unitPrice)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-slate-400">
                    No custom product lines attached to this blueprint template.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default QuotationTemplateDetails;

