import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import JobsClient from './AdminJobsClient';
import { hasPermission } from '@/lib/supabase/permissions';
import { getCurrentUserRole } from '@/lib/supabase/auth';
export const revalidate = 0;


export default async function JobsPage() {
  const supabase = await getSupabaseServerClient();

  // 1. استخدام المصادقة المركزية الموحدة
  const authData = await getCurrentUserRole();
  
  if (!authData || !authData.user || !authData.isAuthorized) {
    redirect('/admin/login?error=unauthorized');
  }

  const { user, role, roleDisplayName } = authData;
  const userEmail = user.email || '';
  const userRole = role || 'supervisor';

  // 2. التحقق من الصلاحيات الديناميكية المطلوبة
  const canViewDashboard = await hasPermission('dashboard.view');
  const allowdView = await hasPermission('jobs.view');
  const allowdCreate = await hasPermission('jobs.create');
  const allowdUpdate = await hasPermission('jobs.update');
  const allowdManage = await hasPermission('jobs.manage');
  const allowdDelete = await hasPermission('jobs.delete');

  if (!canViewDashboard || !allowdView) {
    redirect('/admin/dashboard?error=unauthorized');
  }

  // 3. جلب الوظائف من قاعدة البيانات
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (jobsError) {
    console.error('Supabase Jobs Error:', jobsError.message);
  }

  return (
    <JobsClient
      initialJobs={jobs || []}
      userEmail={userEmail}
      userRole={userRole}
      roleDisplayName={roleDisplayName}
      permission={{
        allowdView,
        allowdCreate,
        allowdUpdate,
        allowdManage,
        allowdDelete,
        isAuthorized: authData.isAuthorized,
      }}
    />
  );
}