import { NextResponse } from 'next/server';
import { getRescueData } from '@/lib/server-db';

const cityCoordinates: Record<string, [number, number]> = {
  jaipur: [26.9124, 75.7873],
  delhi: [28.6139, 77.209],
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  udaipur: [24.5854, 73.7125],
  jodhpur: [26.2389, 73.0243],
};

export async function GET() {
  const data = getRescueData();
  const coordinateFor = (value: unknown) => cityCoordinates[String(value ?? '').toLowerCase()] ?? cityCoordinates.jaipur;
  return NextResponse.json({
    donations: (data.donations as Array<Record<string, unknown>>).map((item) => ({ ...item, coordinates: coordinateFor(item.location) })),
    ngos: (data.ngos as Array<Record<string, unknown>>).map((item) => ({ ...item, coordinates: coordinateFor(item.city) })),
  });
}