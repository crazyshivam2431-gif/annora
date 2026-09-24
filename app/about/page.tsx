import { SiteHeader } from '@/components/site-header';

export default function AboutPage() {
  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="section-heading">
          <p className="eyebrow">About ANNORA</p>
          <h1>Built to make food rescue more visible, trusted, and impactful.</h1>
        </div>

        <div className="info-card step-card">
          <p>
            ANNORA is a coordinated food rescue platform that connects surplus food donors with verified shelters and drivers.
            It helps reduce waste, strengthen response times, and track measurable impact for communities that need support.
          </p>
        </div>
      </section>
    </main>
  );
}
