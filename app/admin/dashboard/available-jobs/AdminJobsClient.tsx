'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/utils/useTranslation';
import Pagination from '@/components/Pagination';
import {
  createJobAction,
  updateJobAction,
  updateJobStatusAction,
  deleteJobAction
} from './actions';

export interface Job {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  deadline?: string;
  status: 'active' | 'closed';
}

interface JobsClientProps {
  initialJobs: Job[];
  userEmail?: string;
  userRole?: string;
  roleDisplayName?: string;
  permission: {
    allowdView: boolean;
    allowdCreate: boolean;
    allowdUpdate: boolean;
    allowdManage: boolean;
    allowdDelete: boolean;
    isAuthorized?: boolean;
  };
}

export default function AdminJobsClient({
  initialJobs,
  userEmail = '',
  userRole = '',
  roleDisplayName,
  permission,
}: JobsClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs || []);
  const [searchTitle, setSearchTitle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const { lang } = useTranslation();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [dateError, setDateError] = useState('');
  
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const router = useRouter();

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    const today = getTodayString();
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.deadline && job.deadline.split('T')[0] < today && job.status === 'active') {
          return { ...job, status: 'closed' };
        }
        return job;
      })
    );
  }, []);

  const totalJobsCount = jobs.length;
  const activeJobsCount = jobs.filter(job => job.status === 'active').length;
  const closedJobsCount = jobs.filter(job => job.status === 'closed').length;

  const handleDeadlineChange = (val: string) => {
    setFormDeadline(val);
    if (val && val < getTodayString()) {
      setDateError(
        lang === 'ar'
          ? 'يجب أن يكون التاريخ النهائي اليوم أو تاريخاً مستقبلياً أكبر من اليوم.'
          : 'The deadline must be today or a future date.'
      );
    } else {
      setDateError('');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesTitle = job.title.toLowerCase().includes(searchTitle.toLowerCase());
    const jobDateOnly = job.created_at ? job.created_at.split('T')[0] : '';
    const matchesDate =
      (!fromDate || jobDateOnly >= fromDate) &&
      (!toDate || jobDateOnly <= toDate);
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesTitle && matchesDate && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTitle, fromDate, toDate, statusFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const isFiltered = searchTitle !== '' || fromDate !== '' || toDate !== '' || statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearchTitle('');
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
  };

  const openEditModal = (job: Job) => {
    setSelectedJob(job);
    setFormTitle(job.title);
    setFormDescription(job.description || '');
    setFormDeadline(job.deadline ? job.deadline.split('T')[0] : '');
    setDateError('');
    setModalError('');
    setIsEditModalOpen(true);
  };

  const openViewModal = (job: Job) => {
    setSelectedJob(job);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormDeadline('');
    setDateError('');
    setModalError('');
    setSelectedJob(null);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || dateError) return;

    setLoading(true);
    setModalError('');
    try {
      const res = await createJobAction({
        title: formTitle,
        description: formDescription,
        experience_years: 0,
        deadline: formDeadline || null,
        status: 'active',
      });

      if (res.success && res.data) {
        setJobs([res.data[0] as Job, ...jobs]);
        setIsAddModalOpen(false);
        resetForm();
        router.refresh();
      } else {
        setModalError(res.error || 'حدث خطأ أثناء إنشاء الوظيفة');
      }
    } catch (err) {
      setModalError(lang === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !formTitle || dateError) return;

    setLoading(true);
    setModalError('');
    try {
      const res = await updateJobAction(selectedJob.id, {
        title: formTitle,
        description: formDescription,
        deadline: formDeadline || null,
      });

      if (res.success) {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === selectedJob.id
              ? { ...job, title: formTitle, description: formDescription, deadline: formDeadline || undefined }
              : job
          )
        );
        setIsEditModalOpen(false);
        resetForm();
        router.refresh();
      } else {
        setModalError(res.error || 'حدث خطأ أثناء تعديل الوظيفة');
      }
    } catch (err) {
      setModalError(lang === 'ar' ? 'حدث خطأ أثناء تعديل الوظيفة' : 'An error occurred while updating the job');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (job: Job) => {
    const nextStatus = job.status === 'active' ? 'closed' : 'active';

    if (nextStatus === 'active') {
      if (job.deadline && job.deadline.split('T')[0] < getTodayString()) {
        alert(
          lang === 'ar'
            ? '⚠️ تنبيه: لا يمكن جعل الوظيفة نشطة لأن تاريخ الانتهاء الحالي قد انتهى. يجب تعديل تاريخ الانتهاء أولاً ليكون اليوم أو تاريخاً مستقبلياً.'
            : '⚠️ Warning: Cannot activate the job because the deadline has passed. Please update the deadline first.'
        );
        return;
      }
    }

    try {
      const res = await updateJobStatusAction(job.id, nextStatus);
      if (res.success) {
        setJobs((prev) =>
          prev.map((item) => (item.id === job.id ? { ...item, status: nextStatus } : item))
        );
        router.refresh();
      } else {
        alert(res.error || 'تعذر تغيير حالة الوظيفة');
      }
    } catch (err) {
      alert(lang === 'ar' ? 'حدث خطأ أثناء تحديث الحالة' : 'An error occurred while updating status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الوظيفة نهائياً؟' : 'Are you sure you want to permanently delete this job?')) return;

    try {
      const res = await deleteJobAction(id);
      if (res.success) {
        setJobs((prev) => prev.filter((job) => job.id !== id));
        router.refresh();
      } else {
        alert(res.error || 'فشل حذف الوظيفة');
      }
    } catch (err) {
      alert(lang === 'ar' ? 'حدث خطأ أثناء الحذف' : 'An error occurred while deleting');
    }
  };

  const handleLogout = async () => {
    router.push('/admin/login');
  };

  const formatDateFormatted = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50/50 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm transition-colors duration-300">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {lang === 'ar' ? 'إدارة الوظائف الشاغرة' : 'Manage Job Vacancies'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
              <span>{lang === 'ar' ? 'مرحباً بعودتك،' : 'Welcome back,'}</span>
              <span className="font-mono text-emerald-600 font-bold">{userEmail || '---'}</span>

              {roleDisplayName && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border bg-emerald-100 border-emerald-300 text-emerald-700">
                  {roleDisplayName}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              {lang === 'ar' ? 'شركة حلول العالم للاتصالات وتقنية المعلومات' : 'Alaalam Solutions for Telecom & IT'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all"
            >
              <svg className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{lang === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
            </button>
          </div>
        </header>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {lang === 'ar' ? 'قائمة الوظائف' : 'Jobs List'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'ar' ? 'متابعة وإدارة الفرص الوظيفية المتاحة وتفاصيلها' : 'Track and manage available career opportunities and details'}
            </p>
          </div>
        </div>

        {permission?.allowdCreate ? (
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>{lang === 'ar' ? 'إضافة وظيفة جديدة' : 'Add New Job'}</span>
          </button>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-emerald-500/20 rounded-2xl shadow-sm hover:border-emerald-500/40 transition-all">
            <div className="text-slate-500 text-xs font-bold">
              {lang === 'ar' ? 'إجمالي الوظائف' : 'Total Jobs'}
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {totalJobsCount}
            </div>
          </div>

          <div className="p-4 bg-white border border-emerald-500/20 rounded-2xl shadow-sm hover:border-emerald-500/40 transition-all">
            <div className="text-slate-500 text-xs font-bold">
              {lang === 'ar' ? 'الوظائف النشطة' : 'Active Jobs'}
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {activeJobsCount}
            </div>
          </div>

          <div className="p-4 bg-white border border-emerald-500/20 rounded-2xl shadow-sm hover:border-emerald-500/40 transition-all">
            <div className="text-slate-500 text-xs font-bold">
              {lang === 'ar' ? 'الوظائف المغلقة' : 'Closed Jobs'}
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {closedJobsCount}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1.5">
                {lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
              </label>
              <input
                type="text"
                placeholder={lang === 'ar' ? 'ابحث بالحروف الأولى...' : 'Search by title...'}
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 font-medium rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1.5">
                {lang === 'ar' ? 'حالة الوظيفة' : 'Job Status'}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'closed')}
                className="w-full bg-white border border-slate-300 font-medium rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="active">{lang === 'ar' ? 'النشطة فقط' : 'Active Only'}</option>
                <option value="closed">{lang === 'ar' ? 'المغلقة فقط' : 'Closed Only'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1.5">
                {lang === 'ar' ? 'من تاريخ الإنشاء' : 'From Creation Date'}
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border border-slate-300 font-medium rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1.5">
                {lang === 'ar' ? 'إلى تاريخ الإنشاء' : 'To Creation Date'}
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border border-slate-300 font-medium rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs font-bold text-slate-500">
              {lang === 'ar' ? `إجمالي النتائج: ${filteredJobs.length}` : `Total Results: ${filteredJobs.length}`}
            </span>
            {isFiltered && (
              <button onClick={handleResetFilters} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">
                {lang === 'ar' ? 'إلغاء الفلاتر' : 'Reset Filters'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className={`w-full text-xs ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold">{lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</th>
                  <th className="p-4 font-bold">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Creation Date'}</th>
                  <th className="p-4 font-bold">{lang === 'ar' ? 'الموعد النهائي' : 'Deadline'}</th>
                  <th className="p-4 font-bold text-center">{lang === 'ar' ? 'شريط الحالة' : 'Status Bar'}</th>
                  <th className="p-4 font-bold text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {currentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      {lang === 'ar' ? 'لا توجد وظائف مطابقة للبحث.' : 'No matching jobs found.'}
                    </td>
                  </tr>
                ) : (
                  currentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors align-middle">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                      </td>
                      <td className="p-4 font-mono whitespace-nowrap">{formatDateFormatted(job.created_at)}</td>
                      <td className="p-4 font-mono whitespace-nowrap text-emerald-700 font-semibold">
                        {formatDateFormatted(job.deadline)}
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          job.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {job.status === 'active'
                            ? (lang === 'ar' ? '✓ نشط' : '✓ Active')
                            : (lang === 'ar' ? '✕ مغلق' : '✕ Closed')}
                        </span>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {permission?.allowdManage && (
                            <button
                              onClick={() => handleStatusChange(job)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                job.status === 'active'
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                              }`}
                              title={
                                job.status === 'active'
                                  ? (lang === 'ar' ? 'إغلاق الوظيفة' : 'Close Job')
                                  : (lang === 'ar' ? 'تنشيط الوظيفة' : 'Activate Job')
                              }
                            >
                              {job.status === 'active' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          )}
                        
                          {permission?.allowdView && (
                            <button
                              onClick={() => openViewModal(job)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200 transition-all cursor-pointer"
                              title={lang === 'ar' ? 'عرض كافة التفاصيل' : 'View Full Details'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}

                          {permission?.allowdUpdate && (
                            <button
                              onClick={() => openEditModal(job)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 transition-all cursor-pointer"
                              title={lang === 'ar' ? 'تعديل الوظيفة' : 'Edit Job'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                         
                          {permission?.allowdDelete && (
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                              title={lang === 'ar' ? 'حذف الوظيفة' : 'Delete Job'}
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
            totalResults={filteredJobs.length}
          />
        </div>

      </div>

      {isViewModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 border border-slate-100 my-auto">

            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                {lang === 'ar' ? 'تفاصيل الفرصة الوظيفية' : 'Job Opportunity Details'}
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto pr-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold">{lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</span>
                <p className="text-sm font-black text-slate-900">{selectedJob.title}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold">{lang === 'ar' ? 'تاريخ الإنشاء' : 'Creation Date'}</span>
                  <p className="font-mono font-bold text-slate-800">{formatDateFormatted(selectedJob.created_at)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-bold">{lang === 'ar' ? 'الموعد النهائي' : 'Deadline'}</span>
                  <p className="font-mono font-bold text-emerald-700">{formatDateFormatted(selectedJob.deadline)}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold">{lang === 'ar' ? 'الحالة الحالية' : 'Current Status'}</span>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                    selectedJob.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {selectedJob.status === 'active'
                      ? (lang === 'ar' ? '✓ نشط' : '✓ Active')
                      : (lang === 'ar' ? '✕ مغلق' : '✕ Closed')}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-slate-400 font-bold">{lang === 'ar' ? 'وصف الوظيفة والمتطلبات الكاملة' : 'Job Description & Full Requirements'}</span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200">
                  {selectedJob.description || (lang === 'ar' ? 'لا يوجد وصف إضافي متوفر لهذه الوظيفة.' : 'No additional description available for this job.')}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer transition-all shadow-md"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[95vh] flex flex-col p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 border border-slate-100 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {lang === 'ar' ? 'إضافة فرصة وظيفية جديدة' : 'Add New Job Opportunity'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: مطور برمجيات أول' : 'e.g. Senior Software Developer'}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === 'ar' ? 'وصف الوظيفة والمتطلبات' : 'Job Description & Requirements'}</label>
                <textarea
                  rows={4}
                  placeholder={lang === 'ar' ? 'اكتب تفاصيل ومسؤوليات ومتطلبات الوظيفة هنا...' : 'Enter job details, responsibilities, and requirements here...'}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === 'ar' ? 'الموعد النهائي للتقديم' : 'Application Deadline'}</label>
                <input
                  type="date"
                  min={getTodayString()}
                  value={formDeadline}
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                {dateError && (
                  <p className="text-rose-600 text-[11px] font-bold mt-1.5 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    ⚠️ {dateError}
                  </p>
                )}
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold text-center">
                  {modalError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading || !!dateError}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
                >
                  {loading
                    ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (lang === 'ar' ? 'حفظ ونشر الوظيفة' : 'Save & Publish Job')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[95vh] flex flex-col p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 border border-slate-100 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                {lang === 'ar' ? 'تعديل بيانات الوظيفة' : 'Edit Job Details'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateJob} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === 'ar' ? 'وصف الوظيفة والمتطلبات' : 'Job Description & Requirements'}</label>
                <textarea
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === 'ar' ? 'الموعد النهائي للتقديم' : 'Application Deadline'}</label>
                <input
                  type="date"
                  min={getTodayString()}
                  value={formDeadline}
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                {dateError && (
                  <p className="text-rose-600 text-[11px] font-bold mt-1.5 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    ⚠️ {dateError}
                  </p>
                )}
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold text-center">
                  {modalError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading || !!dateError}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
                >
                  {loading
                    ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (lang === 'ar' ? 'تحديث التعديلات' : 'Update Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}