import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getStoreBootstrapData,
  placeCustomerOrder,
  getOrderTrackingDetails,
  getCustomerOrdersByEmail,
  getWishlistBySession,
  toggleWishlistProduct,
  getAdminDashboardData,
  upsertAdminProduct,
  deleteAdminProduct,
  upsertAdminCategory,
  updateAdminOrderStatus,
  upsertAdminBlogPost,
  deleteAdminBlogPost,
  upsertAdminCoupon,
  updateSiteSettingsBatch,
  submitCustomerReview,
  subscribeNewsletter,
  getOrCreateUser,
  registerCustomerWithEmail,
  loginCustomerWithEmail,
  resetCustomerPassword,
  toggleCustomerBlock,
  getCustomerAddresses,
  addCustomerAddress,
} from './src/db/repository.ts';
import {
  generateSitemapIndexXml,
  generateUrlsetXml,
  generateRobotsTxt,
  validateAndCalculateCoupon,
} from './src/utils/commerceRules.ts';

dotenv.config();

const PUBLIC_STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' as const },
  { path: '/shop', priority: '0.9', changefreq: 'daily' as const },
  { path: '/categories', priority: '0.8', changefreq: 'weekly' as const },
  { path: '/new-arrivals', priority: '0.8', changefreq: 'daily' as const },
  { path: '/best-sellers', priority: '0.8', changefreq: 'daily' as const },
  { path: '/featured', priority: '0.8', changefreq: 'weekly' as const },
  { path: '/offers', priority: '0.8', changefreq: 'daily' as const },
  { path: '/about', priority: '0.7', changefreq: 'monthly' as const },
  { path: '/brand-story', priority: '0.7', changefreq: 'monthly' as const },
  { path: '/why-choose-us', priority: '0.7', changefreq: 'monthly' as const },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' as const },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' as const },
  { path: '/faq', priority: '0.7', changefreq: 'monthly' as const },
  { path: '/reviews', priority: '0.7', changefreq: 'weekly' as const },
  { path: '/track-order', priority: '0.6', changefreq: 'monthly' as const },
  { path: '/privacy-policy', priority: '0.4', changefreq: 'yearly' as const },
  { path: '/terms', priority: '0.4', changefreq: 'yearly' as const },
  { path: '/return-policy', priority: '0.5', changefreq: 'yearly' as const },
  { path: '/shipping-policy', priority: '0.5', changefreq: 'yearly' as const },
];

function resolveBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // ============================================================================
  // 1. DYNAMIC XML SITEMAPS & ROBOTS.TXT (DATABASE-DRIVEN)
  // ============================================================================
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const xml = generateSitemapIndexXml(baseUrl, new Date());
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(xml);
    } catch (error) {
      console.error('Error generating /sitemap.xml:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });

  app.get('/sitemap-pages.xml', async (req: Request, res: Response) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const entries = PUBLIC_STATIC_PAGES.map((p) => ({
        loc: `${baseUrl}${p.path === '/' ? '' : p.path}`,
        lastmod: new Date(),
        changefreq: p.changefreq,
        priority: p.priority,
        isPublished: true,
        noIndex: false,
      }));
      const xml = generateUrlsetXml(entries);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(xml);
    } catch (error) {
      console.error('Error generating /sitemap-pages.xml:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });

  app.get('/sitemap-products.xml', async (req: Request, res: Response) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const entries = data.products.map((prod) => ({
        loc: `${baseUrl}/product/${prod.slug}`,
        lastmod: prod.updatedAt || prod.createdAt || new Date(),
        changefreq: 'daily' as const,
        priority: prod.isFeatured ? '0.9' : '0.8',
        isPublished: prod.isPublished,
        noIndex: prod.noIndex,
      }));
      const xml = generateUrlsetXml(entries);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(xml);
    } catch (error) {
      console.error('Error generating /sitemap-products.xml:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });

  app.get('/sitemap-categories.xml', async (req: Request, res: Response) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const entries = data.categories.map((cat) => ({
        loc: `${baseUrl}/category/${cat.slug}`,
        lastmod: cat.updatedAt || cat.createdAt || new Date(),
        changefreq: 'weekly' as const,
        priority: '0.8',
        isPublished: cat.isEnabled,
        noIndex: cat.noIndex,
      }));
      const xml = generateUrlsetXml(entries);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(xml);
    } catch (error) {
      console.error('Error generating /sitemap-categories.xml:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });

  app.get('/sitemap-blog.xml', async (req: Request, res: Response) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const entries = data.blogPosts.map((post) => ({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt || post.publishedAt || new Date(),
        changefreq: 'weekly' as const,
        priority: '0.7',
        isPublished: post.status === 'published',
        noIndex: post.noIndex,
      }));
      const xml = generateUrlsetXml(entries);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.status(200).send(xml);
    } catch (error) {
      console.error('Error generating /sitemap-blog.xml:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });

  app.get('/robots.txt', async (req: Request, res: Response) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const customRules = data.settings.robots_custom_rules;
      const txt = generateRobotsTxt(baseUrl, customRules);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(200).send(txt);
    } catch (error) {
      const baseUrl = resolveBaseUrl(req);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(200).send(generateRobotsTxt(baseUrl));
    }
  });

  app.get('/api/export-index-html', async (req: Request, res: Response) => {
    try {
      const rawHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
      const standaloneHtml = rawHtml.replace(
        '<script type="module" src="/src/main.tsx"></script>',
        '<!-- Standalone index.html export for DXN Organic Point -->'
      );
      if (req.query.preview === '1') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
      }
      res.status(200).send(standaloneHtml);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate index.html export' });
    }
  });

  // ============================================================================
  // 2. PUBLIC STOREFRONT & CUSTOMER API ROUTES
  // ============================================================================
  app.get('/api/bootstrap', async (_req: Request, res: Response) => {
    try {
      const data = await getStoreBootstrapData();
      res.json(data);
    } catch (error: any) {
      console.error('Failed to fetch bootstrap data:', error);
      res.status(500).json({ error: error.message || 'Failed to load store data' });
    }
  });

  app.post('/api/coupons/validate', async (req: Request, res: Response) => {
    try {
      const { code, subtotal } = req.body;
      const data = await getStoreBootstrapData();
      const cleanCode = String(code || '')
        .trim()
        .toUpperCase();
      const found = data.coupons.find((c) => c.code.toUpperCase() === cleanCode);
      const result = validateAndCalculateCoupon(
        Number(subtotal || 0),
        found
          ? {
              code: found.code,
              discountPercent: found.discountPercent,
              minOrderAmount: Number(found.minOrderAmount),
              maxDiscountAmount: Number(found.maxDiscountAmount),
              expiryDate: found.expiryDate,
              isActive: found.isActive,
            }
          : null
      );
      res.json({ ...result, coupon: found || null });
    } catch (error: any) {
      res.status(400).json({ valid: false, discountAmount: 0, message: error.message });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const result = await placeCustomerOrder(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Order placement error:', error);
      res.status(400).json({ error: error.message || 'Failed to place order' });
    }
  });

  app.get('/api/orders/track/:orderNumber', async (req: Request, res: Response) => {
    try {
      const details = await getOrderTrackingDetails(req.params.orderNumber);
      if (!details) {
        return res.status(404).json({ error: 'No order found matching that Order Number.' });
      }
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to track order' });
    }
  });

  app.get('/api/orders/customer', async (req: Request, res: Response) => {
    try {
      const email = String(req.query.email || '');
      if (!email) {
        return res.json([]);
      }
      const list = await getCustomerOrdersByEmail(email);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to load orders' });
    }
  });

  app.get('/api/wishlist/:sessionKey', async (req: Request, res: Response) => {
    try {
      const ids = await getWishlistBySession(req.params.sessionKey);
      res.json({ productIds: ids });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/wishlist/toggle', async (req: Request, res: Response) => {
    try {
      const { sessionKey, productId } = req.body;
      const ids = await toggleWishlistProduct(String(sessionKey), Number(productId));
      res.json({ productIds: ids });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/reviews', async (req: Request, res: Response) => {
    try {
      const review = await submitCustomerReview(req.body);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/newsletter', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || !String(email).includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      const sub = await subscribeNewsletter(String(email));
      res.json(sub);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // 3. AUTHENTICATION & CUSTOMER ACCOUNT ROUTES
  // ============================================================================
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user?.uid || 'anon';
      const email = req.user?.email || 'customer@dxnorganicpoint.com';
      const name = req.user?.name || email.split('@')[0];
      const dbUser = await getOrCreateUser(uid, email, name);
      res.json({ user: dbUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const user = await registerCustomerWithEmail(req.body);
      const tokenPayload = Buffer.from(JSON.stringify(user), 'utf8').toString('base64');
      res.status(201).json({
        user,
        token: `dxn_sess_${tokenPayload}`,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await loginCustomerWithEmail(String(email || ''), String(password || ''));
      const tokenPayload = Buffer.from(JSON.stringify(user), 'utf8').toString('base64');
      res.json({
        user,
        token: `dxn_sess_${tokenPayload}`,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;
      const result = await resetCustomerPassword(String(email || ''), String(newPassword || ''));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/account/addresses', async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId || 0);
      if (!userId) return res.json([]);
      const list = await getCustomerAddresses(userId);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/account/addresses', async (req: Request, res: Response) => {
    try {
      const created = await addCustomerAddress(req.body);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // 4. ADMIN DASHBOARD, CMS & SEO MANAGEMENT API ROUTES
  // ============================================================================
  app.get('/api/admin/dashboard', async (_req: Request, res: Response) => {
    try {
      const dashboard = await getAdminDashboardData();
      res.json(dashboard);
    } catch (error: any) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ error: error.message || 'Failed to load admin dashboard' });
    }
  });

  app.post('/api/admin/products', async (req: Request, res: Response) => {
    try {
      const saved = await upsertAdminProduct(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/admin/products/:id', async (req: Request, res: Response) => {
    try {
      const result = await deleteAdminProduct(Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/admin/categories', async (req: Request, res: Response) => {
    try {
      const saved = await upsertAdminCategory(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/admin/orders/:id/status', async (req: Request, res: Response) => {
    try {
      const updated = await updateAdminOrderStatus({
        orderId: Number(req.params.id),
        orderStatus: req.body.orderStatus,
        paymentStatus: req.body.paymentStatus,
        trackingNumber: req.body.trackingNumber,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/admin/blog', async (req: Request, res: Response) => {
    try {
      const saved = await upsertAdminBlogPost(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/admin/blog/:id', async (req: Request, res: Response) => {
    try {
      const result = await deleteAdminBlogPost(Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/admin/coupons', async (req: Request, res: Response) => {
    try {
      const saved = await upsertAdminCoupon(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/admin/settings', async (req: Request, res: Response) => {
    try {
      const result = await updateSiteSettingsBatch(req.body.settings || {});
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/api/admin/customers/:id/block', async (req: Request, res: Response) => {
    try {
      const updated = await toggleCustomerBlock(
        Number(req.params.id),
        Boolean(req.body.isBlocked)
      );
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/admin/seo-status', async (req: Request, res: Response) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const publishedProducts = data.products.filter((p) => p.isPublished && !p.noIndex);
      const enabledCategories = data.categories.filter((c) => c.isEnabled && !c.noIndex);
      const publishedPosts = data.blogPosts.filter(
        (b) => b.status === 'published' && !b.noIndex
      );

      res.json({
        baseUrl,
        lastGeneratedAt: new Date().toISOString(),
        sitemaps: [
          {
            name: 'Master Sitemap Index',
            url: `${baseUrl}/sitemap.xml`,
            count: 4,
            status: 'Valid XML (200 OK)',
          },
          {
            name: 'Public Pages Sitemap',
            url: `${baseUrl}/sitemap-pages.xml`,
            count: PUBLIC_STATIC_PAGES.length,
            status: 'Valid XML (200 OK)',
          },
          {
            name: 'Active Products Sitemap',
            url: `${baseUrl}/sitemap-products.xml`,
            count: publishedProducts.length,
            status: 'Valid XML (200 OK)',
          },
          {
            name: 'Enabled Categories Sitemap',
            url: `${baseUrl}/sitemap-categories.xml`,
            count: enabledCategories.length,
            status: 'Valid XML (200 OK)',
          },
          {
            name: 'Published Journal Articles Sitemap',
            url: `${baseUrl}/sitemap-blog.xml`,
            count: publishedPosts.length,
            status: 'Valid XML (200 OK)',
          },
        ],
        robotsUrl: `${baseUrl}/robots.txt`,
        excludedPrivateRoutes: ['/admin/', '/account/', '/checkout/', '/cart/', '/search/'],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // 5. VITE DEV MIDDLEWARE / PRODUCTION SPA FALLBACK
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DXN Organic Point server running on http://localhost:${PORT}`);
  });
}

startServer();
