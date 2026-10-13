'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from './actions';
import { useTranslation } from '@/utils/useTranslation';
import { useSearchParams } from 'next/navigation';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const disActivated = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {lang,t} =useTranslation()

 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginAction({ email, password });

      if (!result.success) {
        setError(
          lang === 'ar'
            ? result.error || 'فشل تسجيل الدخول، يرجى التحقق من البيانات.'
            : 'Login failed, please check your credentials.'
        );
        setLoading(false);
        return;
      }

      router.refresh();
      router.push('/admin/dashboard');
    } catch (err) {
      setError(
        lang === 'ar'
          ? 'حدث خطأ أثناء التواصل مع السيرفر.'
          : 'An unexpected error occurred.'
      );
      setLoading(false); 
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300
      `}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <main className="grow py-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full flex flex-col justify-center space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-sm mx-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>
              {lang === 'ar'
                ? 'لوحة الإدارة '
                : 'Central Administration Portal'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'ar' ? 'تسجيل دخول المشرفين' : 'Admin Sign In'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {lang === 'ar'
              ? 'الرجاء إدخال بيانات الاعتماد الخاصة بحساب الإدارة للوصول إلى لوحة التحكم ومتابعة طلبات التوظيف.'
              : 'Please enter your admin credentials to access the dashboard and manage career applications.'}
          </p>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {disActivated === 'account_disabled' && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-rose-700 dark:text-rose-300 text-xs font-bold text-center animate-shake">
           {lang==="ar" ? "⚠️ حسابك الحالي معطل يرجى مراجعة مسؤول النظام." : "Your current account is disabled please contact the system administrator."}
          </div>
        )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                disabled={loading}
                placeholder="admin@alaalamcc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                required
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? lang === 'ar'
                  ? 'جاري التحقق وتسجيل الدخول...'
                  : 'Authenticating...'
                : lang === 'ar'
                ? 'تسجيل الدخول للنظام'
                : 'Sign In to System'}
            </button>
          </form>
        </div>

        <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>←</span>
            <span>
              {lang === 'ar'
                ? 'العودة إلى الصفحة الرئيسية للموقع'
                : 'Back to Home'}
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}