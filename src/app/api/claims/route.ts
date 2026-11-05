import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    eligibility: {
      eligible: true,
      amount: '0',
      proof: [],
      nextMerkleCommit: 'In 3 days',
    },
    history: [],
  });
}