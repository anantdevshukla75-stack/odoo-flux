import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Package, DollarSign, Tag } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import { apiService } from '../../services/apiService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    async function load() {
      const p = await apiService.getProductById(productId);
      setProduct(p);
    }
    load();
  }, [productId]);

  if (!product) {
    return <LoadingState message="Loading catalog product details..." />;
  }

  const margin = product.salesPrice > 0 && product.costPrice
    ? Math.round(((product.salesPrice - product.costPrice) / product.salesPrice) * 100)
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
              <StatusBadge status={product.isActive ? 'ACTIVE' : 'INACTIVE'} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {product.productType}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{product.notes || 'No description provided'}</p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Edit}
          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
        >
          Edit Product
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Base Sales Price"
          value={formatCurrency(product.salesPrice)}
          icon={DollarSign}
          helperText="Standard catalog list price"
        />
        <StatCard
          label="Cost of Delivery"
          value={formatCurrency(product.costPrice || 0)}
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

      {/* Variants are not supported by the backend catalog yet; the product
          record exposes a single base price. */}
    </div>
  );
}

export default ProductDetails;

