'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGlobalLang } from '@/utils/GlobalTranslationProvider';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { lang, setLang } = useGlobalLang();

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark') || 
                   (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark');
    if (isDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const navLinks = [
    { name: lang === 'ar' ? 'الرئيسية' : 'Home', href: '/' },
    { name: lang === 'ar' ? 'خدماتنا' : 'Services', href: '/services' },
    { name: lang === 'ar' ? 'لماذا نحن' : 'Why Us', href: '/why_us' },
    { name: lang === 'ar' ? 'آلية العمل' : 'How It Works', href: '/how_it_works' },
    { name: lang === 'ar' ? 'الوظائف' : 'jobs', href: '/jobs' },
  ];

  const handleToggleDarkMode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const root = document.documentElement;
    const hasDark = root.classList.contains('dark');
    if (hasDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleToggleLanguage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-100 p-1 group-hover:scale-105 transition-transform">
            <img src="/images/logo.webp" alt="Alaalam" className="h-10 sm:h-12 w-auto object-contain" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black bg-linear-to-r from-slate-900 via-emerald-800 to-amber-600 dark:from-white dark:via-emerald-400 dark:to-amber-400 bg-clip-text text-transparent block leading-tight">
              {lang === 'ar' ? 'حلول العالم' : 'Alaalam'}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase block">
              Alaalam Solutions
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-slate-700 dark:text-slate-200">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-0 after:h-0.5 after:bg-emerald-500 hover:after:w-full after:transition-all">
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleDarkMode}
            className="p-2.5 rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all select-none"
            aria-label="Toggle Theme"
          >
            {mounted && isDarkMode ? '☀️' : '🌙'}
          </button>

          <button
            type="button"
            onClick={handleToggleLanguage}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all select-none"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>

         <div className="hidden lg:flex items-center gap-3 border-r border-slate-200 dark:border-slate-800 pr-3">
  <Link 
    href="/contact" 
    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md text-xs whitespace-nowrap active:scale-95 transition-all"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
    <span>{lang === 'ar' ? 'معلومات التواصل' : 'Contact Info'}</span>
  </Link>

  <Link 
    href="/customer-service" 
    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md text-xs whitespace-nowrap active:scale-95 transition-all"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
    <span>{lang === 'ar' ? 'تواصل مباشر' : 'Get in Touch'}</span>
  </Link>
</div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
            aria-label="القائمة"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 top-20 bg-slate-900/40 backdrop-blur-xs lg:hidden z-40 transition-opacity"
        />
      )}

      <div 
        className={`lg:hidden relative z-50 transition-all duration-300 ease-in-out overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xl ${
          isMobileMenuOpen ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-5 pt-4 pb-7 space-y-4">
          <div className="space-y-1">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-extrabold text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-slate-900 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
              >
                <span>{link.name}</span>
                <span className="text-slate-400 text-xs">{lang === 'ar' ? '←' : '→'}</span>
              </Link>
            ))}
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80 my-2" />

          <Link
  href="/contact"
  onClick={() => setIsMobileMenuOpen(false)}
  className="flex items-center justify-center gap-2 w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 text-sm active:scale-95 transition-all"
>
  {/* أيقونة معلومات الاتصال / دفتر العناوين */}
  <svg 
    className="w-4 h-4" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
    />
  </svg>

  <span>
    {lang === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
  </span>
</Link>
         <Link
  href="/customer-service"
  onClick={() => setIsMobileMenuOpen(false)}
  className="flex items-center justify-center gap-2 w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 text-sm active:scale-95 transition-all"
>
  {/* أيقونة المسجات / المحادثة */}
  <svg 
    className="w-4 h-4" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
    />
  </svg>

  <span>
    {lang === 'ar' ? 'تواصل مباشر' : 'Get in Touch'}
  </span>
</Link>
        </div>
      </div>
    </header>
  );
}