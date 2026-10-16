'use client';

import { useTranslation } from '@/utils/useTranslation';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import { updateApplicationStatus, deleteApplication, downloadCvAction, getSignedCvUrl, logoutAction } from '../actions';
import { 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Briefcase, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  Building2,
  RotateCcw
} from 'lucide-react';

interface Applicant {
  id: string;
  full_name?: string;
  name?: string;
  email: string;
  phone: string;
  experience?: string;
  department?: string;
  position?: string;
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  const handleResetFilters = () => {
    setSearchQuery('');
    setDepartmentQuery('');
    setStatusFilter('all');
    setExperienceFilter('all');
    setCurrentPage(1);
  };

  const jobTitle = lang === 'ar' ? (job.title_ar || job.title) : (job.title_en || job.title);
  const jobDescription = lang === 'ar' ? (job.description_ar || job.description) : (job.description_en || job.description);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const name = app.full_name || app.name || '';
      const position = app.position || jobTitle || '';
      const experience = app.experience || '';
      const dept = app.department || job.department || '';

      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.phone.includes(searchQuery) ||
        position.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDeptQuery = dept.toLowerCase().includes(departmentQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesExperience = experienceFilter === 'all' || experience.includes(experienceFilter);

      return matchesSearch && matchesDeptQuery && matchesStatus && matchesExperience;
    });
  }, [applications, searchQuery, departmentQuery, statusFilter, experienceFilter, jobTitle, job.department]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(start, start + itemsPerPage);
  }, [filteredApplications, currentPage]);

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
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer flex items-center gap-2"
          >
            <span>{lang === 'ar' ? '← العودة للوظائف' : '← Back to Jobs'}</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                {jobTitle}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                {job.department && <span>🏢 {job.department}</span>}
                {job.location && <span>📍 {job.location}</span>}
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-4 py-1.5 rounded-2xl text-xs font-bold">
              {filteredApplications.length} {lang === 'ar' ? 'متقدم مطابق' : 'Matching Applicants'}
            </div>
          </div>
          {jobDescription && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-4">
              {jobDescription}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث بالاسم، البريد...' : 'Search by name, email...'}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="relative">
              <Building2 className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث بالتخصص أو القسم...' : 'Search by department...'}
                value={departmentQuery}
                onChange={(e) => { setDepartmentQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="pending">{lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                <option value="under_review">{lang === 'ar' ? 'قيد المراجعة' : 'Under Review'}</option>
                <option value="accepted">{lang === 'ar' ? 'مقبول' : 'Accepted'}</option>
                <option value="rejected">{lang === 'ar' ? 'مرفوض' : 'Rejected'}</option>
              </select>
            </div>

            <div>
              <select
                value={experienceFilter}
                onChange={(e) => { setExperienceFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="all">{lang === 'ar' ? 'جميع سنوات الخبرة' : 'All Experiences'}</option>
                <option value="Fresh">{lang === 'ar' ? 'حديث التخرج' : 'Fresh Graduate'}</option>
                <option value="1">{lang === 'ar' ? 'سنة إلى سنتين' : '1-2 years'}</option>
                <option value="3">{lang === 'ar' ? '3 سنوات فأكثر' : '3+ years'}</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إلغاء الفلاتر' : 'Reset Filters'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 px-1">
            {lang === 'ar' ? 'سجل المتقدمين' : 'Applicants List'}
          </h3>

          {paginatedApplications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs font-semibold shadow-sm">
              {lang === 'ar' ? 'لا توجد طلبات توظيف مطابقة لبحثك.' : 'No matching applications found.'}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/50">
                      <th className="p-4 font-bold">{lang === 'ar' ? 'المتقدم' : 'Applicant'}</th>
                      <th className="p-4 font-bold">{lang === 'ar' ? 'التخصص والقسم' : 'Department'}</th>
                      <th className="p-4 font-bold">{lang === 'ar' ? 'الخبرة وتاريخ التقديم' : 'Experience & Date'}</th>
                      <th className="p-4 font-bold">{lang === 'ar' ? 'الحالة الحالية' : 'Current Status'}</th>
                      <th className="p-4 font-bold">{lang === 'ar' ? 'تغيير الحالة والإجراءات' : 'Change Status & Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                    {paginatedApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-500" />
                            {app.full_name || app.name || 'بدون اسم'}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 mt-1 flex flex-col gap-0.5">
                            <a href={`mailto:${app.email}`} className="hover:text-emerald-500 transition flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{app.email}</span>
                            </a>
                            <a href={`tel:${app.phone}`} dir="ltr" className="text-right hover:text-emerald-500 transition flex items-center gap-1 justify-end">
                              <span>{app.phone}</span>
                              <Phone className="w-3 h-3 text-slate-400" />
                            </a>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <Building2 className="w-3.5 h-3.5" />
                            {app.department || job.department || 'عام'}
                          </span>
                        </td>

                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{app.experience || 'غير محدد'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full font-bold text-[11px] ${
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
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold">{lang === 'ar' ? 'تغيير الحالة:' : 'Change Status:'}</span>
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
                            </div>

                            {app.cv_url && (
                              <div className="flex items-center gap-1.5 mt-4">
                                <button
                                  onClick={() => handleViewCv(app.id, app.cv_url)}
                                  disabled={loadingCvId === app.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-900 transition-all cursor-pointer disabled:opacity-40"
                                  title={lang === 'ar' ? 'معاينة السيرة الذاتية' : 'View CV'}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>{loadingCvId === app.id ? '...' : 'CV'}</span>
                                </button>

                                <button
                                  onClick={() => handleDownloadCv(app.cv_url)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all cursor-pointer"
                                  title={lang === 'ar' ? 'تحميل السيرة الذاتية' : 'Download CV'}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>{lang === 'ar' ? 'تحميل' : 'Download'}</span>
                                </button>
                              </div>
                            )}

                            {userRole === 'admin' && (
                              <div className="mt-4">
                                <button
                                  onClick={() => handleDeleteApp(app.id, app.cv_url)}
                                  className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all cursor-pointer"
                                  title={lang === 'ar' ? 'حذف الطلب' : 'Delete Application'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500">
                {lang === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}