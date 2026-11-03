import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag,
  X,
  Menu,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Shield,
} from 'lucide-react';
import {
  StoreBootstrapData,
  Product,
  CartItem,
  CustomerUser,
} from './types.ts';
import { SeoHead } from './components/SeoHead.tsx';
import {
  HomePageView,
  CatalogView,
  ProductDetailView,
  CheckoutAndCartView,
  OrderTrackingView,
  CategoriesDirectoryView,
  BlogViews,
  InfoAndPolicyView,
} from './components/StorefrontViews.tsx';
import { AccountViews } from './components/AccountViews.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { buildProductJsonLd } from './utils/commerceRules.ts';

export default function App() {
  const [routePath, setRoutePath] = useState<string>(() => window.location.pathname || '/');
  const [routeSearch, setRouteSearch] = useState<string>(() => window.location.search || '');
  const [storeData, setStoreData] = useState<StoreBootstrapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  // Persistent session key for PostgreSQL wishlist synchronization
  const [sessionKey] = useState<string>(() => 'dxn_guest_session_bd');
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  // In-memory Auth State (never stored in localStorage per cloudsql-setup Step 4.3)
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const navigate = useCallback((to: string) => {
    const [pathname, searchPart] = to.split('?');
    const cleanPath = pathname || '/';
    const cleanSearch = searchPart ? `?${searchPart}` : '';
    window.history.pushState({}, '', `${cleanPath}${cleanSearch}`);
    setRoutePath(cleanPath);
    setRouteSearch(cleanSearch);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoutePath(window.location.pathname || '/');
      setRouteSearch(window.location.search || '');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const fetchStoreData = useCallback(async () => {
    try {
      const [bootRes, wishRes] = await Promise.all([
        fetch('/api/bootstrap'),
        fetch(`/api/wishlist/${encodeURIComponent(sessionKey)}`),
      ]);
      if (!bootRes.ok) {
        throw new Error('Could not load store catalog from database.');
      }
      const bootJson = await bootRes.json();
      setStoreData(bootJson);
      setLoadError('');

      if (wishRes.ok) {
        const wishJson = await wishRes.json();
        if (Array.isArray(wishJson.productIds)) {
          setWishlistIds(wishJson.productIds);
        }
      }
    } catch (err: any) {
      setLoadError(err.message || 'Database connection error.');
    } finally {
      setLoading(false);
    }
  }, [sessionKey]);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  const handleAddToCart = (product: Product, qty: number = 1, variantName?: string) => {
    const chosenVariant =
      variantName || product.variants[0]?.variantName || `Standard (${product.weight})`;
    const variantObj = product.variants.find((v) => v.variantName === chosenVariant);
    const unitPrice = variantObj
      ? Number(variantObj.price)
      : product.discountedPrice && Number(product.discountedPrice) > 0
      ? Number(product.discountedPrice)
      : Number(product.regularPrice);

    setCart((prev) => {
      const idx = prev.findIndex(
        (c) => c.product.id === product.id && c.variantName === chosenVariant
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + qty,
        };
        return updated;
      }
      return [...prev, { product, quantity: qty, variantName: chosenVariant, unitPrice }];
    });

    showToast(`Added ${product.name} to your bag.`);
  };

  const handleUpdateCartQty = (productId: number, variantName: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id === productId && c.variantName === variantName) {
            return { ...c, quantity: c.quantity + delta };
          }
          return c;
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: number, variantName: string) => {
    setCart((prev) =>
      prev.filter((c) => !(c.product.id === productId && c.variantName === variantName))
    );
  };

  const handleToggleWishlist = async (productId: number) => {
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey, productId }),
      });
      if (res.ok) {
        const json = await res.json();
        setWishlistIds(json.productIds || []);
        showToast('Updated your saved wishlist.');
      }
    } catch {}
  };

  const totalCartItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const totalCartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [cart]
  );

  // Dynamic SEO metadata resolution per active route
  const seoMeta = useMemo(() => {
    const baseTitle =
      storeData?.settings.seo_default_title ||
      'DXN Organic Point — Natural Skincare, Cosmetics & Wellness';
    const baseDesc =
      storeData?.settings.seo_default_description ||
      'Shop authentic DXN natural skincare, Ganozhi toothpaste, Aloe.V facial care, and Lingzhi black coffee in Bangladesh.';

    if (!storeData) {
      return {
        title: baseTitle,
        description: baseDesc,
        noIndex: false,
        ogType: 'website' as const,
        jsonLd: undefined,
      };
    }

    if (routePath.startsWith('/product/')) {
      const slug = routePath.replace('/product/', '');
      const prod = storeData.products.find((p) => p.slug === slug);
      if (prod) {
        return {
          title: prod.seoTitle || `${prod.name} — Buy Online in Bangladesh | DXN Organic Point`,
          description: prod.seoDescription || prod.shortDescription,
          noIndex: prod.noIndex,
          ogType: 'product' as const,
          jsonLd: buildProductJsonLd({
            name: prod.name,
            slug: prod.slug,
            sku: prod.sku,
            description: prod.description,
            regularPrice: prod.regularPrice,
            discountedPrice: prod.discountedPrice,
            availability: prod.availability,
            primaryImage: prod.primaryImage,
            baseUrl: window.location.origin,
          }),
        };
      }
    }

    if (routePath.startsWith('/category/')) {
      const slug = routePath.replace('/category/', '');
      const cat = storeData.categories.find((c) => c.slug === slug);
      if (cat) {
        return {
          title: cat.seoTitle || `${cat.name} — DXN Organic Point Bangladesh`,
          description: cat.seoDescription || cat.description || baseDesc,
          noIndex: cat.noIndex,
          ogType: 'website' as const,
          jsonLd: undefined,
        };
      }
    }

    if (routePath.startsWith('/blog/')) {
      const slug = routePath.replace('/blog/', '');
      const post = storeData.blogPosts.find((b) => b.slug === slug);
      if (post) {
        return {
          title: post.seoTitle || `${post.title} | DXN Organic Point Journal`,
          description: post.seoDescription || post.excerpt,
          noIndex: post.noIndex,
          ogType: 'article' as const,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            author: {
              '@type': 'Organization',
              name: post.authorName,
            },
            datePublished: post.publishedAt,
          },
        };
      }
    }

    const privateRoute = ['/admin', '/account', '/cart', '/checkout', '/search'].some((p) =>
      routePath.startsWith(p)
    );

    return {
      title: baseTitle,
      description: baseDesc,
      noIndex: privateRoute,
      ogType: 'website' as const,
      jsonLd: undefined,
    };
  }, [routePath, storeData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6EF] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 rounded-full border-2 border-[#173D32] border-t-transparent animate-spin mb-4" />
        <p className="font-serif-display text-xl text-[#173D32]">
          Loading DXN Organic Point Storefront...
        </p>
      </div>
    );
  }

  if (loadError || !storeData) {
    return (
      <div className="min-h-screen bg-[#F8F6EF] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="font-serif-display text-3xl text-[#173D32]">
          Storefront Temporarily Unavailable
        </h1>
        <p className="text-sm text-[#252B27]/80 max-w-md">{loadError}</p>
        <button
          type="button"
          onClick={fetchStoreData}
          className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Dedicated Admin Workspace Route (/admin)
  if (routePath.startsWith('/admin')) {
    return (
      <>
        <SeoHead
          title="Admin Console — DXN Organic Point"
          description="Enterprise Admin & CMS Console"
          canonicalPath="/admin"
          noIndex={true}
          gscVerificationCode={storeData.settings.gsc_verification_code}
        />
        <AdminPanel
          storeData={storeData}
          onRefreshStore={fetchStoreData}
          onNavigate={navigate}
        />
      </>
    );
  }

  const activeProductSlug = routePath.startsWith('/product/')
    ? routePath.replace('/product/', '')
    : '';
  const activeProduct =
    storeData.products.find((p) => p.slug === activeProductSlug) || storeData.products[0];

  const activeCategorySlug = routePath.startsWith('/category/')
    ? routePath.replace('/category/', '')
    : '';

  const activeBlogSlug = routePath.startsWith('/blog/') ? routePath.replace('/blog/', '') : '';

  const urlParams = new URLSearchParams(routeSearch);
  const trackOrderQuery = urlParams.get('order') || '';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6EF] text-[#252B27]">
      <SeoHead
        title={seoMeta.title}
        description={seoMeta.description}
        canonicalPath={routePath}
        noIndex={seoMeta.noIndex}
        ogType={seoMeta.ogType}
        gscVerificationCode={storeData.settings.gsc_verification_code}
        jsonLd={seoMeta.jsonLd}
      />

      {/* Slim Dismissible Top Announcement Bar (<= 36px height) */}
      {!bannerDismissed && storeData.settings.announcement_bar && (
        <div className="bg-[#173D32] text-[#F8F6EF] px-4 py-2 text-xs flex items-center justify-between">
          <div className="max-w-7xl mx-auto text-center truncate">
            {storeData.settings.announcement_bar}
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement banner"
            className="text-[#A8B9A0] hover:text-white ml-3 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Strictly Disciplined 3-Zone Top Navigation Bar (Top Bar Contract) */}
      <header className="sticky top-0 z-30 bg-[#F8F6EF]/95 backdrop-blur-md border-b border-[#A8B9A0]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="font-serif-display text-2xl font-bold tracking-tight text-[#173D32] whitespace-nowrap shrink-0"
          >
            {storeData.settings.brand_name || 'DXN Organic Point'}
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#252B27]"
          >
            <a
              href="/shop"
              onClick={(e) => {
                e.preventDefault();
                navigate('/shop');
              }}
              className={`hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 ${
                routePath === '/shop' ? 'text-[#173D32] underline underline-offset-4' : ''
              }`}
            >
              Shop
            </a>
            <a
              href="/categories"
              onClick={(e) => {
                e.preventDefault();
                navigate('/categories');
              }}
              className={`hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 ${
                routePath.startsWith('/categor')
                  ? 'text-[#173D32] underline underline-offset-4'
                  : ''
              }`}
            >
              Categories
            </a>
            <a
              href="/blog"
              onClick={(e) => {
                e.preventDefault();
                navigate('/blog');
              }}
              className={`hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 ${
                routePath.startsWith('/blog') ? 'text-[#173D32] underline underline-offset-4' : ''
              }`}
            >
              Journal
            </a>
            <a
              href="/track-order"
              onClick={(e) => {
                e.preventDefault();
                navigate('/track-order');
              }}
              className={`hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 ${
                routePath === '/track-order' ? 'text-[#173D32] underline underline-offset-4' : ''
              }`}
            >
              Track Order
            </a>
            <a
              href="/account"
              onClick={(e) => {
                e.preventDefault();
                navigate('/account');
              }}
              className={`hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0 ${
                routePath === '/account' ? 'text-[#173D32] underline underline-offset-4' : ''
              }`}
            >
              {currentUser ? currentUser.name.split(' ')[0] : 'Account'}
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label={`Shopping bag with ${totalCartItems} items`}
              className="px-4 py-2 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 font-mono-tabular"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                Bag ({totalCartItems}){totalCartSubtotal > 0 ? ` · ৳${totalCartSubtotal}` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile navigation"
              className="md:hidden p-2 text-[#173D32]"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#A8B9A0]/40 px-4 py-4 space-y-2 text-sm">
            {[
              { path: '/', label: 'Home' },
              { path: '/shop', label: 'Shop All Products' },
              { path: '/categories', label: 'All 16 Categories' },
              { path: '/offers', label: 'Special Offers' },
              { path: '/blog', label: 'Botanical Journal' },
              { path: '/track-order', label: 'Track My Order' },
              { path: '/wishlist', label: `Wishlist (${wishlistIds.length})` },
              { path: '/account', label: 'Customer Account' },
              { path: '/admin', label: 'Admin Console (/admin)' },
            ].map((lnk) => (
              <button
                key={lnk.path}
                type="button"
                onClick={() => navigate(lnk.path)}
                className="block w-full text-left py-2 font-medium text-[#173D32] border-b border-[#F8F6EF]"
              >
                {lnk.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#173D32] text-[#F8F6EF] px-5 py-3 rounded-xl shadow-lg border border-[#C6A76A] text-xs font-medium flex items-center gap-3"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="underline text-[#C6A76A] font-semibold whitespace-nowrap"
          >
            Checkout Now
          </button>
        </div>
      )}

      {/* Slide-Over Shopping Cart Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div
            role="dialog"
            aria-label="Shopping Bag Drawer"
            className="w-full max-w-md bg-[#F8F6EF] h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#A8B9A0]/40 pb-4">
                <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                  Shopping Bag ({totalCartItems})
                </h2>
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(false)}
                  aria-label="Close shopping bag drawer"
                  className="p-1.5 text-[#252B27] hover:text-[#173D32]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="font-serif-display text-xl text-[#173D32]">Your bag is empty</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('/shop');
                    }}
                    className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={`${item.product.id}-${item.variantName}`}
                      className="bg-white border border-[#A8B9A0]/35 rounded-xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#173D32] truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-[#252B27]/65">{item.variantName}</div>
                        <div className="text-xs font-mono-tabular font-semibold text-[#245B45] mt-1">
                          ৳{(item.unitPrice * item.quantity).toLocaleString('en-BD')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCartQty(item.product.id, item.variantName, -1)
                          }
                          aria-label={`Decrease quantity of ${item.product.name}`}
                          className="p-1 bg-[#F8F6EF] rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono-tabular px-1.5">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCartQty(item.product.id, item.variantName, 1)
                          }
                          aria-label={`Increase quantity of ${item.product.name}`}
                          className="p-1 bg-[#F8F6EF] rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveCartItem(item.product.id, item.variantName)
                          }
                          aria-label={`Remove ${item.product.name}`}
                          className="p-1 text-red-700 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#A8B9A0]/40 pt-4 space-y-3">
                <div className="flex justify-between text-sm font-mono-tabular font-bold text-[#173D32]">
                  <span className="font-sans">Subtotal</span>
                  <span>৳{totalCartSubtotal.toLocaleString('en-BD')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('/cart');
                    }}
                    className="py-3 text-xs font-semibold border border-[#173D32] text-[#173D32] rounded-lg"
                  >
                    View Full Bag
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('/checkout');
                    }}
                    className="py-3 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Route Viewport */}
      <main className="flex-1">
        {routePath === '/' && (
          <HomePageView
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {routePath === '/shop' && (
          <CatalogView
            mode="all"
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {routePath === '/new-arrivals' && (
          <CatalogView
            mode="new-arrivals"
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {routePath === '/best-sellers' && (
          <CatalogView
            mode="best-sellers"
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {routePath === '/featured' && (
          <CatalogView
            mode="featured"
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {routePath === '/offers' && (
          <CatalogView
            mode="offers"
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {routePath === '/search' && (
          <CatalogView
            mode="search"
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {routePath === '/categories' && (
          <CategoriesDirectoryView
            categories={storeData.categories}
            products={storeData.products}
            onNavigate={navigate}
          />
        )}

        {routePath.startsWith('/category/') && (
          <CatalogView
            mode="category"
            categorySlug={activeCategorySlug}
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {routePath.startsWith('/product/') && (
          <ProductDetailView
            product={activeProduct}
            allProducts={storeData.products}
            isWishlisted={wishlistIds.includes(activeProduct.id)}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onRefreshStore={fetchStoreData}
          />
        )}

        {(routePath === '/cart' || routePath === '/checkout') && (
          <CheckoutAndCartView
            mode={routePath === '/cart' ? 'cart' : 'checkout'}
            cart={cart}
            data={storeData}
            currentUser={currentUser}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={() => setCart([])}
            onNavigate={navigate}
            onOrderSuccess={() => fetchStoreData()}
          />
        )}

        {routePath === '/track-order' && (
          <OrderTrackingView initialOrderNumber={trackOrderQuery} />
        )}

        {routePath === '/blog' && (
          <BlogViews mode="list" posts={storeData.blogPosts} onNavigate={navigate} />
        )}

        {routePath.startsWith('/blog/') && (
          <BlogViews
            mode="detail"
            posts={storeData.blogPosts}
            activeSlug={activeBlogSlug}
            onNavigate={navigate}
          />
        )}

        {routePath === '/account' && (
          <AccountViews
            currentUser={currentUser}
            authToken={authToken}
            wishlistIds={wishlistIds}
            products={storeData.products}
            onAuthSuccess={(user, token) => {
              setCurrentUser(user);
              setAuthToken(token);
              showToast(`Signed in as ${user.name}`);
            }}
            onLogout={() => {
              setCurrentUser(null);
              setAuthToken(null);
              showToast('Signed out of your account.');
            }}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {[
          '/about',
          '/brand-story',
          '/why-choose-us',
          '/contact',
          '/faq',
          '/reviews',
          '/wishlist',
          '/privacy-policy',
          '/terms',
          '/return-policy',
          '/shipping-policy',
        ].includes(routePath) && (
          <InfoAndPolicyView
            pageKey={routePath.replace('/', '') as any}
            data={storeData}
            wishlistIds={wishlistIds}
            onNavigate={navigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        )}
      </main>

      {/* Floating WhatsApp Concierge Button */}
      <a
        href={`https://wa.me/${storeData.settings.contact_whatsapp || '8801711009988'}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with DXN Organic Point Bangladesh"
        className="fixed bottom-5 right-5 z-40 bg-[#173D32] text-[#F8F6EF] p-3.5 rounded-full shadow-lg border border-[#C6A76A] hover:bg-[#245B45] transition-colors flex items-center gap-2"
      >
        <MessageCircle className="w-5 h-5 text-[#C6A76A]" />
        <span className="hidden sm:inline text-xs font-medium pr-1">WhatsApp Care</span>
      </a>

      {/* Comprehensive Storefront Footer */}
      <footer className="bg-[#173D32] text-[#F8F6EF] border-t border-[#245B45] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs">
            <div className="lg:col-span-2 space-y-3">
              <div className="font-serif-display text-2xl font-bold text-[#F8F6EF]">
                {storeData.settings.brand_name || 'DXN Organic Point'}
              </div>
              <p className="text-[#A8B9A0] leading-relaxed max-w-sm">
                {storeData.settings.brand_tagline}. Serving households across all 64 districts of
                Bangladesh from our climate-controlled fulfillment hub in Banani, Dhaka.
              </p>
              <div className="text-[#C6A76A] pt-1">
                {storeData.settings.contact_phone} · {storeData.settings.contact_email}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="font-semibold text-[#C6A76A] uppercase tracking-wider">
                Collections
              </div>
              <ul className="space-y-2 text-[#F8F6EF]/80">
                <li>
                  <button type="button" onClick={() => navigate('/shop')} className="hover:text-white">
                    Shop All Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/categories')}
                    className="hover:text-white"
                  >
                    All 16 Categories
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/best-sellers')}
                    className="hover:text-white"
                  >
                    Best Sellers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/new-arrivals')}
                    className="hover:text-white"
                  >
                    New Arrivals
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/offers')} className="hover:text-white">
                    Special Offers
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="font-semibold text-[#C6A76A] uppercase tracking-wider">
                Brand & Support
              </div>
              <ul className="space-y-2 text-[#F8F6EF]/80">
                <li>
                  <button type="button" onClick={() => navigate('/about')} className="hover:text-white">
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/brand-story')}
                    className="hover:text-white"
                  >
                    Our Brand Story
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/why-choose-us')}
                    className="hover:text-white"
                  >
                    Why Choose Us
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/faq')} className="hover:text-white">
                    FAQ
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/reviews')} className="hover:text-white">
                    Customer Reviews
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/contact')} className="hover:text-white">
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <div className="font-semibold text-[#C6A76A] uppercase tracking-wider">
                Policies & Admin
              </div>
              <ul className="space-y-2 text-[#F8F6EF]/80">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/track-order')}
                    className="hover:text-white"
                  >
                    Track My Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/shipping-policy')}
                    className="hover:text-white"
                  >
                    Shipping & Delivery Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/return-policy')}
                    className="hover:text-white"
                  >
                    Return & Refund Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/privacy-policy')}
                    className="hover:text-white"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/terms')} className="hover:text-white">
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="text-[#C6A76A] font-semibold flex items-center gap-1 hover:underline pt-1"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Dashboard (/admin)</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#245B45] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A8B9A0]">
            <div>
              © {new Date().getFullYear()} DXN Organic Point Bangladesh. Independent Retail &
              E-Commerce Platform.
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/api/export-index-html"
                download="index.html"
                className="text-[#C6A76A] font-semibold hover:text-white"
              >
                Download index.html
              </a>
              <span>·</span>
              <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-white">
                XML Sitemap (/sitemap.xml)
              </a>
              <span>·</span>
              <a href="/robots.txt" target="_blank" rel="noreferrer" className="hover:text-white">
                robots.txt
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
