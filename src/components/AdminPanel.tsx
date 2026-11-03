import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  FileText,
  Tag,
  CreditCard,
  Globe,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { StoreBootstrapData } from '../types.ts';

interface AdminPanelProps {
  storeData: StoreBootstrapData;
  onRefreshStore: () => void;
  onNavigate: (path: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  storeData,
  onRefreshStore,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<
    | 'overview'
    | 'products'
    | 'categories'
    | 'orders'
    | 'customers'
    | 'cms'
    | 'marketing'
    | 'payments'
    | 'seo'
    | 'settings'
    | 'guide'
  >('overview');

  const [adminData, setAdminData] = useState<any | null>(null);
  const [seoStatus, setSeoStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [liveXmlPreview, setLiveXmlPreview] = useState<{ url: string; content: string } | null>(
    null
  );

  // Product Form State
  const [editingProdId, setEditingProdId] = useState<number | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState<number>(
    storeData.categories[0]?.id || 1
  );
  const [prodSubcategory, setProdSubcategory] = useState('Botanical Series');
  const [prodWeight, setProdWeight] = useState('150g');
  const [prodRegularPrice, setProdRegularPrice] = useState('950');
  const [prodDiscountedPrice, setProdDiscountedPrice] = useState('820');
  const [prodStock, setProdStock] = useState('35');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodFeatured, setProdFeatured] = useState(true);
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [prodNewArrival, setProdNewArrival] = useState(true);
  const [prodSpecialOffer, setProdSpecialOffer] = useState(false);
  const [prodPublished, setProdPublished] = useState(true);
  const [prodSeoTitle, setProdSeoTitle] = useState('');
  const [prodSeoDesc, setProdSeoDesc] = useState('');

  // Category Form State
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catOrder, setCatOrder] = useState('17');
  const [catEnabled, setCatEnabled] = useState(true);

