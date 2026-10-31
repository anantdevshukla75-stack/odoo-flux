import React, { useState, useEffect } from 'react';
import { Building, Save, CheckCircle2, User, Mail, Phone, MapPin, Hash, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { useAuth } from '../../context/useAuth.js';
import { apiService } from '../../services/apiService.js';

const EMPTY_PROFILE = {
  id: null,
  fullName: '',
  email: '',
  companyName: '',
  phone: '',
  taxId: '',
  billingAddress: ''
};

export function CustomerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    ...EMPTY_PROFILE,
    fullName: user?.fullName || '',
    email: user?.email || ''
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCust() {
      try {
        const cust = await apiService.getMyCustomer();
        if (!cancelled && cust) {
          setProfile({
            id: cust.id,
            fullName: cust.fullName || '',
            email: cust.email || '',
            companyName: cust.companyName || '',
            phone: cust.phone || '',
            taxId: cust.taxId || '',
            billingAddress: cust.billingAddress || ''
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Could not load your customer profile.');
        }
      }
    }

    loadCust();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!profile.id) {
      setError('Your customer profile is still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);

    try {
      const updated = await apiService.updateCustomer(profile.id, {
        companyName: profile.companyName,
        phone: profile.phone,
        taxId: profile.taxId,
        billingAddress: profile.billingAddress
      });

      setProfile((prev) => ({ ...prev, ...updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err?.message || 'Could not save your profile changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Organization & Invoicing Profile"
        description="Maintain statutory corporate details, VAT/Tax registration IDs, and default invoice remittance address."
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profile changes saved. Future invoices will reflect these corporate details.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity & Company Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-xl">
              {profile.companyName ? profile.companyName.charAt(0) : (profile.fullName.charAt(0) || 'A')}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{profile.companyName}</h2>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Verified Business Account (ID: <code>{profile.id ?? '—'}</code>)</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Primary Contact Full Name"
              value={profile.fullName}
              helperText="Managed on your login account; contact support to change it."
              disabled
            />

            <Input
              label="Primary Account Email"
              type="email"
              value={profile.email}
              disabled
              helperText="Managed via company account administrator"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Legal Company / Entity Name"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              placeholder="e.g. Acme Technologies Inc."
              required
            />

            <Input
              label="Direct Contact Phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Corporate Tax ID / VAT Number"
              value={profile.taxId}
              onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
              placeholder="e.g. US-TAX-8839210 or EU-99238411"
              helperText="Printed on formal tax receipts & invoices"
            />

            <Input
              label="Country / Jurisdiction"
              value="United States (California)"
              disabled
              helperText="Tax jurisdiction based on corporate headquarters"
            />
          </div>

          <Input
            label="Formal Billing & Mailing Address"
            value={profile.billingAddress}
            onChange={(e) => setProfile({ ...profile, billingAddress: e.target.value })}
            placeholder="Street Address, Suite, City, State, Postal Code"
            helperText="Address printed on official PDF tax invoices"
            required
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Company, contact, and billing changes apply immediately.
            </span>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              loading={loading}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerProfile;
