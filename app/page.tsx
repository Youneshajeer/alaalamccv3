'use client';

import React, { useState, useEffect } from 'react';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import WhyUs from '@/components/WhyUs';
import HowItWorks from '@/components/HowItWorks';
import { useTranslation } from '@/utils/useTranslation';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const { lang, isMounted } = useTranslation();

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const currentLang = isMounted ? lang : 'ar';

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 ${currentLang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      {loading && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 transition-opacity duration-500 ${
            fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="relative flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
              <img
                src="/images/logo.png"
                alt="حلول العالم"
                className="h-20 sm:h-28 w-auto object-contain relative z-10 animate-bounce"
              />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-amber-500 tracking-wide">
                {currentLang === 'ar' ? 'شركة حلول العالم للاتصالات وتقنية المعلومات' : 'Alaalam Solutions for Telecom & IT'}
              </h2>
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{currentLang === 'ar' ? 'جاري تحميل المنصة ...' : 'Loading Platform ...'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main>
        <Hero />
        <Services />
        <WhyUs />
        <HowItWorks />
      </main>
    </div>
  );
}