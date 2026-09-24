import { NextResponse } from 'next/server';
import { getImpactStats } from '@/lib/server-db';

export function GET() {
  return NextResponse.json({ stats: getImpactStats() });
}