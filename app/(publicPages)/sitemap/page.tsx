'use client';

import Link from 'next/link';
import { useTranslation } from '@/utils/useTranslation';

export default function HtmlSitemapPage() {
  const { lang, isMounted } = useTranslation();
  const currentLang = isMounted ? lang : 'ar';

  const pages = [
    { title: currentLang === 'ar' ? 'الرئيسية ' : 'Home', url: '/' },
    { title: currentLang === 'ar' ? 'خدماتنا ' : 'Services', url: '/services' },
    { title: currentLang === 'ar' ? 'لماذا نحن ' : 'Why Us', url: '/why_us' },
    { title: currentLang === 'ar' ? 'آلية العمل ' : 'How It Works', url: '/how_it_work' },
    { title: currentLang === 'ar' ? 'الوظائف الشاغرة ' : 'Jobs', url: '/jobs' },
    { title: currentLang === 'ar' ? 'كن جزءاً من فريق العمل ' : 'Careers', url: '/careers' },
    { title: currentLang === 'ar' ? 'تواصل معنا ' : 'Contact Us', url: '/contact' },
    { title: currentLang === 'ar' ? 'الأسئلة الشائعة ' : 'FAQ', url: '/faq' },
    { title: currentLang === 'ar' ? 'سياسة الخصوصية ' : 'Privacy Policy', url: '/privacy' },
    { title: currentLang === 'ar' ? 'شروط الخدمة ' : 'Terms of Service', url: '/terms' },
    { title: currentLang === 'ar' ? 'سياسة الاستخدام المقبول' : 'Acceptable Use', url: '/acceptable-use' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-16 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl transition-colors duration-300">
        
        <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
          <span>🗺️</span>
          <span>{currentLang === 'ar' ? 'خريطة الموقع' : 'Sitemap'}</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-8">
          {currentLang === 'ar'
            ? 'دليل شامل لكافة أقسام وصفحات موقع شركة حلول العالم للاتصالات وتقنية المعلومات.'
            : 'A comprehensive guide to all sections and pages of Alaalam Solutions for Telecom and IT.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pages.map((page, id) => (
            <Link
              key={id}
              href={page.url}
              className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-950 transition-all flex items-center justify-between group shadow-sm dark:shadow-none"
            >
              <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {page.title}
              </span>
              <span 
                className="text-slate-400 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" 
                dir="ltr"
              >
                →
              </span>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}