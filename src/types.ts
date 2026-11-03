export interface ProductVariant {
  id: number;
  productId: number;
  variantName: string;
  sku: string;
  price: string;
  stockQuantity: number;
  weight?: string;
}

export interface ProductGalleryImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

export interface ProductReview {
  id: number;
  productId: number;
  reviewerName: string;
  reviewerRole: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  regularPrice: string;
  discountedPrice: string | null;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  subcategory: string | null;
  weight: string;
  availability: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isSpecialOffer: boolean;
  isPublished: boolean;
  primaryImage: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  tags: string;
  salesCount: number;
  variants: ProductVariant[];
  gallery: ProductGalleryImage[];
  reviews: ProductReview[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  sortOrder: number;
  isEnabled: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  blogCategoryId: number | null;
  categoryName: string;
  categorySlug: string;
  authorName: string;
  status: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  noIndex: boolean;
  readTimeMinutes: number;
  publishedAt: string;
  updatedAt?: string;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Testimonial {
  id: number;
  customerName: string;
  customerRole: string;
  organizationOrCity: string;
  statement: string;
  productPurchased: string;
  rating: number;
  isVisible: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discountPercent: number;
  minOrderAmount: string;
  maxDiscountAmount: string;
  expiryDate: string;
  isActive: boolean;
  usageCount: number;
}

export interface ShippingZone {
  id: number;
  zoneName: string;
  districtsIncluded: string;
  deliveryCharge: string;
  freeShippingThreshold: string;
  estimatedDays: string;
  isActive: boolean;
}

export interface StoreBootstrapData {
  categories: Category[];
  products: Product[];
  banners: Banner[];
  testimonials: Testimonial[];
  reviews: ProductReview[];
  blogPosts: BlogPost[];
  blogCategories: Array<{ id: number; name: string; slug: string; description?: string }>;
  coupons: Coupon[];
  shippingZones: ShippingZone[];
  settings: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variantName: string;
  unitPrice: number;
}

export interface CustomerUser {
  id?: number;
  uid: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}
