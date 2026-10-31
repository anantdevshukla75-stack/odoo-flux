import React, { useState, useEffect } from 'react';
import { Plus, Package, Layers } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    productType: 'SUBSCRIPTION',
    salesPrice: '',
    costPrice: '',
    notes: ''
  });

  const loadProducts = async () => {
    const list = await mockDataService.getProducts();
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    await mockDataService.createProduct({
      ...newProduct,
      salesPrice: Number(newProduct.salesPrice) || 0,
      costPrice: Number(newProduct.costPrice) || 0
    });
    setIsModalOpen(false);
    setNewProduct({
      name: '',
      productType: 'SUBSCRIPTION',
      salesPrice: '',
      costPrice: '',
      notes: ''
    });
    loadProducts();
  };

  const columns = [
    {
      header: 'Product Details',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.notes}</div>
        </div>
      )
    },
    {
      header: 'Product Type',
      render: (row) => {
        let badgeStyle = 'badge-primary';
        if (row.productType === 'SERVICE') badgeStyle = 'badge-info';
        if (row.productType === 'GOODS') badgeStyle = 'badge-warning';
        return <span className={`badge ${badgeStyle}`}>{row.productType}</span>;
      }
    },
    {
      header: 'Sales Price',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {formatCurrency(row.salesPrice)}
        </span>
      )
    },
    {
      header: 'Cost Price',
      render: (row) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {formatCurrency(row.costPrice)}
        </span>
      )
    },
    {
      header: 'Variants Configured',
      render: (row) => (
        <div>
          {row.variants && row.variants.length > 0 ? (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {row.variants.map((v) => (
                <span key={v.id} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                  {v.name} (+{formatCurrency(v.priceAdjustment)})
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>No variants</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Products & Variants"
        description="Configure SaaS subscription products, one-off service SLAs, and variant pricing."
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Product
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={products}
        searchPlaceholder="Search product name, notes..."
        emptyMessage="No products configured in catalog."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Product"
      >
        <form onSubmit={handleCreateProduct}>
          <Input
            label="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            placeholder="e.g. Brightloop Core Platform"
            required
          />

          <Select
            label="Product Classification"
            value={newProduct.productType}
            onChange={(e) => setNewProduct({ ...newProduct, productType: e.target.value })}
            options={[
              { value: 'SUBSCRIPTION', label: 'Subscription License' },
              { value: 'SERVICE', label: 'Service / Support SLA' },
              { value: 'GOODS', label: 'Metered Goods / Consumption Addon' }
            ]}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Default Sales Price ($)"
              type="number"
              step="0.01"
              value={newProduct.salesPrice}
              onChange={(e) => setNewProduct({ ...newProduct, salesPrice: e.target.value })}
              placeholder="0.00"
              required
            />
            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              value={newProduct.costPrice}
              onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <Input
            label="Internal Notes / Description"
            value={newProduct.notes}
            onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
            placeholder="Brief scope of the product offering"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminProducts;
