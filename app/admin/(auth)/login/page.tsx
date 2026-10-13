import { redirect } from 'next/navigation';
import LoginClient from './LoginClient';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
export const revalidate = 0;

export default async function AdminLoginPage() {

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/admin/dashboard');
  }

  return <LoginClient />;
}