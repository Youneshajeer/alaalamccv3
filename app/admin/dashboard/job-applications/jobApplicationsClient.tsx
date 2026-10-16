'use client';
import { useTranslation } from '@/utils/useTranslation';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import Pagination from '@/components/Pagination';
import { logoutAction, deleteJobAction } from './actions';

export interface Job {
  id: string;
  title_ar?: string;
  title_en?: string;
  title?: string;
  description_ar?: string;
  description_en?: string;
  description?: string;
  department?: string;
  location?: string;
  created_at: string;
  deadline?: string;    
  expires_at?: string;  
  applicants_count?: number;
}

interface JobsClientProps {
  initialJobs: Job[];
  userEmail?: string;
  userRole?: string;
  permission: {
    allowdView: boolean,
    allowdManage: boolean,
    allowdDelete: boolean,
    isAuthorized: boolean,


  }
}

export default function JobApplicationsClient({
  initialJobs,
  userEmail,
  userRole = 'admin',
  permission,
}: JobsClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs || []);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const router = useRouter();
  const { lang } = useTranslation();


  const handleDelete = async (id: string) => {
    const confirmMsg = lang === 'ar'
      ? 'هل أنت متأكد من حذف هذه الوظيفة نهائياً؟'
      : 'Are you sure you want to delete this job permanently?';

    if (!confirm(confirmMsg)) return;

    const res = await deleteJobAction(id);
    if (res.success) {
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } else {
      alert(res.error || (lang === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
    }
  };

  
  const jobTitlesList = Array.from(
    new Set(
      jobs
        .map((j: any) => {
          const title = lang === 'ar' ? (j.title_ar || j.title) : (j.title_en || j.title);
          return title?.trim();
        })
        .filter((t): t is string => Boolean(t && t.length > 0))
    )
  );

  const filteredJobs = jobs.filter((job) => {
    const title = lang === 'ar' ? (job.title_ar || job.title) : (job.title_en || job.title);
    const matchesSearch = title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;

    const matchesSelectedJob =
      selectedDepartment === 'all' ||
      (title && title.toLowerCase().includes(selectedDepartment.toLowerCase()));

    return matchesSearch && matchesSelectedJob;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        <AdminHeader
          titleAr="إدارة الوظائف المعلن عنها"
          titleEn="Posted Jobs Management"
          lang={lang}
          userEmail={userEmail || ''}
          userRole={(userRole === 'admin' || userRole === 'supervisor') ? userRole : 'admin'}
          onLogout={logoutAction}
        />

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={lang === 'ar' ? 'ابحث عن عنوان الوظيفة...' : 'Search job title...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{lang === 'ar' ? 'جميع الإعلانات (الوظائف)' : 'All Job Postings'}</option>
              {jobTitlesList.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentJobs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs font-semibold">
            {lang === 'ar' ? 'لا توجد وظائف معلن عنها مطابقة للبحث.' : 'No posted jobs found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentJobs.map((job) => {
              const jobTitle = lang === 'ar' ? (job.title_ar || job.title) : (job.title_en || job.title);
              const deadlineDate = job.deadline || job.deadline || job.expires_at;

              return (
                <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {jobTitle || 'وظيفة بدون عنوان'}
                      </h3>
{permission?.allowdView?(<button
                        onClick={() => setSelectedJob(job)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-emerald-50 text-emerald-600 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                        title={lang === 'ar' ? 'عرض وصف الوظيفة' : 'View Job Description'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>):(
                        <div></div>)}                      
                      
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{job.department || '-'}</span>
                      <span>•</span>
                      <span>{job.location || '-'}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <div>
                        <span className="font-semibold">{lang === 'ar' ? 'تاريخ النشر:' : 'Posted:'}</span>{' '}
                        {job.created_at ? new Date(job.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                      </div>
                      {deadlineDate && (
                        <div>
                          <span className="font-semibold text-rose-500">{lang === 'ar' ? 'الموعد النهائي:' : 'Deadline:'}</span>{' '}
                          {new Date(deadlineDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {lang === 'ar' ? 'المتقدمين:' : 'Applicants:'} <span className="text-emerald-600 font-bold">{job.applicants_count || 0}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/dashboard/job-applications/${job.id}`)}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold cursor-pointer"
                      >
                        {lang === 'ar' ? 'المتقدمون' : 'View Applicants'}
                      </button>
{permission?.allowdDelete?(<button
                        onClick={() => handleDelete(job.id)}
                        className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                        title={lang === 'ar' ? 'حذف الوظيفة' : 'Delete'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>):(<div></div>)}                      

                      
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          lang={lang}
          totalResults={filteredJobs.length}
        />

      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">
              {lang === 'ar' ? (selectedJob.title_ar || selectedJob.title) : (selectedJob.title_en || selectedJob.title)}
            </h3>

            <div className="text-xs text-slate-500 space-y-1">
              <div>{lang === 'ar' ? 'القسم:' : 'Department:'} <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedJob.department || '-'}</span> | {lang === 'ar' ? 'الموقع:' : 'Location:'} <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedJob.location || '-'}</span></div>
              <div className="pt-1 flex gap-4">
                <span>{lang === 'ar' ? 'تاريخ النشر:' : 'Posted:'} {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleDateString() : '-'}</span>
                {(selectedJob.deadline || selectedJob.expires_at) && (
                  <span className="text-rose-500 font-medium">
                    {lang === 'ar' ? 'الموعد النهائي:' : 'Deadline:'} {new Date(selectedJob.deadline || selectedJob.expires_at || '').toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
              {lang === 'ar' ? (selectedJob.description_ar || selectedJob.description) : (selectedJob.description_en || selectedJob.description)}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-300 transition-colors"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}