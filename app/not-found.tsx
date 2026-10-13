import { getTranslation } from '@/utils/getTranslation';
import Link from 'next/link';


export default async function NotFound() {
  const {lang,t} = await getTranslation()
const notFoundText=t.notFound
 

  return (
    <div className={`min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      <main className="grow py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full flex items-center justify-center">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          
          <div className="relative">
            <span className="text-8xl sm:text-9xl font-black text-emerald-600/10 dark:text-emerald-500/10 select-none block">
              {notFoundText.code}
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{notFoundText.eyebrow}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {notFoundText.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {notFoundText.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 transition-all duration-200"
            >
              {notFoundText.backHome}
            </Link>

            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base border border-slate-200 dark:border-slate-800 transition-all duration-200"
            >
              {notFoundText.contactUs}
            </Link>
          </div>

        </div>
      </main>

    </div>
  );
}