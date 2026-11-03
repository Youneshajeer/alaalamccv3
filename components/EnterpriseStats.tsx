
'use client'; 

import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatItem {
  number: string;
  label: string;
  icon?: LucideIcon | string; 
}

interface EnterpriseStatsProps {
  enterpriseStats: StatItem[];
  lang: string;
}

export default function EnterpriseStats({ enterpriseStats, lang }: EnterpriseStatsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState<{ [key: number]: number }>({});
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
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

    const duration = 2200; 
    const steps = 70;
    const stepTime = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const newCounts: { [key: number]: number } = {};
      statsValues.forEach((val, idx) => {
        const isDecimal = val.toString().includes('.') || statIsDecimal(enterpriseStats[idx]?.number);
        const currentNum = val * easeProgress;
        newCounts[idx] = Number(currentNum.toFixed(isDecimal ? 1 : 0));
      });

      setCounts(newCounts);

      if (currentStep >= steps) {
        clearInterval(timer);
        const finalCounts: { [key: number]: number } = {};
        statsValues.forEach((val, idx) => {
          finalCounts[idx] = val;
        });
        setCounts(finalCounts);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, enterpriseStats]);

  const statIsDecimal = (numStr?: string) => {
    if (!numStr) return false;
    return numStr.includes('.');
  };

  const parsePercentage = (numStr: string) => {
    if (numStr.includes("24/7")) return 100;
    const val = parseFloat(numStr.replace(/[^0-9.]/g, ''));
    return isNaN(val) ? 100 : Math.min(val, 100);
  };

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-700/60"
    >
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-center ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        {enterpriseStats?.map((stat, idx) => {
          const currentVal = counts[idx] !== undefined ? counts[idx] : 0;
          const percentage = parsePercentage(stat.number);
          const radius = 40;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = isVisible 
            ? circumference - (percentage / 100) * circumference 
            : circumference;

          const is24_7 = stat.number.includes('24/7');
          
          const IconComponent = typeof stat.icon === 'function' ? (stat.icon as LucideIcon) : null;

          return (
            <div 
              key={idx} 
              className="flex flex-col items-center text-center group p-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
            >
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id={`premiumGradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" /> 
                      <stop offset="50%" stopColor="#0ea5e9" /> 
                      <stop offset="100%" stopColor="#10b981" /> 
                    </linearGradient>
                  </defs>

                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-slate-700/50"
                    fill="transparent"
                  />

                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    stroke={`url(#premiumGradient-${idx})`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                
                  {IconComponent && <IconComponent className="w-5 h-5 text-emerald-400 mb-1 opacity-80 group-hover:scale-110 transition-transform" />}
                  <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-400">
                    {is24_7 ? `${Math.floor(currentVal)}/7` : `${currentVal}${stat.number.includes('%') ? '%' : ''}`}
                  </span>
                </div>
              </div>

              <h3 className="text-sm sm:text-base text-slate-300 font-medium px-2 leading-snug group-hover:text-white transition-colors">
                {stat.label}
              </h3>
            </div>
          );
        })}
      </div>
    </section>
  );
}
