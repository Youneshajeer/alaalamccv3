'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type LangType = 'ar' | 'en';

interface TranslationContextType {
  lang: LangType;
  setLang: (lang: LangType) => void;
  isMounted: boolean;
}

interface GlobalTranslationProviderProps {
  children: ReactNode;
  initialLang?: LangType;
}

const TranslationContext = createContext<TranslationContextType>({
  lang: 'ar',
  setLang: () => {
    console.warn('TranslationContext: setLang called outside of Provider');
  },
  isMounted: false,
});

export function GlobalTranslationProvider({
  children,
  initialLang = 'ar',
}: GlobalTranslationProviderProps) {
  const [lang, setLangState] = useState<LangType>(initialLang);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }, [lang, isMounted]);

  const setLang = (newLang: LangType) => {
    setLangState(newLang);

    document.cookie = `lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem('lang', newLang);

    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;

    router.refresh();
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, isMounted }}>
      <div className="w-full min-h-screen">
        {children}
      </div>
    </TranslationContext.Provider>
  );
}

export const useGlobalLang = () => useContext(TranslationContext);