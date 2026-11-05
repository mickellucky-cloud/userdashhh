import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: true,
    awardedPoints: 10,
    newStreak: 7,
  });
}