import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Package, Search, Power } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadProducts = async () => {
    const list = await mockDataService.getProducts();
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleStatus = async (id) => {
    await mockDataService.toggleProductStatus(id);
    loadProducts();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'ALL' || p.productType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [products, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Product Variants"
        description="Configure subscription licenses, one-off service SLAs, metered consumption add-ons, and pricing tiers."
        breadcrumbs={[
          { name: 'Dashboard', path: '/admin/dashboard' },
          { name: 'Products' }
        ]}
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/admin/products/new')}
        >
          Add Product
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalog products..."
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="SERVICE">Service</option>
              <option value="GOODS">Goods</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Catalog Items: <span className="font-semibold text-slate-800">{filteredProducts.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Product Type</th>
                <th className="px-6 py-3">Sales Price</th>
                <th className="px-6 py-3">Cost Price</th>
                <th className="px-6 py-3 text-center">Variants Count</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const variantsCount = p.variants ? p.variants.length : 0;
                let badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                if (p.productType === 'SERVICE') badgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
                if (p.productType === 'GOODS') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{p.notes || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
                        {p.productType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(p.salesPrice)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                      {formatCurrency(p.costPrice || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {variantsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => navigate(`/admin/products/${p.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Power}
                          onClick={() => handleToggleStatus(p.id)}
                          title={p.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Products;

