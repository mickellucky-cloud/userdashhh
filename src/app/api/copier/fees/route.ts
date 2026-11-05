import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ platformFeePercent: 1.5, minDepositUsdc: 10 });
}