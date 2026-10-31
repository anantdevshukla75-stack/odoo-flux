import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, FileCode, ArrowRight, Layers, Clock } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';

export function QuotationTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    async function load() {
      const list = await mockDataService.getQuotationTemplates();
      setTemplates(list);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotation Templates"
        description="Standardized commercial proposal blueprints with pre-bundled subscription plans and product lines."
        breadcrumbs={[
          { name: 'Dashboard', path: '/admin/dashboard' },
          { name: 'Quotation Templates' }
        ]}
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/admin/quotation-templates/new')}
        >
          Create Template
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileCode className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Valid {tmpl.validityDays} days
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{tmpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-2 pb-1 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Default Plan:</span>
                  <span className="font-semibold text-slate-900">{tmpl.defaultPlanName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Bundled Line Items:</span>
                  <span className="font-semibold text-slate-900">{tmpl.productLines?.length || 0} products</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                icon={Eye}
                onClick={() => navigate(`/admin/quotation-templates/${tmpl.id}`)}
              >
                Inspect Template
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate(`/admin/quotations/new?templateId=${tmpl.id}`)}
              >
                Use in Quote
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuotationTemplates;

