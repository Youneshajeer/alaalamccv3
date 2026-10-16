import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';
import { getRequests } from './actions';
import RequestClient from './requestClient';
import { hasPermission } from '@/lib/supabase/permissions';
import {getCurrentUserRole} from '@/lib/supabase/auth'

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdminRequestsPage({ searchParams }: PageProps) {
  const supabase = await getSupabaseServerClient();

  const authData = await getCurrentUserRole();
  
  if (!authData || !authData.user || !authData.isAuthorized) {
    redirect('/admin/login?error=unauthorized');
  }

  const { user, role, roleDisplayName } = authData;
  const userEmail = user.email || '';
  const userRole = role || 'supervisor';

  const canViewDashboard = await hasPermission('dashboard.view');
  const allowdView = await hasPermission('requests.view')
  const allowdUpdate = await hasPermission('requests.update')
  const allowdManage = await hasPermission('requests.manage')
  const allowdDelete = await hasPermission('requests.delete')

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;
  const search = resolvedParams?.search || '';
  const status = resolvedParams?.status || 'all';

  const { requests, totalCount, totalPages, currentPage } = await getRequests(page, 10, search, status);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10">
      <RequestClient
        initialRequests={requests}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={currentPage}
        currentSearch={search}
        currentStatus={status}
        userEmail={userEmail}
        userRole={userRole}
        
        permission={{
          allowdView,
          allowdUpdate,
          allowdManage,
          allowdDelete,
          isAuthorized: authData.isAuthorized,

        }}
      />
    </div>
  );
}