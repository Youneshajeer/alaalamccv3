'use client';

import { useState, useEffect } from 'react';
import CustomerServiceForm from './customerServiceForm';
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';

const dictionaries = { ar, en };

export default function CustomerServicePage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    
    const savedLang = (localStorage.getItem('lang') as 'ar' | 'en') || 'ar';
    setLang(savedLang);

    
    const checkLangInterval = setInterval(() => {
      const currentLang = (localStorage.getItem('lang') as 'ar' | 'en') || 'ar';
      if (currentLang !== lang) {
        setLang(currentLang);
      }
    }, 100);

    return () => clearInterval(checkLangInterval);
  }, [lang]);

  
  const t = dictionaries[lang]?.customerService || dictionaries.ar.customerService;

  return (
    <main className="min-h-screen py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <CustomerServiceForm dict={t} lang={lang} />
      </div>
    </main>
  );
}