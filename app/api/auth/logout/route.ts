/**
 * POST /api/auth/logout
 * Cierra la sesión del staff
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
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

    // Sign out
    await supabase.auth.signOut();

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: supabaseResponse.headers }
    );
  } catch (err) {
    console.error('[POST /api/auth/logout]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
