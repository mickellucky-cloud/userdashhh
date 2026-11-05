'use client';

/**
 * components/layout/page-transition.tsx — Phase 7.6
 *
 * Wraps page content in a framer-motion enter transition keyed by pathname.
 * Used inside template.tsx files (one per route group that needs transitions).
 *
 * Why template.tsx, not layout.tsx:
 *   - Layouts persist across sibling-route navigations; animations wouldn't fire.
 *   - Templates re-mount on every navigation, giving us a clean enter animation.
 *
 * Stable Animation During Development Hot Reload (AGENTS.md rule):
 *   - This wrapper is the single host for page-transition state.
 *   - The key is `pathname`, so a re-render of a child component does NOT reset
 *     the animation (only an actual route change does).
 *   - Reduced-motion users get an instant swap (opacity only, 0s duration).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const EASE = [0.16, 1, 0.3, 1] as const;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
