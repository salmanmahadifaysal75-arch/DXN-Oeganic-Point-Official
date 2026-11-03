import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  index,
} from 'drizzle-orm/pg-core';

// 1. roles
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // 'admin', 'customer', 'editor'
  description: text('description'),
  permissions: text('permissions').notNull().default('[]'), // JSON array of permission keys
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. users
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(), // Firebase UID or deterministic account UID
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'), // Hashed password for email/password auth
    roleId: integer('role_id').references(() => roles.id),
    roleName: text('role_name').notNull().default('customer'), // 'admin' | 'customer'
    isBlocked: boolean('is_blocked').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_users_uid').on(table.uid), index('idx_users_email').on(table.email)]
);

// 3. profiles
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  district: text('district'),
  area: text('area'),
  bio: text('bio'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. addresses
export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  label: text('label').notNull().default('Home'), // 'Home', 'Office', etc.
  recipientName: text('recipient_name').notNull(),
  phone: text('phone').notNull(),
  streetAddress: text('street_address').notNull(),
  district: text('district').notNull(),
  area: text('area').notNull(),
  postalCode: text('postal_code').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. categories
export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    imageUrl: text('image_url'),
    parentId: integer('parent_id'), // Self-reference for subcategories
    sortOrder: integer('sort_order').notNull().default(0),
    isEnabled: boolean('is_enabled').notNull().default(true),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    canonicalUrl: text('canonical_url'),
    noIndex: boolean('no_index').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_categories_slug').on(table.slug)]
);

// 6. products
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    sku: text('sku').notNull().unique(),
    shortDescription: text('short_description').notNull(),
    description: text('description').notNull(),
    regularPrice: numeric('regular_price', { precision: 10, scale: 2 }).notNull(),
    discountedPrice: numeric('discounted_price', { precision: 10, scale: 2 }),
    stockQuantity: integer('stock_quantity').notNull().default(0),
    categoryId: integer('category_id')
      .references(() => categories.id)
      .notNull(),
    subcategory: text('subcategory'),
    weight: text('weight').notNull().default('100g'),
    availability: text('availability').notNull().default('in_stock'), // 'in_stock', 'out_of_stock', 'pre_order'
    isFeatured: boolean('is_featured').notNull().default(false),
    isBestSeller: boolean('is_best_seller').notNull().default(false),
    isNewArrival: boolean('is_new_arrival').notNull().default(false),
    isSpecialOffer: boolean('is_special_offer').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    primaryImage: text('primary_image').notNull(),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    canonicalUrl: text('canonical_url'),
    ogImage: text('og_image'),
    noIndex: boolean('no_index').notNull().default(false),
    tags: text('tags').notNull().default(''), // Comma-separated product tags
    salesCount: integer('sales_count').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_products_slug').on(table.slug),
    index('idx_products_category').on(table.categoryId),
  ]
);

// 7. product_images
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. product_variants
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  variantName: text('variant_name').notNull(), // e.g. '150g Tube', '20 Sachets Pack'
  sku: text('sku').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(10),
  weight: text('weight'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. inventory
export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  sku: text('sku').notNull(),
  quantityAvailable: integer('quantity_available').notNull().default(0),
  reservedQuantity: integer('reserved_quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  warehouseLocation: text('warehouse_location').notNull().default('Dhaka Central Hub'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. orders
export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    userId: integer('user_id').references(() => users.id), // Nullable for guest checkout
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull(),
    deliveryAddress: text('delivery_address').notNull(),
    district: text('district').notNull(),
    area: text('area').notNull(),
    postalCode: text('postal_code').notNull(),
    orderNotes: text('order_notes'),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
    shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0.00'),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    couponCode: text('coupon_code'),
    paymentMethod: text('payment_method').notNull(), // 'bkash', 'nagad', 'rocket', 'sslcommerz', 'bank_transfer', 'cod'
    paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'paid', 'failed', 'refunded'
    orderStatus: text('order_status').notNull().default('pending'), // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    trackingNumber: text('tracking_number'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_orders_number').on(table.orderNumber)]
);

// 11. order_items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  productName: text('product_name').notNull(),
  productSku: text('product_sku').notNull(),
  variantName: text('variant_name'),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
});

// 12. payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  paymentMethod: text('payment_method').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('BDT'),
  status: text('status').notNull().default('pending'), // 'pending', 'verified', 'failed', 'refunded'
  senderNumber: text('sender_number'),
  transactionId: text('transaction_id'),
  isSandbox: boolean('is_sandbox').notNull().default(true),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. payment_transactions
