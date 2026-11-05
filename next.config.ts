import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextIntlPlugin from 'next-intl/plugin';
import type { default as NextIntlPluginFn } from 'next-intl/plugin';

const createNextIntlPlugin =
  typeof nextIntlPlugin === 'function'
    ? nextIntlPlugin
    : (nextIntlPlugin as unknown as { default: NextIntlPluginFn }).default;

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Canonical default fallback contract addresses and chain configuration
process.env.NEXT_PUBLIC_BSC_CHAIN_ID = process.env.NEXT_PUBLIC_BSC_CHAIN_ID || '56';
process.env.NEXT_PUBLIC_BSC_EXPLORER = process.env.NEXT_PUBLIC_BSC_EXPLORER || 'https://bscscan.com';
process.env.NEXT_PUBLIC_OKN_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_OKN_TOKEN_ADDRESS || '0xBF6B0312f52fa8390Ec9393A9375BF05c8E40377';
process.env.NEXT_PUBLIC_TOKEN_SALE_ADDRESS =
  process.env.NEXT_PUBLIC_TOKEN_SALE_ADDRESS || '0x46fC09a84C23c94Ea6853450253C050be44dB751';
process.env.NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS =
  process.env.NEXT_PUBLIC_MERKLE_DISTRIBUTOR_ADDRESS || '0xC0e7a1cEB339B7a35Af81D2AE7705f7d8456C4a9';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.okntoken.com';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@okn/shared'],
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/app/portfolio',
      },
      {
        source: '/portfolio',
        destination: '/app/portfolio',
      },
      {
        source: '/referral',
        destination: '/app/referral',
      },
      {
        source: '/polymarket-agent',
        destination: '/app/polymarket-agent',
      },
      {
        source: '/tasks',
        destination: '/app/tasks',
      },
      {
        source: '/claim',
        destination: '/app/claim',
      },
      {
        source: '/buy',
        destination: '/app/buy',
      },
      {
        source: '/leaderboard',
        destination: '/app/leaderboard',
      },
      {
        source: '/missions',
        destination: '/app/missions',
      },
      {
        source: '/staking',
        destination: '/app/staking',
      },
      {
        source: '/wallet',
        destination: '/app/wallet',
      },
      {
        source: '/trade-bot',
        destination: '/app/trade-bot',
      },
      {
        source: '/prediction-markets',
        destination: '/app/prediction-markets',
      },
      {
        source: '/settings',
        destination: '/app/settings',
      },
      {
        source: '/learn',
        destination: '/app/learn',
      },
      {
        source: '/news',
        destination: '/app/news',
      },
    ];
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@okn/shared': path.resolve(projectRoot, 'src/shared/index.ts'),
      'pino-pretty': false,
      lokijs: false,
      encoding: false,
      '@react-native-async-storage/async-storage': false,
      '@base-org/account': false,
      '@x402/evm': false,
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/core/client': false,
      '@x402/core/server': false,
      '@x402/svm/exact/client': false,
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
