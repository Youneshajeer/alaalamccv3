'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/utils/useTranslation';
import AdminHeader from '@/components/admin/AdminHeader';

export interface DashboardStats {
  messages: { total: number; unread: number; read: number };
  requests: { total: number; read: number; unread: number; actionTaken: number; pending: number };
  jobs: { total: number; active: number; inactive: number; applicants: number; advertised: number; direct: number };
  users: {
    totalAdmins: number;
    activeAdmins: number;
    totalSupervisors: number;
    activeSupervisors: number;
    total: number;
  };
  rolesBreakdown?: Array<{
    name: string;
    displayName: string;
    total: number;
    active: number;
  }>;
}

interface RecentRequest {
  id: string;
  name: string;
  service: string | null;
  company: string | null;
  status: string;
  action_taken: boolean;
  created_at: string;
}

interface DashboardClientProps {
  stats: DashboardStats;
  recentRequests: RecentRequest[];
  userEmail: string;
  userRole: 'admin' | 'supervisor' | string;
  permissions: {
    canViewMessages: boolean;
    canViewRequests: boolean;
    canViewJobs: boolean;
    canViewUsers: boolean;
  };
}

export default function DashboardClient({
  stats,
  recentRequests,
  userEmail,
  userRole,
  permissions,
}: DashboardClientProps) {
  const router = useRouter();
  const { lang } = useTranslation();

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-8">
      <AdminHeader
        titleAr="لوحة التحكم الرئيسية"
        titleEn="Admin Dashboard"
        lang="ar"
        userEmail={userEmail}
        userRole={userRole}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">💬</div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">{lang === 'ar' ? 'الرسائل' : 'Messages'}</h2>
              </div>

              {permissions?.canViewMessages ? (
                <Link
                  href="/admin/dashboard/messages"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'إدارة الرسائل ←' : 'Manage →'}</span>
                </Link>
              ) : (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold px-3 py-1.5 rounded-xl text-xs cursor-not-allowed">
                  {lang === 'ar' ? 'مغلق' : 'Locked'}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs pt-3">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">{lang === 'ar' ? 'إجمالي الرسائل' : 'Total'}</span>
                <span className="font-black text-slate-900 dark:text-white">{stats.messages.total}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-amber-700 dark:text-amber-400">{lang === 'ar' ? 'غير مقروءة' : 'Unread'}</span>
                <span className="font-black text-amber-600">{stats.messages.unread}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-emerald-700 dark:text-emerald-400">{lang === 'ar' ? 'مقروءة' : 'Read'}</span>
                <span className="font-black text-emerald-600">{stats.messages.read}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">🛠️</div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">{lang === 'ar' ? 'طلبات الخدمات' : 'Requests'}</h2>
              </div>

              {permissions?.canViewRequests ? (
                <Link
                  href="/admin/dashboard/requests"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'إدارة الطلبات ←' : 'Manage →'}</span>
                </Link>
              ) : (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold px-3 py-1.5 rounded-xl text-xs cursor-not-allowed">
                  {lang === 'ar' ? 'مغلق' : 'Locked'}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs pt-3">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">{lang === 'ar' ? 'إجمالي الطلبات' : 'Total'}</span>
                <span className="font-black text-slate-900 dark:text-white">{stats.requests.total}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-amber-700 dark:text-amber-400">{lang === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>
                <span className="font-black text-amber-600">{stats.requests.pending}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-sky-50/50 dark:bg-sky-950/20">
                <span className="text-sky-700 dark:text-sky-400">{lang === 'ar' ? 'تم اتخاذ إجراء' : 'Action Taken'}</span>
                <span className="font-black text-sky-600">{stats.requests.actionTaken}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">💼</div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">{lang === 'ar' ? 'الوظائف والتوظيف' : 'Jobs'}</h2>
              </div>

              {permissions?.canViewJobs ? (
                <Link
                  href="/admin/dashboard/available-jobs"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'إدارة الوظائف ←' : 'Manage →'}</span>
                </Link>
              ) : (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold px-3 py-1.5 rounded-xl text-xs cursor-not-allowed">
                  {lang === 'ar' ? 'مغلق' : 'Locked'}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs pt-3">
              <div className="flex justify-between p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/20">
                <span className="text-purple-700 dark:text-purple-400">{lang === 'ar' ? 'الوظائف النشطة' : 'Active'}</span>
                <span className="font-black text-purple-600">{stats.jobs.active}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">{lang === 'ar' ? 'الوظائف غير النشطة' : 'Inactive'}</span>
                <span className="font-black text-slate-700 dark:text-slate-300">{stats.jobs.inactive}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-sky-50/50 dark:bg-sky-950/20">
                <span className="text-sky-700 dark:text-sky-400">{lang === 'ar' ? 'وظائف معلن عنها' : 'Advertised'}</span>
                <span className="font-black text-sky-600">{stats.jobs.advertised}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-emerald-700 dark:text-emerald-400">{lang === 'ar' ? 'توظيف مباشر' : 'Direct Hiring'}</span>
                <span className="font-black text-emerald-600">{stats.jobs.direct}</span>
              </div>
            </div>
          </div>
        </div>

       
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">🛡️</div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">{lang === 'ar' ? 'الحسابات والأدوار' : 'Users & Roles'}</h2>
              </div>

              {permissions?.canViewUsers ? (
                <Link
                  href="/admin/users"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'إدارة المستخدمين ←' : 'Manage →'}</span>
                </Link>
              ) : (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold px-3 py-1.5 rounded-xl text-xs cursor-not-allowed">
                  {lang === 'ar' ? 'مغلق' : 'Locked'}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs pt-3">
              {stats.rolesBreakdown?.map((roleStat: any) => (
                <div key={roleStat.name} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <div>
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 block">
                      {roleStat.displayName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      نشط: <strong className="text-emerald-600">{roleStat.active}</strong> من {roleStat.total}
                    </span>
                  </div>
                  <div className="text-xs font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
                    {roleStat.total}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {permissions?.canViewRequests && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'أحدث طلبات الخدمات الواردة' : 'Recent Service Requests'}
            </h2>
            <Link
              href="/admin/dashboard/requests"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              {lang === 'ar' ? 'عرض الكل ←' : 'View All →'}
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase">
                  <th className="p-3">{lang === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="p-3">{lang === 'ar' ? 'الخدمة' : 'Service'}</th>
                  <th className="p-3">{lang === 'ar' ? 'حالة القراءة' : 'Read Status'}</th>
                  <th className="p-3">{lang === 'ar' ? 'حالة الإجراء' : 'Action Status'}</th>
                  <th className="p-3 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{req.name}</td>
                    <td className="p-3 text-emerald-600 font-bold">{req.service || 'عامة'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        req.status === 'read' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status === 'read' ? 'مقروءة' : 'غير مقروءة'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.action_taken ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {req.action_taken ? '✔ تم اتخاذ إجراء' : '⏳ قيد الانتظار'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => router.push(`/admin/dashboard/requests/${req.id}`)}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        {lang === 'ar' ? 'عرض' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}