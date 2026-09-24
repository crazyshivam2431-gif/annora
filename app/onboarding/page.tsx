import { SiteHeader } from '@/components/site-header';

export default function OnboardingPage() {
  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="auth-card">
          <div className="auth-intro">
            <p className="eyebrow">Welcome</p>
            <h1>Set up your ANNORA profile.</h1>
          </div>

          <div className="info-card step-card">
            <p>Your role-based onboarding is ready. Complete your profile details to begin matching food rescue requests.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
