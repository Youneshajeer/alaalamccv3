'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { executePasswordResetAction } from '../users/actions';


export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false); 
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ text: 'كلمات المرور غير متطابقة.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.', type: 'error' });
      return;
    }

    setIsLoading(true); 
    startTransition(async () => {
      const res = await executePasswordResetAction(token, password);
      if (res.success) {
        setMessage({ 
          text: 'تم تحديث كلمة المرور بنجاح! سيتم توجيهك الآن لصفحة تسجيل الدخول لتسجيل الدخول بكلمة المرور الجديدة.', 
          type: 'success' 
        });
        
        setTimeout(() => {
          window.location.replace('/admin/login');
        }, 3000);
      } else {
        setMessage({ text: res.error || 'فشل إعادة تعيين كلمة المرور.', type: 'error' });
        setIsLoading(false);
       }
    });
  };

  const isLocked = isPending || isLoading;

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">إعادة تعيين كلمة المرور</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            أدخل كلمة المرور الجديدة للحساب: <span className="font-bold text-emerald-600">{email}</span>
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              disabled={isLocked}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تأكيد كلمة المرور</label>
            <input
              type="password"
              required
              disabled={isLocked}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isLocked || !token}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLocked && message?.type !== 'success' ? 'جاري الحفظ وتحديث الحساب...' : isLocked ? 'جاري التوجيه...' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>
      </div>
    </div>
  );
}