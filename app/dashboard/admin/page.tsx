import Link from 'next/link';
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
  const pendingNgo = Math.max(dashboard.stats.pendingNgo, 0);
  const activeDonations = Math.max(dashboard.stats.activeDonations, 0);
  const priorityItems = [
    { title: 'Review NGO applications', description: `${pendingNgo} partner applications are queued for approval.`, href: '#ngo-verification', badge: pendingNgo > 0 ? 'Action required' : 'Clear' },
    { title: 'Monitor rescues', description: `${activeDonations} active food rescues need operational attention.`, href: '/rescue', badge: 'Live feed' },
    { title: 'Check notifications', description: 'Review updates, status changes, and urgent rescues.', href: '/notifications', badge: `${dashboard.notifications.length} recent` },
  ];

  return (
    <main className="page-shell admin-dashboard-page">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="dashboard-topbar">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1>Welcome, {user.name}</h1>
            <p className="portal-lead">Operational overview for the ANNORA network, verified partners, and live rescue flow.</p>
          </div>
          <span className="live-badge">Admin only</span>
        </div>

        <div className="stats-grid admin-stats-grid">
          <div className="stat-box">
            <span>Total users</span>
            <strong>{dashboard.stats.users}</strong>
          </div>
          <div className="stat-box">
            <span>Pending NGO reviews</span>
            <strong>{pendingNgo}</strong>
          </div>
          <div className="stat-box">
            <span>Active donations</span>
            <strong>{activeDonations}</strong>
          </div>
          <div className="stat-box admin-highlight-box">
            <span>Network health</span>
            <strong>{pendingNgo === 0 ? 'Stable' : 'Needs review'}</strong>
          </div>
        </div>

        <div className="admin-two-column-grid">
          <div className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Operations panel</p>
                <h2>Priority actions</h2>
              </div>
              <Link href="/rescue" className="text-link-button">Open live map</Link>
            </div>

            <div className="admin-priority-list">
              {priorityItems.map((item) => (
                <Link key={item.title} href={item.href} className="admin-priority-item">
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </div>
                  <span>{item.badge}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Alerts</p>
                <h2>Recent activity</h2>
              </div>
              <span className="live-badge">Fresh</span>
            </div>

            {dashboard.notifications.length === 0 ? (
              <p className="empty-state">No recent admin alerts. The network is quiet.</p>
            ) : (
              <ul className="list-stack admin-alerts-list">
                {dashboard.notifications.slice(0, 5).map((notification) => (
                  <li key={notification.id} className="list-item admin-alert-item">
                    <div>
                      <strong>{notification.title}</strong>
                      <small>{notification.message}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div id="ngo-verification" className="panel-card admin-queue-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NGO verification</p>
              <h2>Review partner applications</h2>
            </div>
            <span className="live-badge">Admin only</span>
          </div>
          <AdminNgoReview />
        </div>
      </section>
    </main>
  );
}
