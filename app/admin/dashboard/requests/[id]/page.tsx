import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect, notFound } from 'next/navigation';
import RequestDetailsClient from './requestDetailsClient';
import { hasPermission } from '@/lib/supabase/permissions';
import { getRequestDetailsAction } from '../actions';
import { getCurrentUserRole } from '@/lib/supabase/auth';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RequestDetailsPage({ params }: PageProps) {
  const supabase = await getSupabaseServerClient();

  const authData = await getCurrentUserRole();
  
  if (!authData || !authData.user || !authData.isAuthorized) {
    redirect('/admin/login?error=unauthorized');
  }

  const { user, role, roleDisplayName } = authData;
  const userEmail = user.email || '';
  const userRole = role || 'supervisor';

  const canViewRequests = await hasPermission('requests.view');
  if (!canViewRequests) {
    redirect('/admin/dashboard?error=forbidden');
  }

  const resolvedParams = await params;
  const requestId = resolvedParams.id;

  try {
    const result = await getRequestDetailsAction(requestId);

    if (!result.success || !result.request) {
      notFound();
    }

    const requestItem = result.request;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10">
        <RequestDetailsClient 
          requestItem={requestItem} 
          userEmail={userEmail} 
          userRole={userRole}
          roleDisplayName={roleDisplayName} 
        />
      </div>
    );
  } catch (err) {
    notFound();
  }
}