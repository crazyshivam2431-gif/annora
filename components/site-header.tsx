'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(0);
  const previousNotifications = useRef(0);

  useEffect(() => {
    const syncUser = async () => {
      const response = await fetch('/api/auth');
      const result = await response.json();
      setUser(result.user);
      if (result.user) {
        const notificationResponse = await fetch('/api/notifications');
        const notificationResult = await notificationResponse.json();
        const unread = notificationResult.notifications?.filter((item: { read: boolean }) => !item.read).length ?? 0;
        setNotifications(unread);
        if (unread > previousNotifications.current && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('ANNORA rescue update', { body: 'A new update is waiting in your notification centre.' });
        }
        previousNotifications.current = unread;
        if (result.user.role === 'ngo' && 'Notification' in window && Notification.permission === 'default') {
          void Notification.requestPermission();
        }
      } else {
        setNotifications(0);
      }
    };

    void syncUser();
    const interval = window.setInterval(() => void syncUser(), 15000);
    window.addEventListener('storage', syncUser);
    window.addEventListener('notifications-updated', syncUser);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('notifications-updated', syncUser);
    };
  }, []);

  const handleOpenZeva = () => {
    window.dispatchEvent(new CustomEvent('open-zeva'));
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  };

  return (
    <header className="site-header wrap">
      <Link href="/" className="brand-wrap">
        <img className="brand-lockup" src="/brand/annora-logo-dark.svg?v=4" alt="ANNORA — Rescue Food, Nourish Lives" />
      </Link>

      <nav className="top-nav" aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/how-it-works">How It Works</Link>
        <Link href="/donate">Donate Food</Link>
        <Link href="/support">Find Support</Link>
        <Link href="/rescue">Track Deliveries</Link>
        <Link href="/impact">Impact</Link>
        <Link href="/about">About</Link>
      </nav>

      <div className="header-actions">
        <button type="button" className="ghost-btn" onClick={handleOpenZeva}>Ask ZEVA</button>
        {user ? (
          <>
            <Link href="/notifications" className="icon-button" aria-label="Notifications">
              <Bell size={16} />
              {notifications > 0 && <span className="notification-count">{notifications}</span>}
            </Link>
            <Link href="/profile" className="icon-button" aria-label="Profile">
              <UserCircle2 size={16} />
            </Link>
            <button type="button" className="secondary-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="secondary-btn" aria-label="Login">Login</Link>
            <Link href="/register" className="primary-btn" aria-label="Register">Register</Link>
          </>
        )}
      </div>
    </header>
  );
}
