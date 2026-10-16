import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://alaalamcc.com';

  const routes = [
    '',
    '/privacy',
    '/terms',
    '/acceptable-use',
    '/faq',
    'contact',
    'how_it_work',
    'services',
    'why_us',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}