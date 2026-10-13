'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  lang: 'ar' | 'en';
  totalResults?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  lang,
  totalResults,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 gap-3">
      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {lang === 'ar'
          ? `عرض الصفحة ${currentPage} من ${totalPages} ${totalResults ? `(إجمالي النتائج: ${totalResults})` : ''}`
          : `Showing page ${currentPage} of ${totalPages} ${totalResults ? `(Total: ${totalResults})` : ''}`}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          {lang === 'ar' ? 'السابق' : 'Previous'}
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentPage === page
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          {lang === 'ar' ? 'التالي' : 'Next'}
        </button>
      </div>
    </div>
  );
}