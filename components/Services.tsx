'use client';

import React, { useState, useEffect, useRef } from 'react';

const dictionary = {
  ar: {
    sectionEyebrow: "خدمات مراكز الاتصال",
    sectionTitle: "حلول تشغيلية متكاملة لخدمة عملائك",
    servicesList: [
      {
        num: "01",
        title: "الاستقبال والدعم",
        desc: "استقبال استفسارات العملاء، الرد على الشكاوى، وتوجيه الطلبات وفق سياسة كل عميل مع ضمان أفضل انطباع.",
        icon: "🎧"
      },
      {
        num: "02",
        title: "المبيعات الهاتفية",
        desc: "حملات تسويق وبيع صادرة، تأهيل العملاء المحتملين، وجدولة المواعيد لفِرَق المبيعات الميدانية لزيادة المبيعات.",
        icon: "📞"
      },
      {
        num: "03",
        title: "الدعم الفني",
        desc: "معالجة أعطال المستوى الأول، تتبع التذاكر، والتصعيد المنظم لفريق العميل التقني بسرعة واحترافية.",
        icon: "🛠"
      },
      {
        num: "04",
        title: "القنوات المكتوبة",
        desc: "واتساب للأعمال، البريد الإلكتروني، والدردشة الحية — بنفس معايير الجودة الصوتية العالية.",
        icon: "📩"
      },
    ]
  },
  en: {
    sectionEyebrow: "Call Center Services",
    sectionTitle: "Integrated Operational Solutions to Serve Your Customers",
    servicesList: [
      {
        num: "01",
        title: "Inbound & Support",
        desc: "Receiving customer inquiries, handling complaints, and routing requests according to each client's policy to ensure the best impression.",
        icon: "🎧"
      },
      {
        num: "02",
        title: "Telemarketing & Sales",
        desc: "Outbound marketing and sales campaigns, qualifying leads, and scheduling appointments for field sales teams to boost sales.",
        icon: "📞"
      },
      {
        num: "03",
        title: "Technical Support",
        desc: "First-level troubleshooting, ticket tracking, and organized escalation to the client's technical team swiftly and professionally.",
        icon: "🛠"
      },
      {
        num: "04",
        title: "Written Channels",
        desc: "WhatsApp Business, email, and live chat — with the same high standards of voice quality.",
        icon: "📩"
      },
    ]
  }
};

export default function Services() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeCardNum, setActiveCardNum] = useState<string | null>("01");
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
            setActiveCardNum(num);
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
    <section id="services" className={`py-20 bg-white dark:bg-slate-950 transition-colors duration-300 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            {t.sectionEyebrow}
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">
            {t.sectionTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {t.servicesList.map((service) => {
            const isActive = activeCardNum === service.num;
            return (
              <div
                key={service.num}
                ref={(el) => { cardRefs.current[service.num] = el; }}
                className={`group relative rounded-3xl p-6 sm:p-8 border transition-all duration-500 flex flex-col justify-between h-full select-none ${
                  isActive 
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-400 shadow-2xl ring-2 ring-emerald-500/20 lg:scale-105 -translate-y-2' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1'
                } ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-3xl font-black transition-colors duration-300 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-500'}`}>
                      {service.num}
                    </span>
                    <span className={`text-3xl p-3 rounded-2xl shadow-sm border transition-all duration-500 ${
                      isActive 
                        ? 'bg-emerald-600 text-white border-emerald-500 scale-110 shadow-emerald-500/40 rotate-3' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                      {service.icon}
                    </span>
                  </div>
                  <h4 className={`text-xl font-bold mb-3 transition-colors duration-300 ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                    {service.title}
                  </h4>
                  <p className={`text-sm leading-relaxed transition-colors duration-300 ${isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                    {service.desc}
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
