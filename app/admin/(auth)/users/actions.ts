'use server';

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { createUserSchema } from '@/lib/validations/adminValidations';
import { hasPermission } from '@/lib/supabase/permissions';
import { logActivity } from '@/lib/supabase/logger'; 
import crypto from 'crypto';


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

export async function createNewRoleAction(formData: { name: string; display_name: string }) {
  if (!(await verifyAdminAccess())) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لإنشاء أدوار جديدة.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: existingRole } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', formData.name.trim())
    .maybeSingle();

  if (existingRole) {
    return { success: false, error: 'اسم الدور البرمجي موجود مسبقاً في النظام.' };
  }

  const { error } = await supabaseAdmin.from('roles').insert([
    {
      name: formData.name.trim(),
      display_name: formData.display_name.trim(),
    }
  ]);

  if (error) {
    return { success: false, error: 'حدث خطأ أثناء إضافة الدور الجديد.' };
  }

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'CREATE',
    targetTable: 'roles',
    targetId: null,
    description: `User ${currentAdminEmail} created a new role: ${formData.display_name.trim()} (${formData.name.trim()})`,
    fieldName: 'name',
    oldValue: undefined,
    newValue: formData.name.trim(),
  });

  revalidatePath('/admin/users');
  return { success: true };
}

async function verifyAdminAccess() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const hasSuperAdminRole = userRoles?.some((ur: any) => 
    ur.roles?.name === 'super_admin' || ur.roles?.name === 'admin'
  );

  if (hasSuperAdminRole) {
    return true; 
  }

  const canViewDashboard = await hasPermission('dashboard.view');
  const allowedManage = await hasPermission('users.manage');
  return canViewDashboard && allowedManage;
}

export async function createUserAction(formData: {
  fullName: string;
  email: string;
  password: string;
  roleId: string;
}) {
  const isAuthorized = await verifyAdminAccess();
  if (!isAuthorized) {
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
  const currentAdminEmail = currentUser?.email || 'System Admin';

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

  await logActivity({
    userId: currentUser?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'CREATE',
    targetTable: 'profiles',
    targetId: userId,
    description: `User ${currentAdminEmail} created a new user with email: ${email}`,
    fieldName: 'email',
    oldValue: undefined,
    newValue: email,
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserRoleAction(userId: string, roleId: string) {
  if (!(await verifyAdminAccess())) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتعديل صلاحيات المستخدمين.' };
  }

  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

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

  const { data: oldUserRole } = await supabaseAdmin
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', userId)
    .maybeSingle();

  const oldRoleId = oldUserRole?.role_id || null;

  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  const { error } = await supabaseAdmin.from('user_roles').insert({
    user_id: userId,
    role_id: roleId,
  });

  if (error) return { success: false, error: error.message };

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'UPDATE_ROLE',
    targetTable: 'user_roles',
    targetId: userId,
    description: `User ${currentAdminEmail} updated role and permissions for user ${targetEmail}`,
    fieldName: 'role_id',
    oldValue: oldRoleId !== null ? String(oldRoleId) : undefined,
    newValue: roleId,
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function toggleUserStatusAction(id: string, currentStatus: boolean) {
  if (!(await verifyAdminAccess())) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتغيير حالة المستخدم.' };
  }

  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

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

  const statusText = newStatus ? 'active' : 'inactive';

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'TOGGLE_STATUS',
    targetTable: 'profiles',
    targetId: id,
    description: `User ${currentAdminEmail} changed status of ${targetEmail} to ${statusText}`,
    fieldName: 'is_active',
    oldValue: String(currentStatus),
    newValue: String(newStatus),
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function unblockUserAction(userId: string) {
  if (!(await verifyAdminAccess())) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لإلغاء حظر المستخدمين.' };
  }

  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

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

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'UNBLOCK_USER',
    targetTable: 'profiles',
    targetId: userId,
    description: `User ${currentAdminEmail} unblocked and reactivated user account ${targetEmail}`,
    fieldName: 'is_blocked',
    oldValue: 'true',
    newValue: 'false',
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUserAction(id: string) {
  if (!(await verifyAdminAccess())) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لحذف المستخدمين.' };
  }

  const userSupabase = await getSupabaseServerClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

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

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'DELETE',
    targetTable: 'profiles',
    targetId: id,
    description: `User ${currentAdminEmail} deleted user ${targetEmail}`,
    fieldName: 'id',
    oldValue: id,
    newValue: undefined,
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function createNewPermissionAction(formData: { name: string; module: string; description: string }) {
  if (!(await verifyAdminAccess())) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لإنشاء صلاحيات جديدة.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

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

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'CREATE',
    targetTable: 'permissions',
    targetId: null,
    description: `User ${currentAdminEmail} created a new permission named: ${formData.name.trim()}`,
    fieldName: 'name',
    oldValue: undefined,
    newValue: formData.name.trim(),
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateRolePermissionsAction(roleId: string, permissionIds: string[]) {
  if (!(await verifyAdminAccess())) {
    return { success: false, error: 'عذراً، لا تمتلك الصلاحية الكافية لتعديل صلاحيات الأدوار.' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentAdminEmail = user?.email || 'System Admin';

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

  await logActivity({
    userId: user?.id || null,
    userEmail: currentAdminEmail,
    actionType: 'UPDATE_PERMISSIONS',
    targetTable: 'role_permissions',
    targetId: roleId,
    description: `User ${currentAdminEmail} updated permissions for role ID: ${roleId}`,
    fieldName: 'permissions',
    oldValue: 'previous_set',
    newValue: `${permissionIds.length} permissions`,
  });

  revalidatePath('/admin/users');
  return { success: true };
}


export async function generateSecureResetTokenAction(targetUserId: string, targetUserEmail: string) {
  if (!(await verifyAdminAccess())) {
    return { success: false, error: 'غير مصرح لك بتنفيذ هذا الإجراء.' };
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  await logActivity({
    userId: user?.id || null,
    userEmail: user?.email || 'system',
    actionType: 'GENERATE_RESET_TOKEN',
    targetTable: 'profiles',
    targetId: targetUserId,
    description: `Admin generated a password reset token for user: ${targetUserEmail}`,
    fieldName: 'reset_token',
    oldValue: undefined,
    newValue: 'generated_token',
  });

  const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(targetUserEmail)}`;

  return {
    success: true,
    resetLink,
    message: 'تم إنشاء الرابط المؤقت بنجاح وهو صالح لمدة ساعة واحدة فقط ولصاحب الحساب حصرياً.'
  };
}

export async function executePasswordResetAction(token: string, newPassword: string) {
  const supabaseAdmin = getSupabaseAdminClient();

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, reset_token_expires_at')
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

  await logActivity({
    userId: profile.id,
    userEmail: profile.email || 'unknown',
    actionType: 'RESET_PASSWORD',
    targetTable: 'profiles',
    targetId: profile.id,
    description: `Password successfully reset for user: ${profile.email}`,
    fieldName: 'password',
    oldValue: 'encrypted_old',
    newValue: 'encrypted_new',
  });

  return { success: true };
}

export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
}