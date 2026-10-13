'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { createUserSchema } from '@/lib/validations/adminValidations';
import { hasPermission } from '@/lib/supabase/permissions';
import crypto from 'crypto';
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

export async function createUserAction(formData: {
  fullName: string;
  email: string;
  password: string;
  roleId: string;
}) {
  // 🔒 التحقق من الصلاحية
  const allowedManage = await hasPermission('users.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لإنشاء مستخدم جديد.' };
  }

  const validationResult = createUserSchema.safeParse(formData);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map((err: any) => err.message).join(' - ');
    return { success: false, error: errorMessages };
  }

  const { fullName, email, password } = validationResult.data;
  const { roleId } = formData;

  const userSupabase = await getSupabaseServerClient();
  const { data: { user: currentUser } } = await userSupabase.auth.getUser();
  const currentAdminEmail = currentUser?.email || 'مشرف النظام';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: existingUser } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .ilike('email', email.trim())
    .maybeSingle();

  if (existingUser) {
    return { success: false, error: `البريد الإلكتروني "${email}" موجود بالفعل في النظام.` };
  }

  const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (signUpError || !authData.user) {
    return { success: false, error: signUpError?.message || 'فشل إنشاء حساب المستخدم.' };
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabaseAdmin.from('profiles').insert([
    {
      id: userId,
      email,
      full_name: fullName,
      is_active: true,
      failed_login_attempts: 0,
      is_blocked: false,
    },
  ]);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  const { error: roleAssignmentError } = await supabaseAdmin.from('user_roles').insert([
    {
      user_id: userId,
      role_id: roleId,
    },
  ]);

  if (roleAssignmentError) {
    return { success: false, error: roleAssignmentError.message };
  }

  await logActivity(
    userSupabase,
    'CREATE',
    'profiles',
    userId,
    `قام المستخدم ${currentAdminEmail} بإنشاء مستخدم جديد بريد: ${email}`
  );

  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserRoleAction(userId: string, roleId: string) {
  const allowedManage = await hasPermission('users.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتعديل صلاحيات المستخدمين.' };
  }

  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  if (user?.id === userId) {
    return { success: false, error: 'لا يمكنك تغيير صلاحية حسابك الحالي بنفسك.' };
  }

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
  const targetEmail = targetProfile?.email || userId;

  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  const { error } = await supabaseAdmin.from('user_roles').insert({
    user_id: userId,
    role_id: roleId,
  });

  if (error) return { success: false, error: error.message };

  await logActivity(
    userSupabase,
    'UPDATE_ROLE',
    'user_roles',
    userId,
    `قام المستخدم ${currentAdminEmail} بتعديل دور وصلاحيات المستخدم ${targetEmail}`
  );

  revalidatePath('/admin/users');
  return { success: true };
}

export async function toggleUserStatusAction(id: string, currentStatus: boolean) {
  const allowedManage = await hasPermission('users.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتغيير حالة المستخدم.' };
  }

  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  if (user?.id === id) {
    return { success: false, error: 'لا يمكنك تعطيل حسابك الحالي.' };
  }

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', id)
    .single();
  const targetEmail = targetProfile?.email || id;

  const newStatus = !currentStatus;
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: newStatus })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  const statusText = newStatus ? 'نشط' : 'غير نشط';

  await logActivity(
    userSupabase,
    'TOGGLE_STATUS',
    'profiles',
    id,
    `قام المستخدم ${currentAdminEmail} بتغيير حالة ${targetEmail} إلى مستخدم ${statusText}`
  );

  revalidatePath('/admin/users');
  return { success: true };
}

export async function unblockUserAction(userId: string) {
  const allowedManage = await hasPermission('users.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لإلغاء حظر المستخدمين.' };
  }

  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
  const targetEmail = targetProfile?.email || userId;

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      failed_login_attempts: 0,
      is_blocked: false,
    })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logActivity(
    userSupabase,
    'UNBLOCK_USER',
    'profiles',
    userId,
    `قام المستخدم ${currentAdminEmail} بإلغاء حظر وإعادة تفعيل حساب المستخدم ${targetEmail}`
  );

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUserAction(id: string) {
  const allowedManage = await hasPermission('users.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لحذف المستخدمين.' };
  }

  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  if (user?.id === id) {
    return { success: false, error: 'لا يمكنك حذف حسابك الحالي.' };
  }

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', id)
    .single();
  const targetEmail = targetProfile?.email || id;

  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (deleteAuthError) return { success: false, error: deleteAuthError.message };

  const { error: deleteProfileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
  if (deleteProfileError) return { success: false, error: deleteProfileError.message };

  await logActivity(
    userSupabase,
    'DELETE',
    'profiles',
    id,
    `قام المستخدم ${currentAdminEmail} بحذف المستخدم ${targetEmail}`
  );

  revalidatePath('/admin/users');
  return { success: true };
}

