import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getNotificationsForUser, getUserBySession, markNotificationsRead } from '@/lib/server-db';

export async function GET() {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const notifications = (getNotificationsForUser(user.id) as Array<Record<string, unknown>>).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    read: Boolean(item.read),
    createdAt: item.created_at,
  }));
  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  markNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
