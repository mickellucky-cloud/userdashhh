import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    category: 'points',
    period: 'all-time',
    userRank: 42,
    entries: [
      { rank: 1, username: 'satoshi_99', points: 12500, referrals: 142 },
      { rank: 2, username: 'crypto_chad', points: 9800, referrals: 98 },
      { rank: 3, username: 'alpha_hunter', points: 8400, referrals: 76 },
      { rank: 4, username: 'dan_evans', points: 135, referrals: 14 },
    ],
  });
}