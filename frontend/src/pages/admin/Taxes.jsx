import React, { useState, useEffect } from 'react';
import { Plus, Percent, Edit, Power, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import TaxForm from './TaxForm.jsx';
import { apiService } from '../../services/apiService.js';

export function Taxes() {
  const [taxes, setTaxes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [error, setError] = useState('');

  const loadTaxes = async () => {
    try {
      setTaxes(await apiService.getTaxes());
      setError('');
    } catch (err) {
      setError(err?.message || 'Could not load tax rules from the API.');
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const handleOpenCreate = () => {
    setEditingTax(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tax) => {
    setEditingTax(tax);
    setIsModalOpen(true);
  };

  const handleSaveTax = async (taxData) => {
    try {
      if (editingTax) {
        await apiService.updateTax(editingTax.id, taxData);
      } else {
        await apiService.createTax(taxData);
      }
      setIsModalOpen(false);
      setEditingTax(null);
      await loadTaxes();
    } catch (err) {
      setError(err?.message || 'Could not save this tax rule.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await apiService.toggleTaxStatus(id);
      await loadTaxes();
    } catch (err) {
      setError(err?.message || 'Could not update this tax rule.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Configuration & Rates"
        description="Administer jurisdictional tax rules, inclusive/exclusive calculation methods, and default billing tax policies."
        breadcrumbs={[
          { name: 'Dashboard', path: '/admin/dashboard' },
          { name: 'Tax Configuration' }
        ]}
      >
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Tax Rule
        </Button>
      </PageHeader>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Configured Tax Jurisdictions</h3>
          </div>
          <span className="text-xs text-slate-500">
            Rules configured: <strong className="text-slate-800">{taxes.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Tax Rule Name</th>
                <th className="px-6 py-3">Statutory Rate</th>
                <th className="px-6 py-3">Calculation Method</th>
                <th className="px-6 py-3 text-center">Default Rule</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxes.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{t.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-base font-bold text-indigo-600 font-mono">
                      {t.rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {t.calculationType || 'EXCLUSIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {t.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Default
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit}
                        onClick={() => handleOpenEdit(t)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Power}
                        onClick={() => handleToggleStatus(t.id)}
                      >
                        {t.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Form Modal */}
      <TaxForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTax(null);
        }}
        initialData={editingTax}
        onSave={handleSaveTax}
      />
    </div>
  );
}

export default Taxes;

