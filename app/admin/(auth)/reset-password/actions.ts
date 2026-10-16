'use server';

import { getSupabaseAdminClient } from '@/lib/supabase/supabase-server';
import { hasPermission } from '@/lib/supabase/permissions';
import { logActivity } from '@/lib/supabase/logger'; 
import crypto from 'crypto';

export async function generateSecureResetTokenAction(targetUserId: string, targetUserEmail: string) {
  const canManage = await hasPermission('users.manage');
  if (!canManage) {
    return { success: false, error: 'غير مصرح لك بتنفيذ هذا الإجراء.' };
  }

  const supabaseAdmin = getSupabaseAdminClient();

  const { data: { user: adminUser } } = await supabaseAdmin.auth.getUser();

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
    userId: adminUser?.id || null,
    userEmail: adminUser?.email || 'system',
    actionType: 'GENERATE_RESET_TOKEN',
    targetTable: 'profiles',
    targetId: targetUserId,
    description: `User ${adminUser?.email || 'system'} generated a secure password reset token for user: ${targetUserEmail}`,
    fieldName: 'reset_token',
    oldValue: 'null',
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
    return { success: false, error: 'انتهت صلاحية هذا الرابط. يرجى طلب رابط جديد.' };
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
    })
    .eq('id', profile.id);

  await logActivity({
    userId: profile.id,
    userEmail: profile.email || 'unknown',
    actionType: 'RESET_PASSWORD',
    targetTable: 'profiles',
    targetId: profile.id,
    description: `User ${profile.email || 'unknown'} successfully executed password reset for their account`,
    fieldName: 'password',
    oldValue: 'encrypted_old',
    newValue: 'encrypted_new',
  });

  return { success: true };
}