import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import DashboardClient from './jobApplicationsClient';
import { hasPermission } from '@/lib/supabase/permissions';
import { getCurrentUserRole } from '@/lib/supabase/auth';

export const revalidate = 0;

export default async function jobApplicationsPage() {
  const supabase = await getSupabaseServerClient();

  const authData = await getCurrentUserRole();
  
  if (!authData || !authData.user || !authData.isAuthorized) {
    redirect('/admin/login?error=unauthorized');
  }

  const { user, role, roleDisplayName } = authData;
  const userEmail = user.email || '';
  const userRole = role || 'supervisor';

  const canViewDashboard = await hasPermission('dashboard.view');
  const allowdView = await hasPermission('careers.view');
  const allowdManage = await hasPermission('careers.manage');
  const allowdDelete = await hasPermission('careers.delete');

  if (!canViewDashboard || !allowdView) {
    redirect('/admin/dashboard?error=unauthorized');
  }

  const { data: applications, error: appError } = await supabase
    .from('careers')
    .select('*')
    .order('created_at', { ascending: false });

  if (appError) {
    console.error('Supabase Careers Error:', appError.message);
  }

  return (
    <DashboardClient
      initialApplications={applications || []}
      userEmail={userEmail}
      userRole={userRole}
      roleDisplayName={roleDisplayName}
      permission={{
        allowdView,
        allowdManage,
        allowdDelete,
        isAuthorized: authData.isAuthorized,
      }}
    />
  );
}