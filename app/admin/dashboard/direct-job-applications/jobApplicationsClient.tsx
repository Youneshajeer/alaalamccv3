'use client';
import { useTranslation } from '@/utils/useTranslation';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import Pagination from '@/components/Pagination';

import {
  getSignedCvUrl,
  updateApplicationStatus,
  deleteApplication,
  logoutAction,
  downloadCvAction,
} from './actions';
import { supabase } from '@/lib/supabase/supabase';

export interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  cv_url?: string | null;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  created_at: string;
  cv_path?: string | null;
}

interface DashboardClientProps {
  initialApplications: Application[];
  userEmail?: string;
  userRole?: string;
  roleDisplayName?: string;
  permission: {
    allowdView: boolean;
    allowdManage: boolean;
    allowdDelete: boolean;
    isAuthorized?: boolean;
  };
}

export default function JobApplications({
  initialApplications,
  userEmail,
  userRole = 'admin',
  roleDisplayName,
  permission,
}: DashboardClientProps) {
  const [applications, setApplications] = useState<Application[]>(initialApplications || []);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadingCvId, setLoadingCvId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'under_review' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const router = useRouter();
  const { lang } = useTranslation();

  useEffect(() => {
    const channel = supabase
      .channel('careers-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'careers',
        },
        (payload) => {
          const newApp = payload.new as Application;
          setApplications((prev) => [newApp, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDownloadCv = async (rawCvPath?: string | null, applicantName?: string) => {
    if (!rawCvPath) {
      alert(lang === 'ar' ? 'مسار السيرة الذاتية غير متوفر' : 'CV path not found');
      return;
    }

    try {
      const res = await downloadCvAction(rawCvPath);

      if (!res.success || !res.base64) {
        alert(lang === 'ar' ? 'تعذر تحميل الملف، تأكد من وجوده في التخزين.' : 'Failed to download file.');
        return;
      }

      const byteCharacters = atob(res.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: res.contentType });

      const blobUrl = window.URL.createObjectURL(blob);
      const safeName = (applicantName || 'Applicant').trim().replace(/\s+/g, '_');

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `CV_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error('Error downloading file:', err);
      alert(lang === 'ar' ? 'حدث خطأ أثناء تحميل الملف.' : 'Error downloading file.');
    }
  };

  const handleViewCV = async (appId: string, rawCvUrl?: string | null) => {
    if (!rawCvUrl) {
      alert(lang === 'ar' ? 'رابط السيرة الذاتية غير متوفر.' : 'CV URL is missing.');
      return;
    }
    setLoadingCvId(appId);
    try {
      const res = await getSignedCvUrl(rawCvUrl);
      if (res.success && res.url) {
        window.open(res.url, '_blank');
      } else {
        alert(res.error || (lang === 'ar' ? 'تعذر فتح الملف' : 'Could not open file'));
      }
    } catch (err) {
      alert(lang === 'ar' ? 'حدث خطأ أثناء فتح الملف' : 'Error opening file');
    } finally {
      setLoadingCvId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'under_review' | 'accepted' | 'rejected') => {
    setUpdatingId(id);
    try {
      const response = await updateApplicationStatus(id, newStatus);
      if (response.success) {
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
      } else {
        alert(response.error || (lang === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status'));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, cvUrl?: string | null) => {
    const confirmMsg = lang === 'ar'
      ? 'هل أنت متأكد من حذف هذا الطلب والسيرة الذاتية الخاصة به نهائياً؟'
      : 'Are you sure you want to delete this application and its CV permanently?';

    if (!confirm(confirmMsg)) return;

    try {
      const res = await deleteApplication(id, cvUrl);
      if (res.success) {
        setApplications((prev) => prev.filter((app) => app.id !== id));
      } else {
        alert(res.error || (lang === 'ar' ? 'فشل حذف الطلب' : 'Failed to delete application'));
      }
    } catch (err) {
      alert(lang === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting application');
    }
  };

  const handleLogout = async () => {
    await logoutAction();
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch =
      app.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const totalApplications = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const underReviewCount = applications.filter((a) => a.status === 'under_review').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">

        <AdminHeader
          titleAr="إدارة طلبات التوظيف المباشرة"
          titleEn="Direct Job Applications Management"
          lang={lang}
          userEmail={userEmail || ''}
          userRole={(userRole === 'admin' || userRole === 'supervisor') ? userRole : 'admin'}
          onLogout={handleLogout}
        />

        {/* بطاقة معلومات سريعة عن الدور المستخدم */}
        {roleDisplayName && (
          <div className="text-xs text-slate-500 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span>{userEmail}</span>
            <span className="font-bold text-emerald-600">{roleDisplayName}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
            <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {lang === 'ar' ? 'إجمالي الطلبات' : 'Total Applications'}
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {totalApplications}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
            <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {lang === 'ar' ? 'جديدة / معلقة' : 'Pending'}
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {pendingCount}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
            <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {lang === 'ar' ? 'قيد المراجعة' : 'Under Review'}
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {underReviewCount}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
            <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {lang === 'ar' ? 'المقبولة' : 'Accepted'}
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {acceptedCount}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
            <div className="text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {lang === 'ar' ? 'المرفوضة' : 'Rejected'}
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {rejectedCount}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm transition-colors">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={lang === 'ar' ? 'ابحث بالاسم أو البريد أو الجوال...' : 'Search by name, email or phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {(['all', 'pending', 'under_review', 'accepted', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === status
                    ? status === 'under_review'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status === 'all' && (lang === 'ar' ? 'الكل' : 'All')}
                {status === 'pending' && (lang === 'ar' ? 'قيد الانتظار' : 'Pending')}
                {status === 'under_review' && (lang === 'ar' ? 'قيد المراجعة' : 'Under Review')}
                {status === 'accepted' && (lang === 'ar' ? 'المقبولة' : 'Accepted')}
                {status === 'rejected' && (lang === 'ar' ? 'المرفوضة' : 'Rejected')}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">{lang === 'ar' ? 'المتقدم' : 'Applicant'}</th>
                  <th className="py-4 px-6">{lang === 'ar' ? 'معلومات الاتصال' : 'Contact'}</th>
                  <th className="py-4 px-6">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="py-4 px-6">{lang === 'ar' ? 'السيرة الذاتية' : 'Resume'}</th>
                  <th className="py-4 px-6 text-center">{lang === 'ar' ? 'حالة الطلب' : 'Status'}</th>
                  <th className="py-4 px-6 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {currentApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                      {lang === 'ar' ? 'لا توجد طلبات توظيف متطابقة.' : 'No applications found.'}
                    </td>
                  </tr>
                ) : (
                  currentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{app.name}</div>
                      </td>
                      <td className="py-4 px-6 space-y-1 dir-ltr text-right">
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-mono">{app.email}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{app.phone}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {permission?.allowdView ? (
                            <button
                              onClick={() => handleViewCV(app.id, app.cv_url)}
                              disabled={loadingCvId === app.id || !app.cv_url}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>
                                {loadingCvId === app.id
                                  ? '...'
                                  : app.cv_url
                                    ? (lang === 'ar' ? 'عرض الـ CV' : 'View CV')
                                    : (lang === 'ar' ? 'غير مرفق' : 'No CV')}
                              </span>
                            </button>
                          ) : null}

                          {permission?.allowdView ? (
                            <button
                              onClick={() => handleDownloadCv(app.cv_path || app.cv_url || '', app.name || 'Applicant')}
                              disabled={!app.cv_path && !app.cv_url}
                              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold disabled:opacity-40 cursor-pointer"
                              title={lang === 'ar' ? 'تحميل السيرة الذاتية' : 'Download CV'}
                            >
                              {lang === 'ar' ? 'تنزيل PDF' : 'Download PDF'}
                            </button>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            app.status === 'accepted'
                              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20'
                              : app.status === 'under_review'
                              ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20'
                              : 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20'
                          }`}
                        >
                          {app.status === 'accepted'
                            ? lang === 'ar' ? 'مقبول' : 'Accepted'
                            : app.status === 'rejected'
                            ? lang === 'ar' ? 'مرفوض' : 'Rejected'
                            : app.status === 'under_review'
                            ? lang === 'ar' ? 'قيد المراجعة' : 'Under Review'
                            : lang === 'ar' ? 'معلق' : 'Pending'}
                        </span>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {permission?.allowdManage && (
                            <button
                              title={lang === 'ar' ? 'قبول الطلب' : 'Accept'}
                              onClick={() => handleStatusChange(app.id, 'accepted')}
                              disabled={updatingId === app.id || app.status === 'accepted'}
                              className={`p-2 rounded-xl transition-all border ${
                                app.status === 'accepted'
                                  ? 'bg-emerald-500 text-white border-emerald-400 opacity-50 cursor-not-allowed'
                                  : 'bg-slate-100 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/40 cursor-pointer'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}

                          {permission?.allowdManage && (
                            <button
                              onClick={() => handleStatusChange(app.id, 'under_review')}
                              disabled={updatingId === app.id || app.status === 'under_review'}
                              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-lg hover:bg-amber-600 hover:text-white transition-all text-xs disabled:opacity-40 cursor-pointer"
                            >
                              {lang === 'ar' ? 'قيد المراجعة' : 'Under Review'}
                            </button>
                          )}

                          {permission?.allowdManage && (
                            <button
                              title={lang === 'ar' ? 'تعيين كقيد الانتظار' : 'Set Pending'}
                              onClick={() => handleStatusChange(app.id, 'pending')}
                              disabled={updatingId === app.id || app.status === 'pending'}
                              className={`p-2 rounded-xl transition-all border ${
                                app.status === 'pending'
                                  ? 'bg-amber-500 text-white border-amber-400 opacity-50 cursor-not-allowed'
                                  : 'bg-slate-100 dark:bg-slate-950 hover:bg-amber-50 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/40 cursor-pointer'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}

                          {permission?.allowdManage && (
                            <button
                              title={lang === 'ar' ? 'رفض الطلب' : 'Reject'}
                              onClick={() => handleStatusChange(app.id, 'rejected')}
                              disabled={updatingId === app.id || app.status === 'rejected'}
                              className={`p-2 rounded-xl transition-all border ${
                                app.status === 'rejected'
                                  ? 'bg-rose-500 text-white border-rose-400 opacity-50 cursor-not-allowed'
                                  : 'bg-slate-100 dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-500/40 cursor-pointer'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}

                          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>

                          {permission?.allowdDelete && (
                            <button
                              onClick={() => handleDelete(app.id, app.cv_url)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 transition-all cursor-pointer"
                              title={lang === 'ar' ? 'حذف الطلب' : 'Delete Application'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            lang={lang}
            totalResults={filteredApplications.length}
          />
        </div>

      </div>
    </div>
  );
}