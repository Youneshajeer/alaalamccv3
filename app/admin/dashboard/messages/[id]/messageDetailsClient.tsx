'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { updateMessageStatus, deleteMessage } from '../actions';

interface Message {
  id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}

export default function MessageDetailsClient({ message, lang }: { message: Message; lang: 'ar' | 'en' }) {
  const router = useRouter();

  const handleToggleStatus = async () => {
    const newStatus = message.status === 'unread' ? 'read' : 'unread';
    await updateMessageStatus(message.id, newStatus);
    router.refresh();
  };

  const handleDelete = async () => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?')) {
      await deleteMessage(message.id);
      router.push('/admin/dashboard/messages');
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push('/admin/dashboard/messages')}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all shadow-sm"
        >
          {lang === 'ar' ? '← عودة للرسائل' : '← Back to Messages'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all shadow-sm ${
              message.status === 'unread'
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {message.status === 'unread'
              ? (lang === 'ar' ? 'تعليم كمقروءة' : 'Mark as Read')
              : (lang === 'ar' ? 'تعليم كغير مقروءة' : 'Mark as Unread')}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
          >
            {lang === 'ar' ? 'حذف الرسالة' : 'Delete Message'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'اسم المرسل' : 'Sender Name'}</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{message.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'الشركة' : 'Company'}</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{message.company}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{message.email}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{message.phone}</p>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase">{lang === 'ar' ? 'محتوى الرسالة' : 'Message Content'}</span>
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {message.message}
          </div>
        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          {lang === 'ar' ? 'تاريخ الاستلام: ' : 'Received at: '}
          {new Date(message.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
        </div>
      </div>
    </div>
  );
}