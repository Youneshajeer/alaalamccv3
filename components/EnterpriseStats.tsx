'use client';

import React, { useState, useEffect, useRef } from 'react';

interface EnterpriseStatsProps {
  enterpriseStats: Array<{ number: string; label: string; icon?: string }>;
  lang: string;
}

export default function EnterpriseStats({ enterpriseStats, lang }: EnterpriseStatsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState<{ [key: number]: number }>({});
  const sectionRef = useRef<HTMLDivElement>(null);

  // تفعيل مراقبة الوصول إلى القسم للبدء بالعد
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !enterpriseStats) return;

    const statsValues = enterpriseStats.map((stat) => {
      if (stat.number.includes("24/7")) return 24;
      const val = parseFloat(stat.number.replace(/[^0-9.]/g, ''));
      return isNaN(val) ? 100 : val;
    });

    const duration = 2000; 
    const steps = 60;
    const stepTime = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      const newCounts: { [key: number]: number } = {};
      statsValues.forEach((val, idx) => {
        const isDecimal = val === 99.9;
        newCounts[idx] = Number((val * progress).toFixed(isDecimal ? 1 : 0));
      });

      setCounts(newCounts);

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, enterpriseStats]);

  const parsePercentage = (numStr: string) => {
    if (numStr.includes("24/7")) return 100;
    const val = parseFloat(numStr.replace(/[^0-9.]/g, ''));
    return isNaN(val) ? 100 : Math.min(val, 100);
  };

  return (
    <div 
      ref={sectionRef}
      className="bg-slate-100 text-slate-900 rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className={`relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 ${lang === 'ar' ? 'lg:divide-x lg:divide-x-reverse' : 'lg:divide-x'} divide-slate-200 items-center`}>
        {enterpriseStats?.map((stat, idx) => {
          const currentVal = counts[idx] !== undefined ? counts[idx] : 0;
          const percentage = parsePercentage(stat.number);
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = isVisible 
            ? circumference - (percentage / 100) * circumference 
            : circumference;

          const is24_7 = stat.number.includes('24/7');

          return (
            <div key={idx} className={`${idx !== 0 ? 'pt-6 lg:pt-0' : ''} flex flex-col items-center space-y-4 group`}>
              
              <div className="relative w-28 h-28 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                
                <svg className="w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id={`blueToGreen-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" /> 
                      <stop offset="50%" stopColor="#0ea5e9" /> 
                      <stop offset="100%" stopColor="#10b981" /> 
                    </linearGradient>
                  </defs>

                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-200"
                    fill="transparent"
                  />

                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke={`url(#blueToGreen-${idx})`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl sm:text-2xl font-black text-rose-600 drop-shadow-sm">
                    {is24_7 ? `${currentVal}/7` : `${currentVal}${stat.number.includes('%') ? '%' : ''}`}
                  </span>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 font-medium px-2">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}