'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/utils/useTranslation';
import AdminHeader from '@/components/admin/AdminHeader';
import Pagination from '@/components/Pagination';
import { updateRequestStatus, takeActionOnRequests, resetActionOnRequests, deleteRequest } from './actions';
import { supabase } from '@/lib/supabase/supabase';

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

interface RequestClientProps {
  initialRequests: RequestItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  currentSearch: string;
  currentStatus: string;
  userEmail: string;
  userRole: 'admin' | 'supervisor';
  permission:{
          allowdView:boolean,
          allowdUpdate :boolean,
          allowdManage:boolean,
          allowdDelete:boolean,
          isAuthorized:boolean,
          
        }
}

export default function RequestClient({
  initialRequests,
  totalPages,
  currentPage,
  currentSearch,
  currentStatus,
  userEmail,
  userRole,
  permission,
}: RequestClientProps) {
  const router = useRouter();
  const { lang } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState(currentSearch);
  const [status, setStatus] = useState(currentStatus);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== currentSearch) {
        startTransition(() => {
          router.push(`/admin/dashboard/requests?page=1&search=${encodeURIComponent(search)}&status=${status}`);
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, currentSearch, status, router]);

  const handleStatusFilter = (newStatus: string) => {
    setStatus(newStatus);
    startTransition(() => {
      router.push(`/admin/dashboard/requests?page=1&search=${encodeURIComponent(search)}&status=${newStatus}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      router.push(`/admin/dashboard/requests?page=${newPage}&search=${encodeURIComponent(search)}&status=${status}`);
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(initialRequests.map((r) => r.id));
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

  const handleSingleTakeAction = async (id: string) => {
    const note = prompt(lang === 'ar' ? 'أدخل ملاحظة أو تفاصيل الإجراء المتخذ:' : 'Enter action note/details:');
    if (note === null) return;

    try {
      await takeActionOnRequests([id], note, userEmail);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Error');
    }
  };

  const handleResetAction = async () => {
    
    
    if (selectedIds.length === 0) return;

    if (confirm(lang === 'ar' ? 'هل أنت متأكد من إلغاء الإجراء وإعادة الطلبات لقيد الانتظار؟' : 'Reset action for selected items?')) {
      try {
        await resetActionOnRequests(selectedIds);
        setSelectedIds([]);
        router.refresh();
      } catch (error: any) {
        alert(error.message || 'Error');
      }
    }
  };

  const handleDelete = async (id: string) => {
  
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) {
      try {
        await deleteRequest(id, userRole);
        router.refresh();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-6">
      <AdminHeader
        titleAr="طلبات الخدمات"
        titleEn="Service Requests"
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
            placeholder={lang === 'ar' ? 'بحث بالاسم، الخدمة، الشركة...' : 'Search...'}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                status === 'all' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => handleStatusFilter('unread')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                status === 'unread' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              {lang === 'ar' ? 'غير مقروءة' : 'Unread'}
            </button>
            <button
              onClick={() => handleStatusFilter('read')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                status === 'read' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              {lang === 'ar' ? 'مقروءة' : 'Read'}
            </button>
          </div>
            {permission?.allowdManage?selectedIds.length > 0 && (
            <button
              onClick={handleResetAction}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm"
            >
              {lang === 'ar' ? `إلغاء الإجراء للمحدد (${selectedIds.length})` : `Reset Action`}
            </button>
          ):(<div></div>)}

          
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
                    checked={initialRequests.length > 0 && selectedIds.length === initialRequests.length}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">{lang === 'ar' ? 'الخدمة والعميل' : 'Service & Client'}</th>
                <th className="p-4">{lang === 'ar' ? 'الشركة والتواصل' : 'Company & Contact'}</th>
                <th className="p-4">{lang === 'ar' ? 'الرسالة والإجراء المتخذ' : 'Message & Action Note'}</th>
                <th className="p-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {initialRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                    {lang === 'ar' ? 'لا توجد طلبات مطابقة' : 'No requests found'}
                  </td>
                </tr>
              ) : (
                initialRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(req.id)}
                        onChange={() => handleSelectOne(req.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      <div className="text-emerald-600 dark:text-emerald-400">{req.service || (lang === 'ar' ? 'خدمة عامة' : 'General')}</div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5">{req.name}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{req.company}</div>
                      <div>{req.email}</div>
                      <div className="text-slate-400 mt-0.5">{req.phone}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="text-slate-700 dark:text-slate-300 truncate mb-1">{req.message}</div>
                      {req.action_taken ? (
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-0.5">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                            ✔ {lang === 'ar' ? 'تم اتخاذ إجراء' : 'Action Taken'}
                          </span>
                          {req.action_note && <p className="text-slate-600 dark:text-slate-300">ملاحظة: {req.action_note}</p>}
                          <div className="text-[10px] text-slate-400">
                            بواسطة: {req.action_by || '---'} ({req.action_at ? new Date(req.action_at).toLocaleString() : ''})
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold">
                            ⏳ {lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
                          </span>
                          {permission?.allowdManage?(<button
                            onClick={() => handleSingleTakeAction(req.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                          >
                            {lang === 'ar' ? 'اتخاذ إجراء' : 'Take Action'}
                          </button>):(<div></div>)}
                          
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold inline-block ${
                        req.status === 'unread'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {req.status === 'unread' ? (lang === 'ar' ? 'غير مقروء' : 'Unread') : (lang === 'ar' ? 'مقروء' : 'Read')}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/admin/dashboard/requests/${req.id}`)}
                        className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-bold rounded-xl transition-all"
                      >
                        {lang === 'ar' ? 'عرض' : 'View'}
                      </button>
                      { permission?.allowdDelete?(
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all"
                        >
                          {lang === 'ar' ? 'حذف' : 'Delete'}
                        </button>
                      ):(<div></div>)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}