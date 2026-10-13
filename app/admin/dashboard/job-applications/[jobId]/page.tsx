import { hasPermission } from '@/lib/supabase/permissions';
import { redirect, notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { getJobDetailsAndApplications } from '../actions';
import JobDetailsClient from './JobDetailsClient';

interface PageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function JobDetailsPage({ params }: PageProps) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const allowed = await hasPermission('jobs.view');
  if (!allowed) {
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

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole = currentProfile?.role || 'admin';

  return (
    <JobDetailsClient
      job={res.job}
      initialApplications={res.applications || []}
      userEmail={user.email || ''}
      userRole={userRole}
    />
  );
}