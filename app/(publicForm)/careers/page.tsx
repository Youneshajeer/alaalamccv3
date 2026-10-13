
import { supabase } from '@/lib/supabase/supabase';
import CareersFormWrapper from './CareersFormWrapper';

interface CareersPageProps {
  searchParams: Promise<{ jobId?: string }>;
}

export default async function CareersPage({ searchParams }: CareersPageProps) {
  const resolvedSearchParams = await searchParams;
  const jobId = resolvedSearchParams?.jobId;

  let jobDetails = null;

  
  if (jobId) {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    jobDetails = data;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 dir-rtl" dir="rtl">
      <main className="grow py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-12">
        <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
          <CareersFormWrapper jobId={jobId} jobDetails={jobDetails} />
        </div>
      </main>
    </div>
  );
}