import React, { useState } from 'react';
import { Building, Save, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function CustomerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: user?.fullName || 'Marcus Sterling',
    email: user?.email || 'marcus@acmecorp.com',
    companyName: user?.companyName || 'Acme Technologies Inc.',
    phone: user?.phone || '+1 (555) 234-5678',
    taxId: user?.taxId || 'US-TAX-8839210',
    billingAddress: user?.billingAddress || '450 Mission St, Suite 1200, San Francisco, CA 94105'
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <PageHeader
        title="Organization & Billing Profile"
        description="Maintain legal entity name, statutory tax registration ID, and invoicing mailing address."
      />

      <div className="card" style={{ maxWidth: '640px', padding: '2rem' }}>
        {saved && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--success-light)',
              color: 'var(--success)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <CheckCircle style={{ width: '18px', height: '18px' }} />
            Profile changes saved successfully!
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Primary Contact Name"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              required
            />
            <Input
              label="Contact Email"
              type="email"
              value={profile.email}
              disabled
              helperText="Contact administrator to change login email"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Legal Entity Company Name"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              required
            />
            <Input
              label="Direct Contact Phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <Input
            label="Corporate Tax ID / VAT Registration"
            value={profile.taxId}
            onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
            placeholder="e.g. US-TAX-8839210"
          />

          <Input
            label="Formal Billing Address (printed on invoices)"
            value={profile.billingAddress}
            onChange={(e) => setProfile({ ...profile, billingAddress: e.target.value })}
            placeholder="Street address, Suite, City, Postal Code"
            required
          />

          <Button
            type="submit"
            variant="primary"
            icon={Save}
            style={{ marginTop: '0.5rem' }}
          >
            Save Profile Changes
          </Button>
        </form>
      </div>
    </div>
  );
}

export default CustomerProfile;

