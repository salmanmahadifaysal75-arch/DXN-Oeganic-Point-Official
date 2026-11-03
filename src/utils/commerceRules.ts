export interface CartLineItem {
  productId: number;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  variantName?: string;
}

export interface CouponRule {
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  expiryDate: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface SitemapItemInput {
  loc: string;
  lastmod?: string | Date | null;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
  isPublished?: boolean;
  noIndex?: boolean;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateCartSubtotal(items: CartLineItem[]): number {
  const sum = items.reduce((acc, item) => {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    const price = Math.max(0, Number(item.unitPrice) || 0);
    return acc + price * qty;
  }, 0);
  return Math.round(sum * 100) / 100;
}

export function validateAndCalculateCoupon(
  subtotal: number,
  coupon: CouponRule | null | undefined,
  referenceDateIso: string = '2026-11-02'
): { valid: boolean; discountAmount: number; message: string } {
  if (!coupon) {
    return { valid: false, discountAmount: 0, message: 'Invalid coupon code.' };
  }
  if (!coupon.isActive) {
    return { valid: false, discountAmount: 0, message: 'This coupon is currently inactive.' };
  }
  if (coupon.expiryDate && coupon.expiryDate < referenceDateIso.slice(0, 10)) {
    return { valid: false, discountAmount: 0, message: 'This coupon has expired.' };
  }
  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order of ৳${coupon.minOrderAmount} required for ${coupon.code}.`,
    };
  }
  const rawDiscount = (subtotal * coupon.discountPercent) / 100;
  const capped = Math.min(rawDiscount, coupon.maxDiscountAmount);
  const discountAmount = Math.round(capped * 100) / 100;
  return {
    valid: true,
    discountAmount,
    message: `Coupon ${coupon.code} applied (${coupon.discountPercent}% off, saved ৳${discountAmount}).`,
  };
}

export function calculateShippingCharge(
  district: string,
  subtotalAfterDiscount: number,
  freeThreshold: number = 2500
): number {
  if (subtotalAfterDiscount <= 0) return 0;
  if (subtotalAfterDiscount >= freeThreshold) return 0;
  const normalized = (district || '').trim().toLowerCase();
  if (normalized === 'dhaka' || normalized === 'dhaka city' || normalized === 'dhaka metro') {
    return 70;
  }
  if (['gazipur', 'narayanganj', 'savar', 'keraniganj'].includes(normalized)) {
    return 100;
  }
  return 130;
}

export function calculateOrderTotals(params: {
  items: CartLineItem[];
  district: string;
  coupon?: CouponRule | null;
  freeShippingThreshold?: number;
  referenceDateIso?: string;
}): {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  couponMessage: string;
} {
  const subtotal = calculateCartSubtotal(params.items);
  const couponCheck = validateAndCalculateCoupon(
    subtotal,
    params.coupon,
    params.referenceDateIso
  );
  const afterDiscount = Math.max(0, subtotal - couponCheck.discountAmount);
  const shippingCost = calculateShippingCharge(
    params.district,
    afterDiscount,
    params.freeShippingThreshold ?? 2500
  );
  const totalAmount = Math.round((afterDiscount + shippingCost) * 100) / 100;

  return {
    subtotal,
    discountAmount: couponCheck.discountAmount,
    shippingCost,
    totalAmount,
    couponMessage: params.coupon ? couponCheck.message : '',
  };
}

export function generateOrderNumber(now: Date = new Date(), randomSuffix?: string): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const suffix =
    randomSuffix ||
    Math.floor(1000 + Math.random() * 9000).toString();
  return `DXN-${yyyy}${mm}${dd}-${suffix}`;
}

export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const EXCLUDED_SITEMAP_PREFIXES = [
  '/admin',
  '/account',
  '/checkout',
  '/cart',
  '/search',
  '/wishlist',
];

export function filterEligibleSitemapEntries(entries: SitemapItemInput[]): SitemapItemInput[] {
  const seen = new Set<string>();
  const filtered: SitemapItemInput[] = [];

  for (const item of entries) {
    if (item.isPublished === false) continue;
    if (item.noIndex === true) continue;

    let pathname = item.loc;
    try {
      if (item.loc.startsWith('http://') || item.loc.startsWith('https://')) {
        pathname = new URL(item.loc).pathname;
      }
    } catch {
      pathname = item.loc;
    }

    const isExcluded = EXCLUDED_SITEMAP_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (isExcluded) continue;

    const canonicalLoc = item.loc.replace(/\/+$/, '') || item.loc;
    if (seen.has(canonicalLoc)) continue;
    seen.add(canonicalLoc);

    filtered.push({ ...item, loc: canonicalLoc });
  }

  return filtered;
}

export function formatIsoDate(dateInput?: string | Date | null): string {
  if (!dateInput) return new Date().toISOString();
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function generateSitemapIndexXml(baseUrl: string, lastmodDate?: Date | string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const lastmod = formatIsoDate(lastmodDate);
  const childSitemaps = [
    `${cleanBase}/sitemap-pages.xml`,
    `${cleanBase}/sitemap-products.xml`,
    `${cleanBase}/sitemap-categories.xml`,
    `${cleanBase}/sitemap-blog.xml`,
  ];

  const nodes = childSitemaps
    .map(
      (loc) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nodes}
</sitemapindex>`;
}

export function generateUrlsetXml(entries: SitemapItemInput[]): string {
  const eligible = filterEligibleSitemapEntries(entries);
  const nodes = eligible
    .map((item) => {
      const lastmod = formatIsoDate(item.lastmod);
      const changefreq = item.changefreq || 'weekly';
      const priority = item.priority || '0.8';
      return `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nodes}
</urlset>`;
}

export function generateRobotsTxt(baseUrl: string, customRules?: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (customRules && customRules.trim().length > 0) {
    return `${customRules.trim()}\n\nSitemap: ${cleanBase}/sitemap.xml\n`;
  }
  return `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /account/
Disallow: /checkout/
Disallow: /cart/
Disallow: /search/

Sitemap: ${cleanBase}/sitemap.xml
`;
}

export function buildProductJsonLd(product: {
  name: string;
  slug: string;
  sku: string;
  description: string;
  regularPrice: string | number;
  discountedPrice?: string | number | null;
  availability: string;
  primaryImage: string;
  baseUrl: string;
}) {
  const cleanBase = product.baseUrl.replace(/\/+$/, '');
  const activePrice =
    product.discountedPrice && Number(product.discountedPrice) > 0
      ? Number(product.discountedPrice)
      : Number(product.regularPrice);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: product.primaryImage,
    brand: {
      '@type': 'Brand',
      name: 'DXN',
    },
    offers: {
      '@type': 'Offer',
      url: `${cleanBase}/product/${product.slug}`,
      priceCurrency: 'BDT',
      price: activePrice.toFixed(2),
      availability:
        product.availability === 'in_stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'DXN Organic Point',
      },
    },
  };
}
