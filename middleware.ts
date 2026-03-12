import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // #region agent log
  try {
    const logEntry = {
      sessionId: '17cc78',
      runId: 'middleware',
      hypothesisId: 'H1',
      location: 'middleware.ts',
      message: 'Incoming request',
      data: { pathname, hasAuthCookie: !!request.cookies.get('dashboard_auth') },
      timestamp: Date.now(),
    };
    fs.appendFileSync(
      'debug-17cc78.log',
      JSON.stringify(logEntry) + '\n',
      'utf8'
    );
  } catch {
    // ignore logging errors
  }
  // #endregion

  // Allow unauthenticated access to login and static assets
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get('dashboard_auth');

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

