import { cookies } from 'next/headers';
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';

const dictionaries = { ar, en };

export async function getTranslation() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value as 'ar' | 'en') || 'ar';
  
  return {
    lang,
    t: dictionaries[lang] || dictionaries.ar,
  };
}