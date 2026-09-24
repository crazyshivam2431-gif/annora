'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';

type DashboardResponse = { user: { name: string; role: string }; dashboard: { role: string; stats: { active: number; completed: number; meals: number; diverted: number }; donations: Array<{ id: string; foodName: string; quantity: number; unit: string; status: string; location: string }>; notifications: Array<{ id: string; title: string; message: string }> } };

export default function DonorDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/dashboard', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json();
      if (!response.ok || result.dashboard?.role !== 'donor') throw new Error(response.status === 401 ? 'Log in with a donor account to access this dashboard.' : 'This dashboard is only available to donor accounts.');
      setData(result);
    }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load the donor dashboard.')).finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        {loading ? <div className="empty-state">Loading your donor dashboard...</div> : error ? <div className="panel-card access-state"><h1>Donor dashboard</h1><p>{error}</p><Link href="/login" className="primary-btn">Login</Link></div> : data && <>
          <div className="dashboard-topbar"><div><p className="eyebrow">Donor dashboard</p><h1>Welcome, {data.user.name}</h1><p className="portal-lead">Your donations and verified rescue updates.</p></div><Link href="/donate" className="primary-btn">Create donation</Link></div>
          <div className="stats-grid"><div className="stat-box"><span>Active donations</span><strong>{data.dashboard.stats.active}</strong></div><div className="stat-box"><span>Completed donations</span><strong>{data.dashboard.stats.completed}</strong></div><div className="stat-box"><span>Meals rescued</span><strong>{data.dashboard.stats.meals}</strong></div><div className="stat-box"><span>Food diverted</span><strong>{data.dashboard.stats.diverted} kg</strong></div></div>
          <div className="two-column-grid"><div className="panel-card"><div className="panel-heading"><div><p className="eyebrow">Donation history</p><h2>Your recent donations</h2></div></div>{data.dashboard.donations.length === 0 ? <p className="empty-state">You haven’t created any donations yet.</p> : <ul className="list-stack">{data.dashboard.donations.slice(0, 8).map((donation) => <li key={donation.id} className="list-item"><div><strong>{donation.foodName}</strong><small>{donation.quantity} {donation.unit} · {donation.status} · {donation.location}</small></div><Link href={`/donations/${donation.id}`}>View</Link></li>)}</ul>}</div><div className="panel-card"><div className="panel-heading"><div><p className="eyebrow">Notifications</p><h2>Rescue updates</h2></div></div>{data.dashboard.notifications.length === 0 ? <p className="empty-state">No notifications right now.</p> : <ul className="list-stack">{data.dashboard.notifications.slice(0, 8).map((item) => <li key={item.id} className="list-item"><div><strong>{item.title}</strong><small>{item.message}</small></div></li>)}</ul>}</div></div>
        </>}
      </section>
    </main>
  );
}
