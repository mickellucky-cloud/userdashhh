'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * mobile/nav-bar.tsx — iOS top navigation bar with blur backdrop.
 */
export function NavBar({
  title,
  right,
  className,
}: {
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('ios-blur sticky top-0 z-30 flex h-12 items-center px-4', className)}>
      <h1 className="flex-1 text-center text-base font-semibold">{title}</h1>
      <div className="absolute right-4">{right}</div>
    </header>
  );
}
