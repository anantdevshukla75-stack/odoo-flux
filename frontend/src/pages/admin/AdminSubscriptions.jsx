import React, { useState, useEffect } from 'react';
import { Pause, Play, XCircle, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);

  const loadSubscriptions = async () => {
    const list = await mockDataService.getSubscriptions();
    setSubscriptions(list);
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    await mockDataService.updateSubscriptionStatus(id, newStatus);
    loadSubscriptions();
  };

  const columns = [
    {
      header: 'Subscription #',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.subscriptionNumber}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Started {formatDate(row.startDate)}
          </div>
        </div>
      )
    },
    {
      header: 'Customer',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>{row.customerName}</span>
      )
    },
    {
      header: 'Plan & Cadence',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.planName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Billed {row.billingInterval.toLowerCase()}
          </div>
        </div>
      )
    },
    {
      header: 'Recurring Amount',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {formatCurrency(row.recurringAmount)}
        </span>
      )
    },
    {
      header: 'Next Billing Date',
      render: (row) => formatDate(row.nextBillingDate)
    },
    {
      header: 'Auto-Renew',
      render: (row) => (
        <span className={`badge ${row.autoRenew ? 'badge-success' : 'badge-neutral'}`}>
          {row.autoRenew ? 'Enabled' : 'Disabled'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Lifecycle Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {row.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              size="sm"
              icon={Pause}
              onClick={() => handleUpdateStatus(row.id, 'PAUSED')}
            >
              Pause
            </Button>
          )}
          {row.status === 'PAUSED' && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => handleUpdateStatus(row.id, 'ACTIVE')}
            >
              Resume
            </Button>
          )}
          {row.status !== 'CANCELLED' && (
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={() => handleUpdateStatus(row.id, 'CANCELLED')}
            >
              Cancel
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Subscription Management"
        description="Monitor automated recurring billing cycles, pause requests, and active customer contracts."
      />

      <DataTable
        columns={columns}
        data={subscriptions}
        searchPlaceholder="Search subscription #, customer, plan..."
        emptyMessage="No subscriptions active or recorded."
      />
    </div>
  );
}

export default AdminSubscriptions;
