import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  ArrowRight,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Clock,
  Star,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  Product,
  Category,
  BlogPost,
  StoreBootstrapData,
  CartItem,
  CustomerUser,
} from '../types.ts';
import { BotanicalImage } from './BotanicalImage.tsx';
import {
  calculateOrderTotals,
  validateAndCalculateCoupon,
} from '../utils/commerceRules.ts';

const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Gazipur',
  'Narayanganj',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Cumilla',
  'Bogura',
  'Cox’s Bazar',
  'Jashore',
  'Dinajpur',
  'Tangail',
  'Faridpur',
  'Brahmanbaria',
  'Noakhali',
  'Pabna',
  'Kushtia',
  'Savar',
];

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, qty?: number, variantName?: string) => void;
  onToggleWishlist: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
}) => {
  const activePrice =
    product.discountedPrice && Number(product.discountedPrice) > 0
      ? Number(product.discountedPrice)
      : Number(product.regularPrice);
  const hasDiscount =
    product.discountedPrice &&
    Number(product.discountedPrice) > 0 &&
    Number(product.discountedPrice) < Number(product.regularPrice);

  return (
    <article className="group bg-white border border-[#A8B9A0]/35 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="relative">
          <button
            type="button"
            onClick={() => onNavigate(`/product/${product.slug}`)}
            className="block w-full text-left focus:outline-none"
            aria-label={`View details for ${product.name}`}
          >
            <BotanicalImage
              src={product.primaryImage}
              alt={product.name}
              aspectClass="aspect-[4/3]"
              fallbackTitle={product.name}
            />
          </button>
          <button
            type="button"
            onClick={() => onToggleWishlist(product.id)}
            aria-label={
              isWishlisted
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isWishlisted
                ? 'bg-[#173D32] text-[#F8F6EF]'
                : 'bg-white/90 text-[#252B27] hover:bg-[#173D32] hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="p-5">
          {/* Clean unboxed metadata with typographic separators (Zero-Pill Rule) */}
          <div className="flex items-center gap-1.5 text-xs text-[#245B45] mb-1.5">
            <span>{product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.weight}</span>
            <span aria-hidden="true">·</span>
            <span>
              {product.stockQuantity > 0
                ? product.stockQuantity <= 5
                  ? `Only ${product.stockQuantity} left`
                  : 'In Stock'
                : 'Out of Stock'}
            </span>
          </div>

          <h3 className="text-base font-semibold text-[#252B27] leading-snug mb-1.5">
            <button
              type="button"
              onClick={() => onNavigate(`/product/${product.slug}`)}
              className="text-left hover:text-[#173D32] transition-colors"
            >
              {product.name}
            </button>
          </h3>

          <p className="text-xs text-[#252B27]/75 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-[#F8F6EF] flex items-center justify-between gap-3">
        <div className="font-mono-tabular">
          <span className="text-base font-semibold text-[#173D32]">
            ৳{activePrice.toLocaleString('en-BD')}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[#252B27]/45 line-through ml-2">
              ৳{Number(product.regularPrice).toLocaleString('en-BD')}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={product.stockQuantity <= 0}
          onClick={() => onAddToCart(product, 1)}
          aria-label={`Add ${product.name} to cart`}
          className="px-3.5 py-2 text-xs font-medium bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{product.stockQuantity > 0 ? 'Add to Cart' : 'Sold Out'}</span>
        </button>
      </div>
    </article>
  );
};

export const HomePageView: React.FC<{
  data: StoreBootstrapData;
  wishlistIds: number[];
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, qty?: number) => void;
  onToggleWishlist: (productId: number) => void;
}> = ({ data, wishlistIds, onNavigate, onAddToCart, onToggleWishlist }) => {
  const [collectionFilter, setCollectionFilter] = useState<
    'featured' | 'best_sellers' | 'new_arrivals' | 'offers'
  >('featured');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');

  const publishedProducts = useMemo(
    () => data.products.filter((p) => p.isPublished),
    [data.products]
  );

  const displayedProducts = useMemo(() => {
    if (collectionFilter === 'best_sellers') {
      return publishedProducts.filter((p) => p.isBestSeller).slice(0, 6);
    }
    if (collectionFilter === 'new_arrivals') {
      return publishedProducts.filter((p) => p.isNewArrival).slice(0, 6);
    }
    if (collectionFilter === 'offers') {
      return publishedProducts.filter((p) => p.isSpecialOffer).slice(0, 6);
    }
    return publishedProducts.filter((p) => p.isFeatured).slice(0, 6);
  }, [publishedProducts, collectionFilter]);

  const heroBanner = data.banners.find((b) => b.position === 'hero' && b.isActive) || {
    title: 'Botanical Skincare & Mindful Daily Wellness',
    subtitle:
      'Authentic DXN formulations crafted with Ganoderma, Aloe Vera, and plant-based botanicals—delivered across all 64 districts of Bangladesh.',
    ctaText: 'Shop All Products',
    ctaLink: '/shop',
    imageUrl: publishedProducts[0]?.primaryImage || '',
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.includes('@')) {
      setNewsletterMsg('Please enter a valid email address.');
      return;
    }
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (res.ok) {
        setNewsletterMsg('Thank you for joining the DXN Organic Point journal.');
        setNewsletterEmail('');
      } else {
        setNewsletterMsg('Could not subscribe right now. Please try again.');
      }
    } catch {
      setNewsletterMsg('Could not subscribe right now.');
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* 1. Split-Screen Storefront Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-[#173D32] text-[#F8F6EF] rounded-2xl overflow-hidden border border-[#245B45]">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="text-xs tracking-wider text-[#C6A76A] font-medium">
                  Authentic Botanical Retail · Dhaka & Nationwide Bangladesh
                </div>
                <h1
                  className="font-serif-display text-[#F8F6EF] font-semibold tracking-tight leading-[1.12]"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
                >
                  {heroBanner.title}
                </h1>
                <p className="text-base sm:text-lg text-[#F8F6EF]/85 max-w-xl leading-relaxed">
                  {heroBanner.subtitle}
                </p>
              </div>

              <div className="pt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('/shop')}
                  className="px-6 py-3.5 text-sm font-semibold bg-[#C6A76A] text-[#173D32] rounded-lg hover:bg-[#d4b87e] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/categories')}
                  className="px-6 py-3.5 text-sm font-medium border border-[#A8B9A0]/40 text-[#F8F6EF] rounded-lg hover:bg-[#245B45] transition-colors whitespace-nowrap shrink-0"
                >
                  Browse 16 Categories
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full bg-[#245B45]">
              <BotanicalImage
                src={heroBanner.imageUrl}
                alt={heroBanner.title}
                aspectClass="h-full w-full min-h-[320px]"
                className="lg:h-full object-cover"
              />
            </div>
          </div>

          {/* Full-width 4-column Fulfillment & Authenticity Strip below Hero Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#245B45] bg-[#123128]/90 divide-y sm:divide-y-0 sm:divide-x divide-[#245B45]">
            <div className="p-5 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-[#C6A76A] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-[#F8F6EF]">
                  100% Factory-Sealed Batches
                </div>
                <div className="text-xs text-[#A8B9A0] mt-0.5">
                  Verified batch codes & expiry dates
                </div>
              </div>
            </div>
            <div className="p-5 flex items-start gap-3.5">
              <Truck className="w-5 h-5 text-[#C6A76A] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-[#F8F6EF]">
                  All 64 Districts Delivery
                </div>
                <div className="text-xs text-[#A8B9A0] mt-0.5">
                  ৳70 Inside Dhaka · Free over ৳2,500
                </div>
              </div>
            </div>
            <div className="p-5 flex items-start gap-3.5">
              <Clock className="w-5 h-5 text-[#C6A76A] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-[#F8F6EF]">
                  24–48 Hour Dhaka Dispatch
                </div>
                <div className="text-xs text-[#A8B9A0] mt-0.5">
                  Climate-controlled Banani hub
                </div>
              </div>
            </div>
            <div className="p-5 flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-[#C6A76A] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-[#F8F6EF]">
                  Flexible Bangladesh Checkout
                </div>
                <div className="text-xs text-[#A8B9A0] mt-0.5">
                  Cash on Delivery, bKash, Nagad & SSLCommerz
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Botanical & Wellness Collection (3-Column Grid with Interactive Filter Tabs) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-xs text-[#245B45] font-medium mb-1">
              Curated Botanical Formulations
            </div>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
              Signature DXN Essentials
            </h2>
          </div>

          {/* Interactive segmented filter control */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EAE4D3] rounded-lg self-start">
            {[
              { id: 'featured', label: 'Featured' },
              { id: 'best_sellers', label: 'Best Sellers' },
              { id: 'new_arrivals', label: 'New Arrivals' },
              { id: 'offers', label: 'Special Offers' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCollectionFilter(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  collectionFilter === tab.id
                    ? 'bg-[#173D32] text-[#F8F6EF] shadow-xs'
                    : 'text-[#252B27] hover:text-[#173D32]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onNavigate={onNavigate}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => onNavigate('/shop')}
            className="px-6 py-3 text-sm font-medium border border-[#173D32] text-[#173D32] rounded-lg hover:bg-[#173D32] hover:text-[#F8F6EF] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <span>View Complete Catalog ({publishedProducts.length} Products)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. Shop by Category Showcase */}
      <section className="bg-white border-y border-[#A8B9A0]/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs text-[#245B45] font-medium mb-1">
                16 Specialized Departments
              </div>
              <h2 className="font-serif-display text-3xl font-semibold text-[#173D32]">
                Explore by Category
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/categories')}
              className="text-sm font-medium text-[#173D32] hover:text-[#245B45] flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap shrink-0"
            >
              <span>All 16 Categories</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.categories
              .filter((c) => c.isEnabled)
              .slice(0, 8)
              .map((cat) => {
                const count = publishedProducts.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onNavigate(`/category/${cat.slug}`)}
                    className="group text-left bg-[#F8F6EF] border border-[#A8B9A0]/35 rounded-xl overflow-hidden hover:border-[#173D32] transition-all flex flex-col justify-between"
                  >
                    <BotanicalImage
                      src={cat.imageUrl || ''}
                      alt={cat.name}
                      aspectClass="aspect-[16/10]"
                      fallbackTitle={cat.name}
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-[#173D32] group-hover:text-[#245B45]">
                          {cat.name}
                        </h3>
                        <span className="text-xs font-mono-tabular text-[#245B45]">
                          {count} items
                        </span>
                      </div>
                      <p className="text-xs text-[#252B27]/75 mt-1 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      {/* 4. Craftsmanship, Authenticity & Attributable Customer Proof (Claim-to-Proof Adjacency) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 bg-[#173D32] text-[#F8F6EF] p-8 sm:p-10 rounded-2xl space-y-6">
            <div className="text-xs text-[#C6A76A] font-medium">
              Our Commitment to Bangladesh Households
            </div>
            <h2 className="font-serif-display text-3xl font-semibold leading-tight">
              Why Discerning Buyers Choose DXN Organic Point
            </h2>
            <p className="text-sm text-[#F8F6EF]/85 leading-relaxed">
              {data.settings.about_content}
            </p>
            <div className="space-y-3 pt-2 border-t border-[#245B45] text-xs text-[#A8B9A0]">
              <div>01. Climate-controlled storage in Banani, Dhaka</div>
              <div>02. Tamper-evident original factory seals on every unit</div>
              <div>03. Transparent BDT pricing with nationwide Steadfast/Pathao courier</div>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/why-choose-us')}
                className="px-4 py-2.5 text-xs font-semibold bg-[#C6A76A] text-[#173D32] rounded-lg hover:bg-[#d4b87e] transition-colors whitespace-nowrap shrink-0"
              >
                Read Quality Standards
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/brand-story')}
                className="px-4 py-2.5 text-xs font-medium border border-[#A8B9A0]/40 text-[#F8F6EF] rounded-lg hover:bg-[#245B45] transition-colors whitespace-nowrap shrink-0"
              >
                Our Brand Story
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-[#245B45] font-medium">
                  Verified Client Experiences
                </div>
                <h3 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                  Household & Professional Testimonials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/reviews')}
                className="text-xs font-medium text-[#173D32] hover:underline whitespace-nowrap shrink-0"
              >
                All Customer Reviews
              </button>
            </div>

            <div className="space-y-4">
              {data.testimonials
                .filter((t) => t.isVisible)
                .map((item) => (
                  <blockquote
                    key={item.id}
                    className="bg-white border border-[#A8B9A0]/35 rounded-xl p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-[#245B45]">
                      <span>Purchased: {item.productPurchased}</span>
                      <span className="font-mono-tabular">{item.rating}.0 / 5.0</span>
                    </div>
                    <p className="text-sm text-[#252B27] leading-relaxed">
                      “{item.statement}”
                    </p>
                    <footer className="text-xs text-[#252B27]/75 pt-1">
                      <strong className="font-semibold text-[#173D32]">
                        {item.customerName}
                      </strong>{' '}
                      · {item.customerRole} · {item.organizationOrCity}
                    </footer>
                  </blockquote>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Editorial Journal & Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-[#245B45] font-medium mb-1">
              Botanical Education & Usage Guides
            </div>
            <h2 className="font-serif-display text-3xl font-semibold text-[#173D32]">
              From the DXN Organic Point Journal
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/blog')}
            className="text-sm font-medium text-[#173D32] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>Read All Articles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {data.blogPosts
            .filter((b) => b.status === 'published')
            .slice(0, 3)
            .map((post) => (
              <article
                key={post.id}
                className="group bg-white border border-[#A8B9A0]/35 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/blog/${post.slug}`)}
                    className="block w-full text-left"
                  >
                    <BotanicalImage
                      src={post.featuredImage}
                      alt={post.title}
                      aspectClass="aspect-[16/10]"
                    />
                  </button>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#245B45]">
                      <span>{post.categoryName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readTimeMinutes} min read</span>
                    </div>
                    <h3 className="font-serif-display text-xl font-semibold text-[#173D32] leading-snug">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/blog/${post.slug}`)}
                        className="text-left hover:text-[#245B45]"
                      >
                        {post.title}
                      </button>
                    </h3>
                    <p className="text-xs text-[#252B27]/75 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/blog/${post.slug}`)}
                    className="text-xs font-semibold text-[#173D32] hover:text-[#245B45] flex items-center gap-1"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
        </div>

        {/* Newsletter Bar */}
        <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl space-y-2">
            <h3 className="font-serif-display text-2xl font-semibold text-[#173D32]">
              Receive Batch Arrival Alerts & Seasonal Privileges
            </h3>
            <p className="text-sm text-[#252B27]/80">
              Subscribe for notifications when fresh shipments of Ganozhi skincare, Lingzhi black
              coffee, and Morinzhi arrive at our Dhaka hub.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              className="px-4 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/60 rounded-lg focus:outline-none focus:border-[#173D32] min-w-[260px]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45] transition-colors whitespace-nowrap shrink-0"
            >
              Join Journal
            </button>
          </form>
        </div>
        {newsletterMsg && (
          <p className="text-xs font-medium text-[#173D32] text-right">{newsletterMsg}</p>
        )}
      </section>
    </div>
  );
};

export const CatalogView: React.FC<{
  mode: 'all' | 'new-arrivals' | 'best-sellers' | 'featured' | 'offers' | 'category' | 'search';
  categorySlug?: string;
  initialSearchQuery?: string;
  data: StoreBootstrapData;
  wishlistIds: number[];
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, qty?: number) => void;
  onToggleWishlist: (productId: number) => void;
}> = ({
  mode,
  categorySlug,
  initialSearchQuery = '',
  data,
  wishlistIds,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCatSlug, setSelectedCatSlug] = useState<string>(categorySlug || 'all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular'>(
    'featured'
  );

  // Keep categorySlug synced when navigating between categories
  React.useEffect(() => {
    if (mode === 'category' && categorySlug) {
      setSelectedCatSlug(categorySlug);
    } else if (mode !== 'category') {
      setSelectedCatSlug('all');
    }
  }, [mode, categorySlug]);

  const activeCategory = useMemo(
    () => data.categories.find((c) => c.slug === selectedCatSlug),
    [data.categories, selectedCatSlug]
  );

  const filteredProducts = useMemo(() => {
    let list = data.products.filter((p) => p.isPublished);

    if (mode === 'new-arrivals' || selectedCatSlug === 'new-arrivals') {
      list = list.filter((p) => p.isNewArrival);
    } else if (mode === 'best-sellers' || selectedCatSlug === 'best-sellers') {
      list = list.filter((p) => p.isBestSeller);
    } else if (mode === 'featured') {
      list = list.filter((p) => p.isFeatured);
    } else if (mode === 'offers' || selectedCatSlug === 'special-offers') {
      list = list.filter((p) => p.isSpecialOffer);
    } else if (selectedCatSlug && selectedCatSlug !== 'all') {
      list = list.filter((p) => p.categorySlug === selectedCatSlug);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.tags.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    if (sortBy === 'price-asc') {
      sorted.sort(
        (a, b) =>
          Number(a.discountedPrice || a.regularPrice) -
          Number(b.discountedPrice || b.regularPrice)
      );
    } else if (sortBy === 'price-desc') {
      sorted.sort(
        (a, b) =>
          Number(b.discountedPrice || b.regularPrice) -
          Number(a.discountedPrice || a.regularPrice)
      );
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => b.salesCount - a.salesCount);
    }

    return sorted;
  }, [data.products, mode, selectedCatSlug, searchQuery, sortBy]);

  const pageHeading = useMemo(() => {
    if (mode === 'category' && activeCategory) return activeCategory.name;
    if (mode === 'new-arrivals') return 'New Arrivals';
    if (mode === 'best-sellers') return 'Best Sellers';
    if (mode === 'featured') return 'Featured Collection';
    if (mode === 'offers') return 'Special Offers & Bundles';
    if (mode === 'search') return 'Search Catalog';
    return 'Shop All DXN Products';
  }, [mode, activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb & Header */}
      <div className="space-y-3 border-b border-[#A8B9A0]/35 pb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#245B45]">
          <button type="button" onClick={() => onNavigate('/')} className="hover:underline">
            Home
          </button>
          <span>/</span>
          <button type="button" onClick={() => onNavigate('/shop')} className="hover:underline">
            Shop
          </button>
          {mode !== 'all' && (
            <>
              <span>/</span>
              <span className="text-[#173D32] font-medium">{pageHeading}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
              {pageHeading}
            </h1>
            <p className="text-sm text-[#252B27]/80 mt-1 max-w-2xl">
              {activeCategory?.description ||
                'Authentic DXN personal care, skincare, and botanical wellness products with nationwide delivery across Bangladesh.'}
            </p>
          </div>
          <div className="text-xs font-mono-tabular text-[#245B45]">
            Showing {filteredProducts.length} products
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#A8B9A0]/35 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-5 relative">
          <label htmlFor="catalog-search" className="sr-only">
            Search products
          </label>
          <Search className="w-4 h-4 text-[#252B27]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="catalog-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, ingredient, or SKU..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg focus:outline-none focus:border-[#173D32]"
          />
        </div>

        <div className="md:col-span-4">
          <label htmlFor="catalog-category" className="sr-only">
            Filter by Category
          </label>
          <select
            id="catalog-category"
            value={selectedCatSlug}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCatSlug(val);
              if (val === 'all') onNavigate('/shop');
              else onNavigate(`/category/${val}`);
            }}
            className="w-full px-3.5 py-2 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg focus:outline-none focus:border-[#173D32]"
          >
            <option value="all">All Categories ({data.categories.length})</option>
            {data.categories
              .filter((c) => c.isEnabled)
              .map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="catalog-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3.5 py-2 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg focus:outline-none focus:border-[#173D32]"
          >
            <option value="featured">Sort: Featured First</option>
            <option value="popular">Sort: Best Selling</option>
            <option value="price-asc">Price: Low to High (BDT)</option>
            <option value="price-desc">Price: High to Low (BDT)</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#A8B9A0]/35 rounded-xl p-12 text-center space-y-4">
          <p className="font-serif-display text-2xl text-[#173D32]">
            No products matched your current filter
          </p>
          <p className="text-sm text-[#252B27]/75">
            Try clearing your search keyword or switching to all categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCatSlug('all');
              onNavigate('/shop');
            }}
            className="px-5 py-2.5 text-xs font-medium bg-[#173D32] text-[#F8F6EF] rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onNavigate={onNavigate}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductDetailView: React.FC<{
  product: Product;
  allProducts: Product[];
  isWishlisted: boolean;
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, qty: number, variantName?: string) => void;
  onToggleWishlist: (productId: number) => void;
  onRefreshStore: () => void;
}> = ({
  product,
  allProducts,
  isWishlisted,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  onRefreshStore,
}) => {
  const [selectedImage, setSelectedImage] = useState(product.primaryImage);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0]?.variantName || `Standard (${product.weight})`
  );
  const [quantity, setQuantity] = useState(1);
  const [reviewName, setReviewName] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewStatus, setReviewStatus] = useState('');

  React.useEffect(() => {
    setSelectedImage(product.primaryImage);
    setSelectedVariant(product.variants[0]?.variantName || `Standard (${product.weight})`);
    setQuantity(1);
  }, [product]);

  const activeVariantObj = product.variants.find((v) => v.variantName === selectedVariant);
  const unitPrice = activeVariantObj
    ? Number(activeVariantObj.price)
    : product.discountedPrice && Number(product.discountedPrice) > 0
    ? Number(product.discountedPrice)
    : Number(product.regularPrice);

  const relatedProducts = allProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.isPublished)
    .slice(0, 3);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          reviewerName: reviewName,
          rating: reviewRating,
          title: reviewTitle || 'Verified Purchase Experience',
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewName('');
        setReviewTitle('');
        setReviewComment('');
        setReviewStatus('Thank you! Your review has been published.');
        onRefreshStore();
      }
    } catch {
      setReviewStatus('Could not submit review right now.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#245B45]">
        <button type="button" onClick={() => onNavigate('/')} className="hover:underline">
          Home
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => onNavigate(`/category/${product.categorySlug}`)}
          className="hover:underline"
        >
          {product.categoryName}
        </button>
        <span>/</span>
        <span className="text-[#173D32] font-medium">{product.name}</span>
      </nav>

      {/* Contiguous Purchase Module (Sticky Gallery Left, Sticky Purchase Module Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-[#A8B9A0]/35 rounded-2xl overflow-hidden">
            <BotanicalImage
              src={selectedImage}
              alt={product.name}
              aspectClass="aspect-[4/3]"
              fallbackTitle={product.name}
            />
          </div>
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex items-center gap-3">
              {product.gallery.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`w-24 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === img.imageUrl
                      ? 'border-[#173D32]'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <BotanicalImage
                    src={img.imageUrl}
                    alt={img.altText}
                    aspectClass="aspect-[4/3]"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#245B45]">
              <span>{product.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>SKU: {product.sku}</span>
              <span aria-hidden="true">·</span>
              <span>
                {product.stockQuantity > 0
                  ? `In Stock (${product.stockQuantity} units)`
                  : 'Out of Stock'}
              </span>
            </div>

            <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
              {product.name}
            </h1>
          </div>

          <div className="flex items-baseline gap-3 font-mono-tabular border-y border-[#F8F6EF] py-4">
            <span className="text-2xl sm:text-3xl font-bold text-[#173D32]">
              ৳{unitPrice.toLocaleString('en-BD')}
            </span>
            {product.discountedPrice &&
              Number(product.discountedPrice) < Number(product.regularPrice) && (
                <span className="text-sm text-[#252B27]/50 line-through">
                  ৳{Number(product.regularPrice).toLocaleString('en-BD')}
                </span>
              )}
            <span className="text-xs text-[#245B45] ml-auto">
              Pack Weight: {product.weight}
            </span>
          </div>

          <p className="text-sm text-[#252B27]/85 leading-relaxed">{product.description}</p>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#173D32]">
                Select Pack Size / Option
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v.variantName)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      selectedVariant === v.variantName
                        ? 'bg-[#173D32] text-[#F8F6EF] border-[#173D32]'
                        : 'bg-[#F8F6EF] text-[#252B27] border-[#A8B9A0]/50 hover:border-[#173D32]'
                    }`}
                  >
                    {v.variantName} — ৳{Number(v.price).toLocaleString('en-BD')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Primary Purchase CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-[#A8B9A0]/60 rounded-lg bg-[#F8F6EF]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="p-2.5 text-[#173D32] hover:bg-[#EAE4D3] rounded-l-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-mono-tabular font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stockQuantity || 10, q + 1))}
                aria-label="Increase quantity"
                className="p-2.5 text-[#173D32] hover:bg-[#EAE4D3] rounded-r-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={product.stockQuantity <= 0}
              onClick={() => onAddToCart(product, quantity, selectedVariant)}
              className="flex-1 min-w-[160px] px-6 py-3 text-sm font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart · ৳{(unitPrice * quantity).toLocaleString('en-BD')}</span>
            </button>

            <button
              type="button"
              disabled={product.stockQuantity <= 0}
              onClick={() => {
                onAddToCart(product, quantity, selectedVariant);
                onNavigate('/checkout');
              }}
              className="px-5 py-3 text-sm font-semibold bg-[#C6A76A] text-[#173D32] rounded-lg hover:bg-[#d4b87e] transition-colors whitespace-nowrap shrink-0"
            >
              Buy Now
            </button>

            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              aria-label={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
              className={`p-3 rounded-lg border transition-colors ${
                isWishlisted
                  ? 'bg-[#173D32] text-[#F8F6EF] border-[#173D32]'
                  : 'border-[#A8B9A0]/60 text-[#173D32] hover:bg-[#F8F6EF]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="bg-[#F8F6EF] rounded-xl p-4 space-y-2 text-xs text-[#252B27]/80">
            <div>
              <strong className="text-[#173D32]">Dhaka Metro Delivery:</strong> ৳70 (24–48 Hours) ·{' '}
              <strong className="text-[#173D32]">Nationwide Courier:</strong> ৳130 (Free on orders
              over ৳2,500)
            </div>
            <div>
              <strong className="text-[#173D32]">Authenticity Guarantee:</strong> Factory-sealed DXN
              packaging with verifiable batch stamp.
            </div>
          </div>
        </div>
      </div>

      {/* Verified Customer Reviews & Write Review Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-t border-[#A8B9A0]/35 pt-12">
        <div className="lg:col-span-7 space-y-6">
          <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
            Customer Reviews ({product.reviews?.length || 0})
          </h2>
          {!product.reviews || product.reviews.length === 0 ? (
            <p className="text-sm text-[#252B27]/70">
              No reviews published for this product yet. Share your experience using the form.
            </p>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-[#A8B9A0]/35 rounded-xl p-5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-[#245B45]">
                    <span className="font-semibold text-[#173D32]">{rev.reviewerName}</span>
                    <span>
                      {rev.reviewerRole} · {rev.rating}/5 Stars
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#252B27]">{rev.title}</h3>
                  <p className="text-xs text-[#252B27]/80 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-[#A8B9A0]/35 rounded-xl p-6 space-y-4">
          <h3 className="font-serif-display text-xl font-semibold text-[#173D32]">
            Write a Customer Review
          </h3>
          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <div>
              <label htmlFor="rev-name" className="block text-xs font-medium mb-1">
                Your Full Name
              </label>
              <input
                id="rev-name"
                type="text"
                required
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="e.g. Farhana Rahman"
                className="w-full px-3.5 py-2 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rev-rating" className="block text-xs font-medium mb-1">
                  Rating
                </label>
                <select
                  id="rev-rating"
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                >
                  <option value={5}>5 Stars — Excellent</option>
                  <option value={4}>4 Stars — Good</option>
                  <option value={3}>3 Stars — Average</option>
                </select>
              </div>
              <div>
                <label htmlFor="rev-title" className="block text-xs font-medium mb-1">
                  Review Headline
                </label>
                <input
                  id="rev-title"
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summary of experience"
                  className="w-full px-3 py-2 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label htmlFor="rev-comment" className="block text-xs font-medium mb-1">
                Detailed Feedback
              </label>
              <textarea
                id="rev-comment"
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share how you use this product..."
                className="w-full px-3.5 py-2 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45]"
            >
              Submit Verified Review
            </button>
            {reviewStatus && (
              <p className="text-xs font-medium text-[#245B45] pt-1">{reviewStatus}</p>
            )}
          </form>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 border-t border-[#A8B9A0]/35 pt-12">
          <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
            Complementary Products in {product.categoryName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                isWishlisted={false}
                onNavigate={onNavigate}
                onAddToCart={(p, q) => onAddToCart(p, q || 1)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CheckoutAndCartView: React.FC<{
  mode: 'cart' | 'checkout';
  cart: CartItem[];
  data: StoreBootstrapData;
  currentUser: CustomerUser | null;
  onUpdateQty: (productId: number, variantName: string, delta: number) => void;
  onRemoveItem: (productId: number, variantName: string) => void;
  onClearCart: () => void;
  onNavigate: (path: string) => void;
  onOrderSuccess: (orderNum: string) => void;
}> = ({
  mode,
  cart,
  data,
  currentUser,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onNavigate,
  onOrderSuccess,
}) => {
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('Gulshan');
  const [postalCode, setPostalCode] = useState('1212');
  const [orderNotes, setOrderNotes] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<
    'cod' | 'bkash' | 'nagad' | 'rocket' | 'sslcommerz' | 'bank_transfer'
  >('cod');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  const matchedCoupon = useMemo(() => {
    if (!appliedCouponCode) return null;
    const found = data.coupons.find(
      (c) => c.code.toUpperCase() === appliedCouponCode.toUpperCase()
    );
    if (!found) return null;
    return {
      code: found.code,
      discountPercent: found.discountPercent,
      minOrderAmount: Number(found.minOrderAmount),
      maxDiscountAmount: Number(found.maxDiscountAmount),
      expiryDate: found.expiryDate,
      isActive: found.isActive,
    };
  }, [appliedCouponCode, data.coupons]);

  const totals = useMemo(() => {
    return calculateOrderTotals({
      items: cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        sku: c.product.sku,
        unitPrice: c.unitPrice,
        quantity: c.quantity,
        variantName: c.variantName,
      })),
      district,
      coupon: matchedCoupon,
      freeShippingThreshold: 2500,
    });
  }, [cart, district, matchedCoupon]);

  const handleApplyCoupon = () => {
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;
    const found = data.coupons.find((c) => c.code.toUpperCase() === clean);
    const check = validateAndCalculateCoupon(
      totals.subtotal,
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
    if (check.valid) {
      setAppliedCouponCode(clean);
      setErrorMsg('');
    } else {
      setAppliedCouponCode('');
      setErrorMsg(check.message);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Please fill in your full name, phone number, and delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || null,
          customerName,
          customerEmail: customerEmail || 'guest@dxnorganicpoint.com',
          customerPhone,
          deliveryAddress,
          district,
          area,
          postalCode,
          orderNotes,
          couponCode: appliedCouponCode || undefined,
          paymentMethod,
          senderNumber,
          transactionId,
          items: cart.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
            variantName: c.variantName,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Could not place order.');
      } else {
        setConfirmedOrder(json.order);
        onClearCart();
        onOrderSuccess(json.order.orderNumber);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while placing order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white border border-[#173D32] rounded-2xl p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3 text-[#173D32]">
            <CheckCircle2 className="w-8 h-8 text-[#245B45]" />
            <div>
              <div className="text-xs font-medium text-[#245B45]">
                Order Saved to PostgreSQL Database
              </div>
              <h1 className="font-serif-display text-3xl font-semibold">
                Order {confirmedOrder.orderNumber} Confirmed
              </h1>
            </div>
          </div>

          <p className="text-sm text-[#252B27]/80">
            Thank you, <strong>{confirmedOrder.customerName}</strong>. Your order has been
            registered in our Dhaka fulfillment system and inventory has been reserved.
          </p>

          <div className="bg-[#F8F6EF] rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#252B27]/60">Order Number</div>
              <div className="font-mono-tabular font-semibold text-[#173D32] mt-0.5">
                {confirmedOrder.orderNumber}
              </div>
            </div>
            <div>
              <div className="text-[#252B27]/60">Courier Tracking</div>
              <div className="font-mono-tabular font-semibold text-[#173D32] mt-0.5">
                {confirmedOrder.trackingNumber}
              </div>
            </div>
            <div>
              <div className="text-[#252B27]/60">Payment Method</div>
              <div className="font-semibold uppercase text-[#173D32] mt-0.5">
                {confirmedOrder.paymentMethod} ({confirmedOrder.paymentStatus})
              </div>
            </div>
            <div>
              <div className="text-[#252B27]/60">Total Amount</div>
              <div className="font-mono-tabular font-semibold text-[#173D32] mt-0.5">
                ৳{Number(confirmedOrder.totalAmount).toLocaleString('en-BD')}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="button"
              onClick={() =>
                onNavigate(`/track-order?order=${encodeURIComponent(confirmedOrder.orderNumber)}`)
              }
              className="px-6 py-3 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45]"
            >
              Track Order Live
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/shop')}
              className="px-6 py-3 text-xs font-medium border border-[#173D32] text-[#173D32] rounded-lg hover:bg-[#F8F6EF]"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-[#A8B9A0]/35 pb-5">
        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
            {mode === 'cart' ? 'Shopping Bag' : 'Secure Bangladesh Checkout'}
          </h1>
          <p className="text-xs text-[#245B45] mt-1">
            Complimentary shipping across Bangladesh on orders of ৳2,500 or more
          </p>
        </div>
        {mode === 'cart' && cart.length > 0 && (
          <button
            type="button"
            onClick={() => onNavigate('/checkout')}
            className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45]"
          >
            Proceed to Checkout
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-[#A8B9A0]/35 rounded-2xl p-12 text-center space-y-4">
          <ShoppingBag className="w-10 h-10 text-[#173D32] mx-auto stroke-[1.5]" />
          <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
            Your Shopping Bag is Empty
          </h2>
          <p className="text-sm text-[#252B27]/75 max-w-md mx-auto">
            Explore our authentic DXN skincare, personal care, and Lingzhi coffee collection to add
            items to your bag.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/shop')}
            className="px-6 py-3 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45]"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Cart Items + Checkout Form */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white border border-[#A8B9A0]/35 rounded-2xl divide-y divide-[#F8F6EF]">
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.variantName}`}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[#A8B9A0]/30">
                      <BotanicalImage
                        src={item.product.primaryImage}
                        alt={item.product.name}
                        aspectClass="w-16 h-16"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#173D32]">
                        {item.product.name}
                      </h3>
                      <div className="text-xs text-[#252B27]/70 mt-0.5">
                        {item.variantName} · ৳{item.unitPrice.toLocaleString('en-BD')} each
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-[#A8B9A0]/50 rounded-lg bg-[#F8F6EF]">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.product.id, item.variantName, -1)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className="p-1.5 text-[#173D32]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-mono-tabular font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.product.id, item.variantName, 1)}
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className="p-1.5 text-[#173D32]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="font-mono-tabular text-sm font-semibold text-[#173D32] min-w-[72px] text-right">
                      ৳{(item.unitPrice * item.quantity).toLocaleString('en-BD')}
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id, item.variantName)}
                      aria-label={`Remove ${item.product.name} from cart`}
                      className="text-[#252B27]/50 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery & Payment Form */}
            <form
              id="checkout-form"
              onSubmit={handlePlaceOrder}
              className="bg-white border border-[#A8B9A0]/35 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                Delivery Details & Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="chk-name" className="block text-xs font-medium mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    id="chk-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Farhana Rahman"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="chk-phone" className="block text-xs font-medium mb-1">
                    Mobile Number (Bangladesh) *
                  </label>
                  <input
                    id="chk-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="chk-email" className="block text-xs font-medium mb-1">
                    Email Address
                  </label>
                  <input
                    id="chk-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="chk-district" className="block text-xs font-medium mb-1">
                    District *
                  </label>
                  <select
                    id="chk-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="chk-area" className="block text-xs font-medium mb-1">
                    Area / Thana *
                  </label>
                  <input
                    id="chk-area"
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Banani / Agrabad"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="chk-address" className="block text-xs font-medium mb-1">
                    Full Street / House / Apartment Address *
                  </label>
                  <input
                    id="chk-address"
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House, Road, Block, Apartment"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="chk-postal" className="block text-xs font-medium mb-1">
                    Postal Code
                  </label>
                  <input
                    id="chk-postal"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1212"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
              </div>

              {/* Payment Gateway Selection — Bangladesh */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-[#173D32]">
                  Select Payment Method (Bangladesh)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', sub: 'Pay upon receiving parcel' },
                    { id: 'bkash', label: 'bKash (Sandbox)', sub: 'Mobile Merchant Test' },
                    { id: 'nagad', label: 'Nagad (Sandbox)', sub: 'Mobile Merchant Test' },
                    { id: 'rocket', label: 'Rocket (Sandbox)', sub: 'DBBL Mobile Banking' },
                    { id: 'sslcommerz', label: 'SSLCommerz (Sandbox)', sub: 'Cards & NetBanking' },
                    { id: 'bank_transfer', label: 'Bank Transfer', sub: 'City Bank PLC' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMethod === pm.id
                          ? 'bg-[#173D32] text-[#F8F6EF] border-[#173D32]'
                          : 'bg-[#F8F6EF] text-[#252B27] border-[#A8B9A0]/50 hover:border-[#173D32]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{pm.label}</div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          paymentMethod === pm.id ? 'text-[#A8B9A0]' : 'text-[#252B27]/65'
                        }`}
                      >
                        {pm.sub}
                      </div>
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'cod' && (
                  <div className="bg-[#F8F6EF] border border-[#C6A76A]/60 rounded-xl p-4 space-y-3 text-xs">
                    <div className="font-semibold text-[#173D32]">
                      Sandbox / Test Mode Payment Verification ({paymentMethod.toUpperCase()})
                    </div>
                    <p className="text-[#252B27]/80">
                      {paymentMethod === 'bank_transfer'
                        ? 'Transfer to City Bank PLC (A/C: 1402998877665 — DXN Organic Point Retail) and enter your transfer reference below.'
                        : `Send BDT ৳${totals.totalAmount.toLocaleString('en-BD')} to Sandbox Merchant 01711-009988 and provide the Sandbox Transaction ID to verify immediately.`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        placeholder="Sender Mobile / Account No."
                        className="px-3 py-2 bg-white border border-[#A8B9A0]/60 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Transaction ID (e.g. BKH99201)"
                        className="px-3 py-2 bg-white border border-[#A8B9A0]/60 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="chk-notes" className="block text-xs font-medium mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  id="chk-notes"
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Gate instructions or preferred delivery window"
                  className="w-full px-3.5 py-2 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 text-sm font-semibold bg-[#173D32] text-[#F8F6EF] rounded-xl hover:bg-[#245B45] transition-colors"
              >
                {submitting
                  ? 'Recording Order in Database...'
                  : `Complete Order · ৳${totals.totalAmount.toLocaleString('en-BD')}`}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary & Coupon Box */}
          <div className="lg:col-span-5 bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-7 space-y-6">
            <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
              Order Summary
            </h2>

            {/* Coupon Code Input */}
            <div className="space-y-2">
              <label htmlFor="coupon-input" className="block text-xs font-medium text-[#252B27]">
                Privilege / Promo Code (Try: <code className="font-mono">ORGANIC10</code>)
              </label>
              <div className="flex gap-2">
                <input
                  id="coupon-input"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter code (e.g. ORGANIC10)"
                  className="flex-1 px-3.5 py-2 text-xs bg-[#F8F6EF] border border-[#A8B9A0]/60 rounded-lg uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 text-xs font-semibold bg-[#245B45] text-[#F8F6EF] rounded-lg hover:bg-[#173D32] whitespace-nowrap shrink-0"
                >
                  Apply Coupon
                </button>
              </div>
              {totals.couponMessage && (
                <p className="text-xs text-[#245B45] font-medium">{totals.couponMessage}</p>
              )}
            </div>

            <div className="space-y-3 border-t border-[#F8F6EF] pt-4 text-sm font-mono-tabular">
              <div className="flex justify-between">
                <span className="font-sans text-[#252B27]/75">Subtotal</span>
                <span>৳{totals.subtotal.toLocaleString('en-BD')}</span>
              </div>
              <div className="flex justify-between text-[#245B45]">
                <span className="font-sans">Coupon Savings</span>
                <span>-৳{totals.discountAmount.toLocaleString('en-BD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-[#252B27]/75">
                  Delivery ({district})
                </span>
                <span>
                  {totals.shippingCost === 0
                    ? 'FREE (৳0)'
                    : `৳${totals.shippingCost.toLocaleString('en-BD')}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#173D32] border-t border-[#A8B9A0]/35 pt-3">
                <span className="font-sans">Total Payable (BDT)</span>
                <span>৳{totals.totalAmount.toLocaleString('en-BD')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const OrderTrackingView: React.FC<{
  initialOrderNumber?: string;
}> = ({ initialOrderNumber = '' }) => {
  const [orderNum, setOrderNum] = useState(initialOrderNumber || 'DXN-20261101-1042');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (targetNumber?: string) => {
    const q = (targetNumber ?? orderNum).trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) {
        setResult(null);
        setError(json.error || 'Order not found.');
      } else {
        setResult(json);
      }
    } catch {
      setError('Failed to query tracking status.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleTrack(initialOrderNumber || 'DXN-20261101-1042');
  }, [initialOrderNumber]);

  const stages = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIdx = result?.order
    ? stages.indexOf(result.order.orderStatus)
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
          Track My Order
        </h1>
        <p className="text-sm text-[#252B27]/80">
          Enter your DXN Organic Point Order Number to inspect real-time fulfillment and courier
          status from our database.
        </p>
      </div>

      <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <label htmlFor="track-order-input" className="sr-only">
            Order Number
          </label>
          <input
            id="track-order-input"
            type="text"
            value={orderNum}
            onChange={(e) => setOrderNum(e.target.value)}
            placeholder="e.g. DXN-20261101-1042"
            className="flex-1 px-4 py-2.5 text-sm font-mono bg-[#F8F6EF] border border-[#A8B9A0]/60 rounded-lg uppercase"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45] whitespace-nowrap shrink-0"
          >
            {loading ? 'Checking...' : 'Track Order'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#245B45]">
          <span>Sample Orders in Database:</span>
          <button
            type="button"
            onClick={() => {
              setOrderNum('DXN-20261101-1042');
              handleTrack('DXN-20261101-1042');
            }}
            className="underline font-mono"
          >
            DXN-20261101-1042
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => {
              setOrderNum('DXN-20261102-2089');
              handleTrack('DXN-20261102-2089');
            }}
            className="underline font-mono"
          >
            DXN-20261102-2089
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {result?.order && (
        <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F8F6EF] pb-4">
            <div>
              <div className="text-xs text-[#245B45]">
                Order #{result.order.orderNumber} · Courier Ref: {result.order.trackingNumber}
              </div>
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32] mt-0.5">
                Recipient: {result.order.customerName} ({result.order.district})
              </h2>
            </div>
            <div className="text-right font-mono-tabular">
              <div className="text-xs uppercase font-semibold text-[#173D32]">
                Status: {result.order.orderStatus}
              </div>
              <div className="text-sm font-bold text-[#245B45]">
                Total: ৳{Number(result.order.totalAmount).toLocaleString('en-BD')}
              </div>
            </div>
          </div>

          {/* 5-Stage Fulfillment Progress */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stages.map((st, idx) => {
              const reached = currentIdx >= idx;
              return (
                <div
                  key={st}
                  className={`p-3 rounded-xl border text-center ${
                    reached
                      ? 'bg-[#173D32] text-[#F8F6EF] border-[#173D32]'
                      : 'bg-[#F8F6EF] text-[#252B27]/50 border-[#A8B9A0]/30'
                  }`}
                >
                  <div className="text-[11px] font-mono">0{idx + 1}</div>
                  <div className="text-xs font-semibold capitalize mt-0.5">{st}</div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[#173D32] uppercase tracking-wider">
              Items in Shipment
            </h3>
            <div className="divide-y divide-[#F8F6EF] text-xs">
              {result.items.map((item: any) => (
                <div key={item.id} className="py-2.5 flex justify-between font-mono-tabular">
                  <span className="font-sans text-[#252B27]">
                    {item.productName} ({item.variantName}) × {item.quantity}
                  </span>
                  <span className="font-semibold text-[#173D32]">
                    ৳{Number(item.totalPrice).toLocaleString('en-BD')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CategoriesDirectoryView: React.FC<{
  categories: Category[];
  products: Product[];
  onNavigate: (path: string) => void;
}> = ({ categories, products, onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2 border-b border-[#A8B9A0]/35 pb-6">
        <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
          All Product Categories ({categories.filter((c) => c.isEnabled).length})
        </h1>
        <p className="text-sm text-[#252B27]/80">
          Browse our complete taxonomy of natural skincare, personal care, herbal formulations, and
          functional beverages.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories
          .filter((c) => c.isEnabled)
          .map((cat) => {
            const count = products.filter(
              (p) => p.categoryId === cat.id && p.isPublished
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigate(`/category/${cat.slug}`)}
                className="group text-left bg-white border border-[#A8B9A0]/35 rounded-xl overflow-hidden hover:border-[#173D32] transition-all flex flex-col justify-between"
              >
                <BotanicalImage
                  src={cat.imageUrl || ''}
                  alt={cat.name}
                  aspectClass="aspect-[16/10]"
                  fallbackTitle={cat.name}
                />
                <div className="p-5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[#173D32]">{cat.name}</h2>
                    <span className="text-xs font-mono-tabular text-[#245B45]">{count} items</span>
                  </div>
                  <p className="text-xs text-[#252B27]/75 line-clamp-2">{cat.description}</p>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
};

export const BlogViews: React.FC<{
  mode: 'list' | 'detail';
  posts: BlogPost[];
  activeSlug?: string;
  onNavigate: (path: string) => void;
}> = ({ mode, posts, activeSlug, onNavigate }) => {
  const published = posts.filter((p) => p.status === 'published');
  const activePost = published.find((p) => p.slug === activeSlug) || published[0];

  if (mode === 'detail' && activePost) {
    return (
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <nav className="flex items-center gap-2 text-xs text-[#245B45]">
          <button type="button" onClick={() => onNavigate('/')} className="hover:underline">
            Home
          </button>
          <span>/</span>
          <button type="button" onClick={() => onNavigate('/blog')} className="hover:underline">
            Journal
          </button>
          <span>/</span>
          <span className="text-[#173D32] font-medium">{activePost.title}</span>
        </nav>

        <div className="space-y-4">
          <div className="text-xs text-[#245B45]">
            {activePost.categoryName} · {activePost.readTimeMinutes} min read · By{' '}
            {activePost.authorName}
          </div>
          <h1 className="font-serif-display text-3xl sm:text-5xl font-semibold text-[#173D32] leading-tight">
            {activePost.title}
          </h1>
          <p className="text-base text-[#252B27]/80 leading-relaxed">{activePost.excerpt}</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[#A8B9A0]/40">
          <BotanicalImage
            src={activePost.featuredImage}
            alt={activePost.title}
            aspectClass="aspect-[16/9]"
          />
        </div>

        <div className="bg-white border border-[#A8B9A0]/35 rounded-2xl p-8 space-y-4 text-base text-[#252B27] leading-relaxed whitespace-pre-line">
          {activePost.content}
        </div>
      </article>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#A8B9A0]/35 pb-6">
        <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
          Botanical Skincare & Wellness Journal
        </h1>
        <p className="text-sm text-[#252B27]/80 mt-1">
          Practical guides on pH-balanced skincare, Ganoderma heritage, and mindful daily rituals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {published.map((post) => (
          <article
            key={post.id}
            className="bg-white border border-[#A8B9A0]/35 rounded-2xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              <button
                type="button"
                onClick={() => onNavigate(`/blog/${post.slug}`)}
                className="block w-full text-left"
              >
                <BotanicalImage
                  src={post.featuredImage}
                  alt={post.title}
                  aspectClass="aspect-[16/9]"
                />
              </button>
              <div className="p-6 space-y-3">
                <div className="text-xs text-[#245B45]">
                  {post.categoryName} · {post.readTimeMinutes} min read
                </div>
                <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/blog/${post.slug}`)}
                    className="text-left hover:text-[#245B45]"
                  >
                    {post.title}
                  </button>
                </h2>
                <p className="text-sm text-[#252B27]/80 leading-relaxed">{post.excerpt}</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => onNavigate(`/blog/${post.slug}`)}
                className="text-xs font-semibold text-[#173D32] flex items-center gap-1.5"
              >
                <span>Read Complete Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export const InfoAndPolicyView: React.FC<{
  pageKey:
    | 'about'
    | 'brand-story'
    | 'why-choose-us'
    | 'contact'
    | 'faq'
    | 'reviews'
    | 'wishlist'
    | 'privacy-policy'
    | 'terms'
    | 'return-policy'
    | 'shipping-policy';
  data: StoreBootstrapData;
  wishlistIds: number[];
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, qty?: number) => void;
  onToggleWishlist: (productId: number) => void;
}> = ({ pageKey, data, wishlistIds, onNavigate, onAddToCart, onToggleWishlist }) => {
  const [contactSent, setContactSent] = useState(false);

  if (pageKey === 'wishlist') {
    const wishedProducts = data.products.filter((p) => wishlistIds.includes(p.id));
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="border-b border-[#A8B9A0]/35 pb-5">
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
            My Saved Wishlist ({wishedProducts.length})
          </h1>
          <p className="text-sm text-[#252B27]/80 mt-1">
            Items saved to your PostgreSQL wishlist for future orders.
          </p>
        </div>

        {wishedProducts.length === 0 ? (
          <div className="bg-white border border-[#A8B9A0]/35 rounded-2xl p-12 text-center space-y-4">
            <p className="font-serif-display text-2xl text-[#173D32]">
              Your wishlist is currently empty
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/shop')}
              className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
            >
              Explore Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {wishedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={true}
                onNavigate={onNavigate}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (pageKey === 'faq') {
    let faqs: Array<{ q: string; a: string }> = [];
    try {
      faqs = JSON.parse(data.settings.faqs_json || '[]');
    } catch {
      faqs = [];
    }
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
          Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#A8B9A0]/35 rounded-xl p-6 space-y-2"
            >
              <h2 className="text-base font-semibold text-[#173D32]">{item.q}</h2>
              <p className="text-sm text-[#252B27]/80 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pageKey === 'reviews') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
          Verified Customer Testimonials & Reviews
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#A8B9A0]/35 rounded-xl p-6 space-y-3"
            >
              <div className="text-xs text-[#245B45]">
                {t.productPurchased} · {t.rating}.0 / 5.0
              </div>
              <p className="text-sm text-[#252B27] leading-relaxed">“{t.statement}”</p>
              <div className="text-xs font-semibold text-[#173D32]">
                {t.customerName} · {t.customerRole}, {t.organizationOrCity}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pageKey === 'contact') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-5">
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
            Contact DXN Organic Point
          </h1>
          <p className="text-sm text-[#252B27]/80 leading-relaxed">
            Our customer care specialists in Banani, Dhaka assist with product recommendations,
            order tracking, and wholesale/retail inquiries.
          </p>
          <div className="space-y-3 text-sm text-[#252B27]">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#173D32]" />
              <span>{data.settings.contact_address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#173D32]" />
              <span>{data.settings.contact_phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#173D32]" />
              <span>{data.settings.contact_email}</span>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setContactSent(true);
          }}
          className="md:col-span-7 bg-white border border-[#A8B9A0]/35 rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
            Send a Direct Message
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="Your Name"
              className="px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
            />
            <input
              type="email"
              required
              placeholder="Your Email or Phone"
              className="px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
            />
          </div>
          <textarea
            rows={4}
            required
            placeholder="How can we help you today?"
            className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
          />
          <button
            type="submit"
            className="px-6 py-3 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
          >
            Send Inquiry
          </button>
          {contactSent && (
            <p className="text-xs font-medium text-[#245B45]">
              Thank you! Our Dhaka care desk has received your message and will respond shortly.
            </p>
          )}
        </form>
      </div>
    );
  }

  const contentMap: Record<string, { title: string; body: string }> = {
    about: {
      title: 'About DXN Organic Point',
      body:
        data.settings.about_content ||
        'DXN Organic Point is a premier natural skincare, personal care, and botanical wellness retail platform serving all 64 districts of Bangladesh.',
    },
    'brand-story': {
      title: 'Our Brand Story & Botanical Philosophy',
      body:
        data.settings.brand_story_content ||
        'We curate authentic plant-based personal care and Ganoderma-enriched wellness essentials stored in climate-controlled conditions in Dhaka.',
    },
    'why-choose-us': {
      title: 'Why Choose DXN Organic Point',
      body: `1. Authentic Factory-Sealed Batches: Every tube, bottle, and box carries verifiable manufacturing and expiry dates.\n2. Climate-Controlled Dhaka Hub: Botanical oils, serums, and beverages are protected from heat and humidity.\n3. Fast Nationwide Delivery: 24–48 hour delivery inside Dhaka Metro (৳70) and reliable Steadfast/Pathao courier delivery across all 64 districts (৳130, free over ৳2,500).`,
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      body: `DXN Organic Point respects your privacy. Customer names, delivery addresses, phone numbers, and order records are stored securely in our PostgreSQL database strictly for order fulfillment, customer support, and account management. We never sell or rent customer data to third parties.`,
    },
    terms: {
      title: 'Terms & Conditions',
      body: `DXN Organic Point operates as an independent retail storefront in Bangladesh supplying authentic DXN products. Prices are denominated in Bangladeshi Taka (BDT). Orders are confirmed upon verification of delivery details or sandbox/live payment confirmation.`,
    },
    'return-policy': {
      title: 'Return & Refund Policy',
      body: `Unopened products in their original factory-sealed packaging may be returned or exchanged within 7 calendar days of delivery. In the event of transit damage or an incorrect item dispatch, notify care@dxnorganicpoint.com within 48 hours for a complimentary replacement or full refund.`,
    },
    'shipping-policy': {
      title: 'Shipping & Delivery Policy (Bangladesh)',
      body: `• Inside Dhaka Metro: ৳70 flat rate (24–48 Hours delivery).\n• Dhaka Suburbs (Gazipur, Narayanganj, Savar): ৳100 (2–3 Business Days).\n• All Other 63 Districts: ৳130 via Steadfast / Pathao Courier (3–5 Business Days).\n• Complimentary Delivery: Automatically applied at checkout on all orders of ৳2,500 or above.`,
    },
  };

  const info = contentMap[pageKey] || contentMap.about;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#173D32]">
        {info.title}
      </h1>
      <div className="bg-white border border-[#A8B9A0]/35 rounded-2xl p-8 space-y-4 text-sm text-[#252B27] leading-relaxed whitespace-pre-line">
        {info.body}
        <div className="pt-4 border-t border-[#F8F6EF] text-xs text-[#252B27]/65">
          {data.settings.brand_disclaimer}
        </div>
      </div>
    </div>
  );
};
