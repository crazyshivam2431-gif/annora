import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDashboardData, getUserBySession } from '@/lib/server-db';

export async function GET() {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  return NextResponse.json({ user, dashboard: getDashboardData(user) });
}