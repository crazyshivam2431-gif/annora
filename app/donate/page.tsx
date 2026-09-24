'use client';

import { FormEvent, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { useRouter } from 'next/navigation';

export default function DonatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    foodName: '',
    category: '',
    quantity: '',
    unit: '',
    foodType: 'Vegetarian',
    preparationTime: '',
    safeUntil: '',
    pickupTime: '',
    pickupAddress: '',
    location: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/donations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, quantity: Number(form.quantity) || 0 }) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) router.push('/login');
        return;
      }
      if (result.donationId) router.push('/dashboard/donor');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="auth-card large">
          <div className="auth-intro">
            <p className="eyebrow">Donate food</p>
            <h1>List your surplus and help rescue it.</h1>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-grid">
              <label>
                Food name
                <input value={form.foodName} onChange={(e) => handleChange('foodName', e.target.value)} required />
              </label>
              <label>
                Category
                <input value={form.category} onChange={(e) => handleChange('category', e.target.value)} required />
              </label>
              <label>
                Quantity
                <input value={form.quantity} onChange={(e) => handleChange('quantity', e.target.value)} required />
              </label>
              <label>
                Unit
                <input value={form.unit} onChange={(e) => handleChange('unit', e.target.value)} required />
              </label>
              <label>
                Food type
                <select value={form.foodType} onChange={(e) => handleChange('foodType', e.target.value)}>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                </select>
              </label>
              <label>
                City
                <input value={form.location} onChange={(e) => handleChange('location', e.target.value)} required />
              </label>
              <label>
                Preparation time
                <input type="time" value={form.preparationTime} onChange={(e) => handleChange('preparationTime', e.target.value)} required />
              </label>
              <label>
                Safe until
                <input type="time" value={form.safeUntil} onChange={(e) => handleChange('safeUntil', e.target.value)} required />
              </label>
              <label>
                Pickup time
                <input type="time" value={form.pickupTime} onChange={(e) => handleChange('pickupTime', e.target.value)} required />
              </label>
              <label className="full-width">
                Pickup address
                <input value={form.pickupAddress} onChange={(e) => handleChange('pickupAddress', e.target.value)} required />
              </label>
              <label className="full-width">
                Description
                <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={4} required />
              </label>
            </div>

            <button type="submit" className="primary-btn full" disabled={saving}>
              {saving ? 'Posting donation...' : 'Post donation'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
