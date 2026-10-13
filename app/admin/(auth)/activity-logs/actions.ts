'use server';

import { getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { hasPermission } from '@/lib/supabase/permissions';
import { revalidatePath } from 'next/cache';

export interface ActivityLogFilterOptions {
  page?: number;
  limit?: number;
  emailQuery?: string;
  actionType?: string;
  targetTable?: string;
  startDate?: string;
  endDate?: string;
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

  return {
    success: true,
    logs: data || [],
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}


export async function logActivity({
  userId,
  userEmail,
  actionType,
  targetTable,
  targetId,
  description,
}: {
  userId?: string | null;
  userEmail: string;
  actionType: string;
  targetTable: string;
  targetId?: string | null;
  description: string;
}) {
  const supabase = await getSupabaseServerClient();
  await supabase.from('activity_logs').insert([
    {
      user_id: userId || null,
      user_email: userEmail,
      action_type: actionType,
      target_table: targetTable,
      target_id: targetId || null,
      description,
    },
  ]);
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
    description: 'قام مدير النظام بتنظيف الأرشيف والسجلات القديمة (أقدم من 90 يوم)',
  });

  revalidatePath('/admin/activity-logs');
  return { success: true };
}