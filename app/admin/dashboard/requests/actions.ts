'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { hasPermission } from '@/lib/supabase/permissions';
import { logActivity } from '@/lib/supabase/logger';  
import { z } from 'zod';

const requestIdSchema = z.string().uuid('معرف الطلب غير صالح');

export async function getRequests(page: number = 1, limit: number = 10, search: string = '', statusFilter: string = 'all') {
  const supabase = await getSupabaseServerClient();
  const allowedView = await hasPermission('requests.view');
  if (!allowedView) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لعرض الطلبات.');
  }
  const offset = (page - 1) * limit;

  let query = supabase
    .from('request-service')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,service.ilike.%${search}%,message.ilike.%${search}%`);
  }

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error('فشل في جلب طلبات الخدمات');
  }

  return {
    requests: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
}

export async function getRequestDetailsAction(id: string) {
  const validatedId = requestIdSchema.parse(id);

  const allowedView = await hasPermission('requests.view');
  if (!allowedView) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لعرض تفاصيل الطلب.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: reqData, error: fetchError } = await supabaseAdmin
    .from('request-service')
    .select('*')
    .eq('id', validatedId)
    .single();

  if (fetchError || !reqData) {
    throw new Error('طلب الخدمة غير موجود.');
  }

  const requesterEmail = reqData.email;

  if (reqData.status === 'unread') {
    await supabaseAdmin
      .from('request-service')
      .update({ status: 'read' })
      .eq('id', validatedId);
    
    reqData.status = 'read';
  }

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'READ_REQUEST',
    targetTable: 'request-service',
    targetId: validatedId,
    description: `User ${currentAdminEmail} read and viewed service request from (${requesterEmail})`,
    fieldName: 'status',
    oldValue: 'unread',
    newValue: 'read',
  });

  return { success: true, request: reqData };
}

export async function updateRequestStatus(id: string, status: 'unread' | 'read') {
  const validatedId = requestIdSchema.parse(id);
  
  const allowedManage = await hasPermission('requests.manage');
  if (!allowedManage) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لتنفيذ هذا الإجراء.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: reqData } = await supabaseAdmin.from('request-service').select('email, status').eq('id', validatedId).single();
  const requesterEmail = reqData?.email || validatedId;
  const oldStatus = reqData?.status || 'unknown';
  
  const { error } = await supabaseAdmin
    .from('request-service')
    .update({ status })
    .eq('id', validatedId);

  if (error) throw new Error('فشل في تحديث الحالة');

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'UPDATE_STATUS',
    targetTable: 'request-service',
    targetId: validatedId,
    description: `User ${currentAdminEmail} updated service request status for (${requesterEmail}) to (${status})`,
    fieldName: 'status',
    oldValue: oldStatus,
    newValue: status,
  });

  revalidatePath('/admin/dashboard/requests');
  return { success: true };
}

export async function takeActionOnRequests(ids: string[], note: string, userEmail: string) {
  const allowedManage = await hasPermission('requests.manage');
  if (!allowedManage) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لتنفيذ هذا الإجراء.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';
  
  const validatedIds = z.array(requestIdSchema).parse(ids);
  if (validatedIds.length === 0) return { success: true };

  const supabaseAdmin = getSupabaseAdminClient();

  const { error } = await supabaseAdmin
    .from('request-service')
    .update({
      action_taken: true,
      action_note: note,
      action_at: new Date().toISOString(),
      action_by: userEmail,
      status: 'read', 
    })
    .in('id', validatedIds);

  if (error) {
    throw new Error('فشل في حفظ الإجراء المتخذ');
  }

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'TAKE_ACTION',
    targetTable: 'request-service',
    targetId: null,
    description: `User ${currentAdminEmail} took action on (${validatedIds.length}) service requests`,
    fieldName: 'action_taken',
    oldValue: 'false',  
    newValue: 'true',  
  });

  revalidatePath('/admin/dashboard/requests');
  return { success: true };
}

export async function resetActionOnRequests(ids: string[]) {
  const allowedUpdate = await hasPermission('requests.update');
  if (!allowedUpdate) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لتنفيذ هذا الإجراء.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const validatedIds = z.array(requestIdSchema).parse(ids);
  if (validatedIds.length === 0) return { success: true };

  const supabaseAdmin = getSupabaseAdminClient();

  const { error } = await supabaseAdmin
    .from('request-service')
    .update({
      action_taken: false,
      action_note: null,
      action_at: null,
      action_by: null,
    })
    .in('id', validatedIds);

  if (error) {
    throw new Error('فشل في إلغاء الإجراء وإعادة الطلب لقيد الانتظار');
  }

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'RESET_ACTION',
    targetTable: 'request-service',
    targetId: null,
    description: `User ${currentAdminEmail} reset actions for (${validatedIds.length}) service requests`,
    fieldName: 'action_taken',
    oldValue: 'true',  
    newValue: 'false', 
  });

  revalidatePath('/admin/dashboard/requests');
  return { success: true };
}

export async function deleteRequest(id: string, userRole?: string) {
  const validatedId = requestIdSchema.parse(id);

  const allowedDelete = await hasPermission('requests.delete'); 
  if (!allowedDelete) {
    throw new Error('عذراً، لا تمتلك الصلاحية الكافية لتنفيذ هذا الإجراء.');
  }

  const supabaseServer = await getSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: reqData } = await supabaseAdmin.from('request-service').select('email').eq('id', validatedId).single();
  const requesterEmail = reqData?.email || validatedId;
  
  const { error } = await supabaseAdmin
    .from('request-service')
    .delete()
    .eq('id', validatedId);

  if (error) throw new Error('فشل في الحذف');

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'DELETE',
    targetTable: 'request-service',
    targetId: validatedId,
    description: `User ${currentAdminEmail} deleted service request from (${requesterEmail})`,
    fieldName: 'id',
    oldValue: validatedId,
    newValue: undefined,
  });

  revalidatePath('/admin/dashboard/requests');
  return { success: true };
}