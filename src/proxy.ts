import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Root redirects straight to user dashboard portfolio
  if (pathname === '/' || pathname === '/en') {
    const url = req.nextUrl.clone();
    url.pathname = '/app/portfolio';
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
