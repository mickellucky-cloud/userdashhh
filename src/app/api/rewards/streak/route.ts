import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    currentStreak: 6,
    longestStreak: 6,
    lastCheckIn: new Date().toISOString(),
    canCheckInToday: true,
  });
}