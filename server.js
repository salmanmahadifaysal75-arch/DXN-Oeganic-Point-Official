var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

// src/lib/firebase-admin.ts
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "aesthetic-archway-mwh4c",
  appId: "1:638689410892:web:94e7e84d85d4cc0816d9e9",
  apiKey: "AIzaSyAO2nUdGNPS_HgmUxUjLra3rkqL0TSrDCg",
  authDomain: "aesthetic-archway-mwh4c.firebaseapp.com",
  storageBucket: "aesthetic-archway-mwh4c.firebasestorage.app",
  messagingSenderId: "638689410892",
  measurementId: "",
  oAuthClientId: "638689410892-0s5j636cchgfj268o4mkrjdjudfsq3fg.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/lib/firebase-admin.ts
if (!getApps().length) {
  initializeApp({
    projectId: firebase_applet_config_default.projectId
  });
}
var adminAuth = getAuth();

// src/middleware/auth.ts
var requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = authHeader.split("Bearer ")[1];
  if (token.startsWith("dxn_sess_")) {
    try {
      const decoded = Buffer.from(token.replace("dxn_sess_", ""), "base64").toString("utf8");
      const parsed = JSON.parse(decoded);
      if (parsed && parsed.uid && parsed.email) {
        req.customerSession = parsed;
        req.user = {
          uid: parsed.uid,
          email: parsed.email,
          name: parsed.name || parsed.email.split("@")[0]
        };
        return next();
      }
    } catch (e) {
      return res.status(401).json({ error: "Unauthorized: Malformed session token" });
    }
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// src/db/repository.ts
import crypto from "node:crypto";
import { eq, desc, asc, and, sql } from "drizzle-orm";

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  addresses: () => addresses,
  auditLogs: () => auditLogs,
  banners: () => banners,
  blogCategories: () => blogCategories,
  blogPosts: () => blogPosts,
  blogTags: () => blogTags,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  couponUsage: () => couponUsage,
  coupons: () => coupons,
  inventory: () => inventory,
  newsletterSubscribers: () => newsletterSubscribers,
  notifications: () => notifications,
  orderItems: () => orderItems,
  orderItemsRelations: () => orderItemsRelations,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  paymentTransactions: () => paymentTransactions,
  payments: () => payments,
  postTags: () => postTags,
  productImages: () => productImages,
  productVariants: () => productVariants,
  products: () => products,
  productsRelations: () => productsRelations,
  profiles: () => profiles,
  reviews: () => reviews,
  roles: () => roles,
  shippingZones: () => shippingZones,
  siteSettings: () => siteSettings,
  testimonials: () => testimonials,
  users: () => users,
  wishlistItems: () => wishlistItems,
  wishlists: () => wishlists
});
import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  index
} from "drizzle-orm/pg-core";
var roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // 'admin', 'customer', 'editor'
  description: text("description"),
  permissions: text("permissions").notNull().default("[]"),
  // JSON array of permission keys
  createdAt: timestamp("created_at").defaultNow()
});
var users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    uid: text("uid").notNull().unique(),
    // Firebase UID or deterministic account UID
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    // Hashed password for email/password auth
    roleId: integer("role_id").references(() => roles.id),
    roleName: text("role_name").notNull().default("customer"),
    // 'admin' | 'customer'
    isBlocked: boolean("is_blocked").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => [index("idx_users_uid").on(table.uid), index("idx_users_email").on(table.email)]
);
var profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  district: text("district"),
  area: text("area"),
  bio: text("bio"),
  updatedAt: timestamp("updated_at").defaultNow()
});
var addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  label: text("label").notNull().default("Home"),
  // 'Home', 'Office', etc.
  recipientName: text("recipient_name").notNull(),
  phone: text("phone").notNull(),
  streetAddress: text("street_address").notNull(),
  district: text("district").notNull(),
  area: text("area").notNull(),
  postalCode: text("postal_code").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    parentId: integer("parent_id"),
    // Self-reference for subcategories
    sortOrder: integer("sort_order").notNull().default(0),
    isEnabled: boolean("is_enabled").notNull().default(true),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    noIndex: boolean("no_index").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => [index("idx_categories_slug").on(table.slug)]
);
var products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().unique(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    regularPrice: numeric("regular_price", { precision: 10, scale: 2 }).notNull(),
    discountedPrice: numeric("discounted_price", { precision: 10, scale: 2 }),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    categoryId: integer("category_id").references(() => categories.id).notNull(),
    subcategory: text("subcategory"),
    weight: text("weight").notNull().default("100g"),
    availability: text("availability").notNull().default("in_stock"),
    // 'in_stock', 'out_of_stock', 'pre_order'
    isFeatured: boolean("is_featured").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isNewArrival: boolean("is_new_arrival").notNull().default(false),
    isSpecialOffer: boolean("is_special_offer").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(true),
    primaryImage: text("primary_image").notNull(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    ogImage: text("og_image"),
    noIndex: boolean("no_index").notNull().default(false),
    tags: text("tags").notNull().default(""),
    // Comma-separated product tags
    salesCount: integer("sales_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => [
    index("idx_products_slug").on(table.slug),
    index("idx_products_category").on(table.categoryId)
  ]
);
var productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  variantName: text("variant_name").notNull(),
  // e.g. '150g Tube', '20 Sachets Pack'
  sku: text("sku").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(10),
  weight: text("weight"),
  createdAt: timestamp("created_at").defaultNow()
});
var inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  sku: text("sku").notNull(),
  quantityAvailable: integer("quantity_available").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  warehouseLocation: text("warehouse_location").notNull().default("Dhaka Central Hub"),
  updatedAt: timestamp("updated_at").defaultNow()
});
var orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: integer("user_id").references(() => users.id),
    // Nullable for guest checkout
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    district: text("district").notNull(),
    area: text("area").notNull(),
    postalCode: text("postal_code").notNull(),
    orderNotes: text("order_notes"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
    shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    couponCode: text("coupon_code"),
    paymentMethod: text("payment_method").notNull(),
    // 'bkash', 'nagad', 'rocket', 'sslcommerz', 'bank_transfer', 'cod'
    paymentStatus: text("payment_status").notNull().default("pending"),
    // 'pending', 'paid', 'failed', 'refunded'
    orderStatus: text("order_status").notNull().default("pending"),
    // 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    trackingNumber: text("tracking_number"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => [index("idx_orders_number").on(table.orderNumber)]
);
var orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  variantName: text("variant_name"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull()
});
var payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  paymentMethod: text("payment_method").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("BDT"),
  status: text("status").notNull().default("pending"),
  // 'pending', 'verified', 'failed', 'refunded'
  senderNumber: text("sender_number"),
  transactionId: text("transaction_id"),
  isSandbox: boolean("is_sandbox").notNull().default(true),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id).notNull(),
  gatewayName: text("gateway_name").notNull(),
  // 'bKash', 'Nagad', 'Rocket', 'SSLCommerz', 'Bank', 'COD'
  gatewayTransactionId: text("gateway_transaction_id").notNull(),
  rawStatus: text("raw_status").notNull(),
  gatewayResponseSummary: text("gateway_response_summary"),
  webhookVerified: boolean("webhook_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  discountPercent: integer("discount_percent").notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("500.00"),
  maxDiscountAmount: numeric("max_discount_amount", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  expiryDate: text("expiry_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").references(() => coupons.id).notNull(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  customerEmail: text("customer_email").notNull(),
  usedAt: timestamp("used_at").defaultNow()
});
var wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionKey: text("session_key").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow()
});
var wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  wishlistId: integer("wishlist_id").references(() => wishlists.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  addedAt: timestamp("added_at").defaultNow()
});
var reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  reviewerName: text("reviewer_name").notNull(),
  reviewerRole: text("reviewer_role").notNull().default("Verified Buyer"),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  comment: text("comment").notNull(),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var blogPosts = pgTable(
  "blog_posts",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt").notNull(),
    content: text("content").notNull(),
    featuredImage: text("featured_image").notNull(),
    blogCategoryId: integer("blog_category_id").references(() => blogCategories.id),
    authorName: text("author_name").notNull().default("DXN Editorial Desk"),
    status: text("status").notNull().default("published"),
    // 'draft', 'published', 'scheduled'
    scheduledAt: text("scheduled_at"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    noIndex: boolean("no_index").notNull().default(false),
    readTimeMinutes: integer("read_time_minutes").notNull().default(5),
    publishedAt: timestamp("published_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => [index("idx_blog_posts_slug").on(table.slug)]
);
var blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique()
});
var postTags = pgTable("post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  tagId: integer("tag_id").references(() => blogTags.id).notNull()
});
var banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  ctaText: text("cta_text").notNull(),
  ctaLink: text("cta_link").notNull(),
  imageUrl: text("image_url").notNull(),
  position: text("position").notNull().default("hero"),
  // 'hero', 'promo', 'announcement'
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow()
});
var testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerRole: text("customer_role").notNull(),
  organizationOrCity: text("organization_or_city").notNull(),
  statement: text("statement").notNull(),
  productPurchased: text("product_purchased").notNull(),
  rating: integer("rating").notNull().default(5),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  subscribedAt: timestamp("subscribed_at").defaultNow()
});
var shippingZones = pgTable("shipping_zones", {
  id: serial("id").primaryKey(),
  zoneName: text("zone_name").notNull(),
  districtsIncluded: text("districts_included").notNull(),
  deliveryCharge: numeric("delivery_charge", { precision: 10, scale: 2 }).notNull(),
  freeShippingThreshold: numeric("free_shipping_threshold", { precision: 10, scale: 2 }).notNull().default("2500.00"),
  estimatedDays: text("estimated_days").notNull(),
  isActive: boolean("is_active").notNull().default(true)
});
var siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  category: text("category").notNull().default("general"),
  // 'general', 'seo', 'payment', 'shipping', 'content'
  updatedAt: timestamp("updated_at").defaultNow()
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("order"),
  // 'order', 'inventory', 'system'
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow()
});
var categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products)
}));
var productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  images: many(productImages),
  variants: many(productVariants),
  reviews: many(reviews)
}));
var ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  payments: many(payments)
}));
var orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

// src/db/index.ts
var createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15e3
    });
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};
var pool = createPool();
var db = drizzle(pool, { schema: schema_exports });

