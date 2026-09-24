'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { SiteHeader } from '@/components/site-header';

const supportTypes = ['Emergency food support', 'Shelter / NGO support', 'Pickup or delivery help', 'Partnership enquiry'];

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', requestType: supportTypes[0], message: '' });
  const [submitted, setSubmitted] = useState(false);
  const handleChange = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'support', ...form }) });
    if (response.ok) {
      setSubmitted(true);
      setForm((current) => ({ ...current, message: '' }));
    }
  };

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap portal-page">
        <div className="portal-hero">
          <div><p className="eyebrow">ANNORA support desk</p><h1>Find the right support, without the runaround.</h1><p className="portal-lead">Tell us what you need and our rescue network will route it to the right team.</p></div>
          <div className="contact-card"><span>Direct contact</span><span>Submit the form and our team will respond through your preferred contact details.</span></div>
        </div>
        <div className="portal-grid">
          <form onSubmit={handleSubmit} className="portal-form panel-card">
            <div className="panel-heading"><div><p className="eyebrow">Request help</p><h2>Start a support request</h2></div><span className="live-badge">Network online</span></div>
            <div className="form-grid">
              <label>Full name<input value={form.name} onChange={(e) => handleChange('name', e.target.value)} required /></label>
              <label>Mobile number<input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} required /></label>
              <label className="full-width">Email address<input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required /></label>
              <label className="full-width">What do you need?<select value={form.requestType} onChange={(e) => handleChange('requestType', e.target.value)}>{supportTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="full-width">Tell us more<textarea rows={5} value={form.message} onChange={(e) => handleChange('message', e.target.value)} placeholder="Share location, quantity, urgency, or any other useful context." required /></label>
            </div>
            {submitted && <div className="success-message">Request received. Our team will contact you using the details provided.</div>}
            <button type="submit" className="primary-btn">Send support request</button>
          </form>
          <aside className="portal-side">
            <div className="side-card"><span className="side-index">01</span><h3>Need food urgently?</h3><p>Share your location and meal requirement so verified partners can respond quickly.</p></div>
            <div className="side-card"><span className="side-index">02</span><h3>Want to help instead?</h3><p>Join the driver and volunteer network to move food where it matters.</p><Link href="/volunteer" className="text-link">Become a volunteer</Link></div>
            <div className="side-card"><span className="side-index">03</span><h3>Represent an NGO?</h3><p>Create a verified shelter profile and receive matched donations.</p><Link href="/ngo/register" className="text-link">Register your NGO</Link></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
