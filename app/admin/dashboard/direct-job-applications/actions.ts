'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/supabase/permissions';

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

export async function getSignedCvUrl(cvUrl?: string | null) {
  if (!cvUrl) {
    return { success: false, error: 'مسار الملف غير متوفر.' };
  }

  if (cvUrl.startsWith('http://') || cvUrl.startsWith('https://')) {
    return { success: true, url: cvUrl };
  }

  const allowedView = await hasPermission('careers.view');
  if (!allowedView) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لعرض السيرة الذاتية.' };
  }

  const supabase = await getSupabaseServerClient();

  let cleanPath = cvUrl.trim();
  if (cleanPath.startsWith('resumes/')) {
    cleanPath = cleanPath.replace(/^resumes\//, '');
  }

  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(cleanPath, 120);

  if (error || !data?.signedUrl) {
    const retry = await supabase.storage
      .from('resumes')
      .createSignedUrl(cvUrl.trim(), 120);

    if (retry.data?.signedUrl) {
      return { success: true, url: retry.data.signedUrl };
    }

    return { success: false, error: 'تعذر فتح ملف السيرة الذاتية.' };
  }

  return { success: true, url: data.signedUrl };
}

export async function updateApplicationStatus(
  id: string,
  status: 'pending' | 'under_review' | 'accepted' | 'rejected'
) {
  if (!id) return { success: false, error: 'معرّف الطلب غير صالح.' };

  const allowedUpdate = await hasPermission('careers.update');
  if (!allowedUpdate) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتعديل حالة الطلب.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const adminClient = getSupabaseAdminClient();

  const { data: applicationData } = await adminClient.from('careers').select('email').eq('id', id).single();
  const applicantEmail = applicationData?.email || id;

  const { error } = await adminClient
    .from('careers')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating status:', error);
    return { success: false, error: 'فشل تحديث حالة الطلب.' };
  }

  await logActivity(
    supabase,
    'UPDATE_STATUS',
    'careers',
    id,
    `قام المستخدم ${currentAdminEmail} بتحديث حالة طلب التوظيف الخاص بـ (${applicantEmail}) إلى (${status})`
  );

  return { success: true };
}

export async function deleteApplication(id: string, cvUrl?: string | null) {
  if (!id) return { success: false, error: 'معرّف الطلب غير صالح.' };

  const allowedDelete = await hasPermission('careers.delete');
  if (!allowedDelete) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لحذف الطلب.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const adminClient = getSupabaseAdminClient();

  const { data: applicationData } = await adminClient.from('careers').select('email').eq('id', id).single();
  const applicantEmail = applicationData?.email || id;

  if (cvUrl) {
    let cleanPath = cvUrl.trim().split('?')[0];
    if (cleanPath.startsWith('resumes/')) {
      cleanPath = cleanPath.replace(/^resumes\//, '');
    }

    await adminClient.storage.from('resumes').remove([cleanPath, cvUrl.trim()]);
  }

  const { error } = await adminClient
    .from('careers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting application:', error);
    return { success: false, error: 'فشل حذف الطلب.' };
  }

  await logActivity(
    supabase,
    'DELETE',
    'careers',
    id,
    `قام المستخدم ${currentAdminEmail} بحذف طلب التوظيف الخاص بـ (${applicantEmail})`
  );

  return { success: true };
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function downloadCvAction(rawCvPath?: string | null) {
  if (!rawCvPath) {
    return { success: false, error: 'مسار الملف غير متوفر.' };
  }

  const allowedView = await hasPermission('careers.view');
  if (!allowedView) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتحميل السيرة الذاتية.' };
  }

  const supabase = await getSupabaseServerClient();

  const rawPath = rawCvPath.trim().split('?')[0];
  let cleanPath = rawPath;

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    cleanPath = cleanPath.replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/(public|sign)\/resumes\//, '');
  }

  while (cleanPath.startsWith('resumes/')) {
    cleanPath = cleanPath.replace(/^resumes\//, '');
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  let { data, error } = await supabase.storage
    .from('resumes')
    .download(cleanPath);

  if (error || !data) {
    const retry = await supabase.storage
      .from('resumes')
      .download(rawPath);

    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.error('Storage Download Error:', error);
    return { success: false, error: 'تعذر العثور على الملف في التخزين.' };
  }

  const buffer = await data.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  return {
    success: true,
    base64,
    contentType: data.type || 'application/pdf',
  };
}