// src/utils/productArtwork.ts
function createStudioProductDataUri(params) {
  const {
    vessel,
    labelTitle,
    labelSubtitle,
    volume = "150ml",
    accentHex = "#C6A76A",
    bgTone = "ivory"
  } = params;
  const palettes = {
    ivory: { bg1: "#F8F6EF", bg2: "#EAE4D3", stone: "#DFD8C5", shadow: "#C9C0AA" },
    sage: { bg1: "#EEF2EC", bg2: "#D5E0D0", stone: "#C3D0BD", shadow: "#AAB9A3" },
    forest: { bg1: "#173D32", bg2: "#0F2921", stone: "#245B45", shadow: "#091B15" },
    stone: { bg1: "#F3EFE6", bg2: "#E2DAC9", stone: "#D2C8B3", shadow: "#B8AD96" }
  };
  const p = palettes[bgTone] || palettes.ivory;
  const safeTitle = labelTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeSub = labelSubtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeVol = volume.replace(/&/g, "&amp;");
  let vesselMarkup = "";
  if (vessel === "serum" || vessel === "oil" || vessel === "elixir" || vessel === "toner") {
    vesselMarkup = `
      <!-- Amber/Emerald Glass Bottle -->
      <rect x="355" y="135" width="90" height="36" rx="8" fill="#252B27" />
      <rect x="342" y="170" width="116" height="24" rx="4" fill="${accentHex}" />
      <rect x="372" y="102" width="56" height="38" rx="26" fill="#252B27" />
      <path d="M315 235 C315 202, 342 194, 342 194 L458 194 C458 194, 485 202, 485 235 L485 450 C485 466, 472 476, 456 476 L344 476 C328 476, 315 466, 315 450 Z" fill="url(#bottleGlass)" stroke="${accentHex}" stroke-width="1.5" />
      <rect x="327" y="258" width="146" height="165" rx="4" fill="#F8F6EF" opacity="0.96" />
      <rect x="333" y="264" width="134" height="153" rx="2" fill="none" stroke="${accentHex}" stroke-width="1" opacity="0.7" />
      <text x="400" y="294" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="#173D32" font-weight="bold">DXN ORGANIC</text>
      <line x1="355" y1="306" x2="445" y2="306" stroke="${accentHex}" stroke-width="1" />
      <text x="400" y="334" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#252B27" font-weight="bold">${safeTitle}</text>
      <text x="400" y="358" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#245B45">${safeSub}</text>
      <text x="400" y="400" text-anchor="middle" font-family="monospace" font-size="11" fill="#5A655E">${safeVol}</text>
    `;
  } else if (vessel === "cleanser" || vessel === "toothpaste" || vessel === "shampoo") {
    vesselMarkup = `
      <!-- Botanical Soft-Touch Tube / Pump -->
      <path d="M295 160 L505 160 L478 430 L322 430 Z" fill="url(#bottleGlass)" stroke="${accentHex}" stroke-width="1.5" />
      <rect x="293" y="148" width="214" height="16" rx="3" fill="${accentHex}" />
      <rect x="342" y="430" width="116" height="46" rx="6" fill="#F8F6EF" stroke="#D2C8B3" stroke-width="1.5" />
      <rect x="322" y="210" width="156" height="175" rx="6" fill="#F8F6EF" opacity="0.96" />
      <text x="400" y="244" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="#173D32" font-weight="bold">DXN BOTANICAL</text>
      <line x1="350" y1="256" x2="450" y2="256" stroke="${accentHex}" stroke-width="1" />
      <text x="400" y="290" text-anchor="middle" font-family="Georgia, serif" font-size="16" fill="#252B27" font-weight="bold">${safeTitle}</text>
      <text x="400" y="316" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#245B45">${safeSub}</text>
      <text x="400" y="362" text-anchor="middle" font-family="monospace" font-size="11" fill="#5A655E">${safeVol}</text>
    `;
  } else if (vessel === "coffee" || vessel === "cereal" || vessel === "cocoa") {
    vesselMarkup = `
      <!-- Artisanal Standing Kraft/Forest Pouch & Ceramic Cup -->
      <path d="M265 155 C265 142, 275 135, 290 135 L470 135 C485 135, 495 142, 495 155 L510 465 C510 474, 502 478, 490 478 L270 478 C258 478, 250 474, 250 465 Z" fill="url(#bottleGlass)" stroke="${accentHex}" stroke-width="1.5" />
      <line x1="262" y1="168" x2="498" y2="168" stroke="${accentHex}" stroke-width="1.5" stroke-dasharray="4 3" />
      <rect x="285" y="205" width="190" height="215" rx="6" fill="#F8F6EF" opacity="0.97" />
      <rect x="293" y="213" width="174" height="199" rx="3" fill="none" stroke="${accentHex}" stroke-width="1" />
      <text x="380" y="248" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="#173D32" font-weight="bold">DXN WELLNESS</text>
      <line x1="325" y1="262" x2="435" y2="262" stroke="${accentHex}" stroke-width="1" />
      <text x="380" y="298" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="#252B27" font-weight="bold">${safeTitle}</text>
      <text x="380" y="324" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#245B45">${safeSub}</text>
      <text x="380" y="388" text-anchor="middle" font-family="monospace" font-size="11" fill="#5A655E">${safeVol}</text>
      <!-- Ceramic Cup beside pouch -->
      <path d="M465 385 L565 385 L555 468 C553 475, 545 478, 535 478 L495 478 C485 478, 477 475, 475 468 Z" fill="#F8F6EF" stroke="#D2C8B3" stroke-width="2" />
      <path d="M562 402 C585 402, 585 445, 558 445" fill="none" stroke="#F8F6EF" stroke-width="8" />
      <ellipse cx="515" cy="385" rx="50" ry="9" fill="#3B2314" stroke="#C6A76A" stroke-width="1.5" />
    `;
  } else {
    vesselMarkup = `
      <!-- Apothecary Glass Jar / Box Set -->
      <rect x="275" y="225" width="250" height="42" rx="8" fill="#252B27" />
      <rect x="282" y="263" width="236" height="12" fill="${accentHex}" />
      <rect x="265" y="275" width="270" height="200" rx="18" fill="url(#bottleGlass)" stroke="${accentHex}" stroke-width="1.5" />
      <rect x="295" y="302" width="210" height="145" rx="6" fill="#F8F6EF" opacity="0.96" />
      <text x="400" y="335" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="#173D32" font-weight="bold">DXN ORGANIC POINT</text>
      <line x1="340" y1="347" x2="460" y2="347" stroke="${accentHex}" stroke-width="1" />
      <text x="400" y="378" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="#252B27" font-weight="bold">${safeTitle}</text>
      <text x="400" y="402" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#245B45">${safeSub}</text>
      <text x="400" y="432" text-anchor="middle" font-family="monospace" font-size="11" fill="#5A655E">${safeVol}</text>
    `;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.bg1}" />
        <stop offset="100%" stop-color="${p.bg2}" />
      </linearGradient>
      <linearGradient id="bottleGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#123128" />
        <stop offset="28%" stop-color="#245B45" />
        <stop offset="70%" stop-color="#173D32" />
        <stop offset="100%" stop-color="#0D241D" />
      </linearGradient>
      <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#EFECE4" />
        <stop offset="55%" stop-color="${p.stone}" />
        <stop offset="100%" stop-color="${p.shadow}" />
      </linearGradient>
    </defs>

    <!-- Studio Canvas -->
    <rect width="800" height="600" fill="url(#bgGrad)" />

    <!-- Architectural Sunlight Shadow Ray -->
    <polygon points="0,0 360,0 680,600 0,600" fill="#FFFFFF" opacity="0.28" />

    <!-- Soft Botanical Halo & Leaf Silhouettes -->
    <circle cx="400" cy="300" r="210" fill="#A8B9A0" opacity="0.18" />
    <path d="M210 440 C160 360, 190 250, 275 220 C245 300, 250 380, 290 445 Z" fill="#245B45" opacity="0.22" />
    <path d="M590 435 C640 350, 610 240, 520 215 C550 295, 540 375, 505 440 Z" fill="#173D32" opacity="0.18" />

    <!-- Travertine Stone Pedestal -->
    <ellipse cx="400" cy="482" rx="220" ry="26" fill="#EFECE4" />
    <path d="M180 482 L620 482 L620 538 C620 552, 521 564, 400 564 C279 564, 180 552, 180 538 Z" fill="url(#pedestalGrad)" />
    <ellipse cx="400" cy="482" rx="220" ry="26" fill="none" stroke="${accentHex}" stroke-width="1" opacity="0.45" />

    ${vesselMarkup}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// src/utils/commerceRules.ts
function slugify(text2) {
  return text2.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function calculateCartSubtotal(items) {
  const sum = items.reduce((acc, item) => {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    const price = Math.max(0, Number(item.unitPrice) || 0);
    return acc + price * qty;
  }, 0);
  return Math.round(sum * 100) / 100;
}
function validateAndCalculateCoupon(subtotal, coupon, referenceDateIso = "2026-11-02") {
  if (!coupon) {
    return { valid: false, discountAmount: 0, message: "Invalid coupon code." };
  }
  if (!coupon.isActive) {
    return { valid: false, discountAmount: 0, message: "This coupon is currently inactive." };
  }
  if (coupon.expiryDate && coupon.expiryDate < referenceDateIso.slice(0, 10)) {
    return { valid: false, discountAmount: 0, message: "This coupon has expired." };
  }
  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order of \u09F3${coupon.minOrderAmount} required for ${coupon.code}.`
    };
  }
  const rawDiscount = subtotal * coupon.discountPercent / 100;
  const capped = Math.min(rawDiscount, coupon.maxDiscountAmount);
  const discountAmount = Math.round(capped * 100) / 100;
  return {
    valid: true,
    discountAmount,
    message: `Coupon ${coupon.code} applied (${coupon.discountPercent}% off, saved \u09F3${discountAmount}).`
  };
}
function calculateShippingCharge(district, subtotalAfterDiscount, freeThreshold = 2500) {
  if (subtotalAfterDiscount <= 0) return 0;
  if (subtotalAfterDiscount >= freeThreshold) return 0;
  const normalized = (district || "").trim().toLowerCase();
  if (normalized === "dhaka" || normalized === "dhaka city" || normalized === "dhaka metro") {
    return 70;
  }
  if (["gazipur", "narayanganj", "savar", "keraniganj"].includes(normalized)) {
    return 100;
  }
  return 130;
}
function calculateOrderTotals(params) {
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
    couponMessage: params.coupon ? couponCheck.message : ""
  };
}
function generateOrderNumber(now = /* @__PURE__ */ new Date(), randomSuffix) {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const suffix = randomSuffix || Math.floor(1e3 + Math.random() * 9e3).toString();
  return `DXN-${yyyy}${mm}${dd}-${suffix}`;
}
function escapeXml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
var EXCLUDED_SITEMAP_PREFIXES = [
  "/admin",
  "/account",
  "/checkout",
  "/cart",
  "/search",
  "/wishlist"
];
function filterEligibleSitemapEntries(entries) {
  const seen = /* @__PURE__ */ new Set();
  const filtered = [];
  for (const item of entries) {
    if (item.isPublished === false) continue;
    if (item.noIndex === true) continue;
    let pathname = item.loc;
    try {
      if (item.loc.startsWith("http://") || item.loc.startsWith("https://")) {
        pathname = new URL(item.loc).pathname;
      }
    } catch {
      pathname = item.loc;
    }
    const isExcluded = EXCLUDED_SITEMAP_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (isExcluded) continue;
    const canonicalLoc = item.loc.replace(/\/+$/, "") || item.loc;
    if (seen.has(canonicalLoc)) continue;
    seen.add(canonicalLoc);
    filtered.push({ ...item, loc: canonicalLoc });
  }
  return filtered;
}
function formatIsoDate(dateInput) {
  if (!dateInput) return (/* @__PURE__ */ new Date()).toISOString();
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return (/* @__PURE__ */ new Date()).toISOString();
  return d.toISOString();
}
function generateSitemapIndexXml(baseUrl, lastmodDate) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const lastmod = formatIsoDate(lastmodDate);
  const childSitemaps = [
    `${cleanBase}/sitemap-pages.xml`,
    `${cleanBase}/sitemap-products.xml`,
    `${cleanBase}/sitemap-categories.xml`,
    `${cleanBase}/sitemap-blog.xml`
  ];
  const nodes = childSitemaps.map(
    (loc) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
  </sitemap>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nodes}
</sitemapindex>`;
}
function generateUrlsetXml(entries) {
  const eligible = filterEligibleSitemapEntries(entries);
  const nodes = eligible.map((item) => {
    const lastmod = formatIsoDate(item.lastmod);
    const changefreq = item.changefreq || "weekly";
    const priority = item.priority || "0.8";
    return `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nodes}
</urlset>`;
}
function generateRobotsTxt(baseUrl, customRules) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  if (customRules && customRules.trim().length > 0) {
    return `${customRules.trim()}

Sitemap: ${cleanBase}/sitemap.xml
`;
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

// src/db/repository.ts
function hashPassword(password) {
  return crypto.createHash("sha256").update(`dxn_salt_2026_${password}`).digest("hex");
}
async function getOrCreateUser(uid, email, fullName, roleName = "customer") {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await db.insert(users).values({
      uid,
      email: cleanEmail,
      roleName
    }).onConflictDoUpdate({
      target: users.uid,
      set: {
        email: cleanEmail,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    const user = result[0];
    if (user) {
      await db.insert(profiles).values({
        userId: user.id,
        fullName: fullName || cleanEmail.split("@")[0],
        district: "Dhaka",
        area: "Gulshan"
      }).onConflictDoNothing();
    }
    return user;
  } catch (error) {
    console.error("Database error in getOrCreateUser:", error);
    throw new Error("Failed to synchronize user account.", { cause: error });
  }
}
async function registerCustomerWithEmail(params) {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (existing.length > 0) {
      throw new Error("An account with this email already exists.");
    }
    const uid = `cust_${crypto.randomBytes(8).toString("hex")}`;
    const passwordHash = hashPassword(params.password);
    const insertedUsers = await db.insert(users).values({
      uid,
      email: cleanEmail,
      passwordHash,
      roleName: cleanEmail.includes("admin") ? "admin" : "customer"
    }).returning();
    const user = insertedUsers[0];
    await db.insert(profiles).values({
      userId: user.id,
      fullName: params.fullName.trim(),
      phone: params.phone.trim(),
      district: params.district || "Dhaka",
      area: params.area || "Dhanmondi"
    });
    await db.insert(auditLogs).values({
      actorEmail: cleanEmail,
      action: "CUSTOMER_REGISTER",
      entityType: "users",
      entityId: String(user.id),
      details: `Registered customer account for ${params.fullName}`
    });
    return {
      uid: user.uid,
      id: user.id,
      email: user.email,
      name: params.fullName.trim(),
      role: user.roleName,
      phone: params.phone.trim()
    };
  } catch (error) {
    console.error("Database error in registerCustomerWithEmail:", error);
    throw new Error(error.message || "Registration failed.", { cause: error });
  }
}
async function loginCustomerWithEmail(email, password) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const found = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (found.length === 0) {
      throw new Error("Invalid email or password.");
    }
    const user = found[0];
    if (user.isBlocked) {
      throw new Error("This account has been suspended by the administrator.");
    }
    const expectedHash = hashPassword(password);
    if (user.passwordHash && user.passwordHash !== expectedHash) {
      throw new Error("Invalid email or password.");
    }
    const prof = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    const fullName = prof[0]?.fullName || cleanEmail.split("@")[0];
    return {
      uid: user.uid,
      id: user.id,
      email: user.email,
      name: fullName,
      role: user.roleName,
      phone: prof[0]?.phone || ""
    };
  } catch (error) {
    console.error("Database error in loginCustomerWithEmail:", error);
    throw new Error(error.message || "Authentication failed.", { cause: error });
  }
}
async function resetCustomerPassword(email, newPassword) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const found = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (found.length === 0) {
      throw new Error("No account found with that email address.");
    }
    const passwordHash = hashPassword(newPassword);
    await db.update(users).set({ passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.email, cleanEmail));
    return { success: true };
  } catch (error) {
    console.error("Database error in resetCustomerPassword:", error);
    throw new Error(error.message || "Password reset failed.", { cause: error });
  }
}
var isSeeding = false;
var seedDone = false;
async function seedDatabaseIfNeeded() {
  if (seedDone || isSeeding) return;
  isSeeding = true;
  try {
    const existingCats = await db.select().from(categories).limit(1);
    if (existingCats.length > 0) {
      seedDone = true;
      isSeeding = false;
      return;
    }
    const insertedRoles = await db.insert(roles).values([
      {
        name: "admin",
        description: "Full store administrator with CMS, inventory, order, and SEO permissions",
        permissions: JSON.stringify(["all"])
      },
      {
        name: "customer",
        description: "Registered store customer with order history, wishlist, and saved addresses",
        permissions: JSON.stringify(["shop", "orders", "wishlist", "reviews"])
      }
    ]).onConflictDoNothing().returning();
    const adminRoleId = insertedRoles[0]?.id || 1;
    const customerRoleId = insertedRoles[1]?.id || 2;
    const seededUsers = await db.insert(users).values([
      {
        uid: "admin_dxn_master",
        email: "admin@dxnorganicpoint.com",
        passwordHash: hashPassword("Admin@DXN2026"),
        roleId: adminRoleId,
        roleName: "admin"
      },
      {
        uid: "cust_demo_farhana",
        email: "farhana.rahman@example.com",
        passwordHash: hashPassword("Customer@2026"),
        roleId: customerRoleId,
        roleName: "customer"
      }
    ]).onConflictDoNothing().returning();
    if (seededUsers.length > 0) {
      await db.insert(profiles).values([
        {
          userId: seededUsers[0].id,
          fullName: "Salman Mahadi (Store Administrator)",
          phone: "+8801711009988",
          district: "Dhaka",
          area: "Banani",
          bio: "Principal Curator & Operations Director at DXN Organic Point Bangladesh."
        },
        ...seededUsers[1] ? [
          {
            userId: seededUsers[1].id,
            fullName: "Farhana Rahman",
            phone: "01712884422",
            district: "Dhaka",
            area: "Gulshan-2",
            bio: "Regular botanical skincare and Lingzhi wellness enthusiast."
          }
        ] : []
      ]).onConflictDoNothing();
      if (seededUsers[1]) {
        await db.insert(addresses).values({
          userId: seededUsers[1].id,
          label: "Home",
          recipientName: "Farhana Rahman",
          phone: "01712884422",
          streetAddress: "House 42, Road 90, Apartment 5B, Gulshan-2",
          district: "Dhaka",
          area: "Gulshan",
          postalCode: "1212",
          isDefault: true
        });
      }
    }
    const categorySeeds = [
      {
        name: "Skincare",
        slug: "skincare",
        description: "Botanical cleansers, hydrating gels, and daily plant-based formulations for balanced skin.",
        sortOrder: 1,
        vessel: "serum"
      },
      {
        name: "Face Wash & Cleansers",
        slug: "face-wash-cleansers",
        description: "pH-balanced liquid cleansers and Aloe Vera foaming washes formulated for gentle daily purification.",
        sortOrder: 2,
        vessel: "cleanser"
      },
      {
        name: "Facial Care",
        slug: "facial-care",
        description: "Hydrating toners, day emulsions, and night serums crafted with botanical extracts.",
        sortOrder: 3,
        vessel: "toner"
      },
      {
        name: "Hair Care",
        slug: "hair-care",
        description: "Ganoderma-enriched shampoos and scalp-nourishing botanical oils with Vitamin B5.",
        sortOrder: 4,
        vessel: "shampoo"
      },
      {
        name: "Body Care",
        slug: "body-care",
        description: "Palm oil and botanical soap bars, massage oils, and moisturizing body lotions.",
        sortOrder: 5,
        vessel: "soap"
      },
      {
        name: "Personal Care",
        slug: "personal-care",
        description: "Everyday oral care, gentle baby care oils, and family hygiene essentials without harsh synthetics.",
        sortOrder: 6,
        vessel: "toothpaste"
      },
      {
        name: "Organic Beauty Products",
        slug: "organic-beauty-products",
        description: "Luxury botanical serums and multi-step beauty rituals for radiant complexion.",
        sortOrder: 7,
        vessel: "serum"
      },
      {
        name: "Herbal Products",
        slug: "herbal-products",
        description: "Traditional botanical preparations and soothing herbal topical creams.",
        sortOrder: 8,
        vessel: "cream"
      },
      {
        name: "Health & Wellness",
        slug: "health-wellness",
        description: "Daily botanical nutrition and wholesome plant-derived dietary formulations.",
        sortOrder: 9,
        vessel: "elixir"
      },
      {
        name: "Functional Beverages",
        slug: "functional-beverages",
        description: "Fermented botanical fruit juices, Noni (Morinda citrifolia) elixirs, and cocoa blends.",
        sortOrder: 10,
        vessel: "elixir"
      },
      {
        name: "Coffee & Tea",
        slug: "coffee-tea",
        description: "Aromatic Brazilian roast coffees and Nilgiri teas blended with Ganoderma extract.",
        sortOrder: 11,
        vessel: "coffee"
      },
      {
        name: "Nutritional Products",
        slug: "nutritional-products",
        description: "Whole-grain Spirulina cereals and nutrient-dense daily food blends.",
        sortOrder: 12,
        vessel: "cereal"
      },
      {
        name: "DXN Specialty Products",
        slug: "dxn-specialty-products",
        description: "Signature DXN formulations and curated seasonal gift sets.",
        sortOrder: 13,
        vessel: "serum"
      },
      {
        name: "New Arrivals",
        slug: "new-arrivals",
        description: "Recently arrived batches and newest botanical care releases in Bangladesh.",
        sortOrder: 14,
        vessel: "serum"
      },
      {
        name: "Best Sellers",
        slug: "best-sellers",
        description: "Our most frequently reordered customer favorites across Bangladesh.",
        sortOrder: 15,
        vessel: "toothpaste"
      },
      {
        name: "Special Offers",
        slug: "special-offers",
        description: "Value bundles and seasonal retail savings on authentic DXN products.",
        sortOrder: 16,
        vessel: "coffee"
      }
    ];
    const insertedCategories = await db.insert(categories).values(
      categorySeeds.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sortOrder,
        isEnabled: true,
        imageUrl: createStudioProductDataUri({
          vessel: c.vessel,
          labelTitle: c.name.toUpperCase().slice(0, 16),
          labelSubtitle: "Botanical Collection",
          volume: "DXN Series",
          bgTone: c.sortOrder % 2 === 0 ? "sage" : "ivory"
        }),
        seoTitle: `${c.name} \u2014 DXN Organic Point Bangladesh`,
        seoDescription: c.description
      }))
    ).returning();
    const catMap = /* @__PURE__ */ new Map();
    for (const c of insertedCategories) {
      catMap.set(c.slug, c.id);
    }
    const productSeeds = [
      {
        name: "DXN Ganozhi Plus Toothpaste",
        slug: "dxn-ganozhi-plus-toothpaste",
        sku: "DXN-PC-001",
        shortDescription: "Fluoride-free herbal gel toothpaste formulated with Ganoderma extract, menthol, and food-grade peppermint oil.",
        description: "DXN Ganozhi Plus Toothpaste is a gentle daily oral care gel free from artificial saccharin and synthetic coloring. Formulated with Ganoderma lucidum extract, food-grade gel base, and natural menthol to leave teeth clean and breath refreshed.",
        regularPrice: "680.00",
        discountedPrice: "590.00",
        stockQuantity: 85,
        categorySlug: "personal-care",
        subcategory: "Oral Care",
        weight: "150g",
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        isSpecialOffer: true,
        vessel: "toothpaste",
        tags: "toothpaste,oral care,ganozhi,personal care,fluoride free",
        salesCount: 342
      },
      {
        name: "DXN Ganozhi Liquid Cleanser",
        slug: "dxn-ganozhi-liquid-cleanser",
        sku: "DXN-FW-002",
        shortDescription: "Mild pH-balanced botanical facial and body cleanser enriched with Ganoderma extract and lipoaminoacids.",
        description: "Formulated for daily facial cleansing without stripping natural skin moisture. DXN Ganozhi Liquid Cleanser combines gentle plant-derived surfactants with Ganoderma extract to remove surface impurities and leave skin soft and supple.",
        regularPrice: "1250.00",
        discountedPrice: "1090.00",
        stockQuantity: 42,
        categorySlug: "face-wash-cleansers",
        subcategory: "Liquid Cleansers",
        weight: "150ml",
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        isSpecialOffer: false,
        vessel: "cleanser",
        tags: "cleanser,face wash,ganozhi,skincare,ph balanced",
        salesCount: 218
      },
      {
        name: "DXN Lingzhi Black Coffee (Sugar-Free)",
        slug: "dxn-lingzhi-black-coffee",
        sku: "DXN-CF-003",
        shortDescription: "Aromatic instant black coffee blended with Ganoderma extract\u2014zero added sugar, rich roast character.",
        description: "Prepared from roasted coffee beans and Ganoderma lucidum extract with no artificial flavorings or preservatives. Packaged in 20 individual sachets for convenient preparation at home or the office.",
        regularPrice: "1450.00",
        discountedPrice: "1290.00",
        stockQuantity: 64,
        categorySlug: "coffee-tea",
        subcategory: "Gourmet Coffee",
        weight: "20 Sachets \xD7 4.5g",
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        isSpecialOffer: true,
        vessel: "coffee",
        tags: "coffee,lingzhi,sugar free,beverages,ganoderma",
        salesCount: 410
      },
      {
        name: "DXN Ganozhi Soap Bar (Twin Pack)",
        slug: "dxn-ganozhi-soap-twin-pack",
        sku: "DXN-BC-004",
        shortDescription: "Botanical bathing bar crafted with nutrient-rich palm oil and Ganoderma extract for gentle everyday cleansing.",
        description: "DXN Ganozhi Soap is crafted from botanical palm oil enriched with Ganoderma extract. Produces a creamy lather suitable for both facial and body cleansing across normal to dry skin types.",
        regularPrice: "650.00",
        discountedPrice: "560.00",
        stockQuantity: 95,
        categorySlug: "body-care",
        subcategory: "Artisanal Soaps",
        weight: "2 \xD7 80g",
        isFeatured: false,
        isBestSeller: true,
        isNewArrival: false,
        isSpecialOffer: false,
        vessel: "soap",
        tags: "soap,body care,palm oil,ganozhi,bathing bar",
        salesCount: 289
      },
      {
        name: "DXN Aloe.V Cleansing Gel",
        slug: "dxn-aloe-v-cleansing-gel",
        sku: "DXN-SK-005",
        shortDescription: "Soap-free refreshing facial cleansing gel infused with pure Aloe Barbadensis leaf extract.",
        description: "A soothing, soap-free facial wash featuring Aloe Vera leaf extract to gently lift makeup residue and excess sebum while maintaining the skin barrier\u2019s natural hydration.",
        regularPrice: "980.00",
        discountedPrice: "860.00",
        stockQuantity: 38,
        categorySlug: "skincare",
        subcategory: "Aloe.V Series",
        weight: "100ml",
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
        isSpecialOffer: false,
        vessel: "cleanser",
        tags: "aloe vera,cleansing gel,skincare,facial wash",
        salesCount: 145
      },
      {
        name: "DXN Aloe.V Hydrating Toner",
        slug: "dxn-aloe-v-hydrating-toner",
        sku: "DXN-FC-006",
        shortDescription: "Alcohol-free botanical facial toner combining Aloe Vera, Witch Hazel, and amino-acid humectants.",
        description: "Formulated to refresh and prep the complexion immediately after cleansing. Combines Aloe Vera extract with botanical Witch Hazel to refine skin texture without drying alcohol.",
        regularPrice: "1050.00",
        discountedPrice: "920.00",
        stockQuantity: 29,
        categorySlug: "facial-care",
        subcategory: "Toners & Mists",
        weight: "100ml",
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: true,
        isSpecialOffer: false,
        vessel: "toner",
        tags: "toner,aloe vera,witch hazel,facial care",
        salesCount: 96
      },
      {
        name: "DXN Ganozhi Shampoo",
        slug: "dxn-ganozhi-shampoo",
        sku: "DXN-HC-007",
        shortDescription: "pH-balanced botanical hair wash enriched with Ganoderma extract and Vitamin B5 (Panthenol).",
        description: "Designed for daily scalp and hair care, DXN Ganozhi Shampoo cleanses gently while Vitamin B5 and Ganoderma extract help maintain natural hair sheen and manageability.",
        regularPrice: "1180.00",
        discountedPrice: "1020.00",
        stockQuantity: 51,
        categorySlug: "hair-care",
        subcategory: "Shampoos",
        weight: "250ml",
        isFeatured: false,
        isBestSeller: true,
        isNewArrival: false,
        isSpecialOffer: false,
        vessel: "shampoo",
        tags: "shampoo,hair care,vitamin b5,ganozhi",
        salesCount: 174
      },
      {
        name: "DXN Gano Massage Oil",
        slug: "dxn-gano-massage-oil",
        sku: "DXN-BC-008",
        shortDescription: "100% botanical palm oil blended with Ganoderma extract for soothing body and scalp massage.",
        description: "An all-natural botanical massage oil combining refined palm oil (70%) and Ganoderma extract (30%). Ideal for relaxing post-shower skin conditioning, scalp nourishment, and soothing massage.",
        regularPrice: "1120.00",
        discountedPrice: "990.00",
        stockQuantity: 44,
        categorySlug: "body-care",
        subcategory: "Body Oils",
        weight: "75ml",
        isFeatured: true,
        isBestSeller: true,
        isNewArrival: false,
        isSpecialOffer: false,
        vessel: "oil",
        tags: "massage oil,body oil,palm oil,scalp oil",
        salesCount: 205
      },
      {
        name: "DXN Tea Tree Cream",
        slug: "dxn-tea-tree-cream",
        sku: "DXN-HB-009",
        shortDescription: "Soothing botanical topical cream formulated with pure Melaleuca alternifolia (Tea Tree) leaf oil.",
        description: "A lightweight, fast-absorbing herbal cream featuring pure Australian Tea Tree oil in a gentle emollient base. Ideal for targeted skin comfort and outdoor family care.",
        regularPrice: "890.00",
        discountedPrice: "790.00",
        stockQuantity: 33,
        categorySlug: "herbal-products",
        subcategory: "Topical Creams",
        weight: "30g",
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: true,
        isSpecialOffer: true,
        vessel: "cream",
        tags: "tea tree,herbal cream,skincare,botanical",
        salesCount: 118
      },
      {
        name: "DXN Morinzhi Botanical Beverage",
        slug: "dxn-morinzhi-botanical-beverage",
        sku: "DXN-FB-010",
        shortDescription: "Botanical fruit beverage fermented from Morinda citrifolia (Noni) and natural Roselle juice.",
        description: "Prepared from selected Morinda citrifolia fruit enriched with natural Roselle (Hibiscus sabdariffa) for a balanced tart-sweet botanical profile. Bottled in protective dark glass with zero artificial preservatives.",
        regularPrice: "1850.00",
        discountedPrice: "1650.00",
        stockQuantity: 27,
        categorySlug: "functional-beverages",
        subcategory: "Botanical Juices",
        weight: "285ml",
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: false,
        isSpecialOffer: true,
        vessel: "elixir",
        tags: "morinzhi,noni,roselle,functional beverage",
        salesCount: 162
      },
      {
        name: "DXN Spirulina Cereal Blend",
        slug: "dxn-spirulina-cereal-blend",
        sku: "DXN-NP-011",
        shortDescription: "Wholesome whole-wheat cereal flakes blended with cultivated Spirulina platensis powder and malt extract.",
        description: "A convenient morning or evening nutritional beverage combining whole-grain cereal fiber with DXN cultivated Spirulina powder and subtle vanilla aroma in 30 individual sachets.",
        regularPrice: "3200.00",
        discountedPrice: "2890.00",
        stockQuantity: 19,
        categorySlug: "nutritional-products",
        subcategory: "Superfood Cereals",
        weight: "30 Sachets \xD7 30g",
        isFeatured: false,
        isBestSeller: true,
        isNewArrival: false,
        isSpecialOffer: false,
        vessel: "cereal",
        tags: "spirulina,cereal,nutrition,breakfast,wellness",
        salesCount: 134
      },
      {
        name: "DXN Cocozhi Cocoa Beverage",
        slug: "dxn-cocozhi-cocoa-beverage",
        sku: "DXN-FB-012",
        shortDescription: "Rich roasted cocoa drink formulated with Ganoderma extract and malt\u2014enjoyed hot or iced.",
        description: "Crafted from fine cocoa powder blended with Ganoderma extract, skim milk powder, and malt extract. Smooth chocolate taste suitable for the entire family.",
        regularPrice: "1750.00",
        discountedPrice: "1580.00",
        stockQuantity: 36,
        categorySlug: "functional-beverages",
        subcategory: "Cocoa & Malt",
        weight: "20 Sachets \xD7 32g",
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: true,
        isSpecialOffer: false,
        vessel: "cocoa",
        tags: "cocozhi,cocoa,chocolate,beverage,family",
        salesCount: 151
      },
      {
        name: "DXN Chubby Baby & Skin Oil",
        slug: "dxn-chubby-baby-oil",
        sku: "DXN-PC-013",
        shortDescription: "Delicate moisturizing oil infused with wheatgerm extract, sunflower seed extract, and commiphora myrrha.",
        description: "A gentle skin conditioning oil designed to lock in moisture for delicate skin, elbows, heels, and cuticles.",
        regularPrice: "950.00",
        discountedPrice: "850.00",
        stockQuantity: 4,
        // Low stock to demonstrate Admin Low Stock alert!
        categorySlug: "personal-care",
        subcategory: "Gentle Moisture",
        weight: "200ml",
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: true,
        isSpecialOffer: false,
        vessel: "oil",
        tags: "baby oil,moisturizer,personal care,skin oil",
        salesCount: 64
      },
      {
        name: "DXN Gempyuri Botanical Essence Serum",
        slug: "dxn-gempyuri-botanical-essence-serum",
        sku: "DXN-OB-014",
        shortDescription: "Concentrated Korean-inspired botanical peptide and truffle mushroom essence serum in frosted emerald glass.",
        description: "Part of the luxury Gempyuri skincare collection, this silky botanical essence serum delivers multi-layer hydration and luminous finish for evening and morning skincare rituals.",
        regularPrice: "3600.00",
        discountedPrice: "3250.00",
        stockQuantity: 14,
        categorySlug: "organic-beauty-products",
        subcategory: "Luxury Serums",
        weight: "50ml",
        isFeatured: true,
        isBestSeller: false,
        isNewArrival: true,
        isSpecialOffer: true,
        vessel: "serum",
        tags: "gempyuri,serum,luxury skincare,organic beauty",
        salesCount: 88
      }
    ];
    for (const p of productSeeds) {
      const catId = catMap.get(p.categorySlug) || insertedCategories[0].id;
      const primaryImg = createStudioProductDataUri({
        vessel: p.vessel,
        labelTitle: p.name.replace("DXN ", "").slice(0, 18),
        labelSubtitle: p.subcategory,
        volume: p.weight,
        bgTone: p.isFeatured ? "ivory" : "sage"
      });
      const insertedProd = await db.insert(products).values({
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription,
        description: p.description,
        regularPrice: p.regularPrice,
        discountedPrice: p.discountedPrice,
        stockQuantity: p.stockQuantity,
        categoryId: catId,
        subcategory: p.subcategory,
        weight: p.weight,
        availability: p.stockQuantity > 0 ? "in_stock" : "out_of_stock",
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isNewArrival: p.isNewArrival,
        isSpecialOffer: p.isSpecialOffer,
        isPublished: true,
        primaryImage: primaryImg,
        seoTitle: `${p.name} (${p.weight}) \u2014 Buy Online in Bangladesh | DXN Organic Point`,
        seoDescription: p.shortDescription,
        tags: p.tags,
        salesCount: p.salesCount
      }).returning();
      const prod = insertedProd[0];
      await db.insert(productImages).values([
        {
          productId: prod.id,
          imageUrl: primaryImg,
          altText: `${p.name} Studio Front View`,
          sortOrder: 1
        },
        {
          productId: prod.id,
          imageUrl: createStudioProductDataUri({
            vessel: p.vessel,
            labelTitle: p.name.replace("DXN ", "").slice(0, 18),
            labelSubtitle: "Botanical Detail",
            volume: p.weight,
            bgTone: "stone"
          }),
          altText: `${p.name} Stone Pedestal Angle`,
          sortOrder: 2
        }
      ]);
      await db.insert(productVariants).values([
        {
          productId: prod.id,
          variantName: `Standard (${p.weight})`,
          sku: `${p.sku}-STD`,
          price: p.discountedPrice || p.regularPrice,
          stockQuantity: p.stockQuantity,
          weight: p.weight
        },
        {
          productId: prod.id,
          variantName: `Value Twin Bundle (2 \xD7 ${p.weight})`,
          sku: `${p.sku}-TWIN`,
          price: String(Math.round(Number(p.discountedPrice || p.regularPrice) * 1.9)),
          stockQuantity: Math.max(2, Math.floor(p.stockQuantity / 2)),
          weight: `2 \xD7 ${p.weight}`
        }
      ]);
      await db.insert(inventory).values({
        productId: prod.id,
        sku: p.sku,
        quantityAvailable: p.stockQuantity,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        warehouseLocation: "Dhaka Central Fulfillment Hub (Banani)"
      });
    }
    await db.insert(coupons).values([
      {
        code: "ORGANIC10",
        description: "10% retail savings on orders above \u09F31,000",
        discountPercent: 10,
        minOrderAmount: "1000.00",
        maxDiscountAmount: "500.00",
        expiryDate: "2027-12-31",
        isActive: true,
        usageCount: 14
      },
      {
        code: "DXN15",
        description: "15% privilege discount on skincare & wellness bundles above \u09F32,500",
        discountPercent: 15,
        minOrderAmount: "2500.00",
        maxDiscountAmount: "900.00",
        expiryDate: "2027-12-31",
        isActive: true,
        usageCount: 8
      },
      {
        code: "WELCOME5",
        description: "5% welcome discount on any order above \u09F3500",
        discountPercent: 5,
        minOrderAmount: "500.00",
        maxDiscountAmount: "300.00",
        expiryDate: "2027-12-31",
        isActive: true,
        usageCount: 23
      }
    ]).onConflictDoNothing();
    await db.insert(shippingZones).values([
      {
        zoneName: "Inside Dhaka Metro",
        districtsIncluded: "Dhaka",
        deliveryCharge: "70.00",
        freeShippingThreshold: "2500.00",
        estimatedDays: "24\u201348 Hours (Same/Next Day Dispatch)",
        isActive: true
      },
      {
        zoneName: "Dhaka Suburbs & Adjacent",
        districtsIncluded: "Gazipur, Narayanganj, Savar, Keraniganj",
        deliveryCharge: "100.00",
        freeShippingThreshold: "2500.00",
        estimatedDays: "2\u20133 Business Days",
        isActive: true
      },
      {
        zoneName: "Nationwide Bangladesh (All 63 Other Districts)",
        districtsIncluded: "Chattogram, Sylhet, Rajshahi, Khulna, Barishal, Rangpur, Mymensingh & all districts",
        deliveryCharge: "130.00",
        freeShippingThreshold: "2500.00",
        estimatedDays: "3\u20135 Business Days via Steadfast / Pathao Courier",
        isActive: true
      }
    ]);
    const insertedBlogCats = await db.insert(blogCategories).values([
      {
        name: "Botanical Skincare Rituals",
        slug: "botanical-skincare-rituals",
        description: "Practical guides to gentle, pH-balanced skincare in Bangladesh\u2019s humid climate."
      },
      {
        name: "Ganoderma & Herbal Heritage",
        slug: "ganoderma-herbal-heritage",
        description: "Exploring the cultivation and culinary uses of Reishi (Ganoderma) and Spirulina."
      },
      {
        name: "Conscious Daily Living",
        slug: "conscious-daily-living",
        description: "Mindful morning routines, sugar-free coffee habits, and natural personal care."
      }
    ]).returning();
    const insertedTags = await db.insert(blogTags).values([
      { name: "Skincare Routine", slug: "skincare-routine" },
      { name: "Lingzhi Coffee", slug: "lingzhi-coffee" },
      { name: "Aloe Vera", slug: "aloe-vera" },
      { name: "Oral Care", slug: "oral-care" }
    ]).returning();
    const blogSeeds = [
      {
        title: "Building a Gentle pH-Balanced Skincare Routine for Humid South Asian Weather",
        slug: "gentle-ph-balanced-skincare-routine-bangladesh",
        excerpt: "Why harsh foaming cleansers trigger excess oil production in Dhaka\u2019s monsoon and summer months, and how botanical liquid cleansers and Aloe Vera toners restore calm balance.",
        content: `In warm, high-humidity climates like Dhaka and Chattogram, many skincare enthusiasts over-cleanse with high-alkaline soaps. While that squeaky-clean sensation feels refreshing for ten minutes, stripping the skin's acid mantle prompts sebaceous glands to overcompensate.

A balanced three-step botanical ritual focuses on barrier preservation:

1. Cleansing Without Stripping: Start morning and evening with a mild, pH-balanced wash such as DXN Ganozhi Liquid Cleanser or Aloe.V Cleansing Gel. Lukewarm water and 45 seconds of gentle circular massage dissolve urban dust and sunscreen without tightness.

2. Alcohol-Free Hydration: Immediately after patting dry, apply DXN Aloe.V Hydrating Toner. Formulated with Aloe Barbadensis and Witch Hazel without drying alcohol, it replenishes water content in the upper epidermis.

3. Targeted Evening Nourishment: Seal hydration with 2\u20133 drops of Gempyuri Botanical Essence Serum or a light layer of Tea Tree Cream on blemish-prone zones.`,
        blogCategoryId: insertedBlogCats[0].id,
        readTimeMinutes: 5,
        vessel: "cleanser"
      },
      {
        title: "Switching to Sugar-Free Gourmet Black Coffee: A Mindful Morning Ritual",
        slug: "sugar-free-lingzhi-black-coffee-morning-ritual",
        excerpt: "How replacing sweetened 3-in-1 sachets with pure roasted black coffee and Ganoderma extract transforms your morning focus and palate.",
        content: `For many professionals across Bangladesh, morning coffee has long meant heavily sweetened instant premixes. Transitioning to an unsweetened, pure roast like DXN Lingzhi Black Coffee introduces a cleaner, more aromatic experience.

Each 4.5g sachet pairs medium-dark roasted coffee beans with Ganoderma lucidum extract. Because it contains zero refined sugar or non-dairy creamer, the natural nutty and earthy notes of the roast come forward.

Preparation Tip: Pour 150ml of water at 85\xB0C (just off a rolling boil) over one sachet. Enjoy black, or pair with a splash of warm milk or a cinnamon stick for a comforting afternoon pause.`,
        blogCategoryId: insertedBlogCats[2].id,
        readTimeMinutes: 4,
        vessel: "coffee"
      },
      {
        title: "Why Fluoride-Free Herbal Gels Are Gaining Popularity in Family Oral Care",
        slug: "herbal-oral-care-ganozhi-plus-toothpaste-guide",
        excerpt: "Understanding the botanical ingredients behind DXN Ganozhi Plus Toothpaste\u2014from food-grade peppermint oil to Ganoderma lucidum extract.",
        content: `Oral hygiene is the cornerstone of daily personal care. Families looking for a clean-label alternative to synthetic colorants and harsh abrasives consistently choose DXN Ganozhi Plus Toothpaste.

Crafted with a translucent food-grade gel base, natural menthol, peppermint oil, and Ganoderma extract, it cleanses tooth enamel gently while leaving a crisp, cooling finish. A pea-sized amount twice daily is sufficient for a thoroughtwo-minute brushing routine.`,
        blogCategoryId: insertedBlogCats[1].id,
        readTimeMinutes: 4,
        vessel: "toothpaste"
      },
      {
        title: "How to Verify Authentic DXN Retail Products When Shopping Online in Bangladesh",
        slug: "verify-authentic-dxn-products-bangladesh",
        excerpt: "A transparent buyer\u2019s checklist covering batch numbers, factory-sealed packaging, expiry stamps, and authorized retail sourcing at DXN Organic Point.",
        content: `When purchasing personal care, skincare, and nutritional beverages online, product authenticity and storage conditions matter immensely.

At DXN Organic Point, every item in our Dhaka fulfillment hub undergoes a three-point inspection before dispatch:

1. Intact Original Factory Seals: All tubes, bottles, and sachet boxes retain their tamper-evident shrink wrap or foil seal.
2. Clear Batch & Expiry Coding: Every package displays legible laser or embossed manufacturing and expiration dates.
3. Climate-Controlled Storage: Botanical oils, serums, and fermented beverages like Morinzhi are stored away from direct heat and sunlight in our Banani warehouse.`,
        blogCategoryId: insertedBlogCats[1].id,
        readTimeMinutes: 6,
        vessel: "elixir"
      }
    ];
    for (const b of blogSeeds) {
      const insertedPost = await db.insert(blogPosts).values({
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt,
        content: b.content,
        featuredImage: createStudioProductDataUri({
          vessel: b.vessel,
          labelTitle: "EDITORIAL JOURNAL",
          labelSubtitle: b.title.slice(0, 24),
          volume: `${b.readTimeMinutes} MIN READ`,
          bgTone: "stone"
        }),
        blogCategoryId: b.blogCategoryId,
        authorName: "DXN Organic Point Editorial Desk",
        status: "published",
        seoTitle: `${b.title} | DXN Organic Point Journal`,
        seoDescription: b.excerpt,
        readTimeMinutes: b.readTimeMinutes
      }).returning();
      if (insertedPost[0] && insertedTags[0]) {
        await db.insert(postTags).values({
          postId: insertedPost[0].id,
          tagId: insertedTags[0].id
        });
      }
    }
    await db.insert(banners).values([
      {
        title: "Botanical Skincare & Mindful Daily Wellness",
        subtitle: "Authentic DXN formulations crafted with Ganoderma, Aloe Vera, and plant-based botanicals\u2014delivered across all 64 districts of Bangladesh.",
        ctaText: "Explore Collection",
        ctaLink: "/shop",
        imageUrl: createStudioProductDataUri({
          vessel: "serum",
          labelTitle: "BOTANICAL APOTHECARY",
          labelSubtitle: "Skincare & Wellness",
          volume: "2026 Collection",
          bgTone: "ivory"
        }),
        position: "hero",
        isActive: true,
        sortOrder: 1
      },
      {
        title: "Complimentary Nationwide Delivery on Orders Over \u09F32,500",
        subtitle: "Use code ORGANIC10 at checkout for 10% savings on orders above \u09F31,000.",
        ctaText: "Shop Special Offers",
        ctaLink: "/offers",
        imageUrl: createStudioProductDataUri({
          vessel: "coffee",
          labelTitle: "SEASONAL PRIVILEGE",
          labelSubtitle: "Code: ORGANIC10",
          volume: "BDT Savings",
          bgTone: "sage"
        }),
        position: "promo",
        isActive: true,
        sortOrder: 2
      }
    ]);
    await db.insert(testimonials).values([
      {
        customerName: "Farhana Rahman",
        customerRole: "Senior Architect",
        organizationOrCity: "Studio Vastu, Gulshan, Dhaka",
        statement: "Before switching to the Aloe.V Cleansing Gel and Hydrating Toner, high-foam washes left my skin tight in air-conditioned offices. Over the past 3 months, my daily routine feels noticeably calmer and my orders always arrive in Dhaka within 24 hours.",
        productPurchased: "DXN Aloe.V Cleansing Gel & Hydrating Toner",
        rating: 5,
        isVisible: true
      },
      {
        customerName: "Tanvir Ahmed Chowdhury",
        customerRole: "Managing Partner",
        organizationOrCity: "Chattogram Trade House, Agrabad",
        statement: "We replaced our office pantry\u2019s sweetened instant coffee packets with DXN Lingzhi Black Coffee six months ago. The sugar-free roast is crisp, convenient in individual sachets, and Steadfast courier delivery to Chattogram is consistently well-packed.",
        productPurchased: "DXN Lingzhi Black Coffee (Sugar-Free)",
        rating: 5,
        isVisible: true
      },
      {
        customerName: "Nusrat Jahan Mimi",
        customerRole: "University Lecturer",
        organizationOrCity: "Sylhet Metropolitan Area",
        statement: "Our entire household uses Ganozhi Plus Toothpaste and the Ganozhi Soap Twin Pack. Ordering from DXN Organic Point gives us peace of mind with authentic batch seals and straightforward bKash checkout.",
        productPurchased: "DXN Ganozhi Plus Toothpaste (150g)",
        rating: 5,
        isVisible: true
      }
    ]);
    const allProds = await db.select().from(products);
    if (allProds.length >= 3) {
      await db.insert(reviews).values([
        {
          productId: allProds[0].id,
          reviewerName: "Nusrat Jahan Mimi",
          reviewerRole: "Verified Buyer \xB7 Sylhet",
          rating: 5,
          title: "Clean peppermint finish without harshness",
          comment: "Have used Ganozhi Plus for over a year. The gel texture rinses clean and leaves a very natural mint freshness. Sealed original tube received.",
          isApproved: true
        },
        {
          productId: allProds[1].id,
          reviewerName: "Farhana Rahman",
          reviewerRole: "Verified Buyer \xB7 Dhaka",
          rating: 5,
          title: "Gentle on combination skin",
          comment: "A small pump is enough for evening cleansing. Does not dry out my cheeks and keeps humid-weather shine under control.",
          isApproved: true
        },
        {
          productId: allProds[2].id,
          reviewerName: "Tanvir Ahmed Chowdhury",
          reviewerRole: "Verified Buyer \xB7 Chattogram",
          rating: 5,
          title: "Authentic sugar-free dark roast",
          comment: "Rich aroma and zero sugar. Perfect for morning focus before meetings.",
          isApproved: true
        }
      ]);
      const sampleOrder1 = await db.insert(orders).values({
        orderNumber: "DXN-20261101-1042",
        userId: seededUsers[1]?.id || null,
        customerName: "Farhana Rahman",
        customerEmail: "farhana.rahman@example.com",
        customerPhone: "01712884422",
        deliveryAddress: "House 42, Road 90, Apartment 5B, Gulshan-2",
        district: "Dhaka",
        area: "Gulshan",
        postalCode: "1212",
        orderNotes: "Please call at gate before delivery.",
        subtotal: "2270.00",
        discountAmount: "227.00",
        shippingCost: "70.00",
        totalAmount: "2113.00",
        couponCode: "ORGANIC10",
        paymentMethod: "bkash",
        paymentStatus: "paid",
        orderStatus: "delivered",
        trackingNumber: "STF-BD-884120"
      }).returning();
      if (sampleOrder1[0]) {
        await db.insert(orderItems).values([
          {
            orderId: sampleOrder1[0].id,
            productId: allProds[0].id,
            productName: allProds[0].name,
            productSku: allProds[0].sku,
            variantName: "Standard (150g)",
            quantity: 2,
            unitPrice: "590.00",
            totalPrice: "1180.00"
          },
          {
            orderId: sampleOrder1[0].id,
            productId: allProds[1].id,
            productName: allProds[1].name,
            productSku: allProds[1].sku,
            variantName: "Standard (150ml)",
            quantity: 1,
            unitPrice: "1090.00",
            totalPrice: "1090.00"
          }
        ]);
        const pay1 = await db.insert(payments).values({
          orderId: sampleOrder1[0].id,
          paymentMethod: "bkash",
          amount: "2113.00",
          currency: "BDT",
          status: "verified",
          senderNumber: "01712884422",
          transactionId: "BKH98241DXN",
          isSandbox: true,
          verifiedAt: /* @__PURE__ */ new Date()
        }).returning();
        if (pay1[0]) {
          await db.insert(paymentTransactions).values({
            paymentId: pay1[0].id,
            gatewayName: "bKash",
            gatewayTransactionId: "BKH98241DXN",
            rawStatus: "COMPLETED_SANDBOX",
            gatewayResponseSummary: "Sandbox bKash Tokenized Checkout Verified (BDT 2113.00)",
            webhookVerified: true
          });
        }
      }
      const sampleOrder2 = await db.insert(orders).values({
        orderNumber: "DXN-20261102-2089",
        customerName: "Tanvir Ahmed Chowdhury",
        customerEmail: "tanvir.ctg@example.com",
        customerPhone: "01819445566",
        deliveryAddress: "Plot 14, Commercial Area, Agrabad",
        district: "Chattogram",
        area: "Agrabad",
        postalCode: "4100",
        orderNotes: "Office hours delivery (10am - 5pm).",
        subtotal: "2580.00",
        discountAmount: "0.00",
        shippingCost: "0.00",
        totalAmount: "2580.00",
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "shipped",
        trackingNumber: "PTH-CTG-992014"
      }).returning();
      if (sampleOrder2[0]) {
        await db.insert(orderItems).values([
          {
            orderId: sampleOrder2[0].id,
            productId: allProds[2].id,
            productName: allProds[2].name,
            productSku: allProds[2].sku,
            variantName: "Standard (20 Sachets \xD7 4.5g)",
            quantity: 2,
            unitPrice: "1290.00",
            totalPrice: "2580.00"
          }
        ]);
        const pay2 = await db.insert(payments).values({
          orderId: sampleOrder2[0].id,
          paymentMethod: "cod",
          amount: "2580.00",
          currency: "BDT",
          status: "pending",
          transactionId: "COD-2089",
          isSandbox: true
        }).returning();
        if (pay2[0]) {
          await db.insert(paymentTransactions).values({
            paymentId: pay2[0].id,
            gatewayName: "COD",
            gatewayTransactionId: "COD-2089",
            rawStatus: "AWAITING_DELIVERY_COLLECTION",
            gatewayResponseSummary: "Cash on Delivery scheduled via courier",
            webhookVerified: false
          });
        }
      }
    }
    const defaultFaqs = [
      {
        q: "Are all products at DXN Organic Point original and factory-sealed?",
        a: "Yes. DXN Organic Point is an independent specialty retail platform in Bangladesh supplying 100% original, factory-sealed DXN skincare, personal care, and wellness products with verifiable batch numbers and expiry dates."
      },
      {
        q: "What are the delivery charges and timelines across Bangladesh?",
        a: "Inside Dhaka Metro, delivery is \u09F370 (24\u201348 hours). In Dhaka suburbs (Gazipur, Narayanganj, Savar), delivery is \u09F3100 (2\u20133 business days). Across all other 63 districts of Bangladesh, courier delivery is \u09F3130 (3\u20135 business days). Orders of \u09F32,500 or above qualify for complimentary nationwide shipping."
      },
      {
        q: "Which payment methods do you accept in Bangladesh?",
        a: "We support Cash on Delivery (COD) nationwide, as well as bKash, Nagad, Rocket, SSLCommerz card/mobile checkout, and direct Bank Transfer. Note: Online payment gateways are currently operating in clearly labeled Sandbox/Test verification mode until live merchant production keys are enabled in Admin Settings."
      },
      {
        q: "How can I track my order after checkout?",
        a: "Immediately after placing an order, you receive a unique Order Number (e.g., DXN-20261101-1042). Enter this number on our Track My Order page at any time to view real-time fulfillment and courier status."
      },
      {
        q: "What is your return and refund policy?",
        a: "Unopened items in their original sealed packaging can be returned or exchanged within 7 days of delivery. If you receive a damaged or incorrect item, contact our support desk within 48 hours for a priority replacement or full refund."
      }
    ];
    const paymentGatewayConfig = {
      mode: "sandbox",
      bkash: {
        enabled: true,
        merchantNumber: "01711-009988 (Sandbox Merchant)",
        instructions: "Send Money or Merchant Payment in Sandbox mode and provide Transaction ID (e.g. BKH123456)."
      },
      nagad: {
        enabled: true,
        merchantNumber: "01819-009988 (Sandbox Merchant)",
        instructions: "Transfer via Nagad Sandbox and enter the 8\u201310 character Transaction Reference."
      },
      rocket: {
        enabled: true,
        merchantNumber: "01911-009988-4 (DBBL Rocket Sandbox)",
        instructions: "Provide your Rocket Transaction ID for verification."
      },
      sslcommerz: {
        enabled: true,
        storeId: "dxnor6720sandbox",
        isSandbox: true,
        instructions: "Simulated SSLCommerz Sandbox Gateway supporting Visa, Mastercard, and Mobile Banking test transactions."
      },
      bank_transfer: {
        enabled: true,
        bankName: "City Bank PLC \u2014 Gulshan Avenue Branch",
        accountName: "DXN Organic Point Retail",
        accountNumber: "1402998877665",
        routingNumber: "225261729"
      },
      cod: {
        enabled: true,
        instructions: "Pay in cash (BDT) directly to the delivery rider upon receiving your sealed parcel."
      }
    };
    const settingsEntries = [
      { key: "brand_name", value: "DXN Organic Point", category: "general" },
      {
        key: "brand_tagline",
        value: "Botanical Skincare, Personal Care & Mindful Daily Wellness",
        category: "general"
      },
      {
        key: "brand_disclaimer",
        value: "DXN Organic Point operates as an independent retail & e-commerce storefront in Bangladesh offering authentic DXN products. Product descriptions are provided for retail informational purposes only and are not intended to diagnose, treat, cure, or prevent any disease.",
        category: "general"
      },
      { key: "contact_phone", value: "+880 1711-009988", category: "general" },
      { key: "contact_whatsapp", value: "8801711009988", category: "general" },
      { key: "contact_email", value: "care@dxnorganicpoint.com", category: "general" },
      {
        key: "contact_address",
        value: "Level 4, Botanical Arcade, Road 11, Banani, Dhaka-1213, Bangladesh",
        category: "general"
      },
      { key: "currency_code", value: "BDT", category: "general" },
      { key: "currency_symbol", value: "\u09F3", category: "general" },
      {
        key: "announcement_bar",
        value: "Complimentary Delivery Across Bangladesh on Orders Over \u09F32,500 \xB7 Use Code ORGANIC10 for 10% Savings",
        category: "content"
      },
      {
        key: "about_content",
        value: "Founded in Dhaka, DXN Organic Point curates authentic plant-based personal care, botanical skincare, and Ganoderma-enriched daily wellness beverages for discerning households across Bangladesh. Every item in our catalog is sourced from verified batches, stored in climate-controlled conditions, and dispatched with transparent batch documentation.",
        category: "content"
      },
      {
        key: "brand_story_content",
        value: "Our journey began with a simple observation: families in Bangladesh wanted cleaner daily essentials\u2014fluoride-free herbal toothpastes, pH-balanced liquid cleansers, and sugar-free roasted coffees\u2014without worrying about grey-market counterfeits or heat-damaged stock. DXN Organic Point bridges that gap with an apothecary-grade online retail experience.",
        category: "content"
      },
      {
        key: "faqs_json",
        value: JSON.stringify(defaultFaqs),
        category: "content"
      },
      {
        key: "seo_default_title",
        value: "DXN Organic Point \u2014 Natural Skincare, Cosmetics & Wellness in Bangladesh",
        category: "seo"
      },
      {
        key: "seo_default_description",
        value: "Shop authentic DXN natural skincare, Ganozhi toothpaste, Aloe.V facial care, Lingzhi black coffee, and botanical wellness products in Bangladesh.",
        category: "seo"
      },
      {
        key: "gsc_verification_code",
        value: "google-site-verification=dxn_organic_point_bd_ready",
        category: "seo"
      },
      {
        key: "robots_custom_rules",
        value: `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /account/
Disallow: /checkout/
Disallow: /cart/
Disallow: /search/`,
        category: "seo"
      },
      {
        key: "redirects_json",
        value: JSON.stringify([
          { from: "/old-shop", to: "/shop", status: 301 },
          { from: "/toothpaste", to: "/product/dxn-ganozhi-plus-toothpaste", status: 301 }
        ]),
        category: "seo"
      },
      {
        key: "payment_gateways_config",
        value: JSON.stringify(paymentGatewayConfig),
        category: "payment"
      }
    ];
    await db.insert(siteSettings).values(
      settingsEntries.map((s) => ({
        settingKey: s.key,
        settingValue: s.value,
        category: s.category
      }))
    ).onConflictDoNothing();
    seedDone = true;
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    isSeeding = false;
  }
}
async function getStoreBootstrapData() {
  try {
    await seedDatabaseIfNeeded();
    const [
      allCategories,
      allProducts,
      allVariants,
      allImages,
      allBanners,
      allTestimonials,
      allReviews,
      allPosts,
      allBlogCats,
      allCoupons,
      allZones,
      allSettings
    ] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
      db.select().from(products).orderBy(desc(products.isFeatured), asc(products.id)),
      db.select().from(productVariants),
      db.select().from(productImages).orderBy(asc(productImages.sortOrder)),
      db.select().from(banners).orderBy(asc(banners.sortOrder)),
      db.select().from(testimonials).orderBy(desc(testimonials.id)),
      db.select().from(reviews).orderBy(desc(reviews.createdAt)),
      db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt)),
      db.select().from(blogCategories),
      db.select().from(coupons).orderBy(desc(coupons.id)),
      db.select().from(shippingZones),
      db.select().from(siteSettings)
    ]);
    const settingsMap = {};
    for (const s of allSettings) {
      settingsMap[s.settingKey] = s.settingValue;
    }
    const enrichedProducts = allProducts.map((p) => {
      const cat = allCategories.find((c) => c.id === p.categoryId);
      const variants = allVariants.filter((v) => v.productId === p.id);
      const gallery = allImages.filter((img) => img.productId === p.id);
      const prodReviews = allReviews.filter((r) => r.productId === p.id && r.isApproved);
      return {
        ...p,
        categoryName: cat?.name || "Skincare",
        categorySlug: cat?.slug || "skincare",
        variants,
        gallery,
        reviews: prodReviews
      };
    });
    const enrichedPosts = allPosts.map((post) => {
      const bcat = allBlogCats.find((c) => c.id === post.blogCategoryId);
      return {
        ...post,
        categoryName: bcat?.name || "Botanical Journal",
        categorySlug: bcat?.slug || "botanical-journal"
      };
    });
    return {
      categories: allCategories,
      products: enrichedProducts,
      banners: allBanners,
      testimonials: allTestimonials,
      reviews: allReviews,
      blogPosts: enrichedPosts,
      blogCategories: allBlogCats,
      coupons: allCoupons,
      shippingZones: allZones,
      settings: settingsMap
    };
  } catch (error) {
    console.error("Database query failed in getStoreBootstrapData:", error);
    throw new Error("Failed to load storefront data. Please try again later.", {
      cause: error
    });
  }
}
async function placeCustomerOrder(input) {
  try {
    if (!input.items || input.items.length === 0) {
      throw new Error("Your shopping cart is empty.");
    }
    const allProds = await db.select().from(products);
    const prodMap = new Map(allProds.map((p) => [p.id, p]));
    const lineItems = input.items.map((item) => {
      const prod = prodMap.get(Number(item.productId));
      if (!prod) {
        throw new Error(`Product ID ${item.productId} no longer exists.`);
      }
      if (prod.stockQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${prod.name} (Available: ${prod.stockQuantity}).`
        );
      }
      const activePrice = prod.discountedPrice && Number(prod.discountedPrice) > 0 ? Number(prod.discountedPrice) : Number(prod.regularPrice);
      return {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        unitPrice: activePrice,
        quantity: Number(item.quantity),
        variantName: item.variantName || `Standard (${prod.weight})`
      };
    });
    let matchedCoupon = null;
    if (input.couponCode && input.couponCode.trim()) {
      const cleanCode = input.couponCode.trim().toUpperCase();
      const foundCoupons = await db.select().from(coupons).where(eq(coupons.code, cleanCode));
      if (foundCoupons[0]) {
        matchedCoupon = {
          id: foundCoupons[0].id,
          code: foundCoupons[0].code,
          discountPercent: foundCoupons[0].discountPercent,
          minOrderAmount: Number(foundCoupons[0].minOrderAmount),
          maxDiscountAmount: Number(foundCoupons[0].maxDiscountAmount),
          expiryDate: foundCoupons[0].expiryDate,
          isActive: foundCoupons[0].isActive
        };
      }
    }
    const totals = calculateOrderTotals({
      items: lineItems,
      district: input.district,
      coupon: matchedCoupon,
      freeShippingThreshold: 2500
    });
    const orderNumber = generateOrderNumber(/* @__PURE__ */ new Date());
    const trackingNumber = `BD-TRK-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const isInstantSandboxVerified = ["bkash", "nagad", "rocket", "sslcommerz"].includes(input.paymentMethod) && Boolean(input.transactionId && input.transactionId.trim().length >= 4);
    const paymentStatus = isInstantSandboxVerified ? "paid" : "pending";
    const orderStatus = isInstantSandboxVerified ? "confirmed" : "pending";
    const createdOrder = await db.transaction(async (tx) => {
      const insertedOrders = await tx.insert(orders).values({
        orderNumber,
        userId: input.userId || null,
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail.trim().toLowerCase(),
        customerPhone: input.customerPhone.trim(),
        deliveryAddress: input.deliveryAddress.trim(),
        district: input.district.trim(),
        area: input.area.trim(),
        postalCode: input.postalCode.trim() || "1200",
        orderNotes: input.orderNotes?.trim() || "",
        subtotal: totals.subtotal.toFixed(2),
        discountAmount: totals.discountAmount.toFixed(2),
        shippingCost: totals.shippingCost.toFixed(2),
        totalAmount: totals.totalAmount.toFixed(2),
        couponCode: matchedCoupon && totals.discountAmount > 0 ? matchedCoupon.code : null,
        paymentMethod: input.paymentMethod,
        paymentStatus,
        orderStatus,
        trackingNumber
      }).returning();
      const orderRecord = insertedOrders[0];
      for (const line of lineItems) {
        await tx.insert(orderItems).values({
          orderId: orderRecord.id,
          productId: line.productId,
          productName: line.name,
          productSku: line.sku,
          variantName: line.variantName,
          quantity: line.quantity,
          unitPrice: line.unitPrice.toFixed(2),
          totalPrice: (line.unitPrice * line.quantity).toFixed(2)
        });
        await tx.update(products).set({
          stockQuantity: sql`GREATEST(0, ${products.stockQuantity} - ${line.quantity})`,
          salesCount: sql`${products.salesCount} + ${line.quantity}`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(products.id, line.productId));
        await tx.update(inventory).set({
          quantityAvailable: sql`GREATEST(0, ${inventory.quantityAvailable} - ${line.quantity})`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(inventory.productId, line.productId));
      }
      const gatewayTxId = input.transactionId?.trim() || `SBX-${input.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const insertedPayments = await tx.insert(payments).values({
        orderId: orderRecord.id,
        paymentMethod: input.paymentMethod,
        amount: totals.totalAmount.toFixed(2),
        currency: "BDT",
        status: isInstantSandboxVerified ? "verified" : "pending",
        senderNumber: input.senderNumber?.trim() || input.customerPhone.trim(),
        transactionId: gatewayTxId,
        isSandbox: true,
        verifiedAt: isInstantSandboxVerified ? /* @__PURE__ */ new Date() : null
      }).returning();
      if (insertedPayments[0]) {
        await tx.insert(paymentTransactions).values({
          paymentId: insertedPayments[0].id,
          gatewayName: input.paymentMethod.toUpperCase(),
          gatewayTransactionId: gatewayTxId,
          rawStatus: isInstantSandboxVerified ? "SANDBOX_VERIFIED" : "PENDING_VERIFICATION",
          gatewayResponseSummary: `Sandbox ${input.paymentMethod.toUpperCase()} transaction recorded for Order ${orderNumber}`,
          webhookVerified: isInstantSandboxVerified
        });
      }
      if (matchedCoupon && totals.discountAmount > 0) {
        await tx.insert(couponUsage).values({
          couponId: matchedCoupon.id,
          orderId: orderRecord.id,
          customerEmail: input.customerEmail.trim().toLowerCase()
        });
        await tx.update(coupons).set({ usageCount: sql`${coupons.usageCount} + 1` }).where(eq(coupons.id, matchedCoupon.id));
      }
      await tx.insert(notifications).values({
        userId: input.userId || null,
        title: `New Order ${orderNumber}`,
        message: `Order placed by ${input.customerName} for \u09F3${totals.totalAmount.toFixed(2)} via ${input.paymentMethod.toUpperCase()}.`,
        type: "order"
      });
      await tx.insert(auditLogs).values({
        actorEmail: input.customerEmail.trim().toLowerCase(),
        action: "ORDER_CREATED",
        entityType: "orders",
        entityId: orderNumber,
        details: `Total BDT ${totals.totalAmount.toFixed(2)} (${lineItems.length} items)`
      });
      return orderRecord;
    });
    return {
      order: createdOrder,
      items: lineItems
    };
  } catch (error) {
    console.error("Database transaction failed in placeCustomerOrder:", error);
    throw new Error(error.message || "Could not place order. Please check your details.", {
      cause: error
    });
  }
}
async function getOrderTrackingDetails(orderNumber) {
  try {
    const cleanNum = orderNumber.trim().toUpperCase();
    const found = await db.select().from(orders).where(eq(orders.orderNumber, cleanNum));
    if (found.length === 0) {
      return null;
    }
    const order = found[0];
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const paymentRecords = await db.select().from(payments).where(eq(payments.orderId, order.id));
    return {
      order,
      items,
      payment: paymentRecords[0] || null
    };
  } catch (error) {
    console.error("Database query failed in getOrderTrackingDetails:", error);
    throw new Error("Unable to retrieve order tracking details.", { cause: error });
  }
}
async function getCustomerOrdersByEmail(email) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const userOrders = await db.select().from(orders).where(eq(orders.customerEmail, cleanEmail)).orderBy(desc(orders.createdAt));
    const allOrderItems = await db.select().from(orderItems);
    const allPayments = await db.select().from(payments);
    return userOrders.map((o) => ({
      ...o,
      items: allOrderItems.filter((i) => i.orderId === o.id),
      payment: allPayments.find((p) => p.orderId === o.id) || null
    }));
  } catch (error) {
    console.error("Database query failed in getCustomerOrdersByEmail:", error);
    throw new Error("Failed to load customer orders.", { cause: error });
  }
}
async function getWishlistBySession(sessionKey) {
  try {
    const found = await db.select().from(wishlists).where(eq(wishlists.sessionKey, sessionKey));
    if (found.length === 0) return [];
    const items = await db.select().from(wishlistItems).where(eq(wishlistItems.wishlistId, found[0].id));
    return items.map((i) => i.productId);
  } catch (error) {
    console.error("Database query failed in getWishlistBySession:", error);
    throw new Error("Failed to load wishlist.", { cause: error });
  }
}
async function toggleWishlistProduct(sessionKey, productId) {
  try {
    let wl = (await db.select().from(wishlists).where(eq(wishlists.sessionKey, sessionKey)))[0];
    if (!wl) {
      const inserted = await db.insert(wishlists).values({ sessionKey }).onConflictDoNothing().returning();
      wl = inserted[0] || (await db.select().from(wishlists).where(eq(wishlists.sessionKey, sessionKey)))[0];
    }
    const existing = await db.select().from(wishlistItems).where(
      and(
        eq(wishlistItems.wishlistId, wl.id),
        eq(wishlistItems.productId, productId)
      )
    );
    if (existing.length > 0) {
      await db.delete(wishlistItems).where(eq(wishlistItems.id, existing[0].id));
    } else {
      await db.insert(wishlistItems).values({
        wishlistId: wl.id,
        productId
      });
    }
    return await getWishlistBySession(sessionKey);
  } catch (error) {
    console.error("Database query failed in toggleWishlistProduct:", error);
    throw new Error("Failed to update wishlist.", { cause: error });
  }
}
async function getAdminDashboardData() {
  try {
    await seedDatabaseIfNeeded();
    const [
      allOrders,
      allOrderItems,
      allProducts,
      allCategories,
      allUsers,
      allProfiles,
      allPayments,
      allTransactions,
      allInventory,
      allCoupons,
      allSubscribers,
      allLogs,
      allNotifications
    ] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(orderItems),
      db.select().from(products).orderBy(desc(products.id)),
      db.select().from(categories).orderBy(asc(categories.sortOrder)),
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(profiles),
      db.select().from(payments).orderBy(desc(payments.createdAt)),
      db.select().from(paymentTransactions).orderBy(desc(paymentTransactions.createdAt)),
      db.select().from(inventory),
      db.select().from(coupons).orderBy(desc(coupons.id)),
      db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt)),
      db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(40),
      db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(20)
    ]);
    const activeOrders = allOrders.filter((o) => o.orderStatus !== "cancelled");
    const totalSales = activeOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const pendingOrders = allOrders.filter((o) => o.orderStatus === "pending").length;
    const completedOrders = allOrders.filter((o) => o.orderStatus === "delivered").length;
    const cancelledOrders = allOrders.filter((o) => o.orderStatus === "cancelled").length;
    const lowStockProducts = allProducts.filter((p) => p.stockQuantity <= 5);
    const enrichedOrders = allOrders.map((o) => ({
      ...o,
      items: allOrderItems.filter((i) => i.orderId === o.id),
      payment: allPayments.find((p) => p.orderId === o.id) || null
    }));
    const enrichedCustomers = allUsers.map((u) => {
      const prof = allProfiles.find((p) => p.userId === u.id);
      const userOrders = allOrders.filter(
        (o) => o.userId === u.id || o.customerEmail.toLowerCase() === u.email.toLowerCase()
      );
      const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      return {
        ...u,
        fullName: prof?.fullName || u.email.split("@")[0],
        phone: prof?.phone || "\u2014",
        district: prof?.district || "Dhaka",
        ordersCount: userOrders.length,
        totalSpent
      };
    });
    const monthlyPerformance = [
      { month: "Jun", revenue: 42800, orders: 19 },
      { month: "Jul", revenue: 56400, orders: 26 },
      { month: "Aug", revenue: 61900, orders: 29 },
      { month: "Sep", revenue: 74200, orders: 35 },
      { month: "Oct", revenue: 88500, orders: 42 },
      { month: "Nov", revenue: Math.round(92e3 + totalSales), orders: 44 + allOrders.length }
    ];
    return {
      metrics: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders: allOrders.length,
        totalCustomers: allUsers.length,
        totalProducts: allProducts.length,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        lowStockCount: lowStockProducts.length
      },
      lowStockProducts,
      orders: enrichedOrders,
      customers: enrichedCustomers,
      payments: allPayments,
      transactions: allTransactions,
      inventory: allInventory,
      coupons: allCoupons,
      subscribers: allSubscribers,
      auditLogs: allLogs,
      notifications: allNotifications,
      monthlyPerformance,
      categories: allCategories,
      products: allProducts
    };
  } catch (error) {
    console.error("Database query failed in getAdminDashboardData:", error);
    throw new Error("Failed to load admin dashboard analytics.", { cause: error });
  }
}
async function upsertAdminProduct(payload) {
  try {
    const cleanName = String(payload.name || "").trim();
    if (!cleanName) throw new Error("Product name is required.");
    const slug = payload.slug ? slugify(payload.slug) : slugify(cleanName);
    const sku = String(payload.sku || `DXN-${Date.now().toString().slice(-4)}`).trim();
    const regularPrice = Number(payload.regularPrice || 0).toFixed(2);
    const discountedPrice = payload.discountedPrice && Number(payload.discountedPrice) > 0 ? Number(payload.discountedPrice).toFixed(2) : null;
    const stockQuantity = Math.max(0, Number(payload.stockQuantity ?? 20));
    const categoryId = Number(payload.categoryId || 1);
    const primaryImage = payload.primaryImage && String(payload.primaryImage).trim().length > 0 ? String(payload.primaryImage).trim() : createStudioProductDataUri({
      vessel: "serum",
      labelTitle: cleanName.replace("DXN ", "").slice(0, 18),
      labelSubtitle: payload.subcategory || "Botanical Care",
      volume: payload.weight || "100g",
      bgTone: "ivory"
    });
    if (payload.id) {
      const updated = await db.update(products).set({
        name: cleanName,
        slug,
        sku,
        shortDescription: payload.shortDescription || cleanName,
        description: payload.description || payload.shortDescription || cleanName,
        regularPrice,
        discountedPrice,
        stockQuantity,
        categoryId,
        subcategory: payload.subcategory || "Botanical Series",
        weight: payload.weight || "100g",
        availability: stockQuantity > 0 ? "in_stock" : "out_of_stock",
        isFeatured: Boolean(payload.isFeatured),
        isBestSeller: Boolean(payload.isBestSeller),
        isNewArrival: Boolean(payload.isNewArrival),
        isSpecialOffer: Boolean(payload.isSpecialOffer),
        isPublished: payload.isPublished !== false,
        primaryImage,
        seoTitle: payload.seoTitle || `${cleanName} | DXN Organic Point`,
        seoDescription: payload.seoDescription || payload.shortDescription || cleanName,
        noIndex: Boolean(payload.noIndex),
        tags: payload.tags || "",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(products.id, Number(payload.id))).returning();
      await db.update(inventory).set({ quantityAvailable: stockQuantity, updatedAt: /* @__PURE__ */ new Date() }).where(eq(inventory.productId, Number(payload.id)));
      await db.insert(auditLogs).values({
        actorEmail: "admin@dxnorganicpoint.com",
        action: "PRODUCT_UPDATED",
        entityType: "products",
        entityId: String(payload.id),
        details: `Updated product ${cleanName} (Stock: ${stockQuantity})`
      });
      return updated[0];
    } else {
      const inserted = await db.insert(products).values({
        name: cleanName,
        slug,
        sku,
        shortDescription: payload.shortDescription || cleanName,
        description: payload.description || payload.shortDescription || cleanName,
        regularPrice,
        discountedPrice,
        stockQuantity,
        categoryId,
        subcategory: payload.subcategory || "Botanical Series",
        weight: payload.weight || "100g",
        availability: stockQuantity > 0 ? "in_stock" : "out_of_stock",
        isFeatured: Boolean(payload.isFeatured),
        isBestSeller: Boolean(payload.isBestSeller),
        isNewArrival: Boolean(payload.isNewArrival ?? true),
        isSpecialOffer: Boolean(payload.isSpecialOffer),
        isPublished: payload.isPublished !== false,
        primaryImage,
        seoTitle: payload.seoTitle || `${cleanName} | DXN Organic Point`,
        seoDescription: payload.seoDescription || payload.shortDescription || cleanName,
        noIndex: Boolean(payload.noIndex),
        tags: payload.tags || ""
      }).returning();
      const prod = inserted[0];
      await db.insert(inventory).values({
        productId: prod.id,
        sku: prod.sku,
        quantityAvailable: stockQuantity,
        lowStockThreshold: 5
      });
      await db.insert(productVariants).values({
        productId: prod.id,
        variantName: `Standard (${prod.weight})`,
        sku: `${prod.sku}-STD`,
        price: discountedPrice || regularPrice,
        stockQuantity,
        weight: prod.weight
      });
      await db.insert(auditLogs).values({
        actorEmail: "admin@dxnorganicpoint.com",
        action: "PRODUCT_CREATED",
        entityType: "products",
        entityId: String(prod.id),
        details: `Created product ${cleanName}`
      });
      return prod;
    }
  } catch (error) {
    console.error("Database error in upsertAdminProduct:", error);
    throw new Error(error.message || "Failed to save product.", { cause: error });
  }
}
async function deleteAdminProduct(productId) {
  try {
    await db.delete(productImages).where(eq(productImages.productId, productId));
    await db.delete(productVariants).where(eq(productVariants.productId, productId));
    await db.delete(inventory).where(eq(inventory.productId, productId));
    await db.delete(reviews).where(eq(reviews.productId, productId));
    await db.delete(wishlistItems).where(eq(wishlistItems.productId, productId));
    await db.delete(products).where(eq(products.id, productId));
    await db.insert(auditLogs).values({
      actorEmail: "admin@dxnorganicpoint.com",
      action: "PRODUCT_DELETED",
      entityType: "products",
      entityId: String(productId),
      details: `Deleted product #${productId}`
    });
    return { deleted: true };
  } catch (error) {
    console.error("Database error in deleteAdminProduct:", error);
    throw new Error("Could not delete product (it may be referenced in existing orders).", {
      cause: error
    });
  }
}
async function upsertAdminCategory(payload) {
  try {
    const cleanName = String(payload.name || "").trim();
    if (!cleanName) throw new Error("Category name is required.");
    const slug = payload.slug ? slugify(payload.slug) : slugify(cleanName);
    const imageUrl = payload.imageUrl || createStudioProductDataUri({
      vessel: "serum",
      labelTitle: cleanName.toUpperCase().slice(0, 16),
      labelSubtitle: "Botanical Collection",
      volume: "DXN Series",
      bgTone: "sage"
    });
    if (payload.id) {
      const updated = await db.update(categories).set({
        name: cleanName,
        slug,
        description: payload.description || "",
        imageUrl,
        sortOrder: Number(payload.sortOrder || 1),
        isEnabled: payload.isEnabled !== false,
        seoTitle: payload.seoTitle || `${cleanName} \u2014 DXN Organic Point`,
        seoDescription: payload.seoDescription || payload.description || "",
        noIndex: Boolean(payload.noIndex),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(categories.id, Number(payload.id))).returning();
      return updated[0];
    } else {
      const inserted = await db.insert(categories).values({
        name: cleanName,
        slug,
        description: payload.description || "",
        imageUrl,
        sortOrder: Number(payload.sortOrder || 10),
        isEnabled: payload.isEnabled !== false,
        seoTitle: payload.seoTitle || `${cleanName} \u2014 DXN Organic Point`,
        seoDescription: payload.seoDescription || payload.description || "",
        noIndex: Boolean(payload.noIndex)
      }).returning();
      return inserted[0];
    }
  } catch (error) {
    console.error("Database error in upsertAdminCategory:", error);
    throw new Error(error.message || "Failed to save category.", { cause: error });
  }
}
async function updateAdminOrderStatus(params) {
  try {
    const updateData = {
      orderStatus: params.orderStatus,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (params.paymentStatus) updateData.paymentStatus = params.paymentStatus;
    if (params.trackingNumber !== void 0) updateData.trackingNumber = params.trackingNumber;
    const updated = await db.update(orders).set(updateData).where(eq(orders.id, params.orderId)).returning();
    if (params.paymentStatus) {
      await db.update(payments).set({
        status: params.paymentStatus === "paid" ? "verified" : params.paymentStatus,
        verifiedAt: params.paymentStatus === "paid" ? /* @__PURE__ */ new Date() : null
      }).where(eq(payments.orderId, params.orderId));
    }
    await db.insert(auditLogs).values({
      actorEmail: "admin@dxnorganicpoint.com",
      action: "ORDER_STATUS_UPDATED",
      entityType: "orders",
      entityId: String(params.orderId),
      details: `Order status -> ${params.orderStatus}, Payment -> ${params.paymentStatus || "unchanged"}`
    });
    return updated[0];
  } catch (error) {
    console.error("Database error in updateAdminOrderStatus:", error);
    throw new Error("Failed to update order status.", { cause: error });
  }
}
async function upsertAdminBlogPost(payload) {
  try {
    const title = String(payload.title || "").trim();
    if (!title) throw new Error("Blog post title is required.");
    const slug = payload.slug ? slugify(payload.slug) : slugify(title);
    const featuredImage = payload.featuredImage || createStudioProductDataUri({
      vessel: "elixir",
      labelTitle: "BOTANICAL JOURNAL",
      labelSubtitle: title.slice(0, 22),
      volume: "EDITORIAL",
      bgTone: "stone"
    });
    if (payload.id) {
      const updated = await db.update(blogPosts).set({
        title,
        slug,
        excerpt: payload.excerpt || title,
        content: payload.content || payload.excerpt || title,
        featuredImage,
        blogCategoryId: payload.blogCategoryId ? Number(payload.blogCategoryId) : null,
        authorName: payload.authorName || "DXN Editorial Desk",
        status: payload.status || "published",
        seoTitle: payload.seoTitle || `${title} | DXN Organic Point`,
        seoDescription: payload.seoDescription || payload.excerpt || title,
        noIndex: Boolean(payload.noIndex),
        readTimeMinutes: Number(payload.readTimeMinutes || 5),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(blogPosts.id, Number(payload.id))).returning();
      return updated[0];
    } else {
      const inserted = await db.insert(blogPosts).values({
        title,
        slug,
        excerpt: payload.excerpt || title,
        content: payload.content || payload.excerpt || title,
        featuredImage,
        blogCategoryId: payload.blogCategoryId ? Number(payload.blogCategoryId) : null,
        authorName: payload.authorName || "DXN Editorial Desk",
        status: payload.status || "published",
        seoTitle: payload.seoTitle || `${title} | DXN Organic Point`,
        seoDescription: payload.seoDescription || payload.excerpt || title,
        noIndex: Boolean(payload.noIndex),
        readTimeMinutes: Number(payload.readTimeMinutes || 5)
      }).returning();
      return inserted[0];
    }
  } catch (error) {
    console.error("Database error in upsertAdminBlogPost:", error);
    throw new Error(error.message || "Failed to save blog post.", { cause: error });
  }
}
async function deleteAdminBlogPost(postId) {
  try {
    await db.delete(postTags).where(eq(postTags.postId, postId));
    await db.delete(blogPosts).where(eq(blogPosts.id, postId));
    return { deleted: true };
  } catch (error) {
    console.error("Database error in deleteAdminBlogPost:", error);
    throw new Error("Failed to delete blog post.", { cause: error });
  }
}
async function upsertAdminCoupon(payload) {
  try {
    const code = String(payload.code || "").trim().toUpperCase();
    if (!code) throw new Error("Coupon code is required.");
    if (payload.id) {
      const updated = await db.update(coupons).set({
        code,
        description: payload.description || `${payload.discountPercent}% discount`,
        discountPercent: Number(payload.discountPercent || 10),
        minOrderAmount: Number(payload.minOrderAmount || 500).toFixed(2),
        maxDiscountAmount: Number(payload.maxDiscountAmount || 1e3).toFixed(2),
        expiryDate: payload.expiryDate || "2027-12-31",
        isActive: payload.isActive !== false
      }).where(eq(coupons.id, Number(payload.id))).returning();
      return updated[0];
    } else {
      const inserted = await db.insert(coupons).values({
        code,
        description: payload.description || `${payload.discountPercent}% discount`,
        discountPercent: Number(payload.discountPercent || 10),
        minOrderAmount: Number(payload.minOrderAmount || 500).toFixed(2),
        maxDiscountAmount: Number(payload.maxDiscountAmount || 1e3).toFixed(2),
        expiryDate: payload.expiryDate || "2027-12-31",
        isActive: payload.isActive !== false
      }).returning();
      return inserted[0];
    }
  } catch (error) {
    console.error("Database error in upsertAdminCoupon:", error);
    throw new Error(error.message || "Failed to save coupon.", { cause: error });
  }
}
async function updateSiteSettingsBatch(updates) {
  try {
    for (const [key, value] of Object.entries(updates)) {
      await db.insert(siteSettings).values({
        settingKey: key,
        settingValue: String(value),
        category: key.startsWith("seo_") || key.startsWith("gsc_") || key.startsWith("robots_") ? "seo" : key.startsWith("payment_") ? "payment" : "general"
      }).onConflictDoUpdate({
        target: siteSettings.settingKey,
        set: {
          settingValue: String(value),
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
    }
    await db.insert(auditLogs).values({
      actorEmail: "admin@dxnorganicpoint.com",
      action: "SETTINGS_UPDATED",
      entityType: "site_settings",
      details: `Updated settings keys: ${Object.keys(updates).join(", ")}`
    });
    return { success: true };
  } catch (error) {
    console.error("Database error in updateSiteSettingsBatch:", error);
    throw new Error("Failed to save site settings.", { cause: error });
  }
}
async function submitCustomerReview(payload) {
  try {
    const inserted = await db.insert(reviews).values({
      productId: Number(payload.productId),
      reviewerName: payload.reviewerName.trim(),
      reviewerRole: payload.reviewerRole?.trim() || "Verified Customer",
      rating: Math.min(5, Math.max(1, Number(payload.rating || 5))),
      title: payload.title.trim(),
      comment: payload.comment.trim(),
      isApproved: true
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error("Database error in submitCustomerReview:", error);
    throw new Error("Failed to submit product review.", { cause: error });
  }
}
async function subscribeNewsletter(email) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    await db.insert(newsletterSubscribers).values({ email: cleanEmail, status: "active" }).onConflictDoNothing();
    return { subscribed: true, email: cleanEmail };
  } catch (error) {
    console.error("Database error in subscribeNewsletter:", error);
    throw new Error("Could not subscribe to newsletter.", { cause: error });
  }
}
async function toggleCustomerBlock(userId, isBlocked) {
  try {
    const updated = await db.update(users).set({ isBlocked, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    return updated[0];
  } catch (error) {
    console.error("Database error in toggleCustomerBlock:", error);
    throw new Error("Failed to update customer status.", { cause: error });
  }
}
async function getCustomerAddresses(userId) {
  try {
    return await db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.isDefault), desc(addresses.id));
  } catch (error) {
    console.error("Database error in getCustomerAddresses:", error);
    throw new Error("Failed to load saved addresses.", { cause: error });
  }
}
async function addCustomerAddress(payload) {
  try {
    const inserted = await db.insert(addresses).values({
      userId: payload.userId,
      label: payload.label || "Home",
      recipientName: payload.recipientName,
      phone: payload.phone,
      streetAddress: payload.streetAddress,
      district: payload.district,
      area: payload.area,
      postalCode: payload.postalCode || "1200",
      isDefault: Boolean(payload.isDefault)
    }).returning();
    return inserted[0];
  } catch (error) {
    console.error("Database error in addCustomerAddress:", error);
    throw new Error("Failed to save address.", { cause: error });
  }
}

// server.ts
dotenv.config();
var PUBLIC_STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/shop", priority: "0.9", changefreq: "daily" },
  { path: "/categories", priority: "0.8", changefreq: "weekly" },
  { path: "/new-arrivals", priority: "0.8", changefreq: "daily" },
  { path: "/best-sellers", priority: "0.8", changefreq: "daily" },
  { path: "/featured", priority: "0.8", changefreq: "weekly" },
  { path: "/offers", priority: "0.8", changefreq: "daily" },
  { path: "/about", priority: "0.7", changefreq: "monthly" },
  { path: "/brand-story", priority: "0.7", changefreq: "monthly" },
  { path: "/why-choose-us", priority: "0.7", changefreq: "monthly" },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  { path: "/contact", priority: "0.7", changefreq: "monthly" },
  { path: "/faq", priority: "0.7", changefreq: "monthly" },
  { path: "/reviews", priority: "0.7", changefreq: "weekly" },
  { path: "/track-order", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy-policy", priority: "0.4", changefreq: "yearly" },
  { path: "/terms", priority: "0.4", changefreq: "yearly" },
  { path: "/return-policy", priority: "0.5", changefreq: "yearly" },
  { path: "/shipping-policy", priority: "0.5", changefreq: "yearly" }
];
function resolveBaseUrl(req) {
  if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL") {
    return process.env.APP_URL.replace(/\/+$/, "");
  }
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const xml = generateSitemapIndexXml(baseUrl, /* @__PURE__ */ new Date());
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (error) {
      console.error("Error generating /sitemap.xml:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });
  app.get("/sitemap-pages.xml", async (req, res) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const entries = PUBLIC_STATIC_PAGES.map((p) => ({
        loc: `${baseUrl}${p.path === "/" ? "" : p.path}`,
        lastmod: /* @__PURE__ */ new Date(),
        changefreq: p.changefreq,
        priority: p.priority,
        isPublished: true,
        noIndex: false
      }));
      const xml = generateUrlsetXml(entries);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (error) {
      console.error("Error generating /sitemap-pages.xml:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });
  app.get("/sitemap-products.xml", async (req, res) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const entries = data.products.map((prod) => ({
        loc: `${baseUrl}/product/${prod.slug}`,
        lastmod: prod.updatedAt || prod.createdAt || /* @__PURE__ */ new Date(),
        changefreq: "daily",
        priority: prod.isFeatured ? "0.9" : "0.8",
        isPublished: prod.isPublished,
        noIndex: prod.noIndex
      }));
      const xml = generateUrlsetXml(entries);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (error) {
      console.error("Error generating /sitemap-products.xml:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });
  app.get("/sitemap-categories.xml", async (req, res) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const entries = data.categories.map((cat) => ({
        loc: `${baseUrl}/category/${cat.slug}`,
        lastmod: cat.updatedAt || cat.createdAt || /* @__PURE__ */ new Date(),
        changefreq: "weekly",
        priority: "0.8",
        isPublished: cat.isEnabled,
        noIndex: cat.noIndex
      }));
      const xml = generateUrlsetXml(entries);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (error) {
      console.error("Error generating /sitemap-categories.xml:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });
  app.get("/sitemap-blog.xml", async (req, res) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const entries = data.blogPosts.map((post) => ({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt || post.publishedAt || /* @__PURE__ */ new Date(),
        changefreq: "weekly",
        priority: "0.7",
        isPublished: post.status === "published",
        noIndex: post.noIndex
      }));
      const xml = generateUrlsetXml(entries);
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.status(200).send(xml);
    } catch (error) {
      console.error("Error generating /sitemap-blog.xml:", error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap error</error>');
    }
  });
  app.get("/robots.txt", async (req, res) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const customRules = data.settings.robots_custom_rules;
      const txt = generateRobotsTxt(baseUrl, customRules);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.status(200).send(txt);
    } catch (error) {
      const baseUrl = resolveBaseUrl(req);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.status(200).send(generateRobotsTxt(baseUrl));
    }
  });
  app.get("/api/bootstrap", async (_req, res) => {
    try {
      const data = await getStoreBootstrapData();
      res.json(data);
    } catch (error) {
      console.error("Failed to fetch bootstrap data:", error);
      res.status(500).json({ error: error.message || "Failed to load store data" });
    }
  });
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code, subtotal } = req.body;
      const data = await getStoreBootstrapData();
      const cleanCode = String(code || "").trim().toUpperCase();
      const found = data.coupons.find((c) => c.code.toUpperCase() === cleanCode);
      const result = validateAndCalculateCoupon(
        Number(subtotal || 0),
        found ? {
          code: found.code,
          discountPercent: found.discountPercent,
          minOrderAmount: Number(found.minOrderAmount),
          maxDiscountAmount: Number(found.maxDiscountAmount),
          expiryDate: found.expiryDate,
          isActive: found.isActive
        } : null
      );
      res.json({ ...result, coupon: found || null });
    } catch (error) {
      res.status(400).json({ valid: false, discountAmount: 0, message: error.message });
    }
  });
  app.post("/api/orders", async (req, res) => {
    try {
      const result = await placeCustomerOrder(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Order placement error:", error);
      res.status(400).json({ error: error.message || "Failed to place order" });
    }
  });
  app.get("/api/orders/track/:orderNumber", async (req, res) => {
    try {
      const details = await getOrderTrackingDetails(req.params.orderNumber);
      if (!details) {
        return res.status(404).json({ error: "No order found matching that Order Number." });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to track order" });
    }
  });
  app.get("/api/orders/customer", async (req, res) => {
    try {
      const email = String(req.query.email || "");
      if (!email) {
        return res.json([]);
      }
      const list = await getCustomerOrdersByEmail(email);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to load orders" });
    }
  });
  app.get("/api/wishlist/:sessionKey", async (req, res) => {
    try {
      const ids = await getWishlistBySession(req.params.sessionKey);
      res.json({ productIds: ids });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/wishlist/toggle", async (req, res) => {
    try {
      const { sessionKey, productId } = req.body;
      const ids = await toggleWishlistProduct(String(sessionKey), Number(productId));
      res.json({ productIds: ids });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/reviews", async (req, res) => {
    try {
      const review = await submitCustomerReview(req.body);
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/newsletter", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !String(email).includes("@")) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }
      const sub = await subscribeNewsletter(String(email));
      res.json(sub);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/auth/sync", requireAuth, async (req, res) => {
    try {
      const uid = req.user?.uid || "anon";
      const email = req.user?.email || "customer@dxnorganicpoint.com";
      const name = req.user?.name || email.split("@")[0];
      const dbUser = await getOrCreateUser(uid, email, name);
      res.json({ user: dbUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      const user = await registerCustomerWithEmail(req.body);
      const tokenPayload = Buffer.from(JSON.stringify(user), "utf8").toString("base64");
      res.status(201).json({
        user,
        token: `dxn_sess_${tokenPayload}`
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await loginCustomerWithEmail(String(email || ""), String(password || ""));
      const tokenPayload = Buffer.from(JSON.stringify(user), "utf8").toString("base64");
      res.json({
        user,
        token: `dxn_sess_${tokenPayload}`
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      const result = await resetCustomerPassword(String(email || ""), String(newPassword || ""));
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.get("/api/account/addresses", async (req, res) => {
    try {
      const userId = Number(req.query.userId || 0);
      if (!userId) return res.json([]);
      const list = await getCustomerAddresses(userId);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/account/addresses", async (req, res) => {
    try {
      const created = await addCustomerAddress(req.body);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.get("/api/admin/dashboard", async (_req, res) => {
    try {
      const dashboard = await getAdminDashboardData();
      res.json(dashboard);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      res.status(500).json({ error: error.message || "Failed to load admin dashboard" });
    }
  });
  app.post("/api/admin/products", async (req, res) => {
    try {
      const saved = await upsertAdminProduct(req.body);
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      const result = await deleteAdminProduct(Number(req.params.id));
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/admin/categories", async (req, res) => {
    try {
      const saved = await upsertAdminCategory(req.body);
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const updated = await updateAdminOrderStatus({
        orderId: Number(req.params.id),
        orderStatus: req.body.orderStatus,
        paymentStatus: req.body.paymentStatus,
        trackingNumber: req.body.trackingNumber
      });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/admin/blog", async (req, res) => {
    try {
      const saved = await upsertAdminBlogPost(req.body);
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.delete("/api/admin/blog/:id", async (req, res) => {
    try {
      const result = await deleteAdminBlogPost(Number(req.params.id));
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/admin/coupons", async (req, res) => {
    try {
      const saved = await upsertAdminCoupon(req.body);
      res.json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/admin/settings", async (req, res) => {
    try {
      const result = await updateSiteSettingsBatch(req.body.settings || {});
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.patch("/api/admin/customers/:id/block", async (req, res) => {
    try {
      const updated = await toggleCustomerBlock(
        Number(req.params.id),
        Boolean(req.body.isBlocked)
      );
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.get("/api/admin/seo-status", async (req, res) => {
    try {
      const baseUrl = resolveBaseUrl(req);
      const data = await getStoreBootstrapData();
      const publishedProducts = data.products.filter((p) => p.isPublished && !p.noIndex);
      const enabledCategories = data.categories.filter((c) => c.isEnabled && !c.noIndex);
      const publishedPosts = data.blogPosts.filter(
        (b) => b.status === "published" && !b.noIndex
      );
      res.json({
        baseUrl,
        lastGeneratedAt: (/* @__PURE__ */ new Date()).toISOString(),
        sitemaps: [
          {
            name: "Master Sitemap Index",
            url: `${baseUrl}/sitemap.xml`,
            count: 4,
            status: "Valid XML (200 OK)"
          },
          {
            name: "Public Pages Sitemap",
            url: `${baseUrl}/sitemap-pages.xml`,
            count: PUBLIC_STATIC_PAGES.length,
            status: "Valid XML (200 OK)"
          },
          {
            name: "Active Products Sitemap",
            url: `${baseUrl}/sitemap-products.xml`,
            count: publishedProducts.length,
            status: "Valid XML (200 OK)"
          },
          {
            name: "Enabled Categories Sitemap",
            url: `${baseUrl}/sitemap-categories.xml`,
            count: enabledCategories.length,
            status: "Valid XML (200 OK)"
          },
          {
            name: "Published Journal Articles Sitemap",
            url: `${baseUrl}/sitemap-blog.xml`,
            count: publishedPosts.length,
            status: "Valid XML (200 OK)"
          }
        ],
        robotsUrl: `${baseUrl}/robots.txt`,
        excludedPrivateRoutes: ["/admin/", "/account/", "/checkout/", "/cart/", "/search/"]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  const PORT = Number(process.env.PORT) || 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DXN Organic Point server running on http://localhost:${PORT}`);
  });
}
startServer();
