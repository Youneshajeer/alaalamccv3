'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { submitServiceRequest } from './actions';

import { useTranslation } from '@/utils/useTranslation';

export default function RequestServiceForm() {
  const {lang,t}=useTranslation()
const requestServiceText =t.requestService
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service') || 'consultation';
const displayServiceName = serviceParam === 'consultation' 
    ? (lang === 'ar' ? 'جلسة الاستشارة الأولى' : 'First Consultation Session') 
    : serviceParam;

  const [state, formAction, isPending] = useActionState(submitServiceRequest, null);

  const serviceKey = serviceParam;
  return (
    <div className={`min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <main className="grow py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-sm mx-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{requestServiceText.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {requestServiceText.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {requestServiceText.subtitle}
          </p>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm">
          {state?.success ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {requestServiceText.successTitle}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                {state.message || requestServiceText.successDesc}
              </p>
              
              <div className="pt-4">
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors shadow-sm cursor-pointer"
                >
                  {lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
                </a>
              </div>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              <input type="hidden" name="service" value={serviceKey} />

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {requestServiceText.serviceLabel}
                </label>
                <input
                  type="text"
                  readOnly
                  value={displayServiceName}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 text-sm font-bold cursor-not-allowed select-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {requestServiceText.companyLabel}
                </label>
                <input
                  type="text"
                  name="company"
                  placeholder={requestServiceText.companyPlaceholder}
                  defaultValue={state?.fields?.company ? String(state.fields.company) : ''}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {state?.error?.company && <p className="text-xs text-red-500 font-semibold">{state.error.company}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {requestServiceText.nameLabel}
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder={requestServiceText.namePlaceholder}
                    defaultValue={state?.fields?.name ? String(state.fields.name) : ''}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {state?.error?.name && <p className="text-xs text-red-500 font-semibold">{state.error.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@domain.com"
                  defaultValue={state?.fields?.email ? String(state.fields.email) : ''}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {state?.error?.email && <p className="text-xs text-red-500 font-semibold">{state.error.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {requestServiceText.phoneLabel}
                </label>
                <input
                  type="tel"
                  name="phone"
                  maxLength={15}
                  placeholder={requestServiceText.phonePlaceholder}
                    defaultValue={state?.fields?.phone ? String(state.fields.phone) : ''}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {state?.error?.phone && <p className="text-xs text-red-500 font-semibold">{state.error.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  {requestServiceText.messageLabel}
                </label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder={requestServiceText.messagePlaceholder}
                    defaultValue={state?.fields?.message ? String(state.fields.message) : ''}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                ></textarea>
                {state?.error?.message && <p className="text-xs text-red-500 font-semibold">{state.error.message}</p>}
              </div>

              {state && !state.success && state.message && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{state.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 transition-all duration-300 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : requestServiceText.submitBtn}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}