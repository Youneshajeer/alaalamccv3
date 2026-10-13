'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { logoutAction } from './actions';

interface AdminHeaderProps {
  titleAr: string;
  titleEn: string;
  lang: 'ar' | 'en';
  userEmail: string;
  userRole: string;
  onLogout?: () => void | Promise<void>;
}

const roleNamesMap: Record<string, { label: string; bg: string }> = {
  admin: { 
    label: 'مدير النظام العام (Admin)', 
    bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50' 
  },
  supervisor: { 
    label: 'مشرف عام', 
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50' 
  },
  support_agent: { 
    label: 'موظف خدمة العملاء والطلبات', 
    bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50' 
  },
  hr_specialist: { 
    label: 'مسؤول التوظيف والموارد البشرية', 
    bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50' 
  },
};

export default function AdminHeader({
  titleAr,
  titleEn,
  lang,
  userEmail,
  userRole,
}: AdminHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const currentRoleInfo = roleNamesMap[userRole] || { 
    label: userRole, 
    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' 
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'ar' ? titleAr : titleEn}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span>{lang === 'ar' ? 'مرحباً بعودتك،' : 'Welcome back,'}</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{userEmail || '---'}</span>
          
          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${currentRoleInfo.bg}`}>
              👑 {currentRoleInfo.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/dashboard"
          className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          {lang === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
        </Link>

        <button
          onClick={handleLogout}
          disabled={isPending}
          className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          {isPending 
            ? (lang === 'ar' ? 'جاري الخروج...' : 'Signing out...') 
            : (lang === 'ar' ? 'تسجيل الخروج' : 'Logout')}
        </button>
      </div>
    </header>
  );
}