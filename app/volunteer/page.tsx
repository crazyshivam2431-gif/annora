'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';

export default function VolunteerPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', city: '', availability: 'Evenings and weekends' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const sessionResponse = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', name: form.name, phone: form.phone, email: form.email, password: form.password, city: form.city, role: 'driver' }) });
      const session = await sessionResponse.json();
      if (!sessionResponse.ok || !session.user) throw new Error(session.error ?? 'Unable to create your driver account.');
      const response = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'volunteer', name: form.name, phone: form.phone, email: form.email, city: form.city, availability: form.availability }) });
      if (!response.ok) throw new Error('Account created, but the volunteer application could not be saved.');
      setSubmitted(true);
      router.push('/dashboard/driver');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit your application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap portal-page">
        <div className="portal-hero compact">
          <div><p className="eyebrow">Driver / volunteer network</p><h1>Move good food closer to the people who need it.</h1><p className="portal-lead">Create a driver account, share your availability, and join practical pickup and delivery routes.</p></div>
          <div className="impact-note"><strong>Every route matters.</strong><span>Pickup, delivery, and community coordination all count.</span></div>
        </div>
        <form onSubmit={submit} className="portal-form panel-card narrow-form">
          <div className="panel-heading"><div><p className="eyebrow">Join the network</p><h2>Volunteer application</h2></div><span className="live-badge">Open enrolment</span></div>
          <div className="form-grid">
            <label>Full name<input value={form.name} onChange={(e) => update('name', e.target.value)} required /></label>
            <label>Mobile number<input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required /></label>
            <label>Email address<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></label>
            <label>City<input value={form.city} onChange={(e) => update('city', e.target.value)} required /></label>
            <label className="full-width">Create password<input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} minLength={6} required /></label>
            <label className="full-width">Availability<select value={form.availability} onChange={(e) => update('availability', e.target.value)}><option>Weekday mornings</option><option>Evenings and weekends</option><option>Flexible schedule</option></select></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          {submitted && <div className="success-message">Driver account created. Opening your dashboard...</div>}
          <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Creating driver account...' : 'Create driver account'}</button>
        </form>
      </section>
    </main>
  );
}
