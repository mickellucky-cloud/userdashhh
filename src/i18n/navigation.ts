/**
 * i18n/navigation.ts — locale-aware navigation primitives.
 *
 * Drop-in replacements for `next/link` and `next/navigation` hooks. They
 * automatically prepend the active locale to every href, so components just
 * use `Link` / `usePathname` / `useRouter` from here and never touch the
 * locale segment manually.
 *
 *   import { Link, usePathname } from '@/i18n/navigation';
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
