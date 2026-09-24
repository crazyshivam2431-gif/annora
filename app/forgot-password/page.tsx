import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';

export default function ForgotPasswordPage() {
  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="auth-card">
          <div className="auth-intro">
            <p className="eyebrow">Reset password</p>
            <h1>Recover access to ANNORA</h1>
          </div>

          <div className="info-card step-card">
            <p>Use your registered email address to receive instructions for resetting your password.</p>
          </div>

          <div className="auth-links">
            <Link href="/login">Back to login</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
