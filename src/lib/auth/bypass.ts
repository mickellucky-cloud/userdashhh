/**
 * lib/auth/bypass.ts — Standalone Dashboard Auth Bypass
 * By default in the standalone dashboard, bypass is enabled so users and reviewers
 * can view the dashboard immediately.
 */
export function isAuthBypassed(): boolean {
  if (process.env.REQUIRE_AUTH === 'true') return false;
  return true;
}

export function hasProductionSecret(): boolean {
  return !!process.env.JWT_SECRET;
}

export function assertNoDangerousBypassInProduction(): void {
  // No-op for standalone dashboard
}
