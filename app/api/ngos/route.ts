import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createNgo, getUserBySession } from '@/lib/server-db';

export async function POST(request: Request) {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user || user.role !== 'ngo') return NextResponse.json({ error: 'Create or use an NGO account first.' }, { status: 403 });
  const body = await request.json();
  const ngoId = createNgo({ ...body, userId: user.id, maxCapacity: Number(body.maxCapacity), currentCapacity: Number(body.currentCapacity), dailyMealRequirement: Number(body.dailyMealRequirement), foodPreferences: Array.isArray(body.foodPreferences) ? body.foodPreferences : [] });
  return NextResponse.json({ ngoId }, { status: 201 });
}
