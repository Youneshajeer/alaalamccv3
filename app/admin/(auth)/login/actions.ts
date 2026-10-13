'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/supabase-server';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
});

async function logActivity(
  supabaseAdmin: any,
  userId: string | null,
  userEmail: string,
  actionType: string,
  targetTable: string,
  targetId: string | null,
  description: string
) {
  try {
    await supabaseAdmin.from('activity_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action_type: actionType,
      target_table: targetTable,
      target_id: targetId,
      description: description,
    });
  } catch (err) {
    console.error('Failed to log login activity:', err);
  }
}

export async function loginAction(formData: { email: string; password: string }) {
  const parseResult = loginSchema.safeParse(formData);
  const supabaseAdmin = getSupabaseAdminClient();

  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues[0]?.message || 'بيانات الإدخال غير صالحة.';
    
    await logActivity(
      supabaseAdmin,
      null,
      formData.email || 'unknown',
      'LOGIN_FAILED',
      'profiles',
      null,
      `محاولة دخول فاشلة (بيانات غير صالحة): ${errorMsg}`
    );

    return {
      success: false,
      error: errorMsg,
    };
  }

  const { email, password } = parseResult.data;
  const cleanEmail = email.trim().toLowerCase();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, failed_login_attempts, is_blocked')
    .eq('email', cleanEmail)
    .single();

  if (profile?.is_blocked) {
    await logActivity(
      supabaseAdmin,
      profile.id,
      cleanEmail,
      'LOGIN_BLOCKED_ATTEMPT',
      'profiles',
      profile.id,
      `محاولة دخول لحساب محظور بالفعل: ${cleanEmail}`
    );

    return {
      success: false,
      error: 'تم تعطيل حسابك بسبب تجاوز عدد محاولات الدخول الخاطئة. يرجى التواصل مع المسؤول لإعادة التفعيل.',
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error || !data.user) {
    if (profile) {
      const newAttempts = (profile.failed_login_attempts || 0) + 1;
      const shouldBlock = newAttempts >= 3;

      await supabaseAdmin
        .from('profiles')
        .update({
          failed_login_attempts: newAttempts,
          is_blocked: shouldBlock,
        })
        .eq('id', profile.id);

      if (shouldBlock) {
        await logActivity(
          supabaseAdmin,
          profile.id,
          cleanEmail,
          'ACCOUNT_BLOCKED',
          'profiles',
          profile.id,
          `تم حظر الحساب تلقائياً لتجاوزه 3 محاولات دخول خاطئة للبريد: ${cleanEmail}`
        );

        return {
          success: false,
          error: 'تم تجاوز الحد الأقصى للمحاولات (3 محاولات خاطئة). تم حظر الحساب تلقائياً!',
        };
      }

      await logActivity(
        supabaseAdmin,
        profile.id,
        cleanEmail,
        'LOGIN_FAILED',
        'profiles',
        profile.id,
        `محاولة دخول فاشلة (${newAttempts}/3) للبريد: ${cleanEmail}`
      );

      return {
        success: false,
        error: `فشل تسجيل الدخول. المحاولات المتبقية: ${3 - newAttempts}`,
      };
    }

    await logActivity(
      supabaseAdmin,
      null,
      cleanEmail,
      'LOGIN_FAILED',
      'profiles',
      null,
      `محاولة دخول بريد غير مسجل: ${cleanEmail}`
    );

    return {
      success: false,
      error: 'فشل تسجيل الدخول، يرجى التحقق من البريد الإلكتروني وكلمة المرور.',
    };
  }

  if (profile) {
    await supabaseAdmin
      .from('profiles')
      .update({
        failed_login_attempts: 0,
        is_blocked: false,
      })
      .eq('id', profile.id);
  }

  await logActivity(
    supabaseAdmin,
    data.user.id,
    data.user.email || cleanEmail,
    'LOGIN_SUCCESS',
    'profiles',
    data.user.id,
    `تم تسجيل الدخول بنجاح إلى النظام للبريد: ${cleanEmail}`
  );

  return { success: true };
}