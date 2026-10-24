'use client';
import Link from 'next/link';
import { useTranslation } from '@/utils/useTranslation';

export default function Footer() {
  const { lang } = useTranslation();

  return (
    <footer id="contact" className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base leading-snug">
            <span>🌍</span>
            <span>{lang === 'ar' ? 'شركة حلول العالم للاتصالات وتقنية المعلومات' : 'Alaalam Solutions for Telecom & IT'}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'ar'
              ? 'مركز اتصال ومقر لخدمات الأعمال (BPO) يوفر حلول اتصال متكاملة وبنية تحتية مستضافة داخل المملكة العربية السعودية.'
              : 'A BPO call center and business services hub providing integrated communication solutions and infrastructure hosted within the Kingdom of Saudi Arabia.'}
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <h5 className="text-white font-semibold text-sm mb-4 tracking-wide">
            {lang === 'ar' ? 'روابط هامة وسياسات' : 'Quick Links & Policies'}
          </h5>
          <ul className="space-y-2.5">
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
            <li>
              <Link href="/sitemap" className="hover:text-emerald-400 transition-colors">
                {lang === 'ar' ? 'خريطة الموقع' : 'Sitemap'}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-xs">
          <h5 className="text-white font-semibold text-sm mb-4 tracking-wide">
            {lang === 'ar' ? 'الوظائف' : 'Careers'}
          </h5>
          <ul className="space-y-2.5">
            <li>
              <Link href="/jobs" className="text-slate-400 hover:text-emerald-400 transition-colors">
                {lang === 'ar' ? 'الوظائف الشاغرة' : 'Job Vacancies'}
              </Link>
            </li>
            <li>
              <Link href="/careers" className="text-slate-400 hover:text-emerald-400 transition-colors">
                {lang === 'ar' ? 'كن جزءاً من فريق العمل' : 'Be a Member of Our Team'}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-xs">
          <h5 className="text-white font-semibold text-sm mb-4 tracking-wide">
            {lang === 'ar' ? 'معلومات التواصل' : 'Contact Information'}
          </h5>

          <div className="space-y-2">
            <p className="flex items-center gap-2 flex-wrap">
              <span>📞</span>
              <span className="text-slate-500">{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
              <a href="tel:+966557111069" className="font-mono text-emerald-400 hover:underline" dir="ltr">+966 55 711 1069</a>
            </p>
            <p className="flex items-center gap-2 flex-wrap">
              <span>📞</span>
              <span className="text-slate-500">{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
              <a href="tel:+966547938719" className="font-mono text-emerald-400 hover:underline" dir="ltr">+966 54 793 8719</a>
            </p>

            <p className="flex items-center gap-2 flex-wrap">
              <span>✉️</span>
              <span className="text-slate-500">{lang === 'ar' ? 'البريد:' : 'Email:'}</span>
              <a href="mailto:info@alaalamcc.com" className="font-mono text-emerald-400 hover:underline">info@alaalamcc.com</a>
            </p>

            <p className="flex items-center gap-2 flex-wrap">
              <span>💼</span>
              <span className="text-slate-500">{lang === 'ar' ? 'المبيعات:' : 'Sales:'}</span>
              <a href="mailto:sales@alaalamcc.com" className="font-mono text-emerald-400 hover:underline">sales@alaalamcc.com</a>
            </p>

            <p className="flex items-center gap-2 flex-wrap">
              <span>🛠️</span>
              <span className="text-slate-500">{lang === 'ar' ? 'الدعم:' : 'Support:'}</span>
              <a href="mailto:support@alaalamcc.com" className="font-mono text-emerald-400 hover:underline">support@alaalamcc.com</a>
            </p>

            <p className="pt-2 leading-relaxed text-slate-400">
              📍 <span className="text-slate-500">{lang === 'ar' ? 'العنوان:' : 'Address:'}</span> {lang === 'ar' ? '2457 شارع يحيى بن واقد الطائي - حي المنار - جدة - المملكة العربية السعودية' : '2457 Yahya Ibn Waqid Al Taee St, Al Manar Dist, Jeddah, KSA'}
            </p>
          </div>
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