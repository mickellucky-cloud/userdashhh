import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalBought: '0',
    totalClaimed: '0',
    totalEarned: 135,
    earnedBySource: { task: 80, referral: 35, bonus: 20, admin: 0 },
    referralLevels: { l1: 8, l2: 4, l3: 2 },
    saleRate: '1000000000000000000',
  });
}