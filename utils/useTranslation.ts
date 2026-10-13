'use client';

import { useGlobalLang } from '@/utils/GlobalTranslationProvider';
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';

const dictionaries = { ar, en };

export function useTranslation() {
  const { lang, setLang, isMounted } = useGlobalLang();
  
  return {
    lang,
    setLang,
    t: dictionaries[lang] || dictionaries.ar,
    isMounted,
  };
}