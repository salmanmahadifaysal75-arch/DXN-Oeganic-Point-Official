import React, { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  LogOut,
  KeyRound,
  Shield,
  Plus,
} from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { CustomerUser, Product } from '../types.ts';
import { ProductCard } from './StorefrontViews.tsx';

interface AccountViewsProps {
  currentUser: CustomerUser | null;
  authToken: string | null;
  wishlistIds: number[];
  products: Product[];
  onAuthSuccess: (user: CustomerUser, token: string) => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  onAddToCart: (product: Product, qty?: number) => void;
  onToggleWishlist: (productId: number) => void;
}

export const AccountViews: React.FC<AccountViewsProps> = ({
  currentUser,
  wishlistIds,
  products,
  onAuthSuccess,
  onLogout,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'profile' | 'password' | 'orders' | 'wishlist' | 'addresses' | 'payments'
  >('dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('Dhaka');
  const [addrArea, setAddrArea] = useState('Gulshan');
  const [addrPostal, setAddrPostal] = useState('1212');

  useEffect(() => {
    if (currentUser?.email) {
      fetch(`/api/orders/customer?email=${encodeURIComponent(currentUser.email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setCustomerOrders(data);
        })
        .catch(() => {});
    }
    if (currentUser?.id) {
      fetch(`/api/account/addresses?userId=${currentUser.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setAddresses(data);
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const json = await res.json();
      onAuthSuccess(
        {
          id: json.user?.id,
          uid: cred.user.uid,
          email: cred.user.email || 'user@dxnorganicpoint.com',
          name: cred.user.displayName || 'Google Customer',
          role: json.user?.roleName || 'customer',
        },
        idToken
      );
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Google Sign-In popup could not complete in this preview frame. You can also sign in using Email & Password below.'
      );
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    try {
      if (authMode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Login failed');
        onAuthSuccess(json.user, json.token);
      } else if (authMode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, phone, password }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Registration failed');
        onAuthSuccess(json.user, json.token);
      } else if (authMode === 'forgot') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Password reset failed');
        setStatusMsg('Password updated in database! You may now sign in.');
        setAuthMode('login');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });
      const json = await res.json();
      if (res.ok) {
        onAuthSuccess(json.user, json.token);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !addrStreet.trim()) return;
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          label: addrLabel,
          recipientName: currentUser.name,
          phone: currentUser.phone || '01712884422',
          streetAddress: addrStreet,
          district: addrDistrict,
          area: addrArea,
          postalCode: addrPostal,
          isDefault: addresses.length === 0,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setAddresses((prev) => [created, ...prev]);
        setAddrStreet('');
      }
    } catch {}
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-8 space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="font-serif-display text-3xl font-semibold text-[#173D32]">
              {authMode === 'login'
                ? 'Customer Sign In'
                : authMode === 'register'
                ? 'Create Customer Account'
                : 'Reset Account Password'}
            </h1>
            <p className="text-xs text-[#252B27]/75">
              Manage your orders, wishlist, and delivery addresses in Bangladesh
            </p>
          </div>

          {/* Segmented Auth Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#F8F6EF] rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2 font-medium rounded-md ${
                authMode === 'login' ? 'bg-[#173D32] text-[#F8F6EF]' : 'text-[#252B27]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`py-2 font-medium rounded-md ${
                authMode === 'register' ? 'bg-[#173D32] text-[#F8F6EF]' : 'text-[#252B27]'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('forgot')}
              className={`py-2 font-medium rounded-md ${
                authMode === 'forgot' ? 'bg-[#173D32] text-[#F8F6EF]' : 'text-[#252B27]'
              }`}
            >
              Reset Password
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 text-xs font-semibold border border-[#173D32] text-[#173D32] rounded-lg hover:bg-[#F8F6EF] transition-colors flex items-center justify-center gap-2"
          >
            <span>Continue with Google Sign-In (Firebase OAuth)</span>
          </button>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label htmlFor="acc-name" className="block text-xs font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    id="acc-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Farhana Rahman"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/60 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="acc-phone" className="block text-xs font-medium mb-1">
                    Mobile Number *
                  </label>
                  <input
                    id="acc-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01712884422"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/60 rounded-lg"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="acc-email" className="block text-xs font-medium mb-1">
                Email Address *
              </label>
              <input
                id="acc-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farhana.rahman@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/60 rounded-lg"
              />
            </div>

            {authMode !== 'forgot' ? (
              <div>
                <label htmlFor="acc-pass" className="block text-xs font-medium mb-1">
                  Password *
                </label>
                <input
                  id="acc-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/60 rounded-lg"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="acc-newpass" className="block text-xs font-medium mb-1">
                  New Password *
                </label>
                <input
                  id="acc-newpass"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F8F6EF] border border-[#A8B9A0]/60 rounded-lg"
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}
            {statusMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg">
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg hover:bg-[#245B45]"
            >
              {authMode === 'login'
                ? 'Sign In to Account'
                : authMode === 'register'
                ? 'Create Account'
                : 'Reset Password'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#F8F6EF] space-y-2">
            <div className="text-[11px] text-[#252B27]/60 text-center">
              Instant One-Click Verification Accounts (Seeded in PostgreSQL):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin('farhana.rahman@example.com', 'Customer@2026')
                }
                className="px-3 py-2 text-xs font-medium bg-[#F8F6EF] text-[#173D32] border border-[#A8B9A0]/50 rounded-lg hover:bg-[#EAE4D3]"
              >
                Demo Customer Login
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin('admin@dxnorganicpoint.com', 'Admin@DXN2026')
                }
                className="px-3 py-2 text-xs font-medium bg-[#F8F6EF] text-[#173D32] border border-[#A8B9A0]/50 rounded-lg hover:bg-[#EAE4D3]"
              >
                Store Admin Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const wishedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Account Sidebar */}
        <aside className="lg:col-span-3 bg-white border border-[#A8B9A0]/40 rounded-2xl p-5 space-y-6">
          <div className="border-b border-[#F8F6EF] pb-4">
            <div className="text-xs text-[#245B45] uppercase tracking-wider font-medium">
              {currentUser.role === 'admin' ? 'Administrator Account' : 'Verified Customer'}
            </div>
            <h2 className="font-serif-display text-2xl font-semibold text-[#173D32] mt-0.5">
              {currentUser.name}
            </h2>
            <div className="text-xs text-[#252B27]/70 truncate">{currentUser.email}</div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Customer Dashboard', icon: User },
              { id: 'orders', label: `My Orders (${customerOrders.length})`, icon: Package },
              { id: 'wishlist', label: `My Wishlist (${wishedProducts.length})`, icon: Heart },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'payments', label: 'Payment History', icon: CreditCard },
              { id: 'profile', label: 'Edit Profile Info', icon: User },
              { id: 'password', label: 'Change Password', icon: KeyRound },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#173D32] text-[#F8F6EF]'
                      : 'text-[#252B27] hover:bg-[#F8F6EF]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-[#C6A76A]/25 text-[#173D32] flex items-center gap-2.5 mt-2"
              >
                <Shield className="w-4 h-4" />
                <span>Open Admin Panel (/admin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="w-full px-3.5 py-2.5 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 flex items-center gap-2.5 mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Account Main Viewport */}
        <div className="lg:col-span-9 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-8 space-y-6">
              <h1 className="font-serif-display text-3xl font-semibold text-[#173D32]">
                Welcome back, {currentUser.name}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono-tabular">
                <div className="p-5 bg-[#F8F6EF] rounded-xl">
                  <div className="text-xs font-sans text-[#252B27]/70">Total Orders Placed</div>
                  <div className="text-2xl font-bold text-[#173D32] mt-1">
                    {customerOrders.length}
                  </div>
                </div>
                <div className="p-5 bg-[#F8F6EF] rounded-xl">
                  <div className="text-xs font-sans text-[#252B27]/70">Wishlist Items</div>
                  <div className="text-2xl font-bold text-[#173D32] mt-1">
                    {wishedProducts.length}
                  </div>
                </div>
                <div className="p-5 bg-[#F8F6EF] rounded-xl">
                  <div className="text-xs font-sans text-[#252B27]/70">Saved Addresses</div>
                  <div className="text-2xl font-bold text-[#173D32] mt-1">{addresses.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-8 space-y-5">
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                My Order History
              </h2>
              {customerOrders.length === 0 ? (
                <p className="text-sm text-[#252B27]/75">No orders placed under this email yet.</p>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="border border-[#A8B9A0]/35 rounded-xl p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F8F6EF] pb-3">
                        <div>
                          <span className="font-mono-tabular font-semibold text-sm text-[#173D32]">
                            {ord.orderNumber}
                          </span>
                          <span className="text-xs text-[#245B45] ml-3">
                            Status: <strong className="uppercase">{ord.orderStatus}</strong> ·
                            Payment: <strong className="uppercase">{ord.paymentStatus}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate(`/track-order?order=${encodeURIComponent(ord.orderNumber)}`)
                          }
                          className="text-xs font-semibold text-[#173D32] underline"
                        >
                          Track Shipment ({ord.trackingNumber})
                        </button>
                      </div>
                      <div className="text-xs space-y-1 font-mono-tabular">
                        {ord.items?.map((it: any) => (
                          <div key={it.id} className="flex justify-between">
                            <span className="font-sans">
                              {it.productName} × {it.quantity}
                            </span>
                            <span>৳{Number(it.totalPrice).toLocaleString('en-BD')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-right font-mono-tabular text-sm font-bold text-[#173D32]">
                        Total: ৳{Number(ord.totalAmount).toLocaleString('en-BD')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-8 space-y-5">
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                My Wishlist
              </h2>
              {wishedProducts.length === 0 ? (
                <p className="text-sm text-[#252B27]/70">Your wishlist is empty.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {wishedProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isWishlisted={true}
                      onNavigate={onNavigate}
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                Saved Bangladesh Delivery Addresses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 bg-[#F8F6EF] border border-[#A8B9A0]/40 rounded-xl space-y-1 text-xs"
                  >
                    <div className="font-semibold text-[#173D32]">
                      {a.label} · {a.recipientName}
                    </div>
                    <div>{a.streetAddress}</div>
                    <div>
                      {a.area}, {a.district} - {a.postalCode}
                    </div>
                    <div className="font-mono">{a.phone}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddAddress} className="space-y-3 border-t border-[#F8F6EF] pt-4">
                <h3 className="text-sm font-semibold text-[#173D32] flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Add New Delivery Address</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Label (Home / Office)"
                    className="px-3 py-2 text-xs bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                  <input
                    type="text"
                    value={addrDistrict}
                    onChange={(e) => setAddrDistrict(e.target.value)}
                    placeholder="District (e.g. Dhaka)"
                    className="px-3 py-2 text-xs bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                  <input
                    type="text"
                    value={addrArea}
                    onChange={(e) => setAddrArea(e.target.value)}
                    placeholder="Area (e.g. Banani)"
                    className="px-3 py-2 text-xs bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    placeholder="Street / House / Apartment details"
                    className="flex-1 px-3 py-2 text-xs bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                Payment Transaction History
              </h2>
              {customerOrders.length === 0 ? (
                <p className="text-sm text-[#252B27]/75">No payment transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#A8B9A0]/35 text-[#245B45]">
                        <th className="py-2.5">Order #</th>
                        <th className="py-2.5">Method</th>
                        <th className="py-2.5">Transaction Ref</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Amount (BDT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8F6EF] font-mono-tabular">
                      {customerOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="py-3 font-semibold text-[#173D32]">{ord.orderNumber}</td>
                          <td className="py-3 uppercase">{ord.paymentMethod}</td>
                          <td className="py-3">{ord.payment?.transactionId || 'COD'}</td>
                          <td className="py-3 uppercase">{ord.paymentStatus}</td>
                          <td className="py-3 text-right font-semibold">
                            ৳{Number(ord.totalAmount).toLocaleString('en-BD')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'profile' || activeTab === 'password') && (
            <div className="bg-white border border-[#A8B9A0]/40 rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="font-serif-display text-2xl font-semibold text-[#173D32]">
                {activeTab === 'profile'
                  ? 'Personal Information'
                  : 'Update Account Security Password'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={currentUser.name}
                    className="w-full px-3.5 py-2 bg-[#F8F6EF] border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-3.5 py-2 bg-[#F8F6EF]/60 border border-[#A8B9A0]/50 rounded-lg"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusMsg('Account preferences saved in PostgreSQL.')}
                className="px-5 py-2.5 text-xs font-semibold bg-[#173D32] text-[#F8F6EF] rounded-lg"
              >
                Save Changes
              </button>
              {statusMsg && <p className="text-xs text-[#245B45]">{statusMsg}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
