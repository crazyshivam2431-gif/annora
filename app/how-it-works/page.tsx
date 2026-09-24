import { SiteHeader } from '@/components/site-header';

const steps = [
  { title: '1. Post a donation', text: 'Donors share food type, quantity, pickup timing, and location within minutes.' },
  { title: '2. Match with verified demand', text: 'ANNORA checks nearby shelters, capacity, urgency, and food suitability.' },
  { title: '3. Assign a driver', text: 'Volunteer drivers receive rescue pickups and delivery instructions with safe-window guidance.' },
  { title: '4. Track impact', text: 'Every completed trip is measured as meals rescued and food diverted from waste.' },
];

export default function HowItWorksPage() {
  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="section-heading">
          <p className="eyebrow">How ANNORA works</p>
          <h1>Real coordination for food rescue.</h1>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.title} className="info-card step-card">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
