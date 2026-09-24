'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';

type DashboardResponse = { user: { name: string; role: string }; dashboard: { role: string; stats: { activeRequests: number; assigned: number; deliveries: number }; assignments: Array<{ id: string; food_name: string; quantity: number; unit: string; status: string; location: string; pickup_address: string; safe_until: string }>; notifications: Array<{ id: string; title: string; message: string }> } };

export default function DriverDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/dashboard', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || result.dashboard?.role !== 'driver') throw new Error(response.status === 401 ? 'Log in with a driver account to access this dashboard.' : 'This dashboard is only available to driver accounts.');
      setData(result);
    }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load the driver dashboard.')).finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        {loading ? <div className="empty-state">Loading your driver dashboard...</div> : error ? <div className="panel-card access-state"><h1>Driver dashboard</h1><p>{error}</p><Link href="/login" className="primary-btn">Login</Link></div> : data && <>
          <div className="dashboard-topbar"><div><p className="eyebrow">Driver dashboard</p><h1>Welcome, {data.user.name}</h1><p className="portal-lead">Your assigned rescue activity and pickup updates.</p></div><span className="live-badge">Live account data</span></div>
          <div className="stats-grid">
            <div className="stat-box"><span>Available requests</span><strong>{data.dashboard.stats.activeRequests}</strong></div>
            <div className="stat-box"><span>Assigned pickups</span><strong>{data.dashboard.stats.assigned}</strong></div>
            <div className="stat-box"><span>Completed deliveries</span><strong>{data.dashboard.stats.deliveries}</strong></div>
          </div>
          <div className="two-column-grid">
            <div className="panel-card"><div className="panel-heading"><div><p className="eyebrow">Assignments</p><h2>Your pickup activity</h2></div></div>{data.dashboard.assignments.length === 0 ? <p className="empty-state">No assigned pickups yet.</p> : <ul className="list-stack">{data.dashboard.assignments.slice(0, 8).map((item) => <li key={item.id} className="list-item"><div><strong>{item.food_name}</strong><small>{item.quantity} {item.unit} · {item.location} · {item.status}</small></div><Link href={`/donations/${item.id}`}>Open</Link></li>)}</ul>}</div>
            <div className="panel-card"><div className="panel-heading"><div><p className="eyebrow">Notifications</p><h2>Driver updates</h2></div></div>{data.dashboard.notifications.length === 0 ? <p className="empty-state">No pickup updates yet.</p> : <ul className="list-stack">{data.dashboard.notifications.slice(0, 8).map((item) => <li key={item.id} className="list-item"><div><strong>{item.title}</strong><small>{item.message}</small></div></li>)}</ul>}</div>
          </div>
        </>}
      </section>
    </main>
  );
}
