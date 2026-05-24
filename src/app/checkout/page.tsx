"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { createOrder } from "@/app/actions/orders";
import type { Address } from "@/types";

export default function CheckoutPage() {
  const { lang, isRTL } = useLanguage();
  const { items, subtotal, clearCart, updateQuantity, removeItem, cartLoaded } = useCart();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newAddr, setNewAddr] = useState({
    label: "Home",
    street: "",
    city: "",
    area: "",
    building: "",
    floor: "",
    notes: "",
  });

  const [baseDeliveryFee, setBaseDeliveryFee] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [discountedDeliveryFee, setDiscountedDeliveryFee] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  const deliveryFee = useMemo(() => {
    if (baseDeliveryFee === 0) return 0;
    if (freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold) {
      return discountedDeliveryFee;
    }
    return baseDeliveryFee;
  }, [baseDeliveryFee, freeDeliveryThreshold, discountedDeliveryFee, subtotal]);
  
  const amountToFreeDelivery = freeDeliveryThreshold > 0 && subtotal < freeDeliveryThreshold 
    ? freeDeliveryThreshold - subtotal 
    : 0;
  
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login?next=/checkout");
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", ["delivery_fee", "free_delivery_threshold", "discounted_delivery_fee"]);
      
      if (data) {
        const fee = data.find((s) => s.key === "delivery_fee");
        const threshold = data.find((s) => s.key === "free_delivery_threshold");
        const discounted = data.find((s) => s.key === "discounted_delivery_fee");
        
        if (fee?.value) {
          const feeValue = parseFloat(fee.value);
          if (!isNaN(feeValue)) setBaseDeliveryFee(feeValue);
        }
        if (threshold?.value) {
          const thresholdValue = parseFloat(threshold.value);
          if (!isNaN(thresholdValue)) setFreeDeliveryThreshold(thresholdValue);
        }
        if (discounted?.value) {
          const discountedValue = parseFloat(discounted.value);
          if (!isNaN(discountedValue)) setDiscountedDeliveryFee(discountedValue);
        }
      }
      setSettingsLoaded(true);
    }
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only redirect if cart is loaded and empty
    if (cartLoaded && items.length === 0 && !userLoading) {
      router.push("/");
    }
  }, [items, cartLoaded, userLoading, router]);

  useEffect(() => {
    async function loadAddresses() {
      if (!user) return;
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
      if (data && data.length > 0) {
        setAddresses(data as Address[]);
        setSelectedAddress(data.find((a) => a.is_default) ?? data[0] as Address);
      } else {
        setShowNewAddress(true);
      }
    }
    if (user) loadAddresses();
  // supabase is stable (useMemo), only re-fetch when user changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let deliveryAddress;

    if (showNewAddress || !selectedAddress) {
      if (!newAddr.street || !newAddr.city) {
        setError(lang === "ar" ? "يرجى إدخال العنوان" : "Please enter your address");
        setLoading(false);
        return;
      }

      // Save new address
      if (user) {
        const { data: savedAddr } = await supabase.from("addresses").insert({
          user_id: user.id,
          label: newAddr.label,
          street: newAddr.street,
          city: newAddr.city,
          area: newAddr.area || null,
          building: newAddr.building || null,
          floor: newAddr.floor || null,
          notes: newAddr.notes || null,
          is_default: addresses.length === 0,
        }).select().single();

        if (savedAddr) {
          setAddresses((prev) => [...prev, savedAddr as Address]);
          setSelectedAddress(savedAddr as Address);
        }
      }

      deliveryAddress = {
        label: newAddr.label,
        street: newAddr.street,
        city: newAddr.city,
        area: newAddr.area || null,
        building: newAddr.building || null,
        floor: newAddr.floor || null,
        notes: newAddr.notes || null,
      };
    } else {
      deliveryAddress = {
        label: selectedAddress.label,
        street: selectedAddress.street,
        city: selectedAddress.city,
        area: selectedAddress.area,
        building: selectedAddress.building,
        floor: selectedAddress.floor,
        notes: selectedAddress.notes,
      };
    }

    const orderItems = items.map((item) => {
      const price = item.size === "small"
        ? (item.product.price_small ?? 0)
        : (item.product.price_large ?? item.product.price_small ?? 0);
      return {
        product_id: item.product_id,
        product_name_en: item.product.name_en,
        product_name_ar: item.product.name_ar,
        size: item.size,
        quantity: item.quantity,
        unit_price: price,
      };
    });

    const result = await createOrder({
      items: orderItems,
      delivery_address: deliveryAddress,
      notes,
      payment_method: "cod",
      delivery_fee: deliveryFee,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    clearCart();
    router.push(`/orders/${result.order!.id}?new=1`);
  }

  if (userLoading || !cartLoaded || !settingsLoaded || items.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-ink-2 hover:text-ink transition-colors">
            <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="text-sm font-semibold">{lang === "ar" ? "القائمة" : "Menu"}</span>
          </Link>
          <h1 className="text-sm font-bold text-ink flex-1 text-center pe-10">
            {lang === "ar" ? "إتمام الطلب" : "Checkout"}
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl px-4 py-3 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-surface rounded-3xl border border-border p-5 space-y-3">
          <h2 className="font-bold text-ink text-base">
            {lang === "ar" ? "ملخص الطلب" : "Order Summary"}
          </h2>
          <div className="space-y-3">
            {items.map((item) => {
              const name = lang === "ar" ? item.product.name_ar : item.product.name_en;
              const price = item.size === "small" ? (item.product.price_small ?? 0) : (item.product.price_large ?? item.product.price_small ?? 0);
              const sizeLabel = item.size === "small" ? (lang === "ar" ? "صغير" : "Small") : item.size === "large" ? (lang === "ar" ? "كبير" : "Large") : null;
              return (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-2 border border-border/60">
                  {/* Image */}
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                    {item.product.image ? (
                      <Image src={item.product.image} alt={name} fill className="object-cover" sizes="44px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">☕</div>
                    )}
                  </div>

                  {/* Name + size */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{name}</p>
                    {sizeLabel && <p className="text-xs text-ink-3">{sizeLabel}</p>}
                    <p className="text-primary font-bold text-sm tabular-nums">
                      {(price * item.quantity).toFixed(2)} ₪
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity <= 1) removeItem(item.id);
                        else updateQuantity(item.id, item.quantity - 1);
                      }}
                      className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                      aria-label={lang === "ar" ? "إزالة" : "Remove one"}
                    >
                      {item.quantity === 1 ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                        </svg>
                      )}
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-ink tabular-nums select-none">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-ink-2 hover:text-primary hover:border-primary/40 transition-colors"
                      aria-label={lang === "ar" ? "زيادة" : "Add one more"}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm text-ink-2">
              <span>{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
              <span className="font-semibold">{subtotal.toFixed(2)} ₪</span>
            </div>
            <div className="flex justify-between text-sm text-ink-2">
              <span>{lang === "ar" ? "التوصيل" : "Delivery"}</span>
              {deliveryFee === 0 && baseDeliveryFee === 0 ? (
                <span className="text-green-600 font-semibold">{lang === "ar" ? "مجاني" : "Free"}</span>
              ) : deliveryFee === 0 && baseDeliveryFee > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-ink-3 line-through text-xs">{baseDeliveryFee.toFixed(2)} ₪</span>
                  <span className="text-green-600 font-semibold">{lang === "ar" ? "مجاني" : "Free"}</span>
                </div>
              ) : baseDeliveryFee > deliveryFee ? (
                <div className="flex items-center gap-2">
                  <span className="text-ink-3 line-through text-xs">{baseDeliveryFee.toFixed(2)} ₪</span>
                  <span className="text-green-600 font-semibold">{deliveryFee.toFixed(2)} ₪</span>
                </div>
              ) : (
                <span className="font-semibold">{deliveryFee.toFixed(2)} ₪</span>
              )}
            </div>
            {amountToFreeDelivery > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2 mt-2">
                <p className="text-xs text-green-700 dark:text-green-400">
                  {lang === "ar" 
                    ? `أضف ${amountToFreeDelivery.toFixed(2)} ₪ للحصول على ${discountedDeliveryFee === 0 ? "توصيل مجاني" : `توصيل بـ ${discountedDeliveryFee.toFixed(2)} ₪ فقط`}!`
                    : `Add ${amountToFreeDelivery.toFixed(2)} ₪ more to get ${discountedDeliveryFee === 0 ? "FREE delivery" : `delivery for just ${discountedDeliveryFee.toFixed(2)} ₪`}!`
                  }
                </p>
              </div>
            )}
            <div className="flex justify-between font-bold text-ink border-t border-border pt-1.5">
              <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="text-primary text-lg">{total.toFixed(2)} ₪</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-surface rounded-3xl border border-border p-5 space-y-4">
          <h2 className="font-bold text-ink text-base">
            {lang === "ar" ? "عنوان التوصيل" : "Delivery Address"}
          </h2>

          {/* Saved addresses */}
          {addresses.length > 0 && (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <label key={addr.id} className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedAddress?.id === addr.id && !showNewAddress ? "border-primary bg-primary/5" : "border-border hover:border-ink-3"
                }`}>
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress?.id === addr.id && !showNewAddress}
                    onChange={() => { setSelectedAddress(addr); setShowNewAddress(false); }}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{addr.label}</p>
                    <p className="text-xs text-ink-2 mt-0.5">
                      {addr.street}, {addr.city}
                      {addr.area && `, ${addr.area}`}
                      {addr.building && ` - ${lang === "ar" ? "مبنى" : "Building"} ${addr.building}`}
                      {addr.floor && `, ${lang === "ar" ? "طابق" : "Floor"} ${addr.floor}`}
                    </p>
                  </div>
                </label>
              ))}

              <button
                type="button"
                onClick={() => { setShowNewAddress(!showNewAddress); setSelectedAddress(null); }}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-border text-ink-2 text-sm font-medium hover:border-primary hover:text-primary transition-all"
              >
                + {lang === "ar" ? "عنوان جديد" : "New address"}
              </button>
            </div>
          )}

          {/* New address form */}
          {(showNewAddress || addresses.length === 0) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-ink-2 block mb-1.5">{lang === "ar" ? "الشارع *" : "Street *"}</label>
                  <input value={newAddr.street} onChange={(e) => setNewAddr((p) => ({ ...p, street: e.target.value }))} required placeholder={lang === "ar" ? "اسم الشارع والرقم" : "Street name and number"}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-2 block mb-1.5">{lang === "ar" ? "المدينة *" : "City *"}</label>
                  <input value={newAddr.city} onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))} required
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-2 block mb-1.5">{lang === "ar" ? "المنطقة" : "Area"}</label>
                  <input value={newAddr.area} onChange={(e) => setNewAddr((p) => ({ ...p, area: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-2 block mb-1.5">{lang === "ar" ? "المبنى" : "Building"}</label>
                  <input value={newAddr.building} onChange={(e) => setNewAddr((p) => ({ ...p, building: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-2 block mb-1.5">{lang === "ar" ? "الطابق" : "Floor"}</label>
                  <input value={newAddr.floor} onChange={(e) => setNewAddr((p) => ({ ...p, floor: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-surface rounded-3xl border border-border p-5 space-y-3">
          <h2 className="font-bold text-ink text-base">
            {lang === "ar" ? "طريقة الدفع" : "Payment Method"}
          </h2>
          <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-primary bg-primary/5 cursor-pointer">
            <input type="radio" name="payment" defaultChecked className="accent-primary" />
            <div className="flex items-center gap-3">
              <span className="text-2xl">💵</span>
              <div>
                <p className="font-semibold text-ink text-sm">{lang === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery"}</p>
                <p className="text-xs text-ink-3">{lang === "ar" ? "ادفع عند وصول طلبك" : "Pay when your order arrives"}</p>
              </div>
            </div>
          </label>
          <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-border opacity-50 cursor-not-allowed">
            <input type="radio" name="payment" disabled className="accent-primary" />
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-semibold text-ink text-sm">{lang === "ar" ? "بطاقة ائتمان / ماستركارد" : "Credit / Debit Card"}</p>
                <p className="text-xs text-ink-3">{lang === "ar" ? "قريباً" : "Coming soon"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-surface rounded-3xl border border-border p-5 space-y-2">
          <h2 className="font-bold text-ink text-sm">
            {lang === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={lang === "ar" ? "أي تعليمات خاصة للطلب..." : "Any special instructions..."}
            className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>
      </form>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-surface border-t border-border px-4 py-3 pb-safe z-40" dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            disabled={loading || items.length === 0}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary/90 active:scale-[0.99] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {lang === "ar" ? "جاري تأكيد الطلب..." : "Placing order..."}
              </>
            ) : (
              <>
                {lang === "ar" ? "تأكيد الطلب" : "Place Order"}
                <span className="text-white/70">·</span>
                <span>{total.toFixed(2)} ₪</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
