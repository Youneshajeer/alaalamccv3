'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/utils/useTranslation';

interface JobsListProps {
  jobs: any[];
  lang?: 'ar' | 'en';
}

export default function JobsList({ jobs }: JobsListProps) {
    const { lang,t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); 

  const departments = useMemo(() => {
    const depts = jobs.map((job) => job.department).filter(Boolean);
    return Array.from(new Set(depts));
  }, [jobs]);

  const isExpired = (deadline: string) => {
    if (!deadline) return false;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate < today;
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = 
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'all' || job.department === selectedDept;

      const expired = isExpired(job.deadline);
      const isActiveStatus = job.status === 'active' && !expired;

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = isActiveStatus;
      } else if (statusFilter === 'expired') {
        matchesStatus = !isActiveStatus;
      }

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [jobs, searchQuery, selectedDept, statusFilter]);

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-xs mx-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{lang === 'ar' ? 'فرص العمل المتاحة' : 'Available Opportunities'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {lang === 'ar' ? 'انضم إلى فريق عملنا المتميز' : 'Join Our Exceptional Team'}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
          {lang === 'ar' 
            ? 'استكشف الشواغر الوظيفية المتاحة حالياً وتقدم بطلبك مباشرة بخطوات سهلة وبسيطة.' 
            : 'Explore current job openings and apply directly with simple steps.'}
        </p>
      </div>

      <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <input
              type="text"
              placeholder={lang === 'ar' ? 'ابحث عن مسمى وظيفي أو كلمات دلالية...' : 'Search by title or keywords...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">{lang === 'ar' ? 'جميع الأقسام' : 'All Departments'}</option>
              {departments.map((dept: string, idx: number) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{lang === 'ar' ? 'النشطة فقط' : 'Active Only'}</option>
              <option value="expired">{lang === 'ar' ? 'المنتهية / غير النشطة' : 'Expired / Inactive'}</option>
            </select>
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
          <p className="text-slate-500 dark:text-slate-400 text-base">
            {lang === 'ar' 
              ? 'لا توجد وظائف تطابق بحثك الحالي. يمكنك تقديم طلب توظيف عام.' 
              : 'No jobs match your current search. You can submit a general application.'}
          </p>
          <div className="mt-6">
            <Link 
              href="/careers" 
              className="inline-block px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'تقديم طلب توظيف عام' : 'Submit General Application'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredJobs.map((job: any) => {
            const expired = isExpired(job.deadline);
            const isActive = job.status === 'active' && !expired;

            return (
              <div 
                key={job.id} 
                className={`group bg-slate-50/50 dark:bg-slate-900/40 border rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-300 ${
                  isActive ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50' : 'border-red-200/60 dark:border-red-950/40 opacity-75'
                }`}
              >
                <div className="space-y-2 grow">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {job.title}
                    </h3>
                    
                    <span className="px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/50 dark:border-emerald-800/50">
                      {job.department || (lang === 'ar' ? 'عام' : 'General')}
                    </span>

                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {lang === 'ar' ? 'نشط' : 'Active'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {expired ? (lang === 'ar' ? 'انتهى الموعد' : 'Deadline Passed') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed max-w-2xl">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>⏳</span>
                    <span>
                      {job.deadline 
                        ? `${lang === 'ar' ? 'الموعد النهائي:' : 'Deadline:'} ${job.deadline.split('T')[0]}` 
                        : (lang === 'ar' ? 'متاح حتى إشعار آخر' : 'Open until filled')}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {isActive ? (
                    <Link 
                      href={`/careers?jobId=${job.id}`} 
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <span>{lang === 'ar' ? 'تقديم على الوظيفة' : 'Apply Now'}</span>
                      <span className="rtl:rotate-180">→</span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-sm cursor-not-allowed"
                    >
                      <span>{expired ? (lang === 'ar' ? 'انتهى موعد التقديم' : 'Deadline Passed') : (lang === 'ar' ? 'تم اختيار المرشح / مغلق' : 'Closed / Filled')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}