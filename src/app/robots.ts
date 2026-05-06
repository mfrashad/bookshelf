import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bookshelf.aiforgood.my';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/sign-in', '/sign-up', '/onboarding', '/test'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
