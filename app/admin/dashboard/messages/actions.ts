'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/supabase/permissions';
import { logActivity } from '@/lib/supabase/logger';
import { z } from 'zod';

const messageIdSchema = z.string().uuid('معرف الرسالة غير صالح');
const messageStatusSchema = z.enum(['unread', 'read']);

export async function getMessages(page: number = 1, limit: number = 10, search: string = '', statusFilter: string = 'all') {
  console.log('--- [SERVER ACTION] getMessages called ---', { page, limit, search, statusFilter });
  const supabase = await getSupabaseServerClient();

  const allowedView = await hasPermission('messages.view');
  if (!allowedView) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لعرض الرسائل.');
  }

  const offset = (page - 1) * limit;

  let query = supabase
    .from('customer_service')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,message.ilike.%${search}%`);
  }

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('❌ [SUPABASE ERROR] getMessages failed:', error);
    throw new Error('فشل في جلب الرسائل من قاعدة البيانات');
  }

  return {
    messages: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
}

export async function viewAndLogMessageAction(id: string) {
  const validatedId = messageIdSchema.parse(id);

  const allowedView = await hasPermission('messages.view');
  if (!allowedView) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لعرض الرسالة.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: msgData, error: fetchError } = await supabaseAdmin
    .from('customer_service')
    .select('email, status')
    .eq('id', validatedId)
    .single();

  if (fetchError || !msgData) {
    throw new Error('الرسالة غير موجودة.');
  }

  const senderEmail = msgData.email;

  if (msgData.status === 'unread') {
    await supabaseAdmin
      .from('customer_service')
      .update({ status: 'read' })
      .eq('id', validatedId);

    await logActivity({
      userId: user?.id || null,
      userEmail: currentAdminEmail,
      actionType: 'READ_MESSAGE',
      targetTable: 'customer_service',
      targetId: validatedId,
      description: `User ${currentAdminEmail} read and viewed message from (${senderEmail})`,
      fieldName: 'status',
      oldValue: 'unread',
      newValue: 'read',
    });

    revalidatePath('/admin/dashboard/messages');
  }

  return { success: true, message: msgData };
}

export async function updateMessageStatus(id: string, status: 'unread' | 'read') {
  console.log('--- [SERVER ACTION] updateMessageStatus called ---', { id, status });
  const validatedId = messageIdSchema.parse(id);
  const validatedStatus = messageStatusSchema.parse(status);

  const allowedManage = await hasPermission('messages.manage');
  if (!allowedManage) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لتعديل حالة الرسالة.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: msgData } = await supabaseAdmin.from('customer_service').select('email, status').eq('id', validatedId).single();
  const senderEmail = msgData?.email || validatedId;
  const oldStatus = msgData?.status || 'unknown';

  const { data, error } = await supabaseAdmin
    .from('customer_service')
    .update({ status: validatedStatus })
    .eq('id', validatedId)
    .select();

  if (error) {
    console.error('❌ [SUPABASE ERROR] updateMessageStatus failed:', error);
    throw new Error('فشل في تحديث حالة الرسالة في قاعدة البيانات: ' + error.message);
  }

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'UPDATE_STATUS',
    targetTable: 'customer_service',
    targetId: validatedId,
    description: `User ${currentAdminEmail} updated message status from (${senderEmail}) to (${validatedStatus})`,
    fieldName: 'status',
    oldValue: oldStatus,
    newValue: validatedStatus,
  });

  revalidatePath('/admin/dashboard/messages');
  return { success: true, data };
}

export async function markAllAsRead() {
  const allowedManage = await hasPermission('messages.manage');
  if (!allowedManage) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لتنفيذ هذا الإجراء.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('customer_service')
    .update({ status: 'read' })
    .eq('status', 'unread')
    .select();

  if (error) {
    throw new Error('فشل في تحديث كافة الرسائل في قاعدة البيانات: ' + error.message);
  }

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'MARK_ALL_READ',
    targetTable: 'customer_service',
    targetId: null,
    description: `User ${currentAdminEmail} marked all unread messages as read (${data?.length || 0} messages)`,
    fieldName: 'status',
    oldValue: 'unread',
    newValue: 'read',
  });

  revalidatePath('/admin/dashboard/messages');
  return { success: true };
}

export async function deleteMessage(id: string) {
  const validatedId = messageIdSchema.parse(id);

  const allowedDelete = await hasPermission('messages.delete');
  if (!allowedDelete) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لحذف الرسائل.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: msgData } = await supabaseAdmin.from('customer_service').select('email').eq('id', validatedId).single();
  const senderEmail = msgData?.email || validatedId;

  const { data, error } = await supabaseAdmin
    .from('customer_service')
    .delete()
    .eq('id', validatedId)
    .select();

  if (error) {
    throw new Error('فشل في حذف الرسالة من قاعدة البيانات: ' + error.message);
  }

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'DELETE',
    targetTable: 'customer_service',
    targetId: validatedId,
    description: `User ${currentAdminEmail} deleted message from (${senderEmail})`,
    fieldName: 'id',
    oldValue: validatedId,
    newValue: undefined,
  });

  revalidatePath('/admin/dashboard/messages');
  return { success: true };
}

export async function bulkDeleteMessages(ids: string[]) {
  const validatedIds = z.array(messageIdSchema).parse(ids);
  if (validatedIds.length === 0) return { success: true };

  const allowedDelete = await hasPermission('messages.delete');
  if (!allowedDelete) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لتنفيذ الحذف الجماعي.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('customer_service')
    .delete()
    .in('id', validatedIds)
    .select();

  if (error) {
    throw new Error('فشل في تنفيذ الحذف الجماعي من قاعدة البيانات: ' + error.message);
  }

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'BULK_DELETE',
    targetTable: 'customer_service',
    targetId: null,
    description: `User ${currentAdminEmail} performed bulk deletion of (${validatedIds.length}) messages`,
    fieldName: 'id',
    oldValue: 'multiple_ids',
    newValue: undefined,
  });

  revalidatePath('/admin/dashboard/messages');
  return { success: true };
}

export async function getMessageDetailsAction(id: string) {
  const validatedId = messageIdSchema.parse(id);

  const allowedView = await hasPermission('messages.view');
  if (!allowedView) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لعرض تفاصيل الرسالة.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: msgData, error } = await supabaseAdmin
    .from('customer_service')
    .select('*')
    .eq('id', validatedId)
    .single();

  if (error || !msgData) {
    throw new Error('الرسالة غير موجودة.');
  }

  const senderEmail = msgData.email;

  if (msgData.status === 'unread') {
    await supabaseAdmin
      .from('customer_service')
      .update({ status: 'read' })
      .eq('id', validatedId);

    await logActivity({
      userId: user?.id || null,
      userEmail: currentAdminEmail,
      actionType: 'READ_MESSAGE',
      targetTable: 'customer_service',
      targetId: validatedId,
      description: `User ${currentAdminEmail} read and viewed message from (${senderEmail})`,
      fieldName: 'status',
      oldValue: 'unread',
      newValue: 'read',
    });
  }

  return { success: true, message: msgData };
}

export async function deleteApplication(id: string) {
  return await deleteMessage(id);
}