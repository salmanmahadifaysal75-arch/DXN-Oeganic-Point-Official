import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartSubtotal,
  validateAndCalculateCoupon,
  calculateShippingCharge,
  calculateOrderTotals,
  generateOrderNumber,
  filterEligibleSitemapEntries,
  generateSitemapIndexXml,
  generateUrlsetXml,
  generateRobotsTxt,
  slugify,
} from './commerceRules';

test('slugify converts product and category titles into clean URL slugs', () => {
  assert.equal(slugify('DXN Ganozhi Plus Toothpaste (150g)'), 'dxn-ganozhi-plus-toothpaste-150g');
  assert.equal(slugify('  Face Wash & Cleansers  '), 'face-wash-cleansers');
});

test('calculateCartSubtotal computes accurate BDT line totals', () => {
  const subtotal = calculateCartSubtotal([
    { productId: 1, name: 'Ganozhi Toothpaste', sku: 'DXN-TP-01', unitPrice: 590, quantity: 2 },
    { productId: 2, name: 'Lingzhi Black Coffee', sku: 'DXN-CF-02', unitPrice: 1290, quantity: 1 },
  ]);
  assert.equal(subtotal, 2470);
});

test('validateAndCalculateCoupon enforces min order, max cap, and expiry dates', () => {
  const coupon = {
    code: 'ORGANIC10',
    discountPercent: 10,
    minOrderAmount: 1000,
    maxDiscountAmount: 500,
    expiryDate: '2027-12-31',
    isActive: true,
  };

  // Below minimum order
  const lowCheck = validateAndCalculateCoupon(800, coupon, '2026-11-02');
  assert.equal(lowCheck.valid, false);
  assert.equal(lowCheck.discountAmount, 0);

  // Valid order
  const validCheck = validateAndCalculateCoupon(2000, coupon, '2026-11-02');
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.discountAmount, 200);

  // Capped discount
  const cappedCheck = validateAndCalculateCoupon(8000, coupon, '2026-11-02');
  assert.equal(cappedCheck.valid, true);
  assert.equal(cappedCheck.discountAmount, 500);
});

test('calculateShippingCharge applies Dhaka, suburb, outside-Dhaka, and free shipping threshold', () => {
  assert.equal(calculateShippingCharge('Dhaka', 1200, 2500), 70);
  assert.equal(calculateShippingCharge('Gazipur', 1200, 2500), 100);
  assert.equal(calculateShippingCharge('Chattogram', 1200, 2500), 130);
  assert.equal(calculateShippingCharge('Sylhet', 2600, 2500), 0);
});

test('calculateOrderTotals integrates subtotal, coupon discount, and shipping accurately', () => {
  const result = calculateOrderTotals({
    items: [{ productId: 1, name: 'Aloe.V Gel', sku: 'DXN-AL-01', unitPrice: 1000, quantity: 2 }],
    district: 'Dhaka',
    coupon: {
      code: 'ORGANIC10',
      discountPercent: 10,
      minOrderAmount: 1000,
      maxDiscountAmount: 500,
      expiryDate: '2027-12-31',
      isActive: true,
    },
    freeShippingThreshold: 2500,
    referenceDateIso: '2026-11-02',
  });

  assert.equal(result.subtotal, 2000);
  assert.equal(result.discountAmount, 200);
  assert.equal(result.shippingCost, 70);
  assert.equal(result.totalAmount, 1870);
});

test('generateOrderNumber produces deterministic DXN prefix format', () => {
  const d = new Date('2026-11-02T10:00:00Z');
  assert.equal(generateOrderNumber(d, '4821'), 'DXN-20261102-4821');
});

test('filterEligibleSitemapEntries excludes admin, account, checkout, cart, unpublished, and duplicate URLs', () => {
  const raw = [
    { loc: 'https://dxnorganicpoint.com/', isPublished: true },
    { loc: 'https://dxnorganicpoint.com/shop/', isPublished: true },
    { loc: 'https://dxnorganicpoint.com/shop', isPublished: true }, // duplicate
    { loc: 'https://dxnorganicpoint.com/admin', isPublished: true }, // excluded private route
    { loc: 'https://dxnorganicpoint.com/account/orders', isPublished: true }, // excluded
    { loc: 'https://dxnorganicpoint.com/checkout', isPublished: true }, // excluded
    { loc: 'https://dxnorganicpoint.com/cart', isPublished: true }, // excluded
    { loc: 'https://dxnorganicpoint.com/product/draft-item', isPublished: false }, // unpublished
    { loc: 'https://dxnorganicpoint.com/product/hidden-seo', isPublished: true, noIndex: true }, // noindex
    { loc: 'https://dxnorganicpoint.com/product/ganozhi-toothpaste', isPublished: true },
  ];

  const eligible = filterEligibleSitemapEntries(raw);
  assert.equal(eligible.length, 3);
  assert.deepEqual(
    eligible.map((e) => e.loc),
    [
      'https://dxnorganicpoint.com',
      'https://dxnorganicpoint.com/shop',
      'https://dxnorganicpoint.com/product/ganozhi-toothpaste',
    ]
  );
});

test('generateSitemapIndexXml and generateUrlsetXml output valid XML structures', () => {
  const indexXml = generateSitemapIndexXml('https://dxnorganicpoint.com', '2026-11-02T00:00:00Z');
  assert.ok(indexXml.includes('<sitemapindex'));
  assert.ok(indexXml.includes('https://dxnorganicpoint.com/sitemap-products.xml'));

  const urlsetXml = generateUrlsetXml([
    { loc: 'https://dxnorganicpoint.com/product/ganozhi-soap', isPublished: true },
  ]);
  assert.ok(urlsetXml.includes('<urlset'));
  assert.ok(urlsetXml.includes('<loc>https://dxnorganicpoint.com/product/ganozhi-soap</loc>'));
});

test('generateRobotsTxt disallows private routes and references sitemap.xml', () => {
  const robots = generateRobotsTxt('https://dxnorganicpoint.com');
  assert.ok(robots.includes('Disallow: /admin/'));
  assert.ok(robots.includes('Disallow: /checkout/'));
  assert.ok(robots.includes('Sitemap: https://dxnorganicpoint.com/sitemap.xml'));
});
