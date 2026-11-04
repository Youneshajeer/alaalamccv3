'use client';

import React, { useState, useEffect, useRef } from 'react';

const dictionary = {
  ar: {
    sectionEyebrow: "مراحل الشراكة",
    sectionTitle: "آلية العمل والتشغيل",
    steps: [
      {
        step: "1",
        title: "جلسة تعارف",
        desc: "نفهم طبيعة عملك، حجم المكالمات المتوقع، ومعايير الجودة المطلوبة لتحديد الاحتياجات بدقة."
      },
      {
        step: "2",
        title: "إعداد مخصص",
        desc: "بناء سيناريوهات الاتصال (Scripts)، ربط الأنظمة، وتجهيز الفريق المخصص لحسابك."
      },
      {
        step: "3",
        title: "تشغيل تجريبي",
        desc: "فترة قياس أداء محدودة، مع تقديم تقارير يومية وتعديل مباشر قبل التوسع الكامل."
      },
      {
        step: "4",
        title: "تشغيل وتوسّع",
        desc: "انتقال كامل للتشغيل المباشر، مع رفع التقارير الدورية وزيادة السعة حسب نمو عملك."
      },
    ]
  },
  en: {
    sectionEyebrow: "Partnership Phases",
    sectionTitle: "Work & Operation Mechanism",
    steps: [
      {
        step: "1",
        title: "Introductory Session",
        desc: "We understand your business nature, expected call volume, and quality standards to define requirements precisely."
      },
      {
        step: "2",
        title: "Custom Setup",
        desc: "Building call scripts, system integrations, and preparing the dedicated team for your account."
      },
      {
        step: "3",
        title: "Trial Operation",
        desc: "Limited performance measurement period, providing daily reports and direct adjustments before full expansion."
      },
      {
        step: "4",
        title: "Operation & Expansion",
        desc: "Full transition to live operation, with periodic reports and capacity scaling based on your business growth."
      },
    ]
  }
};

export default function HowItWorks() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeStepNum, setActiveStepNum] = useState<string | null>("1");
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const savedLang = (localStorage.getItem('lang') as 'ar' | 'en') || 'ar';
    setLang(savedLang);

    const checkLangInterval = setInterval(() => {
      const currentLang = (localStorage.getItem('lang') as 'ar' | 'en') || 'ar';
      if (currentLang !== lang) {
        setLang(currentLang);
      }
    }, 100);

    return () => clearInterval(checkLangInterval);
  }, [lang]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const triggerPoint = windowHeight / 2;

      Object.entries(cardRefs.current).forEach(([num, el]) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
            setActiveStepNum(num);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = dictionary[lang];

  return (
    <section id="how-it-works" className={`py-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            {t.sectionEyebrow}
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            {t.sectionTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {t.steps.map((item) => {
            const isActive = activeStepNum === item.step;
            return (
              <div
                key={item.step}
                ref={(el) => { cardRefs.current[item.step] = el; }}
                className={`relative rounded-3xl p-6 border transition-all duration-500 flex flex-col justify-between h-full select-none ${
                  isActive 
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-400 shadow-2xl ring-2 ring-emerald-500/20 lg:scale-105 -translate-y-2' 
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1'
                } ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              >
                <div>
                  <div className={`w-10 h-10 rounded-2xl font-black flex items-center justify-center text-lg mb-4 shadow-sm transition-all duration-500 ${
                    isActive 
                      ? 'bg-emerald-600 text-white scale-110 shadow-emerald-500/40 rotate-3' 
                      : 'bg-linear-to-tr from-blue-600 to-emerald-500 text-white'
                  }`}>
                    {item.step}
                  </div>
                  <h4 className={`text-lg font-bold mb-2 transition-colors duration-300 ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                    {item.title}
                  </h4>
                  <p className={`text-xs leading-relaxed transition-colors duration-300 ${isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                    {item.desc}
                  </p>
                </div>

                <div className={`mt-6 pt-4 border-t transition-colors duration-300 flex items-center justify-between text-xs font-semibold ${isActive ? 'border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'border-slate-200/60 dark:border-slate-800 text-slate-400'}`}>
                  
                  <span className={`transform transition-transform duration-300 ${isActive ? 'scale-125 text-emerald-500' : 'opacity-40'}`}>
                    ✦
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
