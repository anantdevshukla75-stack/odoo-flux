import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Package, DollarSign, Tag, Info } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import { productsApi } from '../../services/api/productsApi.js';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { useAuth } from '../../context/useAuth.js';
import { ROLES } from '../../utils/roleHelpers.js';

export function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.getProduct(productId);
      if (data) {
        setProduct(data);
      } else {
        const demo = await mockDataService.getProductById(productId);
        setProduct(demo);
      }
    } catch {
      const demo = await mockDataService.getProductById(productId);
      setProduct(demo);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (loading || !product) {
    return <LoadingState message="Loading catalog product details..." />;
  }

  const pType = (product.product_type || product.productType || 'service').toUpperCase();
  const salesPrice = Number(product.sales_price ?? product.salesPrice ?? 0);
  const costPrice = Number(product.cost_price ?? product.costPrice ?? 0);
  const isActive = Boolean(product.is_active ?? product.isActive);

  const margin = salesPrice > 0 && costPrice >= 0
    ? Math.round(((salesPrice - costPrice) / salesPrice) * 100)
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        type="button"
        onClick={() => navigate('/admin/products')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Products</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
              <StatusBadge status={isActive ? 'ACTIVE' : 'INACTIVE'} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {pType}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{product.notes || 'No notes or description provided'}</p>
          </div>
        </div>

        {isAdmin && (
          <Button
            variant="secondary"
            size="sm"
            icon={Edit}
            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
          >
            Edit Product
          </Button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Base Sales Price"
          value={formatCurrency(salesPrice)}
          icon={DollarSign}
          helperText="Standard catalog list price"
        />
        <StatCard
          label="Cost of Delivery"
          value={formatCurrency(costPrice)}
          icon={DollarSign}
          helperText="Internal base unit cost"
        />
        <StatCard
          label="Estimated Margin"
          value={margin !== null ? `${margin}%` : 'N/A'}
          icon={Tag}
          trend={margin !== null ? `${margin}% profit margin` : ''}
          trendDirection="up"
          helperText="Gross profitability"
        />
      </div>

      {/* Demonstration Variants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Product Variants</h3>
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                Client-Side Demo Preview
              </span>
            </div>
            <p className="text-xs text-slate-500">Tier options available for proposal line simulations</p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {product.variants?.length || 0} variants
          </span>
        </div>

        <div className="p-3 bg-amber-50/50 border-b border-amber-100/50 flex items-center gap-2 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Product variants are maintained as client-side pricing tiers as per Phase 0 specification.</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Variant Tier</th>
                <th className="px-6 py-3">SKU Identifier</th>
                <th className="px-6 py-3">Adjustment</th>
                <th className="px-6 py-3">Effective Final Price</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {product.variants && product.variants.length > 0 ? (
                product.variants.map((v) => {
                  const finalPrice = salesPrice + Number(v.priceAdjustment || 0);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{v.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{v.code}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {Number(v.priceAdjustment) >= 0 ? `+${formatCurrency(v.priceAdjustment)}` : `-${formatCurrency(Math.abs(v.priceAdjustment))}`}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600 font-mono">
                        {formatCurrency(finalPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusBadge status={v.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-400">
                    No custom variants configured for this offering.
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

export default ProductDetails;
