import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productsService } from '../../services/products.service';
import { ordersService } from '../../services/orders.service';
import { Product, CreateProductInput } from '../../types/commerce';
import { hasRole } from '../../config/permissions';
import { parseApiError } from '../../lib/api-errors';
import { formatINR } from '../../lib/formatters';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  ShoppingBag,
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles,
  Share2,
  Truck,
  Layers,
  ArrowRight,
} from 'lucide-react';

export function StorePage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = hasRole(user, 'ADMIN');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Self Order State
  const [selectedColor, setSelectedColor] = useState('Midnight Black');
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedDepot, setSelectedDepot] = useState('Campus Table Booth A');

  // Order Placement Modal
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [modalSize, setModalSize] = useState<string>('M');
  const [quantity, setQuantity] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Admin Add Product Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('Apparel');
  const [prodSku, setProdSku] = useState('');
  const [prodMemberPrice, setProdMemberPrice] = useState(38);
  const [prodStandardPrice, setProdStandardPrice] = useState(45);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productsService.listProducts({ limit: 50 });
      setProducts(res.products || []);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const featuredProduct = products[0];

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderProduct && !featuredProduct) return;
    const target = orderProduct || featuredProduct;

    setIsPlacingOrder(true);
    setFeedback(null);
    try {
      await ordersService.createOrder({
        items: [
          {
            productId: target.id,
            size: modalSize || selectedSize,
            quantity,
          },
        ],
      });
      setFeedback({
        type: 'success',
        message: `Order confirmed for ${target.name} (${modalSize || selectedSize})! Pick up at ${selectedDepot}.`,
      });
      setOrderProduct(null);
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProduct(true);
    setFeedback(null);
    try {
      await productsService.createProduct({
        name: prodName.trim(),
        description: prodDesc.trim() || '',
        category: prodCat.trim(),
        sku: prodSku.trim().toUpperCase(),
        memberPrice: Number(prodMemberPrice),
        standardPrice: Number(prodStandardPrice),
        variants: [
          { size: 'S', stock: 15 },
          { size: 'M', stock: 25 },
          { size: 'L', stock: 20 },
          { size: 'XL', stock: 10 },
        ],
      });
      setFeedback({ type: 'success', message: 'Product drop created in merchandise catalog.' });
      setIsCreateOpen(false);
      await loadData();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Live Pre-Order Bar matching Stitch stitch_merch_store.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0d1c2d] border border-[#273647]/70 text-xs text-[#8e8fa3] light:bg-slate-50 light:border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
          <span className="font-semibold text-[#d4e4fa] light:text-slate-900">LIVE PRE-ORDER WINDOW:</span>
          <span>Batch #1 supplier cutoff: Thursday 11:59 PM EST. 100% paperless student orders enabled.</span>
        </div>
        {isAdmin && (
          <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)} className="h-7 text-xs bg-[#0047FF]">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Product Drop
          </Button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#006e4b]/20 border border-[#006e4b]/40 text-[#4edea3]'
              : 'bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffb4ab]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hero Product Drop Section matching Stitch */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-xl bg-[#122131] border border-[#273647] p-6 shadow-sm light:bg-white light:border-[#E2E8F0]">
        {/* Left Column: Product Info */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold bg-[#1c2b3c] text-[#d4e4fa] px-2 py-0.5 rounded border border-[#273647]">
              BATCH #1 OPEN
            </span>
            <span className="text-[10px] font-bold bg-[#0047FF] text-white px-2 py-0.5 rounded">
              Spring 2026 Edition
            </span>
            <span className="text-[10px] font-semibold text-[#4edea3] flex items-center gap-1">
              • 3 Days Left to Order
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7bd0ff]">
              OFFICIAL APPAREL DROP
            </span>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-[#d4e4fa] tracking-tight light:text-slate-900">
              {featuredProduct?.name || 'Official Skyline 2026 Embroidered Heavyweight Hoodie'}
            </h1>
            <p className="text-xs text-[#8e8fa3] leading-relaxed max-w-xl light:text-slate-500">
              {featuredProduct?.description ||
                'Custom 420-GSM French terry cotton with high-density architectural chest embroidery and serialized wrist tag. Automated online size reservation and instant dues member discount verification.'}
            </p>
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            <span className="text-3xl font-bold font-mono text-[#d4e4fa] light:text-slate-900">
              {featuredProduct ? formatINR(featuredProduct.standardPrice) : '—'}
            </span>
            {featuredProduct && (
              <span className="text-xs font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded border border-[#006e4b]/40">
                Members pay {formatINR(featuredProduct.memberPrice)} (Save {formatINR(Math.max(0, featuredProduct.standardPrice - featuredProduct.memberPrice))})
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#273647]/50 text-xs text-[#8e8fa3]">
            <div>
              <span className="text-[10px] uppercase font-semibold">Total Stock</span>
              <div className="font-bold text-[#d4e4fa] light:text-slate-900 font-mono mt-0.5">
                {featuredProduct?.variants ? featuredProduct.variants.reduce((sum, v) => sum + v.stock, 0) : 0} units
              </div>
              <span className="text-[9px] text-[#4edea3]">Live Warehouse Inventory</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold">Category</span>
              <div className="font-bold text-[#d4e4fa] light:text-slate-900 font-mono mt-0.5">
                {featuredProduct?.category || 'Apparel'}
              </div>
              <span className="text-[9px]">Official Merchandise</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold">Product SKU</span>
              <div className="font-bold text-[#d4e4fa] light:text-slate-900 font-mono mt-0.5 truncate">
                {featuredProduct?.sku || 'CF-MERCH'}
              </div>
              <span className="text-[9px]">CampusFlow Store</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview & Order Action */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="h-56 rounded-xl bg-[#0d1c2d] border border-[#273647] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden light:bg-slate-100">
            <ShoppingBag className="w-16 h-16 text-[#7bd0ff] mb-2" />
            <span className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">
              3 Colorways Live • Fabric: 100% French Terry Cotton
            </span>
            <span className="text-[10px] text-[#8e8fa3] mt-0.5">
              Midnight Black • Skyline Navy • Heather Gray
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              className="flex-1 h-9 bg-[#0047FF] hover:bg-[#0038CC] text-white font-semibold text-xs shadow-none"
              onClick={() => {
                if (featuredProduct) {
                  setOrderProduct(featuredProduct);
                  setModalSize('M');
                }
              }}
            >
              <Package className="w-4 h-4 mr-1.5" />
              + Order Size Now
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-9 px-3 bg-[#1c2b3c] border border-[#273647] text-xs"
              aria-label="Copy store link"
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  void navigator.share({ title: 'CampusFlow Store', url }).catch(() => undefined);
                  return;
                }
                void navigator.clipboard.writeText(url);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Size & Real-Time Inventory Matrix matching Stitch */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-headline font-bold text-[#d4e4fa] light:text-slate-900">
              Size & Real-Time Inventory Matrix
            </h3>
            <p className="text-[11px] text-[#8e8fa3] light:text-slate-500">
              Live inventory by size variant. Automatically decrements upon member order checkout.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#7bd0ff]">
            Total In Stock: {featuredProduct?.variants ? featuredProduct.variants.reduce((sum, v) => sum + v.stock, 0) : 0} units
          </span>
        </div>

        {featuredProduct?.variants && featuredProduct.variants.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProduct.variants.map((v) => (
              <div key={v.id} className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm space-y-2 light:bg-white light:border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#d4e4fa] light:text-slate-900">Size {v.size}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    v.stock === 0
                      ? 'text-[#ffb4ab] bg-[#93000a]/20'
                      : v.stock <= 5
                      ? 'text-[#fbbf24] bg-amber-500/20'
                      : 'text-[#4edea3] bg-[#006e4b]/20'
                  }`}>
                    {v.stock === 0 ? 'Out of Stock' : v.stock <= 5 ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
                <div className="text-[11px] text-[#8e8fa3] flex justify-between">
                  <span>Available Units:</span>
                  <span className="font-mono text-[#d4e4fa] font-semibold light:text-slate-900">{v.stock}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1c2b3c] overflow-hidden light:bg-slate-200">
                  <div
                    className="h-full bg-[#0047FF] rounded-full"
                    style={{ width: `${Math.min(100, v.stock > 0 ? Math.max(15, v.stock * 5) : 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#7bd0ff] font-semibold">{v.stock > 0 ? `${v.stock} Available` : 'Sold Out'}</span>
                  <span className="text-[#8e8fa3]">Instant Reserve</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#8e8fa3] rounded-xl bg-[#122131] border border-[#273647]/60 light:bg-white">
            No size variants configured for this product.
          </div>
        )}
      </section>

      {/* Student 24/7 Self-Order Form & Size Distribution matching Stitch */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Self-Order Form (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#122131] border border-[#273647]/60 p-5 shadow-sm space-y-4 light:bg-white light:border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-headline font-bold text-[#d4e4fa] light:text-slate-900">
              Student 24/7 Self-Order Form
            </h3>
            <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded">
              Live Preview
            </span>
          </div>

          <p className="text-[11px] text-[#8e8fa3] light:text-slate-500">
            How students see and order online via portal link or club booth tablet kiosk.
          </p>

          <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
            {/* 1. Colorway */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] mb-1.5">
                1. Select Colorway
              </span>
              <div className="flex items-center gap-2">
                {['Midnight Black', 'Skyline Navy', 'Heather Gray'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      selectedColor === color
                        ? 'bg-[#0047FF] text-white border-[#0047FF]'
                        : 'bg-[#0d1c2d] text-[#c4c5da] border-[#273647] hover:bg-[#1c2b3c] light:bg-slate-50 light:border-slate-300 light:text-slate-800'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Choose Size */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3]">
                  2. Choose Size
                </span>
                <span className="text-[10px] text-[#8e8fa3]">Relaxed Oversized Fit</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(featuredProduct?.variants && featuredProduct.variants.length > 0
                  ? featuredProduct.variants.map((v) => v.size)
                  : ['S', 'M', 'L', 'XL']
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`py-2 rounded-lg border text-center font-bold text-xs transition-colors ${
                      selectedSize === s
                        ? 'bg-[#0047FF] text-white border-[#0047FF]'
                        : 'bg-[#0d1c2d] text-[#d4e4fa] border-[#273647] hover:bg-[#1c2b3c] light:bg-slate-50 light:border-slate-300 light:text-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Pickup Depot */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8e8fa3] mb-1.5">
                3. Pickup Depot
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDepot('Campus Table Booth A')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedDepot === 'Campus Table Booth A'
                      ? 'bg-[#0047FF]/15 border-[#0047FF]'
                      : 'bg-[#0d1c2d] border-[#273647] light:bg-slate-50 light:border-slate-200'
                  }`}
                >
                  <p className="font-semibold text-[#d4e4fa] light:text-slate-900">Campus Table Booth A</p>
                  <p className="text-[10px] text-[#8e8fa3] mt-0.5">Student Center Plaza • 12:00-4:00 PM</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDepot('Club Room 204')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedDepot === 'Club Room 204'
                      ? 'bg-[#0047FF]/15 border-[#0047FF]'
                      : 'bg-[#0d1c2d] border-[#273647] light:bg-slate-50 light:border-slate-200'
                  }`}
                >
                  <p className="font-semibold text-[#d4e4fa] light:text-slate-900">Club Room 204</p>
                  <p className="text-[10px] text-[#8e8fa3] mt-0.5">Lockers / Exec Desk • 24/7 Access</p>
                </button>
              </div>
            </div>

            {/* Instant Checkout Total & Submit */}
            <div className="p-3 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 flex items-center justify-between light:bg-slate-50">
              <div>
                <span className="text-[10px] text-[#8e8fa3]">Instant Checkout Total</span>
                <div className="text-sm font-bold font-mono text-[#d4e4fa] light:text-slate-900">
                  {featuredProduct ? formatINR(featuredProduct.memberPrice) : '—'}{' '}
                  {featuredProduct && (
                    <span className="text-[10px] text-[#4edea3] font-normal">
                      (Member Rate)
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="sm"
                variant="primary"
                isLoading={isPlacingOrder}
                className="h-8 px-4 bg-[#0047FF] hover:bg-[#0038CC] shadow-none"
              >
                Confirm Pre-Order
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Size Distribution Chart & Supplier Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-[#122131] border border-[#273647]/60 p-5 shadow-sm space-y-4 light:bg-white light:border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">
                Size Stock Breakdown
              </h3>
              <span className="text-[10px] font-mono text-[#8e8fa3]">
                {featuredProduct?.variants?.length || 0} Size Options
              </span>
            </div>

            {/* Bar Chart Visualization matching Stitch */}
            {featuredProduct?.variants && featuredProduct.variants.length > 0 ? (
              <div className="h-36 flex items-end justify-between gap-4 px-4 pt-4 pb-2 bg-[#0d1c2d] rounded-lg border border-[#273647]/40 light:bg-slate-50">
                {(() => {
                  const maxStock = Math.max(...featuredProduct.variants.map((v) => v.stock), 1);
                  return featuredProduct.variants.map((v) => {
                    const heightPct = Math.round((v.stock / maxStock) * 100);
                    return (
                      <div key={v.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-mono font-bold text-[#d4e4fa] light:text-slate-900">
                          {v.stock}
                        </span>
                        <div
                          className="w-full bg-[#7bd0ff] rounded-t"
                          style={{ height: `${Math.max(8, heightPct)}%` }}
                        />
                        <span className="text-[10px] font-bold text-[#8e8fa3]">{v.size}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center bg-[#0d1c2d] rounded-lg border border-[#273647]/40 text-xs text-[#8e8fa3]">
                No size breakdown available
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
                <span className="text-[10px] text-[#8e8fa3]">Total In-Stock Units</span>
                <div className="text-xs font-bold text-[#d4e4fa] light:text-slate-900 mt-0.5">
                  {featuredProduct?.variants ? featuredProduct.variants.reduce((sum, v) => sum + v.stock, 0) : 0} units
                </div>
              </div>
              <div className="p-2.5 rounded bg-[#0d1c2d] border border-[#273647]/40 light:bg-slate-50">
                <span className="text-[10px] text-[#8e8fa3]">Active Catalog SKU</span>
                <div className="text-xs font-bold text-[#d4e4fa] light:text-slate-900 mt-0.5 truncate">
                  {featuredProduct?.sku || 'CF-MERCH'}
                </div>
              </div>
            </div>

            {/* Catalog Info Card */}
            <div className="p-3 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 flex items-center justify-between light:bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#7bd0ff]" />
                <div>
                  <p className="text-xs font-semibold text-[#d4e4fa] light:text-slate-900">
                    Distribution: Campus Table & Club Room
                  </p>
                  <p className="text-[10px] text-[#8e8fa3]">
                    Orders logged to Treasury
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#4edea3] bg-[#006e4b]/20 px-2 py-0.5 rounded border border-[#006e4b]/40">
                Active Catalog
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Grid for other products */}
      {products.length > 1 && (
        <section className="space-y-3 pt-4 border-t border-[#273647]/50">
          <h3 className="text-sm font-headline font-bold text-[#d4e4fa] light:text-slate-900">
            More Club Merch & Accessories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.slice(1).map((prod) => (
              <div
                key={prod.id}
                className="rounded-xl bg-[#122131] border border-[#273647]/60 p-4 shadow-sm flex flex-col justify-between light:bg-white light:border-slate-200"
              >
                <div>
                  <div className="h-28 rounded-lg bg-[#0d1c2d] border border-[#273647]/50 flex items-center justify-center text-[#7bd0ff] mb-2 light:bg-slate-100">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="text-xs font-bold text-[#d4e4fa] truncate light:text-slate-900">{prod.name}</h4>
                  <p className="text-[10px] text-[#8e8fa3] line-clamp-2 mt-0.5">{prod.description}</p>
                  <div className="text-xs font-mono font-bold text-[#4edea3] mt-2">
                    {formatINR(prod.standardPrice)}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#273647]/40">
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full h-7 text-xs bg-[#0047FF] hover:bg-[#0038CC] shadow-none"
                    onClick={() => {
                      setOrderProduct(prod);
                      setModalSize('M');
                    }}
                  >
                    Order Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Order Placement Modal */}
      {orderProduct && (
        <Modal isOpen={!!orderProduct} onClose={() => setOrderProduct(null)} title={`Order ${orderProduct.name}`}>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <span className="text-xs text-[#8e8fa3]">Pricing:</span>
              <p className="text-sm font-bold text-[#d4e4fa] light:text-slate-900">
                {formatINR(orderProduct.standardPrice)} (Member: {formatINR(orderProduct.memberPrice)})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Select Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['S', 'M', 'L', 'XL'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setModalSize(sz)}
                    className={`py-2 rounded-lg border text-center font-bold text-xs ${
                      modalSize === sz
                        ? 'bg-[#0047FF] text-white border-[#0047FF]'
                        : 'bg-[#0d1c2d] text-[#d4e4fa] border-[#273647] light:bg-slate-100 light:text-slate-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOrderProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isPlacingOrder}>
                Confirm Order
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Add Product Modal */}
      {isCreateOpen && (
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Merchandise Product Drop">
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                Product Name
              </label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Official Skyline 2026 Embroidered Hoodie"
                className="w-full h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                SKU Identifier
              </label>
              <input
                type="text"
                required
                value={prodSku}
                onChange={(e) => setProdSku(e.target.value)}
                placeholder="e.g. SKY-26-HD"
                className="w-full h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                  Standard Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={prodStandardPrice}
                  onChange={(e) => setProdStandardPrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d4e4fa] mb-1 light:text-slate-700">
                  Member Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={prodMemberPrice}
                  onChange={(e) => setProdMemberPrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 px-3 text-xs rounded-lg bg-[#0d1c2d] border border-[#273647] text-[#d4e4fa] focus:outline-none focus:border-[#0047FF] light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isCreatingProduct}>
                Publish Product
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