export async function createNewPermissionAction(formData: { name: string; module: string; description: string }) {
  const allowedManage = await hasPermission('users.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لإنشاء صلاحيات جديدة.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin.from('permissions').insert([
    {
      name: formData.name.trim(),
      module: formData.module.trim(),
      description: formData.description.trim(),
    }
  ]);

  if (error) {
    return { success: false, error: 'هذه الصلاحية موجودة مسبقاً أو حدث خطأ في الإضافة.' };
  }

  await logActivity(
    supabase,
    'CREATE',
    'permissions',
    null,
    `قام المستخدم ${currentAdminEmail} بإنشاء صلاحية جديدة باسم: ${formData.name.trim()}`
  );

  revalidatePath('/admin/users');
  return { success: true };
}


export async function updateRolePermissionsAction(roleId: string, permissionIds: string[]) {
  const allowedManage = await hasPermission('users.manage');
  if (!allowedManage) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتعديل صلاحيات الأدوار.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'مشرف النظام';

  const supabaseAdmin = getSupabaseAdminClient();

  await supabaseAdmin.from('role_permissions').delete().eq('role_id', roleId);

  if (permissionIds.length > 0) {
    const insertData = permissionIds.map((permId) => ({
      role_id: roleId,
      permission_id: permId,
    }));

    const { error } = await supabaseAdmin.from('role_permissions').insert(insertData);
    if (error) return { success: false, error: error.message };
  }

  await logActivity(
    supabase,
    'UPDATE_PERMISSIONS',
    'role_permissions',
    roleId,
    `قام المستخدم ${currentAdminEmail} بتحديث صلاحيات الدور برقم المعرف: ${roleId}`
  );

  revalidatePath('/admin/users');
  return { success: true };

}
export async function generateSecureResetTokenAction(targetUserId: string, targetUserEmail: string) {
  const canManage = await hasPermission('users.manage');
  if (!canManage) {
    return { success: false, error: 'غير مصرح لك بتنفيذ هذا الإجراء.' };
  }

  const supabaseAdmin = getSupabaseAdminClient();

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { error: dbError } = await supabaseAdmin
    .from('profiles')
    .update({
      reset_token: resetToken,
      reset_token_expires_at: expiresAt,
    })
    .eq('id', targetUserId);

  if (dbError) {
    return { success: false, error: 'فشل إنشاء رابط إعادة التعيين الآمن.' };
  }

  const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(targetUserEmail)}`;

  return {
    success: true,
    resetLink,
    message: 'تم إنشاء الرابط المؤقت بنجاح وهو صالح لمدة ساعة واحدة فقط ولصاحب الحساب حصرياً.'
  };
}

export async function executePasswordResetAction(token: string, newPassword: string) {
  const supabaseAdmin = getSupabaseAdminClient();

  // 1. البحث عن المستخدم بالتوكن
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, reset_token_expires_at')
    .eq('reset_token', token)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: 'الرابط غير صالح أو تم استخدامه مسبقاً.' };
  }

  if (new Date() > new Date(profile.reset_token_expires_at)) {
    return { success: false, error: 'انتهت صلاحية هذا الرابط. يرجى طلب رابط جديد من الإدارة.' };
  }

  const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (updateAuthError) {
    return { success: false, error: updateAuthError.message };
  }

  await supabaseAdmin.auth.admin.signOut(profile.id);

  await supabaseAdmin
    .from('profiles')
    .update({
      reset_token: null,
      reset_token_expires_at: null,
      is_active: true,
      is_blocked: false,
      failed_login_attempts: 0
    })
    .eq('id', profile.id);

  return { success: true };
}