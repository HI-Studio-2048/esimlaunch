import { prisma } from '../lib/prisma';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  metaTags?: Record<string, string>;
}

export const seoService = {
  /**
   * Get store SEO configuration
   */
  async getStoreSEO(storeId: string): Promise<SEOConfig | null> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        name: true,
        businessName: true,
        seoConfig: true,
      },
    });

    if (!store) {
      return null;
    }

    const seoConfig = store.seoConfig as SEOConfig | null;

    return seoConfig || {
      title: `${store.businessName || store.name} - eSIM Store`,
      description: `Buy eSIM cards for your travels at ${store.businessName || store.name}`,
      keywords: ['esim', 'travel', 'data', 'roaming'],
    };
  },

  /**
   * Update store SEO configuration
   */
  async updateStoreSEO(storeId: string, config: SEOConfig) {
    return prisma.store.update({
      where: { id: storeId },
      data: {
        seoConfig: config,
      },
    });
  },

  /**
   * Generate sitemap for store
   */
  async generateSitemap(storeId: string): Promise<string> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        domain: true,
        subdomain: true,
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    const baseUrl = store.domain 
      ? `https://${store.domain}`
      : `https://${store.subdomain}.esimlaunch.com`;

    // Generate sitemap XML
    const urls = [
      { loc: baseUrl, changefreq: 'daily', priority: '1.0' },
      { loc: `${baseUrl}/packages`, changefreq: 'weekly', priority: '0.8' },
      { loc: `${baseUrl}/help`, changefreq: 'monthly', priority: '0.6' },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return sitemap;
  },

  /**
   * Generate robots.txt for store
   */
  async generateRobotsTxt(storeId: string): Promise<string> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        domain: true,
        subdomain: true,
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    const baseUrl = store.domain 
      ? `https://${store.domain}`
      : `https://${store.subdomain}.esimlaunch.com`;

    return `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml`;
  },
};




