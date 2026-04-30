/**
 * POST /api/auth/login
 * Autentica staff con email + password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    // Crear cliente Supabase
    let supabaseResponse = NextResponse.json(
      { ok: true },
      { status: 200 }
    );

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

    // Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea staff
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, role, hotel_id')
      .eq('id', data.user.id)
      .single();

    if (staffError || !staff) {
      // Usuario autenticado pero no es staff
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'No autorizado. No eres staff del hotel.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        user: { id: data.user.id, email: data.user.email, role: staff.role },
      },
      { status: 200, headers: supabaseResponse.headers }
    );
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
