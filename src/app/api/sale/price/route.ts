import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    oknPerBnb: '10000',
    bnbPriceUsd: '650.00',
    oknPriceUsd: '0.065',
    minContributionBnb: '0.01',
    maxContributionBnb: '10',
  });
}