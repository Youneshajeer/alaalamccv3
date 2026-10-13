import { hasPermission } from '@/lib/supabase/permissions';
import { redirect } from 'next/navigation';
import JobsClient from './AdminJobsClient'
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';

export default async function JobsPage() {
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const allowed = await hasPermission('jobs.view');

  if (!allowed) {
    redirect('/admin/dashboard?error=unauthorized');
  }
  const allowdView = await hasPermission('jobs.view')
  const allowdCreate =await hasPermission('jobs.create')
  const allowdUpdate =await hasPermission('jobs.update')
  const allowdManage =await hasPermission('jobs.manage')
  const allowdDelete = await hasPermission('jobs.delete')



  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <JobsClient
      initialJobs={jobs || []}
      userEmail={user.email || ''}
      userRole={profile?.role || 'admin'}
      permission={{
        allowdView,
        allowdCreate,
        allowdUpdate,
        allowdManage,
        allowdDelete,
      }}
    />
  );
}