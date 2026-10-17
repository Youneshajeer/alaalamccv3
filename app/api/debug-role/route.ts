// app/api/debug-role/route.ts
import { getCurrentUserRole } from '@/lib/supabase/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await getCurrentUserRole();
  return NextResponse.json({
    email: auth.user?.email,
    role: auth.role,
    isAuthorized: auth.isAuthorized,
    supabaseHost: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host,
  });
}