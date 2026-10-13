import { getActiveJobs } from './actions';
import JobsList from './JobsList';

export default async function PublicJobsPage() {
  const jobs = await getActiveJobs();
  const lang = 'ar';

  return (
    <div className={`min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <main className="grow py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <JobsList jobs={jobs} lang={lang} />
      </main>
    </div>
  );
}