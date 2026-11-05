import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      telegramId: '1234567890',
      username: 'okndev',
      firstName: 'Dan',
      lastName: 'Evans',
      displayName: 'Dan Evans',
      walletAddress: null,
      email: 'dan@example.com',
      twoFactorEnabled: false,
      role: 'user',
      createdAt: new Date().toISOString(),
    },
  });
}