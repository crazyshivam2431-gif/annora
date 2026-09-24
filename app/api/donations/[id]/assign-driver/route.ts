import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { assignDriver, getUserBySession } from '@/lib/server-db';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { id } = await context.params;
  const result = assignDriver(id, user, typeof body.driverId === 'string' ? body.driverId : undefined);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result);
}