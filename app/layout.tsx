import { cookies } from 'next/headers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GlobalToast from '@/components/GlobalToast';
import { GlobalTranslationProvider } from '@/utils/GlobalTranslationProvider';
import './globals.css'; 
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://alaalamcc.com'),
  title: {
    default: 'حلول العالم | شريكك التشغيلي المعتمد لمراكز الاتصال وإسناد الأعمال في السعودية',
    template: '%s | حلول العالم للاتصالات وتقنية المعلومات'
  },
  description: 'نقدم حلول مراكز الاتصال المتقدمة، استضافة البيانات محلياً داخل السعودية، تشغيل الكوادر الوطنية المؤهلة، وأنظمة الأتمتة وروبوتات الخدمة بدعم وتشفير مؤسسي كامل.',
  keywords: [
    'مركز اتصال السعودية',
    'إسناد الأعمال',
    'خدمات كول سنتر',
    'استضافة بيانات سحابية',
    'أتمتة العمليات RPA',
    'حلول العالم للاتصالات وتقنية المعلومات'
  ],
  authors: [{ name: 'World Business Solutions' }],
  creator: 'World Business Solutions',
  publisher: 'World Business Solutions',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    url: 'https://alaalamcc.com',
    title: 'حلول العالم | شريكك التشغيلي المعتمد لمراكز الاتصال في السعودية',
    description: 'بناء وتشغيل مراكز اتصال مخصصة بمواصفات أمنية عالية واستضافة محلية 100%.',
    siteName: 'حلول العالم',
    images: [
      {
        url: '/images/og-cover.png',
        width: 1200,
        height: 630,
        alt: 'حلول العالم للاتصالات وتقنية المعلومات',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'حلول العالم | شريكك التشغيلي المعتمد لمراكز الاتصال',
    description: 'تأسيس وتشغيل مراكز الاتصال وإسناد الأعمال بأعلى معايير الجودة والامتثال السعودي.',
    images: ['/images/og-cover.png'],
  },
  alternates: {
    canonical: 'https://alaalamcc.com',
    languages: {
      'ar-SA': 'https://alaalamcc.com',
      'en-US': 'https://alaalamcc.com/en',
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value as 'ar' | 'en') || 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "حلول العالم للاتصالات وتقنية المعلومات",
              "alternateName": "World Business Solutions",
              "url": "https://alaalamcc.com",
              "logo": "https://alaalamcc.com/images/logo.webp",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "SA",
                "addressLocality": "الرياض"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+966 54 793 8719",
                "contactType": "customer service",
                "areaServed": "SA",
                "availableLanguage": ["Arabic", "English"]
              },
              "sameAs": [
                "https://www.linkedin.com/company/alaalamcc",
                "https://twitter.com/alaalamcc"
              ]
            })
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col justify-between bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        <GlobalTranslationProvider initialLang={lang}>
          <GlobalToast />
          <Header />
          <main className="grow">
            {children}
          </main>
          <Footer />
        </GlobalTranslationProvider>
      </body>
    </html>
  );
}