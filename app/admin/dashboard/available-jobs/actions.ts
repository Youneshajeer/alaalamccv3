'use server';

import { JobSchema } from '@/lib/validations/adminValidations'; 
import { revalidatePath } from 'next/cache';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/supabase/permissions';

export interface JobData {
  title: string;
  description: string;
  experience_years: number;
  deadline?: string | null;
  status?: 'active' | 'closed' | 'draft';
}

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

export async function getJobsAction() {
  const allowedView = await hasPermission('jobs.view');
  if (!allowedView) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لعرض الوظائف.' };
  }

  const supabase = await getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function createJobAction(data: JobData) {
  const allowedManage = await hasPermission('jobs.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لإضافة وظيفة جديدة.' };
  }

  const validationResult = JobSchema.safeParse(data);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map((err: any) => err.message).join(' - ');
    return { success: false, error: errorMessages };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const adminClient = getSupabaseAdminClient();

  try {
    const { data: newJob, error } = await adminClient.from('jobs').insert([
      {
        title: validationResult.data.title,
        description: validationResult.data.description,
        experience_years: validationResult.data.experience_years,
        deadline: validationResult.data.deadline || null,
        status: validationResult.data.status || 'active',
      },
    ]).select();

    if (error) throw error;

    const jobId = newJob?.[0]?.id || null;
    await logActivity(
      supabase,
      'CREATE',
      'jobs',
      jobId,
      `قام المستخدم ${currentAdminEmail} بإضافة وظيفة جديدة: ${validationResult.data.title}`
    );

    revalidatePath('/admin/dashboard/available-jobs');
    return { success: true, data: newJob };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء إضافة الوظيفة' };
  }
}

export async function updateJobAction(id: string, data: Partial<JobData>) {
  const allowedManage = await hasPermission('jobs.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتعديل بيانات الوظيفة.' };
  }

  const validationResult = JobSchema.partial().safeParse(data);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map((err: any) => err.message).join(' - ');
    return { success: false, error: errorMessages };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const adminClient = getSupabaseAdminClient();

  try {
    const { data: jobData } = await adminClient.from('jobs').select('title').eq('id', id).single();
    const jobTitle = jobData?.title || id;

    const updatePayload: any = {};
    if (validationResult.data.title !== undefined) updatePayload.title = validationResult.data.title;
    if (validationResult.data.description !== undefined) updatePayload.description = validationResult.data.description;
    if (validationResult.data.experience_years !== undefined) updatePayload.experience_years = validationResult.data.experience_years;
    if (validationResult.data.deadline !== undefined) updatePayload.deadline = validationResult.data.deadline || null;

    const { error } = await adminClient
      .from('jobs')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;

    await logActivity(
      supabase,
      'UPDATE',
      'jobs',
      id,
      `قام المستخدم ${currentAdminEmail} بتعديل بيانات الوظيفة: ${jobTitle}`
    );

    revalidatePath('/admin/dashboard/available-jobs');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء تحديث بيانات الوظيفة' };
  }
}

export async function updateJobStatusAction(
  id: string,
  status: 'active' | 'closed' | 'draft'
) {
  const allowedManage = await hasPermission('jobs.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتغيير حالة الوظيفة.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const adminClient = getSupabaseAdminClient();

  try {
    const { data: jobData } = await adminClient.from('jobs').select('title').eq('id', id).single();
    const jobTitle = jobData?.title || id;

    const { error } = await adminClient
      .from('jobs')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    await logActivity(
      supabase,
      'UPDATE_STATUS',
      'jobs',
      id,
      `قام المستخدم ${currentAdminEmail} بتغيير حالة الوظيفة (${jobTitle}) إلى (${status})`
    );

    revalidatePath('/admin/dashboard/available-jobs');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'تعذر تغيير حالة الوظيفة' };
  }
}

export async function reactivateJobAction(id: string, deadline: string) {
  const allowedManage = await hasPermission('jobs.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لإعادة تفعيل الوظيفة.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const adminClient = getSupabaseAdminClient();

  try {
    const { data: jobData } = await adminClient.from('jobs').select('title').eq('id', id).single();
    const jobTitle = jobData?.title || id;

    const { error } = await adminClient
      .from('jobs')
      .update({
        status: 'active',
        deadline: deadline || null,
      })
      .eq('id', id);

    if (error) throw error;

    await logActivity(
      supabase,
      'REACTIVATE',
      'jobs',
      id,
      `قام المستخدم ${currentAdminEmail} بإعادة تفعيل الوظيفة وتمديد الموعد النهائي: ${jobTitle}`
    );

    revalidatePath('/admin/dashboard/available-jobs');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشلت عملية إعادة التفعيل وتمديد التاريخ' };
  }
}

export async function deleteJobAction(id: string) {
  const allowedDelete = await hasPermission('jobs.delete');
  if (!allowedDelete) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لحذف الوظيفة.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const adminClient = getSupabaseAdminClient();

  try {
    const { data: jobData } = await adminClient.from('jobs').select('title').eq('id', id).single();
    const jobTitle = jobData?.title || id;

    const { error } = await adminClient
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(
      supabase,
      'DELETE',
      'jobs',
      id,
      `قام المستخدم ${currentAdminEmail} بحذف الوظيفة: ${jobTitle}`
    );

    revalidatePath('/admin/dashboard/available-jobs');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل حذف الوظيفة' };
  }
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}