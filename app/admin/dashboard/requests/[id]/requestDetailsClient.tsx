'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/utils/useTranslation';
import { updateRequestStatus, takeActionOnRequests, resetActionOnRequests, deleteRequest } from '../actions';

interface RequestItem {
  id: string;
  service: string | null;
  company: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  action_taken?: boolean;
  action_note?: string;
  action_at?: string;
  action_by?: string;
  created_at: string;
}

interface RequestDetailsClientProps {
  requestItem: RequestItem;
  userEmail: string;
  userRole: string;
  roleDisplayName: string;
}

export default function RequestDetailsClient({ 
  requestItem, 
  userEmail, 
  userRole, 
  roleDisplayName 
}: RequestDetailsClientProps) {
  const router = useRouter();
  const { lang } = useTranslation();

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const handleToggleStatus = async () => {
    const newStatus = requestItem.status === 'unread' ? 'read' : 'unread';
    await updateRequestStatus(requestItem.id, newStatus);
    router.refresh();
  };

  const handleTakeAction = async () => {
    const note = prompt(lang === 'ar' ? 'أدخل ملاحظة أو تفاصيل الإجراء المتخذ:' : 'Enter action note/details:');
    if (note === null) return;

    try {
      await takeActionOnRequests([requestItem.id], note, userEmail);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error');
    }
  };

  const handleResetAction = async () => {
    if (!isAdmin) {
      alert(lang === 'ar' ? 'عذراً، إلغاء الإجراء مخصص للأدمن فقط' : 'Admin only action');
      return;
    }
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من إلغاء الإجراء وإعادة الطلب قيد الانتظار؟' : 'Reset action?')) {
      try {
        await resetActionOnRequests([requestItem.id]);
        router.refresh();
      } catch (error: any) {
        alert(error.message || 'Error');
      }
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      alert(lang === 'ar' ? 'الحذف مخصص للأدمن فقط' : 'Admin only');
      return;
    }
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الطلب نهائياً؟' : 'Are you sure you want to delete this request?')) {
      try {
        await deleteRequest(requestItem.id, userRole);
        router.push('/admin/dashboard/requests');
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <button
          onClick={() => router.push('/admin/dashboard/requests')}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all shadow-sm"
        >
          {lang === 'ar' ? '← عودة لطلبات الخدمات' : '← Back to Requests'}
        </button>

        <div className="text-xs text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <span>{userEmail}</span> — <strong className="text-emerald-600">{roleDisplayName}</strong>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-sm ${
              requestItem.status === 'unread'
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {requestItem.status === 'unread'
              ? (lang === 'ar' ? 'تعليم كمقروء' : 'Mark as Read')
              : (lang === 'ar' ? 'تعليم كغير مقروء' : 'Mark as Unread')}
          </button>

          {!requestItem.action_taken ? (
            <button
              onClick={handleTakeAction}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
            >
              {lang === 'ar' ? 'اتخاذ إجراء' : 'Take Action'}
            </button>
          ) : (
            isAdmin && (
              <button
                onClick={handleResetAction}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
              >
                {lang === 'ar' ? 'إلغاء الإجراء (قيد الانتظار)' : 'Reset Action'}
              </button>
            )
          )}

          {isAdmin && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
            >
              {lang === 'ar' ? 'حذف الطلب' : 'Delete Request'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'الخدمة المطلوبة' : 'Requested Service'}</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{requestItem.service || (lang === 'ar' ? 'خدمة عامة' : 'General Service')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'اسم العميل' : 'Client Name'}</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{requestItem.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'الشركة' : 'Company'}</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{requestItem.company || '-'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{requestItem.email}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{requestItem.phone}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'حالة الإجراء' : 'Action Status'}</span>
            <div>
              {requestItem.action_taken ? (
                <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold">
                  ✔ {lang === 'ar' ? 'تم اتخاذ إجراء' : 'Action Taken'}
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold">
                  ⏳ {lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'تفاصيل الطلب' : 'Request Details'}</span>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {requestItem.message}
          </div>
        </div>

        {requestItem.action_taken && (
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'سجل الإجراء المتخذ' : 'Action Log'}</span>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <p><strong className="text-emerald-700 dark:text-emerald-400">الملاحظة:</strong> {requestItem.action_note || '---'}</p>
              <p><strong className="text-emerald-700 dark:text-emerald-400">بواسطة:</strong> {requestItem.action_by || '---'}</p>
              <p><strong className="text-emerald-700 dark:text-emerald-400">التاريخ:</strong> {requestItem.action_at ? new Date(requestItem.action_at).toLocaleString() : '---'}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
          <span>{lang === 'ar' ? 'تاريخ الاستلام: ' : 'Received at: '} {new Date(requestItem.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
        </div>
      </div>
    </div>
  );
}