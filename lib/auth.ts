/**
 * Utilidades de autenticación y autorización
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Obtiene el usuario y su rol desde la sesión
 */
export async function getStaffUser(req: NextRequest) {
  let supabaseResponse = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, staff: null, error: 'Not authenticated' };
  }

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, role, hotel_id, email')
    .eq('id', user.id)
    .single();

  if (error || !staff) {
    return { user, staff: null, error: 'Not staff' };
  }

  return { user, staff, error: null };
}

/**
 * Verifica que el usuario sea admin
 */
export async function requireAdmin(req: NextRequest) {
  const { user, staff, error } = await getStaffUser(req);

  if (error || !staff || staff.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
    };
  }

  return { authorized: true, user, staff };
}

/**
 * Verifica que el usuario sea reception o admin
 */
export async function requireReception(req: NextRequest) {
  const { user, staff, error } = await getStaffUser(req);

  if (error || !staff || (staff.role !== 'reception' && staff.role !== 'admin')) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
    };
  }

  return { authorized: true, user, staff };
}
