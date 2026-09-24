'use client';

import { ArrowUpRight, HeartHandshake, Map, ShieldCheck, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CinematicIntro } from '@/components/cinematic-intro';
import { SiteHeader } from '@/components/site-header';

type ImpactStats = {
  mealsRescued: number;
  foodDiverted: number;
  sheltersServed: number;
  deliveriesCompleted: number;
};

const destinations = [
  { eyebrow: '01 / Contribute', title: 'Donate surplus food', text: 'Post a rescue request with the details that matter.', href: '/donate', icon: HeartHandshake, tone: 'coral' },
  { eyebrow: '02 / Discover', title: 'Find support', text: 'Explore support options and verified community partners.', href: '/support', icon: Users, tone: 'mint' },
  { eyebrow: '03 / Observe', title: 'Track deliveries', text: 'Follow active food deliveries and verified locations in real time.', href: '/rescue', icon: Map, tone: 'gold' },
] as const;

export default function Home() {
  const [stats, setStats] = useState<ImpactStats>({ mealsRescued: 0, foodDiverted: 0, sheltersServed: 0, deliveriesCompleted: 0 });

  useEffect(() => {
    void fetch('/api/impact')
      .then((response) => response.json())
      .then((result) => {
        if (result.stats) setStats(result.stats);
      })
      .catch(() => undefined);
  }, []);

  return (
    <main className="page-shell home-page">
      <CinematicIntro />
      <SiteHeader />

      <section className="home-hero wrap">
        <div className="home-hero-copy">
          <div className="home-kicker"><span /> Food rescue, made human</div>
          <h1>Good food should have <em>somewhere to go.</em></h1>
          <p>ANNORA brings surplus food, verified organisations, and local volunteers into one calm, coordinated network.</p>
          <div className="home-actions">
            <Link href="/donate" className="primary-btn large">Start a rescue <ArrowUpRight size={17} /></Link>
            <Link href="/how-it-works" className="text-link-button">See how it works <span>↗</span></Link>
          </div>
          <div className="home-trust-line"><ShieldCheck size={16} /> Verified coordination <span /> No invented impact numbers <span /> Built for local action</div>
        </div>

        <div className="home-signal-panel" aria-label="ANNORA live signal">
          <div className="signal-orbit orbit-one" />
          <div className="signal-orbit orbit-two" />
          <div className="signal-core"><Sparkles size={26} /></div>
          <div className="signal-label signal-label-top"><span className="signal-dot live" /> Network status<strong>Ready for the next rescue</strong></div>
          <div className="signal-label signal-label-bottom"><span className="signal-dot" /> Live records<strong>{stats.deliveriesCompleted} completed deliveries</strong></div>
        </div>
      </section>

      <section className="home-impact wrap" aria-label="Live impact">
        <div><span>Current network signal</span><strong>{stats.mealsRescued}</strong><small>meals rescued</small></div>
        <div><span>Food diverted</span><strong>{stats.foodDiverted} kg</strong><small>from completed rescues</small></div>
        <div><span>Community partners</span><strong>{stats.sheltersServed}</strong><small>verified shelters served</small></div>
        <Link href="/impact" className="impact-link">View full impact <ArrowUpRight size={16} /></Link>
      </section>

      <section className="home-destinations wrap">
        <div className="home-section-heading"><span>Choose your next move</span><h2>One network. Clear next steps.</h2></div>
        <div className="destination-grid">
          {destinations.map((destination) => {
            const Icon = destination.icon;
            return <Link href={destination.href} key={destination.title} className={`destination-card ${destination.tone}`}>
              <div className="destination-icon"><Icon size={19} /></div>
              <span className="destination-eyebrow">{destination.eyebrow}</span>
              <h3>{destination.title}</h3>
              <p>{destination.text}</p>
              <span className="destination-arrow"><ArrowUpRight size={18} /></span>
            </Link>;
          })}
        </div>
      </section>

      <section className="home-footer-band wrap">
        <div><span className="home-kicker"><span /> Built around trust</span><h2>Move food with more care, clarity, and purpose.</h2></div>
        <Link href="/register" className="secondary-btn">Join ANNORA <ArrowUpRight size={16} /></Link>
      </section>
    </main>
  );
}
