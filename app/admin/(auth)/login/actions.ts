'use server';

import { z } from 'zod';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/supabase-server';
import { logActivity } from '@/lib/supabase/logger'; 

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
});

export async function loginAction(formData: { email: string; password: string }) {
  const parseResult = loginSchema.safeParse(formData);
  
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues[0]?.message || 'Invalid input data.';
    await logActivity({
      userId: null,
      userEmail: formData.email || 'unknown',
      actionType: 'LOGIN_FAILED',
      targetTable: 'profiles',
      targetId: null,
      description: `Failed login attempt (invalid data): ${errorMsg}`,
    });

    return {
      success: false,
      error: parseResult.error.issues[0]?.message || 'بيانات الإدخال غير صالحة.',
    };
  }

  const { email, password } = parseResult.data;
  const cleanEmail = email.trim().toLowerCase();
  const supabaseAdmin = getSupabaseAdminClient();
  const supabase = await getSupabaseServerClient();

  // 1. جلب بيانات البروفايل ومحاولة المصادقة بشكل متزامن (Parallel) لتوفير الوقت
  const [profileResult, authResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, failed_login_attempts, is_blocked')
      .eq('email', cleanEmail)
      .maybeSingle(),
    supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })
  ]);

  const profile = profileResult.data;
  const { data, error } = authResult;

  // 2. التحقق من حالة الحظر المسبق
  if (profile?.is_blocked) {
    await logActivity({
      userId: profile.id,
      userEmail: cleanEmail,
      actionType: 'LOGIN_BLOCKED_ATTEMPT',
      targetTable: 'profiles',
      targetId: profile.id,
      description: `Attempt to log into an already blocked account: ${cleanEmail}`,
      fieldName: 'is_blocked',
      oldValue: 'false',
      newValue: 'true',
    });

    return {
      success: false,
      error: 'تم تعطيل حسابك بسبب تجاوز عدد محاولات الدخول الخاطئة. يرجى التواصل مع المسؤول لإعادة التفعيل.',
    };
  }

  // 3. في حال فشل تسجيل الدخول (كلمة مرور خطأ أو بريد غير موجود)
  if (error || !data.user) {
    if (profile) {
      const prevAttempts = profile.failed_login_attempts || 0;
      const newAttempts = prevAttempts + 1;
      const shouldBlock = newAttempts >= 3;

      // تحديث محاولات الفشل في الخلفية
      await supabaseAdmin
        .from('profiles')
        .update({
          failed_login_attempts: newAttempts,
          is_blocked: shouldBlock,
        })
        .eq('id', profile.id);

      if (shouldBlock) {
        await logActivity({
          userId: profile.id,
          userEmail: cleanEmail,
          actionType: 'ACCOUNT_BLOCKED',
          targetTable: 'profiles',
          targetId: profile.id,
          description: `Account automatically blocked after exceeding 3 failed login attempts for email: ${cleanEmail}`,
          fieldName: 'is_blocked',
          oldValue: 'false',
          newValue: 'true',
        });

        return {
          success: false,
          error: 'تم تجاوز الحد الأقصى للمحاولات (3 محاولات خاطئة). تم حظر الحساب تلقائياً!',
        };
      }

      await logActivity({
        userId: profile.id,
        userEmail: cleanEmail,
        actionType: 'LOGIN_FAILED',
        targetTable: 'profiles',
        targetId: profile.id,
        description: `Failed login attempt (${newAttempts}/3) for email: ${cleanEmail}`,
        fieldName: 'failed_login_attempts',
        oldValue: String(prevAttempts),
        newValue: String(newAttempts),
      });

      return {
        success: false,
        error: `فشل تسجيل الدخول. المحاولات المتبقية: ${3 - newAttempts}`,
      };
    }

    await logActivity({
      userId: null,
      userEmail: cleanEmail,
      actionType: 'LOGIN_FAILED',
      targetTable: 'profiles',
      targetId: null,
      description: `Failed login attempt with unregistered email: ${cleanEmail}`,
    });

    return {
      success: false,
      error: 'فشل تسجيل الدخول، يرجى التحقق من البريد الإلكتروني وكلمة المرور.',
    };
  }

  // 4. في حال نجاح تسجيل الدخول: تصفير محاولات الفشل وتسجيل النشاط
  if (profile) {
    await supabaseAdmin
      .from('profiles')
      .update({
        failed_login_attempts: 0,
        is_blocked: false,
      })
      .eq('id', profile.id);
  }

  await logActivity({
    userId: data.user.id,
    userEmail: data.user.email || cleanEmail,
    actionType: 'LOGIN_SUCCESS',
    targetTable: 'profiles',
    targetId: data.user.id,
    description: `User successfully logged into the system with email: ${cleanEmail}`,
  });

  return { success: true };
}