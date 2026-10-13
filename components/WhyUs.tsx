'use client';

import { useTranslation } from '@/utils/useTranslation';
import React from 'react';
import EnterpriseStats from '@/components/EnterpriseStats';

export default function WhyUs() {
  const { lang, t } = useTranslation();
  const whyUsText = t.whyUsComponent;

  return (
    <section id="why-us" className={`py-24 bg-white text-slate-900 relative overflow-hidden ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <div className="absolute top-1/4 -right-28 w-125 h-125 bg-emerald-100/45 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 -left-28 w-125 h-125 bg-sky-100/45 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-bold shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {whyUsText?.badge}
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            {whyUsText?.titleMain} <br />
            <span className="bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
              {whyUsText?.titleHighlight}
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
            {whyUsText?.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {whyUsText?.coreFeatures?.map((feature: any) => (
            <div
              key={feature.id}
              className={`group relative bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/80 hover:border-emerald-400/80 flex flex-col justify-between overflow-hidden ${lang === 'ar' ? 'text-right' : 'text-left'}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-linear-to-r group-hover:from-emerald-400 group-hover:to-amber-400 transition-all duration-500"></div>

              <div className="space-y-6">
                <div className={`flex justify-between items-center ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/60 text-emerald-800">
                    {feature.badge}
                  </span>
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shadow-sm group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                    {feature.icon}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-2 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {feature.highlight}
                </span>
                <span className="text-slate-400 group-hover:-translate-x-1 transition-transform">
                  {lang === 'ar' ? '←' : '→'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <EnterpriseStats enterpriseStats={whyUsText?.enterpriseStats} lang={lang} />

        <div className={`bg-linear-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          <div className="space-y-3">
            <h3 className="text-2xl sm:text-3xl font-black">
              {whyUsText?.ctaTitle}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              {whyUsText?.ctaDesc}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <a
              href={`/request-service?service=infrastructure&lang=${lang}`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm whitespace-nowrap active:scale-95 text-center"
            >
              {whyUsText?.ctaButton}
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}