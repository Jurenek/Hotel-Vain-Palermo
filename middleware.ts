import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas (no necesitan auth)
  const publicRoutes = [
    '/',
    '/home',
    '/concierge',
    '/experiences',
    '/extras',
    '/info',
    '/checkin',
    '/auth/login',
    '/api/experiences',
    '/api/hotel-settings',
    '/api/upsells',
    '/api/requests', // GET public, POST sin auth (guest crea solicitud)
    '/api/checkin',
  ];

  // Rutas que REQUIEREN auth
  const protectedRoutes = ['/reception', '/admin'];

  // Si la ruta está protegida, verificar sesión
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Crear cliente Supabase en el servidor
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Obtener sesión
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Si no hay usuario logueado, redirigir a login
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Si es /admin, verificar que sea admin
    if (pathname.startsWith('/admin')) {
      const { data: staff } = await supabase
        .from('staff')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!staff || staff.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Si es /reception, verificar que sea reception o admin
    if (pathname.startsWith('/reception')) {
      const { data: staff } = await supabase
        .from('staff')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!staff || (staff.role !== 'reception' && staff.role !== 'admin')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
