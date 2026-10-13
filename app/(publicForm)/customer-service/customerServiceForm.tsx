'use client';

import { useActionState } from 'react';
import { useTransition } from 'react';
import { submitCustomerService } from './actions';
import Link from 'next/link';
import { CheckCircle2, Send, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/utils/useTranslation';

interface CustomerServiceFormProps {
  dict: any;
  lang?: 'ar' | 'en';
  
}

export default function CustomerServiceForm({ dict }: CustomerServiceFormProps) {
  const [state, formAction, isPending] = useActionState(submitCustomerService, null);
const {lang,t}=useTranslation()
  if (state?.success) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-6 shadow-sm">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
          {dict.successTitle}
        </h3>
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          {state.message || dict.successDesc}
        </p>
        <Link
          href="/"
          className="inline-block w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition shadow-md"
        >
          {dict.returnHome}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 max-w-xl mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {dict.formTitle}
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        {dict.formDesc}
      </p>

      
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {dict.company}
        </label>
        <input
          type="text"
          name="company"
          defaultValue={state?.fields?.company ? String(state.fields.company) : ''}
          placeholder={dict.companyPlaceholder}
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {state?.error?.company && <p className="text-xs text-red-500 font-semibold">{state.error.company}</p>}
      </div>

      
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {dict.name}
        </label>
        <input
          type="text"
          name="name"
          defaultValue={state?.fields?.name ? String(state.fields.name) : ''}
          placeholder={dict.namePlaceholder}
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {state?.error?.name && <p className="text-xs text-red-500 font-semibold">{state.error.name}</p>}
      </div>

      
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {dict.email}
        </label>
        <input
          type="email"
          name="email"
          defaultValue={state?.fields?.email ? String(state.fields.email) : ''}
          placeholder="example@domain.com"
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {state?.error?.email && <p className="text-xs text-red-500 font-semibold">{state.error.email}</p>}
      </div>

      
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {dict.phone}
        </label>
        <input
          type="tel"
          name="phone"
          defaultValue={state?.fields?.phone ? String(state.fields.phone) : ''}
          placeholder="+966 5XXXXXXXX"
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {state?.error?.phone && <p className="text-xs text-red-500 font-semibold">{state.error.phone}</p>}
      </div>

      
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {dict.message}
        </label>
        <textarea
          name="message"
          rows={4}
          defaultValue={state?.fields?.message ? String(state.fields.message) : ''}
          placeholder={dict.messagePlaceholder}
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        ></textarea>
        {state?.error?.message && <p className="text-xs text-red-500 font-semibold">{state.error.message}</p>}
      </div>

      
      {state?.message && !state?.success && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {isPending ? dict.sending : dict.send}
      </button>
    </form>
  );
}