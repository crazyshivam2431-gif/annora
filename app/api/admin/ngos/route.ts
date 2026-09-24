import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getNgoVerificationQueue, getUserBySession, updateNgoVerification } from '@/lib/server-db';

export async function GET() {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return NextResponse.json({ ngos: getNgoVerificationQueue() });
}

export async function PATCH(request: Request) {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const body = await request.json();
  const statuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'];
  if (typeof body.ngoId !== 'string' || !statuses.includes(body.status)) return NextResponse.json({ error: 'A valid NGO and verification status are required.' }, { status: 400 });
  const result = updateNgoVerification(body.ngoId, user, body.status);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result);
}