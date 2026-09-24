'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    void fetch('/api/auth').then((response) => response.json()).then((result) => setUser(result.user));
  }, []);

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap">
        <div className="auth-card">
          <div className="auth-intro">
            <p className="eyebrow">Profile</p>
            <h1>{user?.name ?? 'Your profile'}</h1>
          </div>

          <div className="list-stack">
            <div className="panel-card list-item">
              <div>
                <strong>Email</strong>
                <small>{user?.email ?? 'Not available'}</small>
              </div>
            </div>
            <div className="panel-card list-item">
              <div>
                <strong>Role</strong>
                <small>{user?.role ?? 'user'}</small>
              </div>
            </div>
            <div className="panel-card list-item">
              <div>
                <strong>City</strong>
                <small>{user?.city ?? 'Not specified'}</small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
