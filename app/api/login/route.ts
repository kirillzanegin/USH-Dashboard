import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type DashboardUserRow = {
  id: number;
  login: string;
  password: string;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const login = String(formData.get('login') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!login || !password) {
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'missing');
      return NextResponse.redirect(url);
    }

    const supabase = createServerSupabaseClient();

    const result = await supabase
      .from('dashboard_users')
      .select('id, login, password')
      .eq('login', login)
      .maybeSingle();

    const data = result.data as DashboardUserRow | null;
    const error = result.error;

    if (error || !data || data.password !== password) {
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'invalid');
      return NextResponse.redirect(url);
    }

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('dashboard_auth', login, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch {
    const url = new URL('/login', request.url);
    url.searchParams.set('error', 'unknown');
    return NextResponse.redirect(url);
  }
}