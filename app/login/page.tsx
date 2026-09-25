'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';

const demoAccounts = [
  { label: 'Admin', email: 'admin@annora.in' },
  { label: 'Donor', email: 'donor@demo.annora.in' },
  { label: 'NGO', email: 'ngo@demo.annora.in' },
  { label: 'Driver', email: 'driver@demo.annora.in' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@annora.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', email, password }) });
      const result = await response.json();
      if (!response.ok || !result.user) {
        setError(result.error ?? 'Invalid email or password.');
        setLoading(false);
        return;
      }
      const user = result.user;

      if (user.role === 'donor') {
        router.push('/dashboard/donor');
      } else if (user.role === 'ngo') {
        router.push('/dashboard/ngo');
      } else if (user.role === 'driver') {
        router.push('/dashboard/driver');
      } else if (user.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/onboarding');
      }
      setLoading(false);
    } catch {
      setError('Unable to reach the ANNORA server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="auth-card">
          <div className="auth-intro">
            <p className="eyebrow">Welcome back</p>
            <h1>Login to ANNORA</h1>
            <p>Access your role-based dashboard and rescue operations.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="demo-panel">
              <strong>Demo mode</strong>
              <span>Demo users: <b>demo123</b> · Admin: <b>admin123</b></span>
              <div className="demo-account-list">
                {demoAccounts.map((account) => (
                  <button key={account.email} type="button" onClick={() => { setEmail(account.email); setPassword(account.label === 'Admin' ? 'admin123' : 'demo123'); }}>
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label>
              Password
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="primary-btn full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="auth-links">
              <Link href="/forgot-password">Forgot password</Link>
              <Link href="/register">Create account</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
