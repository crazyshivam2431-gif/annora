import { NextResponse } from 'next/server';
import { createSupportRequest, createVolunteerApplication } from '@/lib/server-db';

export async function POST(request: Request) {
  const body = await request.json();
  if (body.type === 'support') {
    return NextResponse.json({ id: createSupportRequest(body) }, { status: 201 });
  }
  if (body.type === 'volunteer') {
    return NextResponse.json({ id: createVolunteerApplication(body) }, { status: 201 });
  }
  return NextResponse.json({ error: 'Unknown community request type.' }, { status: 400 });
}
