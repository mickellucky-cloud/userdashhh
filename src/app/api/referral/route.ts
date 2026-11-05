import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    referralCode: 'ref_dev',
    referralLink: 'https://t.me/okntest001_bot?start=ref_dev',
    totalPoints: 135,
    levels: [
      { level: 1, count: 8, pointsEarned: 100 },
      { level: 2, count: 4, pointsEarned: 25 },
      { level: 3, count: 2, pointsEarned: 10 },
    ],
    recent: [
      { id: '1', telegramUsername: 'crypto_whale', createdAt: new Date(Date.now() - 3600000).toISOString(), points: 50 },
      { id: '2', telegramUsername: 'sol_trader', createdAt: new Date(Date.now() - 7200000).toISOString(), points: 30 },
      { id: '3', telegramUsername: 'degen_king', createdAt: new Date(Date.now() - 14400000).toISOString(), points: 20 },
    ],
  });
}