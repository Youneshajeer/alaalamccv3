'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/supabase/permissions';
import { z } from 'zod';

const messageIdSchema = z.string().uuid('معرف الرسالة غير صالح');
const messageStatusSchema = z.enum(['unread', 'read']);

async function logActivity(supabase: any, actionType: string, targetTable: string, targetId: string | null, description: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const adminClient = getSupabaseAdminClient();
      await adminClient.from('activity_logs').insert({
        user_id: user.id,
        user_email: user.email || 'unknown',
        action_type: actionType,
        target_table: targetTable,
        target_id: targetId,
        description: description,
      });
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

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
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const supabaseAdmin = getSupabaseAdminClient();

  // جلب إيميل مرسل الرسالة وحالتها الحالية
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

    await logActivity(
      supabaseServer,
      'READ_MESSAGE',
      'customer_service',
      validatedId,
      `قام المستخدم ${currentAdminEmail} بقراءة والاطلاع على الرسالة الواردة من (${senderEmail})`
    );

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
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: msgData } = await supabaseAdmin.from('customer_service').select('email').eq('id', validatedId).single();
  const senderEmail = msgData?.email || validatedId;

  const { data, error } = await supabaseAdmin
    .from('customer_service')
    .update({ status: validatedStatus })
    .eq('id', validatedId)
    .select();

  if (error) {
    console.error('❌ [SUPABASE ERROR] updateMessageStatus failed:', error);
    throw new Error('فشل في تحديث حالة الرسالة في قاعدة البيانات: ' + error.message);
  }

  await logActivity(
    supabaseServer,
    'UPDATE_STATUS',
    'customer_service',
    validatedId,
    `قام المستخدم ${currentAdminEmail} بتحديث حالة الرسالة الواردة من (${senderEmail}) إلى (${validatedStatus})`
  );

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
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('customer_service')
    .update({ status: 'read' })
    .eq('status', 'unread')
    .select();

  if (error) {
    throw new Error('فشل في تحديث كافة الرسائل في قاعدة البيانات: ' + error.message);
  }

  await logActivity(
    supabaseServer,
    'MARK_ALL_READ',
    'customer_service',
    null,
    `قام المستخدم ${currentAdminEmail} بتعيين كافة الرسائل غير المقروءة كمقروءة (${data?.length || 0} رسالة)`
  );

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
  const currentAdminEmail = user?.email || 'مشرف النظام';

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

  await logActivity(
    supabaseServer,
    'DELETE',
    'customer_service',
    validatedId,
    `قام المستخدم ${currentAdminEmail} بحذف الرسالة الواردة من (${senderEmail})`
  );

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
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('customer_service')
    .delete()
    .in('id', validatedIds)
    .select();

  if (error) {
    throw new Error('فشل في تنفيذ الحذف الجماعي من قاعدة البيانات: ' + error.message);
  }

  await logActivity(
    supabaseServer,
    'BULK_DELETE',
    'customer_service',
    null,
    `قام المستخدم ${currentAdminEmail} بحذف جماعي لعدد (${validatedIds.length}) من الرسائل`
  );

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
  const currentAdminEmail = user?.email || 'مشرف النظام';

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

    await logActivity(
      supabaseServer,
      'READ_MESSAGE',
      'customer_service',
      validatedId,
      `قام المستخدم ${currentAdminEmail} بقراءة والاطلاع على الرسالة الواردة من (${senderEmail})`
    );

    revalidatePath('/admin/dashboard/messages');
  }

  return { success: true, message: msgData };
}

export async function deleteApplication(id: string) {
  return await deleteMessage(id);
}