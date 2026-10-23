'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/utils/useTranslation';

export default function Footer() {
  const { lang,t } = useTranslation();
 
  return (
    <footer id="contact" className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <span>🌍</span> {lang === 'ar' ? 'شركة حلول العالم للاتصالات وتقنية المعلومات' : 'Alaalam Solutions for Telecom & IT'}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'ar' 
              ? 'مركز اتصال ومقر لخدمات الأعمال (BPO) يوفر حلول اتصال متكاملة وبنية تحتية مستضافة داخل المملكة العربية السعودية.' 
              : 'A BPO call center and business services hub providing integrated communication solutions and infrastructure hosted within the Kingdom of Saudi Arabia.'}
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <h5 className="text-white font-semibold mb-3">{lang === 'ar' ? 'روابط هامة وسياسات' : 'Quick Links & Policies'}</h5>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                {lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
              </Link>
            </li>
            <li>
              <Link href="/acceptable-use" className="hover:text-emerald-400 transition-colors">
                {lang === 'ar' ? 'سياسة الاستخدام المقبول' : 'Acceptable Use Policy'}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-emerald-400 transition-colors">
                {lang === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
              </Link>
            </li>
          </ul>
        </div>
            <div  className="space-y-2.5 text-xs">
             <h5 className="text-white font-semibold mb-2">{lang === 'ar' ? 'الوظائف' : 'jobs'}</h5>
            <p>
            <a href="/jobs" className=" font-mono text-gray-400 hover:text-emerald-400" dir="ltr">{lang === 'ar' ? 'الوظائف الشاغرة ' : 'Job Vacancies'}</a>
            </p>
            <p>
            <a href="/careers" className=" font-mono text-gray-400 hover:text-emerald-400" dir="ltr">{lang === 'ar' ? 'كن جزء من فريق العمل ': 'be a member of our team '}</a>

            </p>
            </div>

        <div className="space-y-2.5 text-xs">
          <h5 className="text-white font-semibold mb-2">{lang === 'ar' ? 'معلومات التواصل' : 'Contact Information'}</h5>
          
          <p className="flex items-center gap-1.5 flex-wrap">
            <span>📞</span> {lang === 'ar' ? 'الهاتف' : 'Phone'}: 
            <a href="tel:+966557111069" className="font-mono text-emerald-400 hover:underline" dir="ltr">+966 55 711 1069</a> 
            </p>
          <p className="flex items-center gap-1.5 flex-wrap">
            <span>📞</span> {lang === 'ar' ? 'الهاتف' : 'Phone'}:     
            <a href="tel:+966547938719" className="font-mono text-emerald-400 hover:underline" dir="ltr">+966 54 793 8719</a>
          </p>

          <p className="flex items-center gap-1.5 flex-wrap">
            <span>✉️</span> {lang === 'ar' ? 'البريد العام' : 'Info Email'}: 
            <a href="mailto:info@alaalamcc.com" className="font-mono text-emerald-400 hover:underline">info@alaalamcc.com</a>
          </p>

          <p className="flex items-center gap-1.5 flex-wrap">
            <span>💼</span> {lang === 'ar' ? 'المبيعات' : 'Sales Email'}: 
            <a href="mailto:sales@alaalamcc.com" className="font-mono text-emerald-400 hover:underline">sales@alaalamcc.com</a>
          </p>

          <p className="flex items-center gap-1.5 flex-wrap">
            <span>🛠️</span> {lang === 'ar' ? 'الدعم الفني' : 'Support Email'}: 
            <a href="mailto:support@alaalamcc.com" className="font-mono text-emerald-400 hover:underline">support@alaalamcc.com</a>
          </p>

          <p className="mt-2">
            📍 {lang === 'ar' ? 'العنوان' : 'Address'}: {lang === 'ar' ? '2457 شارع يحيى بن واقد الطائي - حي المنار - جدة - المملكة العربية السعودية' : '2457 Yahya Ibn Waqid Al Taee St, Al Manar Dist, Jeddah, KSA'}
          </p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500">
        {lang === 'ar' 
          ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} شركة حلول العالم للاتصالات وتقنية المعلومات.` 
          : `All rights reserved © ${new Date().getFullYear()} Alaalam Solutions for Telecom & IT.`}
      </div>
    </footer>
  );
}