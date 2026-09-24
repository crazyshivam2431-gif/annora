import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserBySession, transitionDonation, type DonationStatus } from '@/lib/server-db';

const statuses: DonationStatus[] = ['POSTED', 'MATCHED', 'DRIVER_ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_NGO', 'ARRIVED_AT_DESTINATION', 'DELIVERED', 'CANCELLED', 'EXPIRED', 'FAILED'];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const body = await request.json();
  if (!statuses.includes(body.status)) return NextResponse.json({ error: 'Unsupported donation status.' }, { status: 400 });
  const { id } = await context.params;
  const result = transitionDonation(id, user, body.status, typeof body.note === 'string' ? body.note : '');
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result);
}