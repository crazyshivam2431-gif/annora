'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';

type DashboardResponse = { user: { name: string; role: string }; dashboard: { role: string; ngo?: { name: string; availability: string; verification_status: string }; stats: { currentCapacity: number; maxCapacity: number; incoming: number; received: number }; notifications: Array<{ id: string; title: string; message: string }> } };

export default function NgoDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/dashboard', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || result.dashboard?.role !== 'ngo') throw new Error(response.status === 401 ? 'Log in with an NGO account to access this dashboard.' : 'This dashboard is only available to NGO accounts.');
      setData(result);
    }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load the NGO dashboard.')).finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        {loading ? <div className="empty-state">Loading your NGO dashboard...</div> : error ? <div className="panel-card access-state"><h1>NGO dashboard</h1><p>{error}</p><Link href="/login" className="primary-btn">Login</Link></div> : data && <>
          <div className="dashboard-topbar"><div><p className="eyebrow">NGO dashboard</p><h1>Welcome, {data.user.name}</h1><p className="portal-lead">{data.dashboard.ngo?.name ?? 'Your organisation'} · {data.dashboard.ngo?.verification_status ?? 'PENDING'}</p></div><span className="live-badge">{data.dashboard.ngo?.availability ?? 'AVAILABLE'}</span></div>
          <div className="stats-grid">
            <div className="stat-box"><span>Current capacity</span><strong>{data.dashboard.stats.currentCapacity} / {data.dashboard.stats.maxCapacity}</strong></div>
            <div className="stat-box"><span>Incoming donations</span><strong>{data.dashboard.stats.incoming}</strong></div>
            <div className="stat-box"><span>Meals received</span><strong>{data.dashboard.stats.received}</strong></div>
          </div>
          <div className="panel-card"><div className="panel-heading"><div><p className="eyebrow">Notifications</p><h2>Recent updates</h2></div><span className="live-badge">Live account data</span></div>{data.dashboard.notifications.length === 0 ? <p className="empty-state">No recent updates for your organisation.</p> : <ul className="list-stack">{data.dashboard.notifications.slice(0, 8).map((item) => <li key={item.id} className="list-item"><div><strong>{item.title}</strong><small>{item.message}</small></div></li>)}</ul>}</div>
        </>}
      </section>
    </main>
  );
}
