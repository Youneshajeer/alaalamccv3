import { redirect, notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { getJobDetailsAndApplications } from '../actions';
import JobDetailsClient from './JobDetailsClient';
import { hasPermission } from '@/lib/supabase/permissions';
import { getCurrentUserRole } from '@/lib/supabase/auth';
export const revalidate = 0;


interface PageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function JobDetailsPage({ params }: PageProps) {
  const supabase = await getSupabaseServerClient();

  const authData = await getCurrentUserRole();
  
  if (!authData || !authData.user || !authData.isAuthorized) {
    redirect('/admin/login?error=unauthorized');
  }

  const { user, role } = authData;
  const userRole = role || 'supervisor';

  const canViewDashboard = await hasPermission('dashboard.view');
  const canViewCareers = await hasPermission('careers.view');

  if (!canViewDashboard || !canViewCareers) {
    redirect('/admin/dashboard?error=unauthorized');
  }

  const resolvedParams = await params;
  const jobId = resolvedParams?.jobId;

  if (!jobId) {
    notFound();
  }

  const res = await getJobDetailsAndApplications(jobId);
  if (!res.success || !res.job) {
    notFound();
  }

  return (
    <JobDetailsClient
      job={res.job}
      initialApplications={res.applications || []}
      userEmail={user.email || ''}
      userRole={userRole}
    />
  );
}