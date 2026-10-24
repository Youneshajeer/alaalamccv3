'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { purgeOldActivityLogs } from './actions';
import { useTranslation } from '@/utils/useTranslation';

interface ActivityLogsClientProps {
  initialLogs: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  userEmail: string;
  userRole: string;
  roleDisplayName?: string;
}

export default function ActivityLogsClient({
  initialLogs,
  totalCount,
  currentPage,
  totalPages,
  userEmail,
  userRole,
  roleDisplayName,
}: ActivityLogsClientProps) {
  const { lang, t } = useTranslation();
  const logsText = (t as any).adminLogs || {};

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [emailQuery, setEmailQuery] = useState(searchParams.get('email') || '');
  const [actionType, setActionType] = useState(searchParams.get('actionType') || 'ALL');
  const [targetTable, setTargetTable] = useState(searchParams.get('targetTable') || 'ALL');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  const [clientSearchText, setClientSearchText] = useState('');
  const [clientActionFilter, setClientActionFilter] = useState('ALL');
  const [clientTableFilter, setClientTableFilter] = useState('ALL');

  const handleServerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (emailQuery) params.set('email', emailQuery);
    if (actionType !== 'ALL') params.set('actionType', actionType);
    if (targetTable !== 'ALL') params.set('targetTable', targetTable);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('page', '1');

    startTransition(() => {
      router.push(`/admin/activity-logs?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setEmailQuery('');
    setActionType('ALL');
    setTargetTable('ALL');
    setStartDate('');
    setEndDate('');
    setClientSearchText('');
    setClientActionFilter('ALL');
    setClientTableFilter('ALL');
    startTransition(() => {
      router.push('/admin/activity-logs');
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    startTransition(() => {
      router.push(`/admin/activity-logs?${params.toString()}`);
    });
  };

  const handlePurge = async () => {
    if (
      confirm(
        lang === 'ar'
          ? 'هل أنت متأكد من رغبتك في حذف السجلات القديمة (أقدم من 90 يوم)؟'
          : 'Are you sure you want to delete records older than 90 days?'
      )
    ) {
      const res = await purgeOldActivityLogs();
      if (res.success) {
        alert(lang === 'ar' ? 'تم تنظيف السجلات القديمة بنجاح.' : 'Old records successfully purged.');
        router.refresh();
      } else {
        alert(res.error || (lang === 'ar' ? 'حدث خطأ أثناء تنظيف السجلات.' : 'An error occurred while purging records.'));
      }
    }
  };

  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log: any) => {
      const matchesText =
        clientSearchText.trim() === '' ||
        log.user_email?.toLowerCase().includes(clientSearchText.toLowerCase()) ||
        log.description?.toLowerCase().includes(clientSearchText.toLowerCase());

      const matchesAction =
        clientActionFilter === 'ALL' || log.action_type === clientActionFilter;

      const matchesTable =
        clientTableFilter === 'ALL' || log.target_table === clientTableFilter;

      return matchesText && matchesAction && matchesTable;
    });
  }, [initialLogs, clientSearchText, clientActionFilter, clientTableFilter]);

  const uniqueCurrentActions = useMemo(() => {
    return Array.from(new Set(initialLogs.map((l: any) => l.action_type)));
  }, [initialLogs]);

  const uniqueCurrentTables = useMemo(() => {
    return Array.from(new Set(initialLogs.map((l: any) => l.target_table)));
  }, [initialLogs]);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-8 p-6 sm:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminHeader
        titleAr="سجل نشاط المستخدمين"
        titleEn="Activity & Logs"
        lang={lang}
        userEmail={userEmail}
        userRole={userRole}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔍</span>
            <span>{logsText.dbQueryTitle || (lang === 'ar' ? 'استعلام قاعدة البيانات' : 'Database Query')}</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
              {lang === 'ar' ? `إجمالي السجلات: ${totalCount}` : `Total Records: ${totalCount}`}
            </span>
            <button
              onClick={handlePurge}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              {logsText.purgeBtn || (lang === 'ar' ? 'تطهير السجلات القديمة (90+ يوم) 🗑️' : 'Purge Old Logs (90+ Days) 🗑️')}
            </button>
          </div>
        </div>

        <form onSubmit={handleServerSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {logsText.emailLabel || (lang === 'ar' ? 'البريد الإلكتروني' : 'Email')}
            </label>
            <input
              type="text"
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              placeholder={logsText.emailPlaceholder || (lang === 'ar' ? 'بحث بالإيميل...' : 'Search by email...')}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {logsText.actionTypeLabel || (lang === 'ar' ? 'نوع الإجراء' : 'Action Type')}
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="ALL">{logsText.allActions || (lang === 'ar' ? 'جميع الإجراءات' : 'All Actions')}</option>
              <option value="LOGIN">تسجيل دخول (LOGIN)</option>
              <option value="CREATE">إنشاء (CREATE)</option>
              <option value="UPDATE">تحديث (UPDATE)</option>
              <option value="DELETE">حذف (DELETE)</option>
              <option value="BLOCK">حظر مستخدم (BLOCK)</option>
              <option value="PURGE_LOGS">تطهير اللوج (PURGE)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {logsText.targetTableLabel || (lang === 'ar' ? 'الجدول المستهدف' : 'Target Table')}
            </label>
            <select
              value={targetTable}
              onChange={(e) => setTargetTable(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="ALL">{logsText.allTables || (lang === 'ar' ? 'جميع الجداول' : 'All Tables')}</option>
              <option value="profiles">الملفات الشخصية (profiles)</option>
              <option value="jobs">الوظائف (jobs)</option>
              <option value="careers">المتقدمين للوظائف (careers)</option>
              <option value="request-service">طلبات الخدمات (request-service)</option>
              <option value="customer_service">الرسائل (customer_service)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {logsText.fromDate || (lang === 'ar' ? 'من تاريخ' : 'From Date')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              {logsText.toDate || (lang === 'ar' ? 'إلى تاريخ' : 'To Date')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {logsText.resetFilters || (lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isPending
                ? (lang === 'ar' ? 'جاري البحث...' : 'Searching...')
                : (logsText.searchBtn || (lang === 'ar' ? 'بحث في قاعدة البيانات 🔍' : 'Search Database 🔍'))}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              ⚡{' '}
              <span>
                {lang === 'ar'
                  ? `تصفية فورية للنتائج المعروضة حالياً (${filteredLogs.length} من أصل ${totalCount} سجل إجمالي)`
                  : `Instant filter for displayed results (${filteredLogs.length} of ${totalCount} total records)`}
              </span>
            </span>
            {(clientSearchText || clientActionFilter !== 'ALL' || clientTableFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setClientSearchText('');
                  setClientActionFilter('ALL');
                  setClientTableFilter('ALL');
                }}
                className="text-[11px] text-rose-600 hover:underline font-bold"
              >
                {lang === 'ar' ? 'مسح التصفية الفورية' : 'Clear Instant Filter'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={clientSearchText}
              onChange={(e) => setClientSearchText(e.target.value)}
              placeholder={lang === 'ar' ? 'تصفية سريعة بالبريد أو الوصف...' : 'Quick filter by email or description...'}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
            />

            <select
              value={clientActionFilter}
              onChange={(e) => setClientActionFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="ALL">{lang === 'ar' ? 'جميع إجراءات الصفحة الحالية' : 'All current page actions'}</option>
              {uniqueCurrentActions.map((act) => (
                <option key={String(act)} value={String(act)}>
                  {String(act)}
                </option>
              ))}
            </select>

            <select
              value={clientTableFilter}
              onChange={(e) => setClientTableFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="ALL">{lang === 'ar' ? 'جميع جداول الصفحة الحالية' : 'All current page tables'}</option>
              {uniqueCurrentTables.map((tbl) => (
                <option key={String(tbl)} value={String(tbl)}>
                  {String(tbl)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full ${lang === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase">
                <th className="p-3">{logsText.tableUser || (lang === 'ar' ? 'المستخدم / البريد' : 'User / Email')}</th>
                <th className="p-3">{logsText.tableAction || (lang === 'ar' ? 'نوع الإجراء' : 'Action Type')}</th>
                <th className="p-3">{logsText.tableTable || (lang === 'ar' ? 'الجدول المستهدف' : 'Target Table')}</th>
                <th className="p-3">{logsText.tableDetails || (lang === 'ar' ? 'التفاصيل والوصف' : 'Details & Description')}</th>
                <th className="p-3">{logsText.tableDate || (lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log: any) => (
                  <tr
                    key={log.id}
                    onClick={() => router.push(`/admin/activity-logs/${log.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    title={lang === 'ar' ? 'انقر لعرض تفاصيل التعديل الكاملة' : 'Click to view full update details'}
                  >
                    <td className="p-3 font-bold text-slate-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setClientSearchText(log.user_email)}
                        className={`hover:text-emerald-600 underline decoration-dotted cursor-pointer ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                        title={lang === 'ar' ? 'انقر لتصفية النتائج الحالية لهذا المستخدم' : 'Click to filter current results for this user'}
                      >
                        {log.user_email}
                      </button>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setClientActionFilter(log.action_type)}
                        className="px-2.5 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'انقر لتصفية نتائج الإجراء فورياً' : 'Click to instantly filter action results'}
                      >
                        {log.action_type}
                      </button>
                    </td>
                    <td className="p-3 font-medium text-purple-600 dark:text-purple-400" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setClientTableFilter(log.target_table)}
                        className="hover:underline cursor-pointer"
                        title={lang === 'ar' ? 'انقر لتصفية نتائج الجدول فورياً' : 'Click to instantly filter table results'}
                      >
                        {log.target_table}
                      </button>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs">
                      <div className={`max-h-20 overflow-y-auto ${lang === 'ar' ? 'pr-1' : 'pl-1'} whitespace-pre-wrap text-[11px] leading-relaxed custom-scrollbar`}>
                        {log.description}
                        {log.field_name && (
                          <span className="block mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {lang === 'ar'
                              ? `الحقل: ${log.field_name} (من: ${log.old_value || 'فارغ'} إلى: ${log.new_value || 'فارغ'})`
                              : `Field: ${log.field_name} (From: ${log.old_value || 'empty'} To: ${log.new_value || 'empty'})`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                    {lang === 'ar'
                      ? 'لا توجد سجلات مطابقة لخيارات التصفية الفورية الحالية.'
                      : 'No records match the current instant filter options.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 disabled:opacity-50 rounded-xl text-xs font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'السابق' : 'Previous'}
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {lang === 'ar'
                ? `صفحة ${currentPage} من ${totalPages} (الإجمالي: ${totalCount})`
                : `Page ${currentPage} of ${totalPages} (Total: ${totalCount})`}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 disabled:opacity-50 rounded-xl text-xs font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}