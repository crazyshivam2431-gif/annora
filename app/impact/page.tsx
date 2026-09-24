'use client';

import { SiteHeader } from '@/components/site-header';
import { useEffect, useState } from 'react';

export default function ImpactPage() {
  const [stats, setStats] = useState([
    { label: 'Meals rescued', value: '0' },
    { label: 'Food diverted', value: '0 kg' },
    { label: 'Shelters served', value: '0' },
    { label: 'Deliveries completed', value: '0' },
  ]);

  useEffect(() => {
    void fetch('/api/impact').then((response) => response.json()).then((result) => {
      if (!result.stats) return;
      setStats([
        { label: 'Meals rescued', value: String(result.stats.mealsRescued) },
        { label: 'Food diverted', value: `${result.stats.foodDiverted} kg` },
        { label: 'Shelters served', value: String(result.stats.sheltersServed) },
        { label: 'Deliveries completed', value: String(result.stats.deliveriesCompleted) },
      ]);
    }).catch(() => undefined);
  }, []);

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="section-heading">
          <p className="eyebrow">Impact</p>
          <h1>See the collective impact of ANNORA.</h1>
        </div>

        <div className="stats-grid">
          {stats.map((item) => (
            <div key={item.label} className="stat-box">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
