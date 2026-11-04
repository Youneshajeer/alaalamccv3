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
      const easeProgress = 1 - Math.pow(1 - progress, 3);

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

  
  const colors = [
    { stroke: '#65a30d', bg: '#f1f5f9' }, // Olive/Green
    { stroke: '#f97316', bg: '#f1f5f9' }, // Orange
    { stroke: '#16a34a', bg: '#f1f5f9' }, // Emerald
    { stroke: '#0ea5e9', bg: '#f1f5f9' }, // Sky Blue (fallback)
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative overflow-hidden bg-white text-slate-800 rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-200"
    >
      <div className={`relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        {enterpriseStats?.map((stat, idx) => {
          const currentVal = counts[idx] !== undefined ? counts[idx] : 0;
          const percentage = parsePercentage(stat.number);
          const radius = 42;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = isVisible 
            ? circumference - (percentage / 100) * circumference 
            : circumference;

          const is24_7 = stat.number.includes('24/7');
          const colorTheme = colors[idx % colors.length];

          return (
            <div 
              key={idx} 
              className="relative group p-6 sm:p-8 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col items-center justify-between overflow-hidden"
            >
              
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90">
                
                  <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke={colorTheme.bg}
                    strokeWidth="16"
                    fill="transparent"
                  />
                  
                  <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke={colorTheme.stroke}
                    strokeWidth="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
                    {is24_7 ? `${Math.floor(currentVal)}/7` : `${Math.floor(currentVal)}%`}
                  </span>
                </div>
              </div>

           
              <div className="text-center mt-6 w-full border-t border-slate-100 pt-4">
                <h3 className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
                  {stat.label}
                </h3>
                {stat.description && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {stat.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
