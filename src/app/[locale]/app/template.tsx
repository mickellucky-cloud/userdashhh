/**
 * app/app/template.tsx — Phase 7.6
 * Re-mounts on every /app/* navigation so the PageTransition enter animation
 * fires. Templates wrap the children of a layout and re-instantiate on
 * navigation (unlike layouts, which persist).
 */
import { PageTransition } from '@/components/layout/page-transition';

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
