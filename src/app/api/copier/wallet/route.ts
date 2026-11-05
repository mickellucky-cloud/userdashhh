import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ address: null, balance: '0' });
}