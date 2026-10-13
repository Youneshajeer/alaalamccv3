import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import JobApplicationsClient from './jobApplicationsClient';
import { hasPermission } from '@/lib/supabase/permissions';

export default async function JobsManagementPage() {
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
const allowed = await hasPermission('career.view');

  if (!allowed) {
    redirect('/admin/dashboard?error=unauthorized');
  }
  const allowdView=await hasPermission('careers.view')
  const allowdManage=await hasPermission('careers.manage')
  const allowdDelete=await hasPermission('careers.delete')
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (jobsError) {
    console.error('Supabase Jobs Error:', jobsError.message);
  }

  const { data: careers, error: careersError } = await supabase
    .from('careers')
    .select('job_id');

  if (careersError) {
    console.error('Supabase Careers Error:', careersError.message);
  }

  const initialJobs = (jobs || []).map((job: any) => {
    const jobApplicants = (careers || []).filter((c: any) => c.job_id === job.id);
    return {
      ...job,
      applicants_count: jobApplicants.length,
    };
  });

  console.log('Fetched Jobs Count:', initialJobs.length); // للتأكد عبر الـ Terminal

  return (
    <JobApplicationsClient
      initialJobs={initialJobs}
      userEmail={user.email || ''}
      userRole={profile?.role || 'admin'}
      permission={{
      allowdView,
      allowdManage,
      allowdDelete,

      }}
      
    />
  );
}