import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    missions: [
      {
        id: 'mission-1',
        title: 'Community Presale Softcap',
        description: 'Reach 500 BNB in community presale commitments',
        currentValue: '342',
        targetValue: '500',
        unit: 'BNB',
        rewardPoints: 500,
        status: 'in_progress',
      },
    ],
  });
}