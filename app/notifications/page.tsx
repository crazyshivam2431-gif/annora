'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      const result = await response.json();
      if (!active) return;
      setAuthRequired(response.status === 401);
      setItems(result.notifications ?? []);
      setLoading(false);
    };

    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const markAllAsRead = async () => {
    setMarkingRead(true);
    await fetch('/api/notifications', { method: 'PATCH' });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    window.dispatchEvent(new Event('notifications-updated'));
    setMarkingRead(false);
  };

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="section-heading">
          <p className="eyebrow">Notifications</p>
          <h1>Updates from your rescue network.</h1>
        </div>

        <div className="list-stack">
          {loading ? <div className="empty-state">Loading live updates...</div> : authRequired ? <div className="empty-state">Log in to see updates from your rescue network.</div> : items.length === 0 ? (
            <div className="empty-state">No notifications yet. New rescue updates will appear here automatically.</div>
          ) : (
            <>
              <div className="notification-toolbar"><span>Live updates refresh automatically.</span><button type="button" className="secondary-btn" onClick={markAllAsRead} disabled={markingRead}>Mark all as read</button></div>
              {items.map((item) => (
              <div key={item.id} className={`panel-card list-item ${item.read ? '' : 'is-unread'}`}>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.message}</small>
                </div>
              </div>
              ))}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
