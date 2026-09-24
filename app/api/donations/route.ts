import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createDonation, getDonationsForUser, getUserBySession } from '@/lib/server-db';

export async function GET() {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const donations = (getDonationsForUser(user.id) as Array<Record<string, unknown>>).map((donation) => ({
    id: donation.id,
    foodName: donation.food_name,
    category: donation.category,
    quantity: donation.quantity,
    unit: donation.unit,
    foodType: donation.food_type,
    pickupAddress: donation.pickup_address,
    location: donation.location,
    status: donation.status,
    createdAt: donation.created_at,
    updatedAt: donation.updated_at,
  }));
  return NextResponse.json({ donations });
}

export async function POST(request: Request) {
  const user = getUserBySession((await cookies()).get('annora-session')?.value);
  if (!user || user.role !== 'donor') return NextResponse.json({ error: 'Only authenticated donors can create donations.' }, { status: 403 });
  const body = await request.json();
  const requiredFields = ['foodName', 'category', 'unit', 'foodType', 'preparationTime', 'safeUntil', 'pickupTime', 'pickupAddress', 'location', 'description'];
  const missing = requiredFields.find((field) => typeof body[field] !== 'string' || !body[field].trim());
  const quantity = Number(body.quantity);
  if (missing || !Number.isInteger(quantity) || quantity <= 0) return NextResponse.json({ error: missing ? `Missing required field: ${missing}.` : 'Quantity must be a positive whole number.' }, { status: 400 });
  if (!['Vegetarian', 'Non-Vegetarian'].includes(body.foodType)) return NextResponse.json({ error: 'Food type must be Vegetarian or Non-Vegetarian.' }, { status: 400 });
  const timeFields = ['preparationTime', 'safeUntil', 'pickupTime'];
  if (timeFields.some((field) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(body[field]))) return NextResponse.json({ error: 'Preparation, safe-until, and pickup times must use HH:MM format.' }, { status: 400 });
  const donationId = createDonation({ ...body, donorId: user.id, quantity });
  return NextResponse.json({ donationId }, { status: 201 });
}
