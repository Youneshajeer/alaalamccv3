'use client';

import React, { useState, useEffect } from 'react';
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';

const dictionaries = { ar, en };

export default function Hero() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const checkLang = () => {
      const htmlLang = document.documentElement.lang as 'ar' | 'en';
      const savedLang = (localStorage.getItem('lang') as 'ar' | 'en') || htmlLang || 'ar';
      setLang(savedLang === 'en' ? 'en' : 'ar');
    };

    checkLang();

    window.addEventListener('storage', checkLang);
    window.addEventListener('languageChanged', checkLang as EventListener);
    
    const observer = new MutationObserver(checkLang);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });

    return () => {
      window.removeEventListener('storage', checkLang);
      window.removeEventListener('languageChanged', checkLang as EventListener);
      observer.disconnect();
    };
  }, []);

  const t: any = dictionaries[lang]?.home?.hero || {};
  const translatedSlides = t?.slides || [];
  const cta = dictionaries[lang]?.common?.cta || { requestDemo: 'اطلب عرض خدمة', viewServices: 'استعرض الخدمات' };
  
  const scrollText = lang === 'en' ? 'More' : 'المزيد';

  const slides = [
    {
      image: '/images/gallery/sa-hosting.png',
      eyebrow: translatedSlides[0]?.eyebrow || (lang === 'en' ? '100% Saudi Cloud Hosting' : 'استضافة سحابية سعودية 100%'),
      title: translatedSlides[0]?.title || (lang === 'en' ? 'We run your customer communication, while you focus on growing your business' : 'نُشغّل خط التواصل مع عملائك، وأنت تركّز على نمو عملك'),
      description: translatedSlides[0]?.description || (lang === 'en' ? 'Alaalam Telecom & IT builds and operates dedicated contact centers in Saudi Arabia.' : 'حلول العالم للاتصالات وتقنية المعلومات تبني وتُشغّل مراكز اتصال مخصصة للشركات في السعودية.'),
      featureIcon: translatedSlides[0]?.featureIcon || '🏢',
      featureTitle: translatedSlides[0]?.featureTitle || (lang === 'en' ? 'Saudi Cloud Hosting' : 'استضافة سحابية سعودية'),
      featureDesc: translatedSlides[0]?.featureDesc || (lang === 'en' ? 'Flexible infrastructure hosted within the Kingdom.' : 'بنية تحتية مرنة ومستضافة داخل المملكة.')
    },
    {
      image: '/images/gallery/callCenterRegistration.png',
      eyebrow: translatedSlides[1]?.eyebrow || (lang === 'en' ? 'Compliant & Registered' : 'تسجيل نظامي ومعتمد'),
      title: translatedSlides[1]?.title || (lang === 'en' ? 'Integrated infrastructure for professional contact centers' : 'بنية تحتية متكاملة لمراكز الاتصال الاحترافية'),
      description: translatedSlides[1]?.description || (lang === 'en' ? 'We enable your company to provide exceptional communication services.' : 'نمكن شركتك من تقديم خدمات اتصال استثنائية وفق أعلى المعايير.'),
      featureIcon: translatedSlides[1]?.featureIcon || '📜',
      featureTitle: translatedSlides[1]?.featureTitle || (lang === 'en' ? 'Registered & Compliant' : 'تسجيل نظامي ومعتمد'),
      featureDesc: translatedSlides[1]?.featureDesc || (lang === 'en' ? 'Full compliance with regulatory requirements.' : 'توافق تام مع المتطلبات التنظيمية لقطاع الاتصالات.')
    },
    {
      image: '/images/gallery/watsapp-calls.png',
      eyebrow: translatedSlides[2]?.eyebrow || (lang === 'en' ? 'Multi-Channel Communication' : 'قنوات تواصل متعددة'),
      title: translatedSlides[2]?.title || (lang === 'en' ? 'Smart interactive management via phone and written chat' : 'إدارة تفاعلية ذكية عبر الهاتف والاتصال المكتوب'),
      description: translatedSlides[2]?.description || (lang === 'en' ? 'Connect with your customers seamlessly through multiple channels.' : 'تواصل مع عملائك بسلاسة عبر قنوات متعددة تشمل المكالمات والواتساب.'),
      featureIcon: translatedSlides[2]?.featureIcon || '💬',
      featureTitle: translatedSlides[2]?.featureTitle || (lang === 'en' ? 'Multi-Channel' : 'قنوات تواصل متعددة'),
      featureDesc: translatedSlides[2]?.featureDesc || (lang === 'en' ? 'Manage calls and live chat from a single platform.' : 'إدارة المكالمات والدردشة من منصة مركزية.')
    },
    {
      image: '/images/gallery/team.png',
      eyebrow: translatedSlides[3]?.eyebrow || (lang === 'en' ? 'Flexible Capacity & Qualified Teams' : 'سعة مرنة وطاقات مؤهلة'),
      title: translatedSlides[3]?.title || (lang === 'en' ? 'Professional teams managed efficiently to meet your needs' : 'فرق عمل احترافية تدار بكفاءة عالية لتلبية احتياجاتك'),
      description: translatedSlides[3]?.description || (lang === 'en' ? 'We provide you with the necessary staff and systems.' : 'نوفر لك الكوادر والأنظمة اللازمة لإدارة تفاعلات العملاء بكفاءة مرنة.'),
      featureIcon: translatedSlides[3]?.featureIcon || '👥',
      featureTitle: translatedSlides[3]?.featureTitle || (lang === 'en' ? 'Flexible Capacity' : 'سعة مرنة وطاقات مؤهلة'),
      featureDesc: translatedSlides[3]?.featureDesc || (lang === 'en' ? 'Workforce that scales effortlessly with your business.' : 'كوادر احترافية تتوسع بسهولة لتناسب حجم أعمالك.')
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const activeSlide = slides[currentSlide] || slides[0];

  return (
    <section 
      id="hero" 
      className={`relative w-full h-screen min-h-187.5 overflow-hidden bg-slate-950 flex items-center justify-center ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <style>{`
        @keyframes textGlowPulse {
          0%, 100% {
            color: #34d399;
            text-shadow: 0 0 14px rgba(52, 211, 153, 0.8);
          }
          50% {
            color: #059669;
            text-shadow: 0 0 4px rgba(5, 150, 105, 0.3);
          }
        }
        .animate-text-pulse {
          animation: textGlowPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(1.03) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            idx === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
          }`}
        >
          <img
            src={slide.image}
            alt="صورة العرض التفاعلي"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-slate-950/85 via-slate-950/50 to-slate-950/95"></div>
        </div>
      ))}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-25 w-full h-full flex flex-col justify-between py-12">
        
        <div className="w-full max-w-3xl mx-auto bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 px-6 py-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          
          <div className={`flex items-center gap-3.5 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
            <span className="text-xl sm:text-2xl p-2 bg-slate-900/90 rounded-xl shadow-inner border border-slate-700 shrink-0 text-emerald-400">
              {activeSlide.featureIcon}
            </span>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-white">
                {activeSlide.featureTitle}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                {activeSlide.featureDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? 'w-8 bg-blue-500 shadow-lg shadow-blue-500/50' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

        <div key={`${currentSlide}-${lang}`} className="space-y-4 animate-fade-in max-w-4xl mx-auto text-center my-auto">
          
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-900/80 border border-emerald-500/60 backdrop-blur-md shadow-xl mx-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs sm:text-sm font-extrabold animate-text-pulse tracking-wide text-emerald-300">
              {activeSlide.eyebrow}
            </span>
          </div>

          <h1 className={`font-black leading-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] ${lang === 'ar' ? 'text-2xl sm:text-4xl lg:text-5xl' : 'text-xl sm:text-3xl lg:text-4xl'}`}>
            {activeSlide.title}
          </h1>

          <p className="leading-relaxed max-w-3xl mx-auto font-medium text-slate-200 text-sm sm:text-base lg:text-lg drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            {activeSlide.description}
          </p>

          <div className="flex items-center justify-center gap-3 sm:gap-6 pt-2">
            
            <button
              onClick={handlePrev}
              className="w-11 h-11 rounded-full bg-slate-900/90 hover:bg-blue-600 text-white border border-slate-700 flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer group shrink-0"
              aria-label="Previous Slide"
            >
              <svg className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
              <a
                href="/contact"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 text-sm sm:text-base whitespace-nowrap"
              >
                {cta.requestDemo}
              </a>
              <a
                href="#services"
                className="bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 font-semibold px-8 py-3.5 rounded-xl backdrop-blur-md transition-all active:scale-95 shadow-md text-sm sm:text-base whitespace-nowrap"
              >
                {cta.viewServices}
              </a>
            </div>

            <button
              onClick={handleNext}
              className="w-11 h-11 rounded-full bg-slate-900/90 hover:bg-blue-600 text-white border border-slate-700 flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer group shrink-0"
              aria-label="Next Slide"
            >
              <svg className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

          </div>

          <div className="pt-3 flex flex-col items-center justify-center text-slate-300 animate-bounce pointer-events-none">
            <span className="text-xs font-semibold tracking-wider mb-0.5">{scrollText}</span>
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

        </div>

        <div></div>

      </div>

    </section>
  );
}