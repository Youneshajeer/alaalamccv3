import { getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import { cookies } from 'next/headers';
import { getCurrentUserRole } from '@/lib/supabase/auth';
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';

const dictionaries = { ar, en };

interface LogDetailsPageProps {
  params: Promise<{ id: string }>;
}

function formatActionType(actionType: string, lang: 'ar' | 'en'): string {
  const mapAr: Record<string, string> = {
    'CREATE': 'إضافة وتنشيط جديد',
    'UPDATE': 'تعديل وتحديث بيانات',
    'DELETE': 'حذف نهائي',
    'UPDATE_STATUS': 'تعديل وتغيير الحالة',
    'PURGE_LOGS': 'تطهير وحذف السجلات القديمة',
    'LOGIN': 'تسجيل دخول المشرف',
    'LOGOUT': 'تسجيل خروج',
  };
  const mapEn: Record<string, string> = {
    'CREATE': 'New Creation & Activation',
    'UPDATE': 'Data Update & Modification',
    'DELETE': 'Permanent Deletion',
    'UPDATE_STATUS': 'Status Update',
    'PURGE_LOGS': 'Purged Old Logs',
    'LOGIN': 'Admin Login',
    'LOGOUT': 'Logout',
  };
  const map = lang === 'ar' ? mapAr : mapEn;
  return map[actionType] || actionType;
}

function formatTargetTable(tableName: string, lang: 'ar' | 'en'): string {
  const mapAr: Record<string, string> = {
    'customer_service': 'رسائل خدمة العملاء',
    'careers': 'طلبات التوظيف والسير الذاتية',
    'jobs': 'إدارة الوظائف الشاغرة',
    'request-service': 'طلبات الخدمات المقدمة',
    'profiles': 'إدارة المشرفين والأدوار',
    'activity_logs': 'سجل النشاطات والأمان',
  };
  const mapEn: Record<string, string> = {
    'customer_service': 'Customer Service Messages',
    'careers': 'Career Applications',
    'jobs': 'Job Management',
    'request-service': 'Service Requests',
    'profiles': 'Profiles & Roles',
    'activity_logs': 'Activity Logs & Security',
  };
  const map = lang === 'ar' ? mapAr : mapEn;
  return map[tableName] || tableName;
}

function formatLogValue(val: any, lang: 'ar' | 'en'): string {
  const t = (dictionaries[lang] as any).logDetails || {};
  if (val === null || val === undefined) return t.nullVal || (lang === 'ar' ? 'فارغة (Null)' : 'Null (Empty)');
  if (val === true || val === 'true') return t.trueVal || (lang === 'ar' ? 'نعم (مفعل)' : 'Yes (Enabled)');
  if (val === false || val === 'false') return t.falseVal || (lang === 'ar' ? 'لا (معطل)' : 'No (Disabled)');
  
  const stringVal = String(val);
  if (stringVal === 'active') return t.active || 'Active';
  if (stringVal === 'closed') return t.closed || 'Closed';
  if (stringVal === 'pending') return t.pending || 'Pending';
  if (stringVal === 'accepted') return t.accepted || 'Accepted';
  if (stringVal === 'rejected') return t.rejected || 'Rejected';
  if (stringVal === 'unread') return t.unread || 'Unread';
  if (stringVal === 'read') return t.read || 'Read';
  
  return stringVal;
}

async function getActivityLogDetails(logId: string, lang: 'ar' | 'en') {
  const supabaseAdmin = getSupabaseAdminClient();
  const t = (dictionaries[lang] as any).logDetails || {};
  
  const { data, error } = await supabaseAdmin
    .from('activity_logs')
    .select('*')
    .eq('id', logId.trim())
    .maybeSingle();

  if (error) {
    console.error('Supabase error fetching log details:', error.message);
    return { success: false, error: t.errorFetching || 'حدث خطأ أثناء جلب تفاصيل السجل من قاعدة البيانات.' };
  }

  if (!data) {
    return { success: false, error: t.notFound || 'سجل النشاط غير موجود أو تم حذفه.' };
  }

  const formattedLog = {
    ...data,
    action_type_readable: formatActionType(data.action_type, lang),
    target_table_readable: formatTargetTable(data.target_type || data.target_table, lang),
    old_value_formatted: formatLogValue(data.old_value, lang),
    new_value_formatted: formatLogValue(data.new_value, lang),
  };

  return { success: true, log: formattedLog };
}

export default async function LogDetailsPage({ params }: LogDetailsPageProps) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value as 'ar' | 'en') || 'ar';
  const t = (dictionaries[lang] as any).logDetails || {};

  const authData = await getCurrentUserRole();
  const userEmail = authData?.user?.email || 'System';
  const userRoleName = authData?.role || 'admin';
  const roleDisplayName = authData?.roleDisplayName;

  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const result = await getActivityLogDetails(id, lang);

  if (!result.success || !result.log) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="p-10 min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 p-6 rounded-3xl border border-rose-200 dark:border-rose-900 font-bold text-xs text-center shadow-sm max-w-md w-full">
          <span>⚠️ {result.error}</span>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">ID: {id}</div>
        </div>
        <Link
          href="/admin/activity-logs"
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all"
        >
          {lang === 'ar' ? 'العودة إلى سجل النشاطات ⬅️' : 'Back to Activity Logs ⬅️'}
        </Link>
      </div>
    );
  }

  const log = result.log;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-8 p-6 sm:p-10 min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminHeader
        titleAr={t.title || 'تفاصيل سجل النشاط والأمان'}
        titleEn={t.titleEn || 'Activity Audit Details'}
        lang={lang}
        userEmail={userEmail}
        userRole={userRoleName}
      />

      <div className={`flex ${lang === 'ar' ? 'justify-end' : 'justify-start'}`}>
        <Link
          href="/admin/activity-logs"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          {t.backToList || 'العودة للقائمة ↩️'}
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block">{t.userEmail || 'المستخدم المسؤول / البريد'}</span>
            <span className="font-black text-slate-900 dark:text-white text-sm break-all">{log.user_email}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block">{t.actionType || 'نوع الإجراء (Action Type)'}</span>
            <span className="inline-block px-3 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900/50">
              {log.action_type_readable}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block">{t.targetTable || 'الجدول المستهدف (Target Table)'}</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
              {log.target_table_readable}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-slate-400 font-bold block text-xs">{t.descriptionTitle || '📝 الوصف التفصيلي للحدث'}</span>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
            {log.description}
          </p>
        </div>

        {log.field_name ? (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">{t.comparisonTitle || 'مقارنة التغييرات المباشرة'}</span>
              <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                {t.fieldLabel || 'الحقل:'} {log.field_name}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-rose-50/60 dark:bg-rose-950/20 p-5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5">
                    <span>🔴</span> {t.oldValue || 'القيمة القديمة (Old Value)'}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 overflow-x-auto">
                  <code className="text-xs text-slate-800 dark:text-slate-200 font-mono block">
                    {log.old_value_formatted}
                  </code>
                </div>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                    <span>🟢</span> {t.newValue || 'القيمة الجديدة (New Value)'}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 overflow-x-auto">
                  <code className="text-xs text-slate-800 dark:text-slate-200 font-mono block">
                    {log.new_value_formatted}
                  </code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-400 font-medium">
            {t.systemEventNote || 'ℹ️ ملاحظة: هذا السجل عبارة عن حدث عام أو عملية تسجيل دخول/خروج ولا يتضمن تعديلاً مباشراً على حقل منفرد.'}
          </div>
        )}

        <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="font-mono">{t.recordId || 'معرف السجل الفريد (UUID):'} {log.id}</span>
          <span className="font-bold">{t.dateTime || 'التاريخ والوقت:'} {new Date(log.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
        </div>

      </div>
    </div>
  );
}