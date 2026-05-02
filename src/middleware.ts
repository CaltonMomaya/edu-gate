import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        },
        remove: (name: string, options: any) => {
          req.cookies.delete(name);
          res.cookies.delete(name, options);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { data: user } = await supabase.from('users').select('school_id').eq('id', session.user.id).single();
  if (!user?.school_id) return res;

  const { data: school } = await supabase.from('schools').select('subscription_status, subscription_expires_at').eq('id', user.school_id).single();
  if (!school) return res;

  // Only lock if status is 'not_paid' OR 'trial' has expired
  const isExpired = school.subscription_status === 'not_paid' || 
                    (school.subscription_status === 'trial' && new Date(school.subscription_expires_at) < new Date());

  // Allow access to subscription page and admin page even if expired
  if (req.nextUrl.pathname.startsWith('/subscription') || 
      req.nextUrl.pathname.startsWith('/admin') ||
      req.nextUrl.pathname.startsWith('/api/')) {
    return res;
  }

  // Redirect to subscription page if expired
  if (isExpired) {
    return NextResponse.redirect(new URL('/subscription', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/(dashboard)/:path*', '/subscription', '/admin', '/api/:path*']
};
