import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'task-1',
      title: 'Follow @OKNToken on X',
      description: 'Follow our official X handle for project announcements',
      category: 'social',
      rewardPoints: 50,
      status: 'pending',
      actionUrl: 'https://x.com/okntoken',
    },
    {
      id: 'task-2',
      title: 'Join OKN Telegram Community',
      description: 'Join the global Telegram announcement channel',
      category: 'social',
      rewardPoints: 50,
      status: 'pending',
      actionUrl: 'https://t.me/okntoken',
    },
    {
      id: 'task-3',
      title: 'Connect Web3 Wallet',
      description: 'Connect your BSC wallet to be ready for token claims',
      category: 'onchain',
      rewardPoints: 100,
      status: 'completed',
    },
    {
      id: 'task-4',
      title: 'Daily Check-in',
      description: 'Maintain your activity streak for bonus multipliers',
      category: 'daily',
      rewardPoints: 10,
      status: 'completed',
    },
  ]);
}