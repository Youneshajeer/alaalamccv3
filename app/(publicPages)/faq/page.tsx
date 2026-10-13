'use client';
import React, { useState } from 'react';
import { useTranslation } from '@/utils/useTranslation';


export default function FAQPage() {
 const { lang, t } = useTranslation();
 const faqText = t.faq;
 const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      <main className="grow py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-12">
        
        <div className={`space-y-4 text-center sm:${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-sm mx-auto sm:mx-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{faqText.eyebrow}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {faqText.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
            {faqText.description}
          </p>
        </div>

        <div className="space-y-4">
          {faqText.questions.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-right gap-4 font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <span className={`text-base sm:text-lg ${lang === 'ar' ? 'text-right' : 'text-left'} w-full`}>
                    {item.q}
                  </span>
                  <span className={`w-8 h-8 rounded-full bg-emerald-100 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-emerald-500 text-white dark:bg-emerald-500 dark:text-white' : ''}`}>
                    ↓
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>

    </div>
  );
}