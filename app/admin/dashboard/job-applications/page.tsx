import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import JobApplicationsClient from './jobApplicationsClient';
import { hasPermission } from '@/lib/supabase/permissions';
import { getCurrentUserRole } from '@/lib/supabase/auth';
export const revalidate = 0;


export default async function JobsManagementPage() {
  const supabase = await getSupabaseServerClient();
  
  const authData = await getCurrentUserRole();
  
  if (!authData || !authData.user || !authData.isAuthorized) {
    redirect('/admin/login?error=unauthorized');
  }

  const { user, role } = authData;
  const userEmail = user.email || '';
  const userRole = role || 'supervisor';

  const canViewDashboard = await hasPermission('dashboard.view');
  const allowdView = await hasPermission('careers.view');
  const allowdManage = await hasPermission('careers.manage');
  const allowdDelete = await hasPermission('careers.delete');

  if (!canViewDashboard) {
    redirect('/admin/login?error=unauthorized');
  }

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

  console.log('Fetched Jobs Count:', initialJobs.length);

  return (
    <JobApplicationsClient
      initialJobs={initialJobs}
      userEmail={userEmail}
      userRole={userRole} 
      permission={{
        allowdView,
        allowdManage,
        allowdDelete,
        isAuthorized: authData.isAuthorized,
      }}
    />
  );
}