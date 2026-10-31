import React, { useState, useEffect } from 'react';
import { RefreshCw, Pause, Play } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import { mockDataService } from '../../services/mockDataService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export function CustomerSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);

  const loadSubscriptions = async () => {
    const list = await mockDataService.getSubscriptions();
    setSubscriptions(list.filter(s => s.customerId === 'cust-001'));
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleTogglePause = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await mockDataService.updateSubscriptionStatus(id, newStatus);
    loadSubscriptions();
  };

  const columns = [
    {
      header: 'Subscription #',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.subscriptionNumber}</span>
      )
    },
    {
      header: 'Plan Tier',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.planName}</span>
      )
    },
    {
      header: 'Recurring Charge',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
          {formatCurrency(row.recurringAmount)} / {row.billingInterval.toLowerCase()}
        </span>
      )
    },
    {
      header: 'Commenced On',
      render: (row) => formatDate(row.startDate)
    },
    {
      header: 'Next Renewal Date',
      render: (row) => formatDate(row.nextBillingDate)
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Self-Service Actions',
      render: (row) => (
        <div>
          {row.status === 'ACTIVE' && (
            <Button
              variant="secondary"
              size="sm"
              icon={Pause}
              onClick={() => handleTogglePause(row.id, row.status)}
            >
              Pause
            </Button>
          )}
          {row.status === 'PAUSED' && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => handleTogglePause(row.id, row.status)}
            >
              Resume
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="My Subscriptions"
        description="View your active software plan licenses, automated renewal cadences, and self-service pause controls."
      />

      <DataTable
        columns={columns}
        data={subscriptions}
        searchPlaceholder="Search subscriptions..."
        emptyMessage="No subscription plans active."
      />
    </div>
  );
}

export default CustomerSubscriptions;

