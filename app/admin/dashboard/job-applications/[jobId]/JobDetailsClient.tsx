'use client';
import { useTranslation } from '@/utils/useTranslation';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import { updateApplicationStatus, deleteApplication, downloadCvAction, getSignedCvUrl, logoutAction } from '../actions';

interface Applicant {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  cv_url?: string;
  created_at: string;
}

interface JobDetailsProps {
  job: {
    id: string;
    title_ar?: string;
    title_en?: string;
    title?: string;
    description_ar?: string;
    description_en?: string;
    description?: string;
    department?: string;
    location?: string;
  };
  initialApplications: Applicant[];
  userEmail?: string;
  userRole?: string;
}

export default function JobDetailsClient({
  job,
  initialApplications,
  userEmail,
  userRole = 'supervisor',
}: JobDetailsProps) {
  const [applications, setApplications] = useState<Applicant[]>(initialApplications || []);
  const [loadingCvId, setLoadingCvId] = useState<string | null>(null);
  const router = useRouter();
  const { lang } = useTranslation();

  const handleStatusChange = async (id: string, newStatus: any) => {
    const res = await updateApplicationStatus(id, newStatus);
    if (res.success) {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
    } else {
      alert(res.error || (lang === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status'));
    }
  };

  const handleDeleteApp = async (id: string, cvUrl?: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this application?')) return;

    const res = await deleteApplication(id, cvUrl);
    if (res.success) {
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } else {
      alert(res.error || (lang === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
    }
  };

  const handleViewCv = async (id: string, cvUrl?: string) => {
    if (!cvUrl) return alert(lang === 'ar' ? 'لا توجد سيرة ذاتية مرفقة' : 'No CV attached');
    setLoadingCvId(id);
    try {
      const res = await getSignedCvUrl(cvUrl);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        alert(res.error || (lang === 'ar' ? 'تعذر فتح الملف' : 'Could not open file'));
      }
    } catch (err) {
      alert(lang === 'ar' ? 'تعذر فتح الملف' : 'Could not open file');
    } finally {
      setLoadingCvId(null);
    }
  };

  const handleDownloadCv = async (cvUrl?: string) => {
    if (!cvUrl) return alert(lang === 'ar' ? 'لا توجد سيرة ذاتية مرفقة' : 'No CV attached');
    
    const res = await downloadCvAction(cvUrl);
    if (res.success && res.base64) {
      const link = document.createElement('a');
      link.href = `data:${res.contentType || 'application/pdf'};base64,${res.base64}`;
      link.download = `CV_${Date.now()}.pdf`;
      link.click();
    } else {
      alert(res.error || (lang === 'ar' ? 'تعذر تحميل الملف' : 'Could not download file'));
    }
  };

  const jobTitle = lang === 'ar' ? (job.title_ar || job.title) : (job.title_en || job.title);
  const jobDescription = lang === 'ar' ? (job.description_ar || job.description) : (job.description_en || job.description);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <AdminHeader
          titleAr={`المتقدمون لوظيفة: ${jobTitle}`}
          titleEn={`Applicants for: ${jobTitle}`}
          lang={lang}
          userEmail={userEmail || ''}
          userRole={(userRole === 'admin' || userRole === 'supervisor') ? userRole : 'admin'}
          onLogout={logoutAction}
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
          >
            {lang === 'ar' ? '← العودة للوظائف' : '← Back to Jobs'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{jobTitle}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                {job.department && <span>🏢 {job.department}</span>}
                {job.location && <span>📍 {job.location}</span>}
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-4 py-1.5 rounded-2xl text-xs font-bold">
              {applications.length} {lang === 'ar' ? 'متقدمين إجمالي' : 'Total Applicants'}
            </div>
          </div>
          {jobDescription && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-4">
              {jobDescription}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 px-1">
            {lang === 'ar' ? 'سجل المتقدمين' : 'Applicants List'}
          </h3>

          {applications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs font-semibold shadow-sm">
              {lang === 'ar' ? 'لا توجد طلبات تقدم لهذه الوظيفة حتى الآن.' : 'No applications found for this job.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      {app.full_name}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                        app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                        app.status === 'under_review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {app.status === 'accepted' ? (lang === 'ar' ? 'مقبول' : 'Accepted') :
                         app.status === 'rejected' ? (lang === 'ar' ? 'مرفوض' : 'Rejected') :
                         app.status === 'under_review' ? (lang === 'ar' ? 'قيد المراجعة' : 'Under Review') :
                         (lang === 'ar' ? 'قيد الانتظار' : 'Pending')}
                      </span>
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-3 items-center">
                      <span>✉️ {app.email}</span>
                      <span>•</span>
                      <span>📞 {app.phone}</span>
                      <span>•</span>
                      <span>📅 {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="pending">{lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                      <option value="under_review">{lang === 'ar' ? 'قيد المراجعة' : 'Under Review'}</option>
                      <option value="accepted">{lang === 'ar' ? 'مقبول' : 'Accepted'}</option>
                      <option value="rejected">{lang === 'ar' ? 'مرفوض' : 'Rejected'}</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      {app.cv_url && (
                        <>
                          <button
                            onClick={() => handleViewCv(app.id, app.cv_url)}
                            disabled={loadingCvId === app.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900 transition-all cursor-pointer disabled:opacity-40"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{loadingCvId === app.id ? '...' : (lang === 'ar' ? 'السيرة' : 'CV')}</span>
                          </button>

                          <button
                            onClick={() => handleDownloadCv(app.cv_url)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{lang === 'ar' ? 'تحميل' : 'Download'}</span>
                          </button>
                        </>
                      )}

                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDeleteApp(app.id, app.cv_url)}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all cursor-pointer"
                          title={lang === 'ar' ? 'حذف الطلب' : 'Delete Application'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}