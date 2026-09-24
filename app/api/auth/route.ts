import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateUser, createSession, createUser, deleteSession, getUserBySession } from '@/lib/server-db';

const sessionCookie = 'annora-session';

export async function GET() {
  const user = getUserBySession((await cookies()).get(sessionCookie)?.value);
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action ?? 'login';
  const result = action === 'register'
    ? createUser({ name: body.name, email: body.email, password: body.password, role: body.role, city: body.city, phone: body.phone })
    : authenticateUser(body.email, body.password);

  if (result.error || !result.user) return NextResponse.json({ user: null, error: result.error }, { status: 400 });
  const response = NextResponse.json({ user: result.user });
  response.cookies.set(sessionCookie, createSession(result.user.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return response;
}

export async function DELETE() {
  const cookieStore = await cookies();
  deleteSession(cookieStore.get(sessionCookie)?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(sessionCookie);
  return response;
}