export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  paymentId: integer('payment_id')
    .references(() => payments.id)
    .notNull(),
  gatewayName: text('gateway_name').notNull(), // 'bKash', 'Nagad', 'Rocket', 'SSLCommerz', 'Bank', 'COD'
  gatewayTransactionId: text('gateway_transaction_id').notNull(),
  rawStatus: text('raw_status').notNull(),
  gatewayResponseSummary: text('gateway_response_summary'),
  webhookVerified: boolean('webhook_verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. coupons
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  description: text('description').notNull(),
  discountPercent: integer('discount_percent').notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }).notNull().default('500.00'),
  maxDiscountAmount: numeric('max_discount_amount', { precision: 10, scale: 2 }).notNull().default('1000.00'),
  expiryDate: text('expiry_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. coupon_usage
export const couponUsage = pgTable('coupon_usage', {
  id: serial('id').primaryKey(),
  couponId: integer('coupon_id')
    .references(() => coupons.id)
    .notNull(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  customerEmail: text('customer_email').notNull(),
  usedAt: timestamp('used_at').defaultNow(),
});

// 16. wishlists
export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  sessionKey: text('session_key').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 17. wishlist_items
export const wishlistItems = pgTable('wishlist_items', {
  id: serial('id').primaryKey(),
  wishlistId: integer('wishlist_id')
    .references(() => wishlists.id)
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  addedAt: timestamp('added_at').defaultNow(),
});

// 18. reviews
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id),
  reviewerName: text('reviewer_name').notNull(),
  reviewerRole: text('reviewer_role').notNull().default('Verified Buyer'),
  rating: integer('rating').notNull(),
  title: text('title').notNull(),
  comment: text('comment').notNull(),
  isApproved: boolean('is_approved').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. blog_categories
export const blogCategories = pgTable('blog_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 20. blog_posts
export const blogPosts = pgTable(
  'blog_posts',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt').notNull(),
    content: text('content').notNull(),
    featuredImage: text('featured_image').notNull(),
    blogCategoryId: integer('blog_category_id').references(() => blogCategories.id),
    authorName: text('author_name').notNull().default('DXN Editorial Desk'),
    status: text('status').notNull().default('published'), // 'draft', 'published', 'scheduled'
    scheduledAt: text('scheduled_at'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    canonicalUrl: text('canonical_url'),
    noIndex: boolean('no_index').notNull().default(false),
    readTimeMinutes: integer('read_time_minutes').notNull().default(5),
    publishedAt: timestamp('published_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_blog_posts_slug').on(table.slug)]
);

// 21. blog_tags
export const blogTags = pgTable('blog_tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

// 22. post_tags
export const postTags = pgTable('post_tags', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => blogPosts.id)
    .notNull(),
  tagId: integer('tag_id')
    .references(() => blogTags.id)
    .notNull(),
});

// 23. banners
export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  ctaText: text('cta_text').notNull(),
  ctaLink: text('cta_link').notNull(),
  imageUrl: text('image_url').notNull(),
  position: text('position').notNull().default('hero'), // 'hero', 'promo', 'announcement'
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 24. testimonials
export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerRole: text('customer_role').notNull(),
  organizationOrCity: text('organization_or_city').notNull(),
  statement: text('statement').notNull(),
  productPurchased: text('product_purchased').notNull(),
  rating: integer('rating').notNull().default(5),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 25. newsletter_subscribers
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  status: text('status').notNull().default('active'),
  subscribedAt: timestamp('subscribed_at').defaultNow(),
});

// 26. shipping_zones
export const shippingZones = pgTable('shipping_zones', {
  id: serial('id').primaryKey(),
  zoneName: text('zone_name').notNull(),
  districtsIncluded: text('districts_included').notNull(),
  deliveryCharge: numeric('delivery_charge', { precision: 10, scale: 2 }).notNull(),
  freeShippingThreshold: numeric('free_shipping_threshold', { precision: 10, scale: 2 }).notNull().default('2500.00'),
  estimatedDays: text('estimated_days').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// 27. site_settings
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value').notNull(),
  category: text('category').notNull().default('general'), // 'general', 'seo', 'payment', 'shipping', 'content'
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 28. notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('order'), // 'order', 'inventory', 'system'
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 29. audit_logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
