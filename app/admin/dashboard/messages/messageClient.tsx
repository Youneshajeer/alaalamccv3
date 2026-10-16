'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateMessageStatus, deleteMessage, bulkDeleteMessages, markAllAsRead } from './actions';
import AdminHeader from '@/components/admin/AdminHeader'; 

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

interface MessageClientProps {
  initialMessages: Message[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  currentSearch: string;
  currentStatus: string;
  lang: 'ar' | 'en';
  userEmail: string;
  userRole: 'admin' | 'supervisor';
  permission: {
    allowdView: boolean,
    allowdManage: boolean,
    allowdDelete: boolean,
  }

}

export default function MessageClient({
  initialMessages,
  totalPages,
  currentPage,
  currentSearch,
  currentStatus,
  lang,
  userEmail,
  userRole,
  permission,
}: MessageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(currentSearch);
  const [status, setStatus] = useState(currentStatus);

  const handleLogout = async () => {
    router.push('/admin/login');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== currentSearch) {
        startTransition(() => {
          router.push(`/admin/dashboard/messages?page=1&search=${encodeURIComponent(search)}&status=${status}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentSearch, status, router]);

  const handleStatusFilter = (newStatus: string) => {
    setStatus(newStatus);
    startTransition(() => {
      router.push(`/admin/dashboard/messages?page=1&search=${encodeURIComponent(search)}&status=${newStatus}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      router.push(`/admin/dashboard/messages?page=${newPage}&search=${encodeURIComponent(search)}&status=${status}`);
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(initialMessages.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleStatus = async (id: string, currentStatusStr: string) => {
    const newStatus = currentStatusStr === 'unread' ? 'read' : 'unread';
    try {
      await updateMessageStatus(id, newStatus);
      router.refresh();
    } catch (error) {
      alert(lang === 'ar' ? 'حدث خطأ أثناء تحديث الحالة' : 'Error updating status');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      router.refresh();
    } catch (error) {
      alert(lang === 'ar' ? 'حدث خطأ أثناء تحديث جميع الرسائل' : 'Error marking all as read');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الرسالة نهائياً؟' : 'Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(id);
        router.refresh();
      } catch (error) {
        alert(lang === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting message');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(lang === 'ar' ? `هل أنت متأكد من حذف ${selectedIds.length} رسائل؟` : `Are you sure you want to delete ${selectedIds.length} messages?`)) {
      try {
        await bulkDeleteMessages(selectedIds);
        setSelectedIds([]);
        router.refresh();
      } catch (error) {
        alert(lang === 'ar' ? 'حدث خطأ أثناء الحذف الجماعي' : 'Error during bulk delete');
      }
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-6">
      <AdminHeader
        titleAr="إدارة رسائل العملاء"
        titleEn="Customer Messages Management"
        lang={lang}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-full sm:w-auto flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث تلقائي (بالاسم، الشركة، النص أو البريد)...' : 'Live search by name, company, message...'}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${status === 'all' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => handleStatusFilter('unread')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${status === 'unread' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              {lang === 'ar' ? 'غير مقروءة' : 'Unread'}
            </button>
            <button
              onClick={() => handleStatusFilter('read')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${status === 'read' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              {lang === 'ar' ? 'مقروءة' : 'Read'}
            </button>
          </div>
          {permission?.allowdManage ? (<button

            onClick={handleMarkAllAsRead}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
          >
            {lang === 'ar' ? 'تعليم الكل كمقروءة' : 'Mark All Read'}
          </button>) : (<div></div>)}


          {selectedIds.length > 0 && (
            permission?.allowdDelete ? (<button
              onClick={handleBulkDelete}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
            >
              {lang === 'ar' ? `حذف المحدد (${selectedIds.length})` : `Delete Selected (${selectedIds.length})`}
            </button>) : (<div></div>))}

        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={initialMessages.length > 0 && selectedIds.length === initialMessages.length}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">{lang === 'ar' ? 'المرسل والشركة' : 'Sender & Company'}</th>
                <th className="p-4">{lang === 'ar' ? 'البريد والهاتف' : 'Email & Phone'}</th>
                <th className="p-4">{lang === 'ar' ? 'مضمون الرسالة' : 'Message'}</th>
                <th className="p-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-4">{lang === 'ar' ? 'تغيير الحالة' : 'Status Action'}</th>
                <th className="p-4">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {initialMessages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'ar' ? 'لا توجد رسائل مطابقة' : 'No messages found'}
                  </td>
                </tr>
              ) : (
                initialMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(msg.id)}
                        onChange={() => handleSelectOne(msg.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      <div>{msg.name}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-normal">{msg.company}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-xs">
                      <div>{msg.email}</div>
                      <div className="text-slate-400 mt-0.5">{msg.phone}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {msg.message}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${msg.status === 'unread'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200'
                        }`}>
                        {msg.status === 'unread' ? (lang === 'ar' ? 'غير مقروءة' : 'Unread') : (lang === 'ar' ? 'مقروءة' : 'Read')}
                      </span>
                    </td>

                    <td className="p-4">
                      {permission?.allowdManage ? (<button
                        onClick={() => handleToggleStatus(msg.id, msg.status)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-sm ${msg.status === 'unread'
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                      >
                        {msg.status === 'unread' ? (lang === 'ar' ? 'تعليم كمقروءة' : 'Mark Read') : (lang === 'ar' ? 'تعليم كغير مقروءة' : 'Mark Unread')}
                      </button>) : (<div></div>)}


                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-4 text-center space-x-2 whitespace-nowrap">
                      {permission?.allowdView ? (<button
                        onClick={() => router.push(`/admin/dashboard/messages/${msg.id}`)}
                        className="px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-xl transition-all"
                      >
                        {lang === 'ar' ? 'عرض' : 'View'}
                      </button>) : (<div></div>)}
                      {permission?.allowdDelete ? (<button
                        onClick={() => handleDelete(msg.id)}
                        className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all"
                      >
                        {lang === 'ar' ? 'حذف' : 'Delete'}
                      </button>) : (<div></div>)}



                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm"
            >
              {lang === 'ar' ? 'السابق' : 'Previous'}
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {lang === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm"
            >
              {lang === 'ar' ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}