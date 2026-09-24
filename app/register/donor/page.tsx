'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';

export default function DonorRegistrationPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', ...form, role: 'donor' }) });
      const result = await response.json();
      if (!response.ok || !result.user) {
        setError(result.error ?? 'Unable to create donor account.');
        setLoading(false);
        return;
      }
      router.push('/donate');
    } catch {
      setError('Unable to reach the ANNORA server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap portal-page">
        <div className="portal-hero compact"><div><p className="eyebrow">Donor onboarding</p><h1>Turn your surplus into someone&apos;s next meal.</h1><p className="portal-lead">Create your donor profile first. You will then go straight to the donation form.</p></div><div className="impact-note"><strong>Simple setup.</strong><span>Account details now, food details next.</span></div></div>
        <form onSubmit={submit} className="portal-form panel-card narrow-form">
          <div className="panel-heading"><div><p className="eyebrow">01 / Donor account</p><h2>Your contact details</h2></div><span className="live-badge">Quick setup</span></div>
          <div className="form-grid">
            <label>Full name<input value={form.name} onChange={(e) => update('name', e.target.value)} required /></label>
            <label>Mobile number<input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required /></label>
            <label>Email address<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></label>
            <label>City<input value={form.city} onChange={(e) => update('city', e.target.value)} required /></label>
            <label className="full-width">Create password<input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} minLength={6} required /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Creating donor account...' : 'Continue to donate food'}</button>
          <p className="form-note">Already registered? <Link href="/login">Login instead</Link></p>
        </form>
      </section>
    </main>
  );
}