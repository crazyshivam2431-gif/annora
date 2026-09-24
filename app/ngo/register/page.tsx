'use client';

import { FormEvent, useState } from 'react';
import { SiteHeader } from '@/components/site-header';

export default function NgoRegisterPage() {
  const [form, setForm] = useState({ name: '', registrationNumber: '', description: '', authorizedPerson: '', phone: '', email: '', password: '', address: '', city: '', state: '', pincode: '', latitude: '', longitude: '', maxCapacity: '', currentCapacity: '', dailyMealRequirement: '', foodPreferences: '', operatingHours: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      let sessionResponse = await fetch('/api/auth');
      let session = await sessionResponse.json();
      if (!session.user) {
        sessionResponse = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'register', name: form.authorizedPerson, email: form.email, password: form.password, role: 'ngo', city: form.city, phone: form.phone }) });
        session = await sessionResponse.json();
      }
      if (!sessionResponse.ok || !session.user || session.user.role !== 'ngo') {
        setError(session.error ?? 'Create or use an NGO account to submit this profile.');
        return;
      }
      const response = await fetch('/api/ngos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, foodPreferences: form.foodPreferences.split(',').map((item) => item.trim()) }) });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Unable to submit the NGO profile.');
        return;
      }
      setSubmitted(Boolean(result.ngoId));
    } catch {
      setError('Unable to reach the ANNORA server. Please try again.');
    }
  };

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap portal-page">
        <div className="portal-hero compact"><div><p className="eyebrow">Verified partner onboarding</p><h1>Register your NGO or community shelter.</h1><p className="portal-lead">Build a trusted profile, share your capacity, and receive better-matched food donations.</p></div><div className="impact-note"><strong>Verification first.</strong><span>Every NGO profile is reviewed before matching begins.</span></div></div>
        <form onSubmit={submit} className="portal-form panel-card">
          <div className="panel-heading"><div><p className="eyebrow">NGO registration</p><h2>Organisation profile</h2></div><span className="live-badge">Review required</span></div>
          <div className="form-grid">
            <label>Organisation name<input value={form.name} onChange={(e) => update('name', e.target.value)} required /></label>
            <label>Registration number<input value={form.registrationNumber} onChange={(e) => update('registrationNumber', e.target.value)} required /></label>
            <label>Authorised person<input value={form.authorizedPerson} onChange={(e) => update('authorizedPerson', e.target.value)} required /></label>
            <label>Contact phone<input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required /></label>
            <label>Email address<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></label>
            <label>Account password<input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} minLength={6} required /></label>
            <label>City<input value={form.city} onChange={(e) => update('city', e.target.value)} required /></label>
            <label className="full-width">Address<input value={form.address} onChange={(e) => update('address', e.target.value)} required /></label>
            <label className="full-width">About your organisation<textarea rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} required /></label>
            <label>Maximum meal capacity<input type="number" value={form.maxCapacity} onChange={(e) => update('maxCapacity', e.target.value)} required /></label>
            <label>Daily meal requirement<input type="number" value={form.dailyMealRequirement} onChange={(e) => update('dailyMealRequirement', e.target.value)} required /></label>
            <label className="full-width">Food preferences<input value={form.foodPreferences} onChange={(e) => update('foodPreferences', e.target.value)} required /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          {submitted && <div className="success-message">Your NGO profile has been submitted for verification. We will contact you at {form.email}.</div>}
          <button type="submit" className="primary-btn">Submit NGO for verification</button>
        </form>
      </section>
    </main>
  );
}
