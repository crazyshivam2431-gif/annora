'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DonationStatus } from '@/lib/server-db';

type Props = { donationId: string; status: DonationStatus; role: string; userId: string; driverId?: string };

const nextStatus: Partial<Record<DonationStatus, DonationStatus>> = {
  DRIVER_ASSIGNED: 'EN_ROUTE_TO_PICKUP',
  EN_ROUTE_TO_PICKUP: 'ARRIVED_AT_PICKUP',
  ARRIVED_AT_PICKUP: 'PICKED_UP',
  PICKED_UP: 'EN_ROUTE_TO_NGO',
  EN_ROUTE_TO_NGO: 'ARRIVED_AT_DESTINATION',
  ARRIVED_AT_DESTINATION: 'DELIVERED',
};

export function DonationActions({ donationId, status, role, userId, driverId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canDrive = role === 'driver' && (!driverId || driverId === userId);
  const canCancel = role === 'donor' && !['DELIVERED', 'CANCELLED', 'EXPIRED', 'FAILED'].includes(status);
  const canAccept = role === 'driver' && status === 'MATCHED' && !driverId;
  const next = nextStatus[status];

  const request = async (url: string, body?: Record<string, string>) => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Unable to update this rescue.');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update this rescue.');
    } finally {
      setBusy(false);
    }
  };

  if ((!canDrive || (!next && !canAccept)) && !canCancel) return null;
  return <div className="donation-actions">
    <div className="donation-action-buttons">
      {canAccept && <button type="button" className="primary-btn" onClick={() => request(`/api/donations/${donationId}/assign-driver`)} disabled={busy}>{busy ? 'Accepting...' : 'Accept pickup'}</button>}
      {canDrive && next && <button type="button" className="primary-btn" onClick={() => request(`/api/donations/${donationId}/transition`, { status: next })} disabled={busy}>{busy ? 'Updating...' : `Mark ${next.replaceAll('_', ' ').toLowerCase()}`}</button>}
      {canCancel && <button type="button" className="secondary-btn" onClick={() => request(`/api/donations/${donationId}/transition`, { status: 'CANCELLED' })} disabled={busy}>Cancel donation</button>}
    </div>
    {error && <p className="form-error">{error}</p>}
  </div>;
}
