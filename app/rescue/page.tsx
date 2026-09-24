'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock3, MapPinned, ShieldCheck } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { LiveRescueMap } from '@/components/live-rescue-map';

type RouteItem = { id: string; food_name?: string; quantity?: number; unit?: string; status?: string; location?: string };

export default function RescuePage() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  useEffect(() => { void fetch('/api/rescue').then((response) => response.json()).then((result) => setRoutes(result.donations ?? [])); }, []);

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap rescue-page">
        <div className="rescue-hero">
          <div className="rescue-hero-copy"><p className="eyebrow">Track deliveries</p><h1>See food moving through the network.</h1><p className="portal-lead">Follow active food deliveries and available community locations from ANNORA&apos;s live network.</p></div>
          <div className="rescue-hero-status"><span className="live-badge"><span className="live-dot" /> Live network</span><strong>{routes.length} active records</strong><small>Updated from the rescue API</small></div>
        </div>
        <div className="rescue-signal-row">
          <div><Activity size={17} /><span>Network status<strong>{routes.length ? 'Active' : 'Standing by'}</strong></span></div>
          <div><MapPinned size={17} /><span>Coverage<strong>Privacy-safe zones</strong></span></div>
          <div><Clock3 size={17} /><span>Refresh<strong>Live API updates</strong></span></div>
          <div><ShieldCheck size={17} /><span>Access<strong>Protected records</strong></span></div>
        </div>
        <LiveRescueMap />
        <div className="rescue-route-list">
          <div className="panel-heading"><div><p className="eyebrow">Active records</p><h2>Current rescue activity</h2></div><span className="live-badge">Live data</span></div>
          {routes.length === 0 ? <p className="empty-state">No active rescue records are available yet.</p> : routes.map((route) => <div key={route.id} className="rescue-route-row"><div><strong>{route.food_name ?? 'Food donation'}</strong><small>{route.quantity} {route.unit} · {route.location ?? 'Local area'}</small></div><span className="status-pill success">{route.status ?? 'POSTED'}</span></div>)}
        </div>
      </section>
    </main>
  );
}
