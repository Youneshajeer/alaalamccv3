import Link from 'next/link';
import { getTranslation } from '@/utils/getTranslation';

interface Job {
  id: string;
  title: string;
  description: string;
  deadline?: string;
}


async function getJobDetails(id: string): Promise<Job | null> {
  return null; 
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang, t } = await getTranslation();

  const typedT = t as any;
  const job = await getJobDetails(id);

  if (!job) {
    return (
      <div 
        dir={lang === 'ar' ? 'rtl' : 'ltr'} 
        className="container mx-auto px-4 py-16 max-w-3xl text-center"
      >
        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
            {lang === 'ar' ? 'الوظيفة غير موجودة' : 'Job Not Found'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {lang === 'ar' 
              ? 'عذراً، الوظيفة المطلوبة غير متاحة حالياً أو تم إغلاق التقديم عليها.' 
              : 'Sorry, the requested position is no longer available or applications are closed.'}
          </p>
          <Link
            href="/careers"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl transition-all text-sm"
          >
            {lang === 'ar' ? 'العودة للوظائف' : 'Back to Careers'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'} 
      className="container mx-auto px-4 py-12 max-w-4xl"
    >
      <div className="mb-6">
        <Link 
          href="/careers" 
          className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
        >
          <span>{lang === 'ar' ? '← العودة لكافة الوظائف' : '← Back to all jobs'}</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4">
          {job.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {job.description}
        </p>
      </div>
    </div>
  );
}