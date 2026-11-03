
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatItem {
  number: string;
  label: string;
  icon?: LucideIcon | string;
  description?: descriptionType; 
}

type descriptionType = string;

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
      const easeProgress = 1 - Math.pow(1 - progress, 3); // حركة انسيابية ناعمة

      const newCounts: { [key: number]: number } = {};
      statsValues.forEach((val, idx) => {
        const isDecimal = val.toString().includes('.') || enterpriseStats[idx]?.number.includes('.');
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

  const parsePercentage = (numStr: string) => {
    if (numStr.includes("24/7")) return 100;
    const val = parseFloat(numStr.replace(/[^0-9.]/g, ''));
    return isNaN(val) ? 100 : Math.min(val, 100);
  };

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0a0f1d] text-slate-100 rounded-3xl p-6 sm:p-12 shadow-2xl border border-slate-800/80"
    >
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      
      <div className={`relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        {enterpriseStats?.map((stat, idx) => {
          const currentVal = counts[idx] !== undefined ? counts[idx] : 0;
          const percentage = parsePercentage(stat.number);
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = isVisible 
            ? circumference - (percentage / 100) * circumference 
            : circumference;

          const is24_7 = stat.number.includes('24/7');
          const IconComponent = typeof stat.icon === 'function' ? (stat.icon as LucideIcon) : null;

          return (
            <div 
              key={idx} 
              className="relative group p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)] flex flex-col justify-between overflow-hidden"
            >
              
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="flex items-center justify-between w-full mb-6 relative z-10">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 tracking-wide uppercase">
                  Verified
                </span>
                {IconComponent && (
                  <div className="p-2 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-700/50 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all duration-300 shadow-inner">
                    <IconComponent className="w-5 h-5" />
                  </div>
                )}
              </div>

    
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-2 relative z-10">
                <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  <defs>
                    <linearGradient id={`neonGradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />  {/* Cyan */}
                      <stop offset="50%" stopColor="#0ea5e9" />  {/* Sky Blue */}
                      <stop offset="100%" stopColor="#10b981" /> {/* Emerald */}
                    </linearGradient>
                  </defs>

                  
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="5"
                    className="text-slate-800"
                    fill="transparent"
                  />

                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    stroke={`url(#neonGradient-${idx})`}
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tighter text-white group-hover:text-cyan-300 transition-colors">
                    {is24_7 ? `${Math.floor(currentVal)}/7` : `${currentVal}${stat.number.includes('%') ? '%' : ''}`}
                  </span>
                </div>
              </div>

              
              <div className="text-center mt-4 relative z-10">
                <h3 className="text-sm sm:text-base font-medium text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                  {stat.label}
                </h3>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
