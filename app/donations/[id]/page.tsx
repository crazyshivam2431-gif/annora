import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { DonationActions } from '@/components/donation-actions';
import { SiteHeader } from '@/components/site-header';
import { getDonationDetails, getUserBySession, type DonationStatus } from '@/lib/server-db';

export default async function DonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: donationId } = await params;
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) redirect('/login?error=auth_required');
  const details = getDonationDetails(donationId, user);
  if (!details) notFound();
  const { donation, events } = details;

  return (
    <main className="page-shell">
      <SiteHeader />
      <section className="content-page wrap detail-page">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">Rescue record</p>
            <h1>{String(donation?.food_name ?? 'Donation not found')}</h1>
            <p className="detail-subtitle">A transparent record of surplus food moving through the ANNORA network.</p>
          </div>
          <span className="detail-status">{String(donation.status ?? 'UNKNOWN')}</span>
        </div>

        <div className="detail-grid">
          <div className="detail-card panel-card">
            <h2>Donation overview</h2>
            <div className="detail-list">
              <div><span>Quantity</span><strong>{donation.quantity} {donation.unit}</strong></div>
              <div><span>Food type</span><strong>{String(donation.food_type ?? '—')}</strong></div>
              <div><span>Pickup address</span><strong>{String(donation.pickup_address ?? '—')}</strong></div>
              <div><span>Location</span><strong>{String(donation.location ?? '—')}</strong></div>
              <div><span>Matched NGO</span><strong>{String(donation.ngo_name ?? 'Awaiting match')}</strong></div>
              <div><span>Driver</span><strong>{String(donation.driver_name ?? 'Awaiting assignment')}</strong></div>
            </div>
          </div>
          <div className="detail-card panel-card">
            <h2>Rescue timeline</h2>
            {events.map((event: any, index: number) => <div key={event.id} className={`timeline-item ${index === events.length - 1 ? 'active' : ''}`}><span />{String(event.status).replaceAll('_', ' ')}<strong>{String(event.note)} · {new Date(String(event.created_at)).toLocaleString()}</strong></div>)}
          </div>
        </div>
        <DonationActions donationId={donationId} status={String(donation.status) as DonationStatus} role={user.role} userId={user.id} driverId={donation.driver_id ? String(donation.driver_id) : undefined} />
        <div className="detail-card panel-card detail-description"><h2>Notes</h2><p>{String(donation.description ?? 'No additional instructions.')}</p></div>
      </section>
    </main>
  );
}
