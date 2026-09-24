import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNgoReview } from '@/components/admin-ngo-review';
import { SiteHeader } from '@/components/site-header';
import { getDashboardData, getUserBySession } from '@/lib/server-db';

export default async function AdminDashboardPage() {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) redirect('/login?error=auth_required');
  if (user.role !== 'admin') redirect('/?error=admin_only');
  const dashboard = getDashboardData(user);

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="dashboard-topbar"><div><p className="eyebrow">Admin dashboard</p><h1>Welcome, {user.name}</h1><p className="portal-lead">Operational overview from the protected ANNORA database.</p></div><span className="live-badge">Admin only</span></div>
        <div className="stats-grid">
          <div className="stat-box"><span>Total users</span><strong>{dashboard.stats.users}</strong></div>
          <div className="stat-box"><span>Pending NGO reviews</span><strong>{dashboard.stats.pendingNgo}</strong></div>
          <div className="stat-box"><span>Active donations</span><strong>{dashboard.stats.activeDonations}</strong></div>
        </div>
        <div className="panel-card access-state"><p className="eyebrow">Protected operations</p><h2>Admin controls are restricted to verified admin sessions.</h2><p>Verification, moderation, rescue monitoring, and reporting modules will be added in the next phase.</p></div>
        <div className="panel-card"><div className="panel-heading"><div><p className="eyebrow">NGO verification</p><h2>Review partner applications</h2></div><span className="live-badge">Admin only</span></div><AdminNgoReview /></div>
      </section>
    </main>
  );
}
