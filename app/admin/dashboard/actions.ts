'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/supabase/logger';

async function verifyAdminAccess(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAuthorized: false, error: 'غير مصرح لك بالوصول، يرجى تسجيل الدخول.' };
  }

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select(`
      roles (
        name
      )
    `)
    .eq('user_id', user.id);

  if (rolesError || !userRoles || userRoles.length === 0) {
    return { isAuthorized: false, error: 'عذراً، لا تمتلك أي أدوار مسجلة في النظام.' };
  }

  const isAdminOrSupervisor = userRoles.some((ur: any) => 
    ur.roles?.name === 'admin' || ur.roles?.name === 'supervisor' || ur.roles?.name === 'super_admin'
  );

  if (!isAdminOrSupervisor) {
    return { isAuthorized: false, error: 'عذراً، هذه العملية مخصصة للمشرفين المخولين فقط.' };
  }

  return { isAuthorized: true, error: null };
}

export async function getSignedCvUrl(cvUrl?: string | null) {
  if (!cvUrl) {
    return { success: false, error: 'مسار الملف غير متوفر.' };
  }

  if (cvUrl.startsWith('http://') || cvUrl.startsWith('https://')) {
    return { success: true, url: cvUrl };
  }

  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdminAccess(supabase);
  if (!authCheck.isAuthorized) {
    return { success: false, error: authCheck.error };
  }

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

  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdminAccess(supabase);
  if (!authCheck.isAuthorized) {
    return { success: false, error: authCheck.error };
  }

  const adminClient = getSupabaseAdminClient();
  const { data: appData } = await adminClient.from('careers').select('email, status').eq('id', id).single();
  const applicantEmail = appData?.email || id;
  const oldStatus = appData?.status || 'unknown';

  const { error } = await adminClient
    .from('careers')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating status:', error);
    return { success: false, error: 'فشل تحديث حالة الطلب.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'UPDATE_STATUS',
    targetTable: 'careers',
    targetId: id,
    description: `User ${currentAdminEmail} updated job application status for (${applicantEmail}) to (${status})`,
    fieldName: 'status',
    oldValue: oldStatus,
    newValue: status,
  });

  return { success: true };
}

export async function deleteApplication(id: string, cvUrl?: string | null) {
  if (!id) return { success: false, error: 'معرّف الطلب غير صالح.' };

  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdminAccess(supabase);
  if (!authCheck.isAuthorized) {
    return { success: false, error: authCheck.error };
  }

  const adminClient = getSupabaseAdminClient();
  const { data: appData } = await adminClient.from('careers').select('email').eq('id', id).single();
  const applicantEmail = appData?.email || id;

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

  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'DELETE',
    targetTable: 'careers',
    targetId: id,
    description: `User ${currentAdminEmail} deleted job application for (${applicantEmail})`,
    fieldName: 'id',
    oldValue: id,
    newValue: undefined,
  });

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

  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdminAccess(supabase);
  if (!authCheck.isAuthorized) {
    return { success: false, error: authCheck.error };
  }

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