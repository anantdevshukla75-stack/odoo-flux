import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Send, FileText } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function AdminQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newQuotation, setNewQuotation] = useState({
    customerId: '',
    planId: '',
    validUntil: ''
  });

  const loadData = async () => {
    const q = await mockDataService.getQuotations();
    const c = await mockDataService.getCustomers();
    const p = await mockDataService.getPlans();
    setQuotations(q);
    setCustomers(c);
    setPlans(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    const selectedCustomer = customers.find(c => c.id === newQuotation.customerId);
    const selectedPlan = plans.find(p => p.id === newQuotation.planId);

    if (!selectedCustomer || !selectedPlan) return;

    const subtotal = Number(selectedPlan.basePrice) || 0;
    const taxAmount = Number((subtotal * 0.18).toFixed(2));
    const total = subtotal + taxAmount;

    await mockDataService.createQuotation({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.companyName || selectedCustomer.fullName,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      subtotal,
      taxAmount,
      discountAmount: 0.00,
      total,
      validUntil: newQuotation.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    setIsModalOpen(false);
    setNewQuotation({ customerId: '', planId: '', validUntil: '' });
    loadData();
  };

  const handleStatusChange = async (id, status) => {
    await mockDataService.updateQuotationStatus(id, status);
    loadData();
  };

  const columns = [
    {
      header: 'Quotation #',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.quotationNumber}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Created {formatDate(row.createdAt)}
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => row.customerName
    },
    {
      header: 'Plan',
      render: (row) => <span className="badge badge-info">{row.planName}</span>
    },
    {
      header: 'Subtotal',
      render: (row) => formatCurrency(row.subtotal)
    },
    {
      header: 'Tax (18%)',
      render: (row) => formatCurrency(row.taxAmount)
    },
    {
      header: 'Total Amount',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {formatCurrency(row.total)}
        </span>
      )
    },
    {
      header: 'Valid Until',
      render: (row) => formatDate(row.validUntil)
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {row.status === 'DRAFT' && (
            <Button
              variant="secondary"
              size="sm"
              icon={Send}
              onClick={() => handleStatusChange(row.id, 'SENT')}
            >
              Send
            </Button>
          )}
          {row.status === 'SENT' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                onClick={() => handleStatusChange(row.id, 'ACCEPTED')}
              >
                Accept
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={X}
                onClick={() => handleStatusChange(row.id, 'REJECTED')}
              >
                Reject
              </Button>
            </>
          )}
          {row.status === 'ACCEPTED' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
              Converted to Sub
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Quotation Management"
        description="Draft custom quotes, send proposals to prospective clients, and convert accepted quotes to active subscriptions."
      >
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Quotation
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={quotations}
        searchPlaceholder="Search quotation number, customer..."
        emptyMessage="No quotations recorded."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate New Quotation"
      >
        <form onSubmit={handleCreateQuotation}>
          <Select
            label="Target Enterprise Customer"
            value={newQuotation.customerId}
            onChange={(e) => setNewQuotation({ ...newQuotation, customerId: e.target.value })}
            options={customers.map(c => ({
              value: c.id,
              label: `${c.companyName || c.fullName} (${c.email})`
            }))}
            placeholder="Select customer..."
            required
          />

          <Select
            label="Select Subscription Plan"
            value={newQuotation.planId}
            onChange={(e) => setNewQuotation({ ...newQuotation, planId: e.target.value })}
            options={plans.map(p => ({
              value: p.id,
              label: `${p.name} - ${formatCurrency(p.basePrice)} / ${p.billingInterval.toLowerCase()}`
            }))}
            placeholder="Select plan..."
            required
          />

          <Input
            label="Proposal Validity Deadline"
            type="date"
            value={newQuotation.validUntil}
            onChange={(e) => setNewQuotation({ ...newQuotation, validUntil: e.target.value })}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Generate Quote
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminQuotations;
