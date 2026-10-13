import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect, notFound } from 'next/navigation';
import RequestDetailsClient from './requestDetailsClient';
import { hasPermission } from '@/lib/supabase/permissions';
import { getRequestDetailsAction } from '../actions';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RequestDetailsPage({ params }: PageProps) {
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
  
  const allowed = await hasPermission('requests.view');
  if (!allowed) {
    redirect('/admin/dashboard?error=unauthorized');
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
        />
      </div>
    );
  } catch (err) {
    notFound();
  }
}