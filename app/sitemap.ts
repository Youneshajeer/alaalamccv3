import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://alaalamcc.com';

  const routes = [
    '',
    '/privacy',
    '/terms',
    '/acceptable-use',
    '/faq',
    '/jobs',
    '/careers',
    '/contact',
    '/how_it_work',
    '/services',
    '/why_us',
  ];

  const now = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}