  // Blog Post Form State
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogStatus, setBlogStatus] = useState('published');
  const [blogSeoTitle, setBlogSeoTitle] = useState('');

  // Coupon Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState('15');
  const [couponMinOrder, setCouponMinOrder] = useState('1200');
  const [couponExpiry, setCouponExpiry] = useState('2027-12-31');

  // Settings / SEO Form State
  const [brandTitle, setBrandTitle] = useState(
    storeData.settings.brand_name || 'DXN Organic Point'
  );
  const [announcementBar, setAnnouncementBar] = useState(
    storeData.settings.announcement_bar || ''
  );
  const [contactPhone, setContactPhone] = useState(storeData.settings.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(storeData.settings.contact_email || '');
  const [contactAddress, setContactAddress] = useState(
    storeData.settings.contact_address || ''
  );
  const [aboutText, setAboutText] = useState(storeData.settings.about_content || '');
  const [gscCode, setGscCode] = useState(storeData.settings.gsc_verification_code || '');
  const [robotsRules, setRobotsRules] = useState(storeData.settings.robots_custom_rules || '');
  const [seoDefaultTitle, setSeoDefaultTitle] = useState(
    storeData.settings.seo_default_title || ''
  );
  const [seoDefaultDesc, setSeoDefaultDesc] = useState(
    storeData.settings.seo_default_description || ''
  );

  const fetchAdminAll = async () => {
    setLoading(true);
    try {
      const [dashRes, seoRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/seo-status'),
      ]);
      if (dashRes.ok) {
        setAdminData(await dashRes.json());
      }
      if (seoRes.ok) {
        setSeoStatus(await seoRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAll();
  }, []);

  const notify = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProdId,
          name: prodName,
          sku: prodSku || `DXN-PRD-${Date.now().toString().slice(-4)}`,
          categoryId: prodCategoryId,
          subcategory: prodSubcategory,
          weight: prodWeight,
          regularPrice: prodRegularPrice,
          discountedPrice: prodDiscountedPrice,
          stockQuantity: Number(prodStock),
          shortDescription: prodShortDesc || prodName,
          description: prodDesc || prodShortDesc || prodName,
          isFeatured: prodFeatured,
          isBestSeller: prodBestSeller,
          isNewArrival: prodNewArrival,
          isSpecialOffer: prodSpecialOffer,
          isPublished: prodPublished,
          seoTitle: prodSeoTitle,
          seoDescription: prodSeoDesc,
        }),
      });
      if (res.ok) {
        notify(
          editingProdId
            ? `Updated product "${prodName}" in PostgreSQL & refreshed XML sitemap.`
            : `Created product "${prodName}" in PostgreSQL & added to /sitemap-products.xml.`
        );
        setEditingProdId(null);
        setProdName('');
        setProdSku('');
        setProdShortDesc('');
        setProdDesc('');
        await fetchAdminAll();
        onRefreshStore();
      }
    } catch {}
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify(`Removed "${name}" from database and active sitemaps.`);
        await fetchAdminAll();
        onRefreshStore();
      }
    } catch {}
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCatId,
          name: catName,
          description: catDesc,
          sortOrder: Number(catOrder),
          isEnabled: catEnabled,
        }),
      });
      if (res.ok) {
        notify(`Saved category "${catName}" to PostgreSQL.`);
        setEditingCatId(null);
        setCatName('');
        setCatDesc('');
        await fetchAdminAll();
        onRefreshStore();
      }
    } catch {}
  };

  const handleOrderStatusChange = async (
    orderId: number,
    orderStatus: string,
    paymentStatus?: string
  ) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus, paymentStatus }),
      });
      if (res.ok) {
        notify(`Order #${orderId} updated to ${orderStatus.toUpperCase()}.`);
        await fetchAdminAll();
      }
    } catch {}
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBlogId,
          title: blogTitle,
          excerpt: blogExcerpt || blogTitle,
          content: blogContent || blogExcerpt || blogTitle,
          status: blogStatus,
          seoTitle: blogSeoTitle,
        }),
      });
      if (res.ok) {
        notify(`Saved blog article "${blogTitle}" (${blogStatus}).`);
        setEditingBlogId(null);
        setBlogTitle('');
        setBlogExcerpt('');
        setBlogContent('');
        await fetchAdminAll();
        onRefreshStore();
      }
    } catch {}
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          discountPercent: Number(couponPercent),
          minOrderAmount: Number(couponMinOrder),
          expiryDate: couponExpiry,
          description: `${couponPercent}% off orders above ৳${couponMinOrder}`,
        }),
      });
      if (res.ok) {
        notify(`Coupon code ${couponCode.toUpperCase()} saved to PostgreSQL.`);
        setCouponCode('');
        await fetchAdminAll();
        onRefreshStore();
      }
    } catch {}
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            brand_name: brandTitle,
            announcement_bar: announcementBar,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            contact_address: contactAddress,
            about_content: aboutText,
            gsc_verification_code: gscCode,
            robots_custom_rules: robotsRules,
            seo_default_title: seoDefaultTitle,
            seo_default_description: seoDefaultDesc,
          },
        }),
      });
      if (res.ok) {
        notify('Website settings, CMS content & SEO rules saved to PostgreSQL.');
        await fetchAdminAll();
        onRefreshStore();
      }
    } catch {}
  };

  const handleInspectXmlUrl = async (urlPath: string) => {
    try {
      const res = await fetch(urlPath);
      const text = await res.text();
      setLiveXmlPreview({ url: urlPath, content: text });
    } catch {}
  };

  const metrics = adminData?.metrics || {
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: storeData.products.length,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    lowStockCount: 0,
  };

  return (
    <div className="min-h-screen bg-[#F8F6EF] flex flex-col lg:flex-row">
      {/* Sidebar Navigation (260px width per 3_saas_dashboard.md) */}
      <aside className="w-full lg:w-64 bg-[#173D32] text-[#F8F6EF] shrink-0 flex flex-col justify-between p-5">
        <div className="space-y-6">
          <div className="border-b border-[#245B45] pb-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-[#C6A76A] whitespace-nowrap">
                Enterprise Console
              </div>
              <div className="font-serif-display text-lg font-semibold whitespace-nowrap">
                DXN Admin
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="text-xs px-2.5 py-1 rounded bg-[#245B45] hover:bg-[#C6A76A] hover:text-[#173D32] transition-colors whitespace-nowrap shrink-0"
            >
              Storefront
            </button>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
              { id: 'products', label: 'Products & Inventory', icon: Package },
              { id: 'categories', label: 'Categories (16)', icon: FolderTree },
              { id: 'orders', label: 'Orders & Invoices', icon: ShoppingCart },
              { id: 'customers', label: 'Customers & Roles', icon: Users },
              { id: 'cms', label: 'Blog & Content CMS', icon: FileText },
              { id: 'marketing', label: 'Coupons & Marketing', icon: Tag },
              { id: 'payments', label: 'Payments & Gateways', icon: CreditCard },
              { id: 'seo', label: 'SEO & XML Sitemaps', icon: Globe },
              { id: 'settings', label: 'Website Settings', icon: Settings },
              { id: 'guide', label: 'Setup & Deploy Guide', icon: BookOpen },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors whitespace-nowrap ${
                    activeSection === item.id
                      ? 'bg-[#C6A76A] text-[#173D32] font-semibold'
                      : 'text-[#F8F6EF]/85 hover:bg-[#245B45]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#245B45] text-[11px] text-[#A8B9A0] space-y-1">
          <div>PostgreSQL 29-Table Schema</div>
          <div>Region: asia-southeast1</div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 overflow-y-auto">
        {/* Top Bar Contract for Admin Workspace */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#A8B9A0]/40 pb-4">
          <div className="text-xs text-[#245B45]">
            <span>Admin Console</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-[#173D32] uppercase">{activeSection}</span>
          </div>

          <div className="flex items-center gap-3">
            {feedbackMsg && (
              <div className="px-3.5 py-1.5 bg-[#173D32] text-[#F8F6EF] text-xs rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A76A]" />
                <span>{feedbackMsg}</span>
              </div>
            )}
            <a
              href="/api/export-index-html"
              download="index.html"
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45] flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Download index.html</span>
            </a>
            <button
              type="button"
              onClick={fetchAdminAll}
              className="px-3.5 py-1.5 text-xs font-medium bg-white border border-[#A8B9A0]/60 rounded-lg hover:border-[#173D32] flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Database</span>
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW & ANALYTICS */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono-tabular">
              <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-5">
                <div className="text-xs font-sans text-[#252B27]/70">Total Revenue (BDT)</div>
                <div className="text-2xl font-bold text-[#173D32] mt-1">
                  ৳{Number(metrics.totalSales).toLocaleString('en-BD')}
                </div>
              </div>
              <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-5">
                <div className="text-xs font-sans text-[#252B27]/70">Total Orders</div>
                <div className="text-2xl font-bold text-[#173D32] mt-1">{metrics.totalOrders}</div>
                <div className="text-[11px] font-sans text-[#245B45] mt-1">
                  {metrics.pendingOrders} Pending · {metrics.completedOrders} Delivered
                </div>
              </div>
              <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-5">
                <div className="text-xs font-sans text-[#252B27]/70">Active Catalog Products</div>
                <div className="text-2xl font-bold text-[#173D32] mt-1">
                  {metrics.totalProducts}
                </div>
                <div className="text-[11px] font-sans text-amber-700 mt-1">
                  {metrics.lowStockCount} Low Stock Alerts
                </div>
              </div>
              <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-5">
                <div className="text-xs font-sans text-[#252B27]/70">Registered Accounts</div>
                <div className="text-2xl font-bold text-[#173D32] mt-1">
                  {metrics.totalCustomers}
                </div>
              </div>
            </div>

            {/* Monthly Revenue Performance Chart (SVG) */}
            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                    Monthly Revenue & Fulfillment Performance (BDT)
                  </h2>
                  <p className="text-xs text-[#252B27]/70">
                    6-month revenue trajectory across Dhaka Metro and nationwide courier zones
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-4 items-end pt-6 h-48 border-b border-[#F8F6EF] pb-2">
                {(adminData?.monthlyPerformance || []).map((m: any) => {
                  const pct = Math.min(100, Math.max(20, Math.round((m.revenue / 110000) * 100)));
                  return (
                    <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end">
                      <div className="text-[11px] font-mono-tabular font-semibold text-[#173D32]">
                        ৳{(m.revenue / 1000).toFixed(1)}k
                      </div>
                      <div
                        style={{ height: `${pct}%` }}
                        className="w-full max-w-[54px] bg-[#173D32] hover:bg-[#245B45] rounded-t-lg transition-all"
                      />
                      <div className="text-xs font-medium text-[#252B27]">{m.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low Stock Alert & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4">
                <h3 className="font-serif-display text-xl font-semibold text-[#173D32] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Low Stock Inventory Alerts (≤ 5 Units)</span>
                </h3>
                {(adminData?.lowStockProducts || []).length === 0 ? (
                  <p className="text-xs text-[#252B27]/70">All products have healthy inventory.</p>
                ) : (
                  <div className="divide-y divide-[#F8F6EF] text-xs">
                    {(adminData?.lowStockProducts || []).map((p: any) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#173D32]">{p.name}</div>
                          <div className="text-[#252B27]/60">SKU: {p.sku}</div>
                        </div>
                        <span className="font-mono-tabular font-bold text-amber-700">
                          {p.stockQuantity} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-display text-xl font-semibold text-[#173D32]">
                    Recent Customer Orders
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveSection('orders')}
                    className="text-xs font-semibold text-[#173D32] underline"
                  >
                    Manage All Orders
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#F8F6EF] text-[#245B45]">
                        <th className="py-2">Order #</th>
                        <th className="py-2">Customer</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Total (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8F6EF] font-mono-tabular">
                      {(adminData?.orders || []).slice(0, 5).map((o: any) => (
                        <tr key={o.id}>
                          <td className="py-2.5 font-semibold text-[#173D32]">{o.orderNumber}</td>
                          <td className="py-2.5 font-sans">
                            {o.customerName} ({o.district})
                          </td>
                          <td className="py-2.5 uppercase">{o.orderStatus}</td>
                          <td className="py-2.5 text-right font-semibold">
                            ৳{Number(o.totalAmount).toLocaleString('en-BD')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCT & INVENTORY MANAGEMENT */}
        {activeSection === 'products' && (
          <div className="space-y-8">
            <form
              onSubmit={handleSaveProduct}
              className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                  {editingProdId ? `Edit Product #${editingProdId}` : 'Add New Product to Database'}
                </h2>
                {editingProdId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProdId(null);
                      setProdName('');
                    }}
                    className="text-xs underline text-[#245B45]"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. DXN Roselle Herbal Drink"
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">SKU *</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="DXN-FB-015"
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Category *</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  >
                    {storeData.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">Regular Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={prodRegularPrice}
                    onChange={(e) => setProdRegularPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Discounted Price (BDT)</label>
                  <input
                    type="number"
                    value={prodDiscountedPrice}
                    onChange={(e) => setProdDiscountedPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Pack Weight / Volume</label>
                  <input
                    type="text"
                    value={prodWeight}
                    onChange={(e) => setProdWeight(e.target.value)}
                    placeholder="285ml"
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">Short Description *</label>
                  <input
                    type="text"
                    required
                    value={prodShortDesc}
                    onChange={(e) => setProdShortDesc(e.target.value)}
                    placeholder="Concise summary for product cards & meta description"
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Custom SEO Title</label>
                  <input
                    type="text"
                    value={prodSeoTitle}
                    onChange={(e) => setProdSeoTitle(e.target.value)}
                    placeholder="Leave blank to auto-generate"
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs pt-1">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={prodPublished}
                    onChange={(e) => setProdPublished(e.target.checked)}
                  />
                  <span>Published</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={prodFeatured}
                    onChange={(e) => setProdFeatured(e.target.checked)}
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={prodBestSeller}
                    onChange={(e) => setProdBestSeller(e.target.checked)}
                  />
                  <span>Best Seller</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={prodNewArrival}
                    onChange={(e) => setProdNewArrival(e.target.checked)}
                  />
                  <span>New Arrival</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={prodSpecialOffer}
                    onChange={(e) => setProdSpecialOffer(e.target.checked)}
                  />
                  <span>Special Offer</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{editingProdId ? 'Update Product in Database' : 'Publish Product'}</span>
              </button>
            </form>

            {/* Product Table */}
            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#A8B9A0]/35 text-[#245B45]">
                    <th className="py-2.5">Product</th>
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-right">Regular</th>
                    <th className="py-2.5 text-right">Sale</th>
                    <th className="py-2.5 text-right">Stock</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F6EF] font-mono-tabular">
                  {storeData.products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8F6EF]/50">
                      <td className="py-3 font-sans font-semibold text-[#173D32]">{p.name}</td>
                      <td className="py-3">{p.sku}</td>
                      <td className="py-3 font-sans">{p.categoryName}</td>
                      <td className="py-3 text-right">৳{p.regularPrice}</td>
                      <td className="py-3 text-right text-[#245B45] font-semibold">
                        {p.discountedPrice ? `৳${p.discountedPrice}` : '—'}
                      </td>
                      <td className="py-3 text-right font-bold">{p.stockQuantity}</td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProdId(p.id);
                              setProdName(p.name);
                              setProdSku(p.sku);
                              setProdCategoryId(p.categoryId);
                              setProdWeight(p.weight);
                              setProdRegularPrice(p.regularPrice);
                              setProdDiscountedPrice(p.discountedPrice || '');
                              setProdStock(String(p.stockQuantity));
                              setProdShortDesc(p.shortDescription);
                              setProdDesc(p.description);
                              setProdFeatured(p.isFeatured);
                              setProdBestSeller(p.isBestSeller);
                              setProdNewArrival(p.isNewArrival);
                              setProdSpecialOffer(p.isSpecialOffer);
                              setProdPublished(p.isPublished);
                            }}
                            aria-label={`Edit ${p.name}`}
                            className="p-1.5 text-[#173D32] hover:bg-[#EAE4D3] rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            aria-label={`Delete ${p.name}`}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CATEGORY MANAGEMENT */}
        {activeSection === 'categories' && (
          <div className="space-y-8">
            <form
              onSubmit={handleSaveCategory}
              className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4 text-xs"
            >
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                {editingCatId ? `Edit Category #${editingCatId}` : 'Create Product Category'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Organic Gift Sets"
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={catEnabled}
                      onChange={(e) => setCatEnabled(e.target.checked)}
                    />
                    <span>Enabled on Storefront & XML Sitemap</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Category Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Describe products in this category"
                  className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
              >
                {editingCatId ? 'Update Category' : 'Add Category'}
              </button>
            </form>

            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#A8B9A0]/35 text-[#245B45]">
                    <th className="py-2.5">Order</th>
                    <th className="py-2.5">Category Name</th>
                    <th className="py-2.5">URL Slug</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F6EF]">
                  {storeData.categories.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 font-mono-tabular">{c.sortOrder}</td>
                      <td className="py-2.5 font-semibold text-[#173D32]">{c.name}</td>
                      <td className="py-2.5 font-mono text-[#245B45]">/category/{c.slug}</td>
                      <td className="py-2.5">{c.isEnabled ? 'Enabled' : 'Disabled'}</td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(c.id);
                            setCatName(c.name);
                            setCatDesc(c.description || '');
                            setCatOrder(String(c.sortOrder));
                            setCatEnabled(c.isEnabled);
                          }}
                          className="text-xs underline text-[#173D32]"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ORDER & INVOICE MANAGEMENT */}
        {activeSection === 'orders' && (
          <div className="space-y-6">
            <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
              Order Management & Fulfillment ({adminData?.orders?.length || 0})
            </h2>

            {invoiceOrder && (
              <div className="bg-white border-2 border-[#173D32] rounded-2xl p-8 space-y-6">
                <div className="flex items-start justify-between border-b border-[#A8B9A0]/40 pb-4">
                  <div>
                    <div className="font-serif-display text-2xl font-bold text-[#173D32]">
                      DXN ORGANIC POINT — RETAIL INVOICE
                    </div>
                    <div className="text-xs text-[#252B27]/70">
                      Level 4, Botanical Arcade, Banani, Dhaka-1213 · +880 1711-009988
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular text-xs">
                    <div className="font-bold text-[#173D32]">
                      Invoice: {invoiceOrder.orderNumber}
                    </div>
                    <div>Tracking: {invoiceOrder.trackingNumber}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-[#173D32]">Billed & Shipped To:</div>
                    <div>{invoiceOrder.customerName}</div>
                    <div>{invoiceOrder.deliveryAddress}</div>
                    <div>
                      {invoiceOrder.area}, {invoiceOrder.district} - {invoiceOrder.postalCode}
                    </div>
                    <div>Phone: {invoiceOrder.customerPhone}</div>
                  </div>
                  <div className="text-right">
                    <div>Payment Method: {invoiceOrder.paymentMethod.toUpperCase()}</div>
                    <div>Payment Status: {invoiceOrder.paymentStatus.toUpperCase()}</div>
                    <div>Fulfillment Status: {invoiceOrder.orderStatus.toUpperCase()}</div>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-t border-[#F8F6EF]">
                  <thead>
                    <tr className="border-b border-[#A8B9A0]/40 text-[#245B45]">
                      <th className="py-2">Item</th>
                      <th className="py-2">SKU</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8F6EF] font-mono-tabular">
                    {(invoiceOrder.items || []).map((it: any) => (
                      <tr key={it.id}>
                        <td className="py-2 font-sans">{it.productName}</td>
                        <td className="py-2">{it.productSku}</td>
                        <td className="py-2 text-right">{it.quantity}</td>
                        <td className="py-2 text-right">৳{it.unitPrice}</td>
                        <td className="py-2 text-right font-semibold">৳{it.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center pt-4 border-t border-[#A8B9A0]/40">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceOrder(null)}
                      className="px-4 py-2 text-xs border border-[#173D32] text-[#173D32] rounded-lg"
                    >
                      Close Invoice
                    </button>
                  </div>
                  <div className="font-mono-tabular text-base font-bold text-[#173D32]">
                    Grand Total: ৳{Number(invoiceOrder.totalAmount).toLocaleString('en-BD')}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#A8B9A0]/35 text-[#245B45]">
                    <th className="py-2.5">Order #</th>
                    <th className="py-2.5">Customer & District</th>
                    <th className="py-2.5">Method</th>
                    <th className="py-2.5">Payment</th>
                    <th className="py-2.5">Order Status</th>
                    <th className="py-2.5 text-right">Total</th>
                    <th className="py-2.5 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F6EF] font-mono-tabular">
                  {(adminData?.orders || []).map((o: any) => (
                    <tr key={o.id}>
                      <td className="py-3 font-semibold text-[#173D32]">{o.orderNumber}</td>
                      <td className="py-3 font-sans">
                        <div className="font-semibold">{o.customerName}</div>
                        <div className="text-[#252B27]/65">
                          {o.customerPhone} · {o.district}
                        </div>
                      </td>
                      <td className="py-3 uppercase">{o.paymentMethod}</td>
                      <td className="py-3">
                        <select
                          aria-label={`Payment status for ${o.orderNumber}`}
                          value={o.paymentStatus}
                          onChange={(e) =>
                            handleOrderStatusChange(o.id, o.orderStatus, e.target.value)
                          }
                          className="px-2 py-1 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded text-xs font-sans"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid / Verified</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <select
                          aria-label={`Order status for ${o.orderNumber}`}
                          value={o.orderStatus}
                          onChange={(e) =>
                            handleOrderStatusChange(o.id, e.target.value, o.paymentStatus)
                          }
                          className="px-2 py-1 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded text-xs font-sans"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 text-right font-bold text-[#173D32]">
                        ৳{Number(o.totalAmount).toLocaleString('en-BD')}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInvoiceOrder(o)}
                          className="px-2.5 py-1 text-xs font-sans font-medium bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded hover:border-[#173D32]"
                        >
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. CUSTOMERS */}
        {activeSection === 'customers' && (
          <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4 overflow-x-auto">
            <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
              Customer Accounts & Access Control
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#A8B9A0]/35 text-[#245B45]">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5 text-right">Orders</th>
                  <th className="py-2.5 text-right">Total Spent</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F6EF] font-mono-tabular">
                {(adminData?.customers || []).map((c: any) => (
                  <tr key={c.id}>
                    <td className="py-3 font-sans font-semibold text-[#173D32]">{c.fullName}</td>
                    <td className="py-3 font-sans">{c.email}</td>
                    <td className="py-3 uppercase">{c.roleName}</td>
                    <td className="py-3 text-right">{c.ordersCount}</td>
                    <td className="py-3 text-right font-semibold">
                      ৳{Number(c.totalSpent || 0).toLocaleString('en-BD')}
                    </td>
                    <td className="py-3 text-right font-sans">
                      {c.roleName !== 'admin' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/customers/${c.id}/block`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isBlocked: !c.isBlocked }),
                            });
                            await fetchAdminAll();
                          }}
                          className="underline text-[#173D32]"
                        >
                          {c.isBlocked ? 'Unblock Account' : 'Active (Block)'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. BLOG & CONTENT CMS */}
        {activeSection === 'cms' && (
          <div className="space-y-8">
            <form
              onSubmit={handleSaveBlogPost}
              className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4 text-xs"
            >
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                {editingBlogId ? 'Edit Journal Article' : 'Publish New Blog / Journal Article'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="e.g. Benefits of Aloe Vera Hydration in Monsoon Weather"
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Publication Status</label>
                  <select
                    value={blogStatus}
                    onChange={(e) => setBlogStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  >
                    <option value="published">Published (Included in Sitemap)</option>
                    <option value="draft">Draft (Excluded from Sitemap)</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Article Excerpt / Meta Summary *</label>
                <input
                  type="text"
                  required
                  value={blogExcerpt}
                  onChange={(e) => setBlogExcerpt(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Article Body Content *</label>
                <textarea
                  rows={4}
                  required
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
              >
                {editingBlogId ? 'Update Article' : 'Publish Article'}
              </button>
            </form>

            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4">
              <h3 className="font-serif-display text-xl font-semibold text-[#173D32]">
                Published & Draft Articles ({storeData.blogPosts.length})
              </h3>
              <div className="divide-y divide-[#F8F6EF] text-xs">
                {storeData.blogPosts.map((post) => (
                  <div key={post.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-[#173D32]">{post.title}</div>
                      <div className="text-[#252B27]/65">
                        /blog/{post.slug} · Status: <strong>{post.status}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBlogId(post.id);
                          setBlogTitle(post.title);
                          setBlogExcerpt(post.excerpt);
                          setBlogContent(post.content);
                          setBlogStatus(post.status);
                        }}
                        className="underline text-[#173D32]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' });
                          await fetchAdminAll();
                          onRefreshStore();
                        }}
                        className="text-red-700 underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. MARKETING & COUPONS */}
        {activeSection === 'marketing' && (
          <div className="space-y-8">
            <form
              onSubmit={handleSaveCoupon}
              className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4 text-xs"
            >
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                Create Promotional Coupon Code
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-medium mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="EID20"
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Discount Percentage (%)</label>
                  <input
                    type="number"
                    value={couponPercent}
                    onChange={(e) => setCouponPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Minimum Order (BDT)</label>
                  <input
                    type="number"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
              >
                Create Coupon
              </button>
            </form>

            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4">
              <h3 className="font-serif-display text-xl font-semibold text-[#173D32]">
                Active Store Coupons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {storeData.coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-[#F8F6EF] border border-[#A8B9A0]/40 rounded-xl space-y-1"
                  >
                    <div className="font-mono font-bold text-sm text-[#173D32]">{c.code}</div>
                    <div>{c.description}</div>
                    <div className="text-[#245B45] font-mono-tabular">
                      Min: ৳{c.minOrderAmount} · Used: {c.usageCount} times · Exp: {c.expiryDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. PAYMENTS & GATEWAYS */}
        {activeSection === 'payments' && (
          <div className="space-y-8">
            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-3">
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                Bangladesh Payment Gateways (Sandbox / Test Mode Active)
              </h2>
              <p className="text-xs text-[#252B27]/80">
                All 6 Bangladeshi payment channels (bKash, Nagad, Rocket, SSLCommerz, City Bank
                Transfer, and Cash on Delivery) are configured and connected to the{' '}
                <code className="font-mono">payments</code> and{' '}
                <code className="font-mono">payment_transactions</code> PostgreSQL tables. Online
                gateways operate in labeled Sandbox mode until live merchant production credentials
                are entered in environment variables.
              </p>
            </div>

            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 overflow-x-auto">
              <h3 className="font-serif-display text-xl font-semibold text-[#173D32] mb-4">
                Payment Transaction Ledger
              </h3>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#A8B9A0]/35 text-[#245B45]">
                    <th className="py-2.5">Gateway</th>
                    <th className="py-2.5">Transaction Ref</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F6EF] font-mono-tabular">
                  {(adminData?.transactions || []).map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="py-2.5 font-semibold text-[#173D32]">{tx.gatewayName}</td>
                      <td className="py-2.5">{tx.gatewayTransactionId}</td>
                      <td className="py-2.5">{tx.rawStatus}</td>
                      <td className="py-2.5 font-sans text-[#252B27]/80">
                        {tx.gatewayResponseSummary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. SEO, DYNAMIC XML SITEMAPS & GOOGLE SEARCH CONSOLE */}
        {activeSection === 'seo' && (
          <div className="space-y-8">
            <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                    Dynamic XML Sitemap & Google Indexing System
                  </h2>
                  <p className="text-xs text-[#252B27]/75 mt-0.5">
                    Generated automatically in real time from PostgreSQL. Private routes (/admin,
                    /account, /checkout, /cart, /search) and draft/unpublished items are strictly
                    excluded.
                  </p>
                </div>
                <div className="text-xs font-mono-tabular text-[#245B45]">
                  Updated: {seoStatus?.lastGeneratedAt?.slice(0, 19).replace('T', ' ')} UTC
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#A8B9A0]/35 text-[#245B45]">
                      <th className="py-2.5 pr-4">Sitemap File</th>
                      <th className="py-2.5 px-4">Endpoint</th>
                      <th className="py-2.5 px-6 text-right">Indexed URLs</th>
                      <th className="py-2.5 px-6">Health Status</th>
                      <th className="py-2.5 pl-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8F6EF] font-mono-tabular">
                    {(seoStatus?.sitemaps || []).map((sm: any) => {
                      const pathOnly = new URL(sm.url).pathname;
                      return (
                        <tr key={sm.name}>
                          <td className="py-3 pr-4 font-sans font-semibold text-[#173D32]">{sm.name}</td>
                          <td className="py-3 px-4 text-[#245B45]">{pathOnly}</td>
                          <td className="py-3 px-6 text-right font-bold">{sm.count}</td>
                          <td className="py-3 px-6 text-[#245B45]">{sm.status}</td>
                          <td className="py-3 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleInspectXmlUrl(pathOnly)}
                              className="px-3 py-1 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded text-xs font-sans font-medium hover:border-[#173D32]"
                            >
                              Preview Live XML
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="py-3 pr-4 font-sans font-semibold text-[#173D32]">
                        Crawler Directives (robots.txt)
                      </td>
                      <td className="py-3 px-4 text-[#245B45]">/robots.txt</td>
                      <td className="py-3 px-6 text-right">—</td>
                      <td className="py-3 px-6 text-[#245B45]">Active (200 OK)</td>
                      <td className="py-3 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleInspectXmlUrl('/robots.txt')}
                          className="px-3 py-1 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded text-xs font-sans font-medium hover:border-[#173D32]"
                        >
                          Preview robots.txt
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {liveXmlPreview && (
                <div className="bg-[#173D32] text-[#F8F6EF] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#C6A76A]">
                    <span className="font-mono">Live Response: GET {liveXmlPreview.url}</span>
                    <button
                      type="button"
                      onClick={() => setLiveXmlPreview(null)}
                      className="underline"
                    >
                      Close Preview
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono overflow-x-auto max-h-64 whitespace-pre-wrap text-[#F8F6EF]/90">
                    {liveXmlPreview.content}
                  </pre>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4 text-xs"
            >
              <h3 className="font-serif-display text-xl font-semibold text-[#173D32]">
                Google Search Console Verification & Global SEO Defaults
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">
                    Google Search Console HTML Verification Tag
                  </label>
                  <input
                    type="text"
                    value={gscCode}
                    onChange={(e) => setGscCode(e.target.value)}
                    placeholder="google-site-verification=..."
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Default Meta Title</label>
                  <input
                    type="text"
                    value={seoDefaultTitle}
                    onChange={(e) => setSeoDefaultTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Default Meta Description</label>
                <input
                  type="text"
                  value={seoDefaultDesc}
                  onChange={(e) => setSeoDefaultDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Custom robots.txt Rules</label>
                <textarea
                  rows={5}
                  value={robotsRules}
                  onChange={(e) => setRobotsRules(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
              >
                Save SEO & Robots Configuration
              </button>
            </form>
          </div>
        )}

        {/* 10. WEBSITE SETTINGS */}
        {activeSection === 'settings' && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 space-y-4 text-xs"
          >
            <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
              Website Brand, Contact & Homepage Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Brand Title</label>
                <input
                  type="text"
                  value={brandTitle}
                  onChange={(e) => setBrandTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Support Phone / WhatsApp</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Top Announcement Bar Text</label>
              <input
                type="text"
                value={announcementBar}
                onChange={(e) => setAnnouncementBar(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Dhaka Office & Hub Address</label>
              <input
                type="text"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">About Us Content</label>
              <textarea
                rows={4}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
            >
              Save Website Settings to Database
            </button>
          </form>
        )}

        {/* 11. SETUP & DEPLOYMENT GUIDE */}
        {activeSection === 'guide' && (
          <div className="bg-white border border-[#A8B9A0]/40 rounded-xl p-6 sm:p-8 space-y-6 text-xs leading-relaxed">
            <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
              DXN Organic Point — Architecture, Setup & Deployment Guide
            </h2>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#173D32]">
                1. Environment Variables (.env)
              </h3>
              <pre className="p-4 bg-[#F8F6EF] rounded-lg font-mono text-[11px] overflow-x-auto">
                {`SQL_HOST="/cloudsql/instance"
SQL_DB_NAME="postgres"
SQL_USER="app_user"
SQL_PASSWORD="<injected_by_runtime>"
SQL_ADMIN_USER="admin_user"
SQL_ADMIN_PASSWORD="<injected_by_runtime>"
SSLCOMMERZ_STORE_ID="dxnor6720sandbox"
SSLCOMMERZ_STORE_PASS="dxnor6720sandbox@ssl"
BKASH_APP_KEY="sandbox_bkash_app_key"
NAGAD_MERCHANT_ID="sandbox_nagad_merchant"`}
              </pre>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#173D32]">
                2. Database Schema & Migrations (29 Tables in Cloud SQL PostgreSQL)
              </h3>
              <p>
                Defined in <code className="font-mono">src/db/schema.ts</code> and managed via
                Drizzle Kit (<code className="font-mono">src/db/drizzle.config.ts</code>). Includes{' '}
                <code className="font-mono">
                  users, profiles, roles, addresses, products, product_images, categories,
                  product_variants, inventory, orders, order_items, payments, payment_transactions,
                  coupons, coupon_usage, wishlists, wishlist_items, reviews, blog_posts,
                  blog_categories, blog_tags, post_tags, banners, testimonials,
                  newsletter_subscribers, shipping_zones, site_settings, notifications, audit_logs
                </code>
                .
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#173D32]">
                3. Default Admin & Demo Customer Credentials
              </h3>
              <p>
                • <strong>Store Admin:</strong>{' '}
                <code className="font-mono">admin@dxnorganicpoint.com</code> / Password:{' '}
                <code className="font-mono">Admin@DXN2026</code>
                <br />• <strong>Demo Customer:</strong>{' '}
                <code className="font-mono">farhana.rahman@example.com</code> / Password:{' '}
                <code className="font-mono">Customer@2026</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
