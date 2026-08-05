import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://doc-mind-gamma.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/dashboard/*', '/admin', '/admin/*', '/chat', '/chat/*', '/studio', '/studio/*', '/upload'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
