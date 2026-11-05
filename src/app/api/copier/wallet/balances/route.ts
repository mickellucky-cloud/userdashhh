import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ usdc: '0', bnb: '0' });
}