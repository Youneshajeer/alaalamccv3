'use server';

import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}