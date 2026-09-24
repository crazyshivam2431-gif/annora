import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDonationDetails, getUserBySession, matchDonation } from '@/lib/server-db';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!['donor', 'ngo', 'admin'].includes(user.role)) return NextResponse.json({ error: 'Only donors, NGOs, or admins can request matching.' }, { status: 403 });
  const { id } = await context.params;
  if (!getDonationDetails(id, user)) return NextResponse.json({ error: 'Donation not found or access denied.' }, { status: 404 });
  const result = matchDonation(id, user.id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result);
}