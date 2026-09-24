'use client';

import { useEffect, useState } from 'react';

type Ngo = { id: string; name: string; registration_number: string; city: string; verification_status: string; max_capacity: number; current_capacity: number; created_at: string };

export function AdminNgoReview() {
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    const response = await fetch('/api/admin/ngos', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? 'Unable to load NGO reviews.');
    else setNgos(result.ngos ?? []);
  };

  useEffect(() => { void load(); }, []);

  const update = async (ngoId: string, status: string) => {
    setBusy(`${ngoId}:${status}`);
    setError('');
    const response = await fetch('/api/admin/ngos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ngoId, status }) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? 'Unable to update NGO verification.');
    else setNgos((current) => current.map((ngo) => ngo.id === ngoId ? { ...ngo, verification_status: status } : ngo));
    setBusy('');
  };

  return <div className="admin-review-list">
    {error && <p className="form-error">{error}</p>}
    {ngos.length === 0 ? <p className="empty-state">No NGO verification records yet.</p> : ngos.map((ngo) => <article key={ngo.id} className="admin-review-card">
      <div><span className="eyebrow">{ngo.city} · {ngo.registration_number}</span><h3>{ngo.name}</h3><p>{ngo.current_capacity} / {ngo.max_capacity} meals capacity · {ngo.verification_status}</p></div>
      <div className="admin-review-actions">
        <button type="button" className="ghost-btn" onClick={() => update(ngo.id, 'UNDER_REVIEW')} disabled={busy.startsWith(ngo.id)}>Review</button>
        <button type="button" className="primary-btn" onClick={() => update(ngo.id, 'APPROVED')} disabled={busy.startsWith(ngo.id)}>Approve</button>
        <button type="button" className="secondary-btn" onClick={() => update(ngo.id, 'CHANGES_REQUESTED')} disabled={busy.startsWith(ngo.id)}>Request changes</button>
        <button type="button" className="danger-btn" onClick={() => update(ngo.id, 'REJECTED')} disabled={busy.startsWith(ngo.id)}>Reject</button>
      </div>
    </article>)}
  </div>;
}
