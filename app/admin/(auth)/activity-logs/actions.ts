'use server';

import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { hasPermission } from '@/lib/supabase/permissions';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/supabase/logger'; 

export interface ActivityLogFilterOptions {
  page?: number;
  limit?: number;
  emailQuery?: string;
  actionType?: string;
  targetTable?: string;
  startDate?: string;
  endDate?: string;
}

// 📌 1. ترجمة أنواع الإجراءات (Action Types) إلى نصوص عربية مفهومة
function formatActionType(actionType: string): string {
  const map: Record<string, string> = {
    'CREATE': 'إضافة وتنشيط جديد',
    'UPDATE': 'تعديل وتحديث بيانات',
    'DELETE': 'حذف نهائي',
    'UPDATE_STATUS': 'تعديل وتغيير الحالة',
    'PURGE_LOGS': 'تطهير وحذف السجلات القديمة',
    'LOGIN': 'تسجيل دخول المشرف',
    'LOGOUT': 'تسجيل خروج',
  };
  return map[actionType] || actionType;
}

// 📌 2. ترجمة أسماء الجداول التقنية (Target Tables) إلى مسميات واضحة ومفهومة
function formatTargetTable(tableName: string): string {
  const map: Record<string, string> = {
    'customer_service': 'رسائل خدمة العملاء',
    'careers': 'طلبات التوظيف والسير الذاتية',
    'jobs': 'إدارة الوظائف الشاغرة',
    'request-service': 'طلبات الخدمات المقدمة',
    'profiles': 'إدارة المشرفين والأدوار',
    'activity_logs': 'سجل النشاطات والأمان',
  };
  return map[tableName] || tableName;
}

// 📌 دالة مساعدة لتحويل القيم التقنية و true/false إلى نصوص عربية مفهومة
function formatLogValue(val: any): string {
  if (val === null || val === undefined) return '---';
  if (val === true || val === 'true') return 'نعم (مفعل)';
  if (val === false || val === 'false') return 'لا (معطل)';
  
  const stringVal = String(val);
  if (stringVal === 'active') return 'نشط';
  if (stringVal === 'closed') return 'مغلق';
  if (stringVal === 'pending') return 'قيد الانتظار';
  if (stringVal === 'accepted') return 'مقبول';
  if (stringVal === 'rejected') return 'مرفوض';
  if (stringVal === 'unread') return 'غير مقروء';
  if (stringVal === 'read') return 'مقروء';
  
  return stringVal;
}

// 📌 دالة لتنسيق تفاصيل السجل ليصبح مقروءاً بالكامل بالعربية
function formatLogItem(log: any) {
  return {
    ...log,
    // استخدام الدوال المعربة بدلاً من النصوص التقنية الصماء
    action_type_readable: formatActionType(log.action_type),
    target_table_readable: formatTargetTable(log.target_table),
    
    old_value_formatted: formatLogValue(log.old_value),
    new_value_formatted: formatLogValue(log.new_value),
  };
}

export async function getActivityLogs(options: ActivityLogFilterOptions = {}) {
  const supabase = await getSupabaseServerClient();

  const canView = await hasPermission('activity_logs.view') || await hasPermission('users.manage');
  if (!canView) {
    return { success: false, error: 'غير مصرح لك بالاطلاع على سجلات النشاطات.', logs: [], totalCount: 0 };
  }

  const page = options.page || 1;
  const limit = options.limit || 15;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options.emailQuery && options.emailQuery.trim() !== '') {
    query = query.ilike('user_email', `%${options.emailQuery.trim()}%`);
  }

  if (options.actionType && options.actionType !== 'ALL') {
    query = query.eq('action_type', options.actionType);
  }

  if (options.targetTable && options.targetTable !== 'ALL') {
    query = query.eq('target_table', options.targetTable);
  }

  if (options.startDate) {
    query = query.gte('created_at', `${options.startDate}T00:00:00.000Z`);
  }

  if (options.endDate) {
    query = query.lte('created_at', `${options.endDate}T23:59:59.999Z`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching activity logs:', error);
    return { success: false, error: 'فشل جلب سجلات النشاطات.', logs: [], totalCount: 0 };
  }

  const formattedLogs = (data || []).map(formatLogItem);

  return {
    success: true,
    logs: formattedLogs,
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getActivityLogDetails(logId: string) {
  const supabase = await getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error || !data) {
    return { success: false, error: 'سجل النشاط غير موجود.' };
  }

  const formattedLog = formatLogItem(data);

  return { success: true, log: formattedLog };
}

export async function purgeOldActivityLogs() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول.' };
  }

  const canPurge = await hasPermission('users.manage');
  if (!canPurge) {
    return { success: false, error: 'صلاحياتك لا توفر إمكانية تفريغ وتطهير سجلات النظام.' };
  }

  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    return { success: false, error: 'فشل تفريغ السجلات القديمة.' };
  }

  await logActivity({
    userId: user.id,
    userEmail: user.email || 'system',
    actionType: 'PURGE_LOGS',
    targetTable: 'activity_logs',
    description: `System administrator ${user.email || 'system'} cleaned up system archives and old logs (older than 90 days)`,
    fieldName: 'created_at',
    oldValue: 'older_than_90_days',
    newValue: 'deleted',
  });

  revalidatePath('/admin/activity-logs');
  return { success: true };
}