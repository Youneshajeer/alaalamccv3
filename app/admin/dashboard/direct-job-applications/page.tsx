import { hasPermission } from '@/lib/supabase/permissions';
import { redirect } from 'next/navigation';
import DashboardClient from './jobApplicationsClient';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';

export const revalidate = 0;

export default async function jobApplicationsPage() {
    const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const userEmail = user.email || '';

  const { data: userRoleRecord } = await supabase
    .from('user_roles')
    .select(`
      roles (
        name
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle();

  const dbRoleName = (userRoleRecord?.roles as any)?.name;
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole = dbRoleName || currentProfile?.role || 'supervisor';
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
const allowed = await hasPermission('careers.view');

  if (!allowed) {
    redirect('/admin/dashboard?error=unauthorized');
  }
const allowdView=await hasPermission('careers.view')
const allowdManage=await hasPermission('careers.manage')
const allowdDelete=await hasPermission('careers.delete')



  const { data: applications } = await supabase
    .from('careers')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <DashboardClient
      initialApplications={applications || []}
      userEmail={user.email}
      userRole={profile?.role || 'admin'}
      permission={{
        allowdView,
        allowdManage,
        allowdDelete,

      }}
    />
  );
}