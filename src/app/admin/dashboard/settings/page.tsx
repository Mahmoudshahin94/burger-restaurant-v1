"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/instant/client";
import { lookup } from "@instantdb/react";

export default function SettingsPage() {
  const { data, isLoading } = db.useQuery({ settings: {} });
  const initializedRef = useRef(false);

  const [logoUrl, setLogoUrl] = useState("");
  const [defaultLang, setDefaultLang] = useState("ar");
  const [carouselSec, setCarouselSec] = useState(5);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0);
  const [discountedDeliveryFee, setDiscountedDeliveryFee] = useState(0);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappMethod, setWhatsappMethod] = useState<"callmebot" | "webhook">("webhook");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isLoading || initializedRef.current) return;
    initializedRef.current = true;

    const rows = data?.settings ?? [];
    const logo = rows.find((s) => s.key === "logo");
    const lang = rows.find((s) => s.key === "default_lang");
    const interval = rows.find((s) => s.key === "carousel_interval");
    const fee = rows.find((s) => s.key === "delivery_fee");
    const waEnabled = rows.find((s) => s.key === "whatsapp_enabled");
    const waMethod = rows.find((s) => s.key === "whatsapp_method");
    const waNumber = rows.find((s) => s.key === "whatsapp_number");
    const waApiKey = rows.find((s) => s.key === "whatsapp_api_key");
    const waWebhook = rows.find((s) => s.key === "whatsapp_webhook_url");
    if (logo) setLogoUrl(logo.value ?? "");
    if (lang) setDefaultLang(lang.value ?? "ar");
    if (interval) {
      const ms = parseInt(interval.value ?? "5000", 10);
      if (!isNaN(ms)) setCarouselSec(Math.round(ms / 1000));
    }
    if (fee) {
      const feeValue = parseFloat(fee.value ?? "0");
      if (!isNaN(feeValue)) setDeliveryFee(feeValue);
    }
    const freeThreshold = rows.find((s) => s.key === "free_delivery_threshold");
    const discountedFee = rows.find((s) => s.key === "discounted_delivery_fee");
    if (freeThreshold) {
      const thresholdValue = parseFloat(freeThreshold.value ?? "0");
      if (!isNaN(thresholdValue)) setFreeDeliveryThreshold(thresholdValue);
    }
    if (discountedFee) {
      const discountedValue = parseFloat(discountedFee.value ?? "0");
      if (!isNaN(discountedValue)) setDiscountedDeliveryFee(discountedValue);
    }
    if (waEnabled) setWhatsappEnabled(waEnabled.value === "true");
    if (waMethod) setWhatsappMethod((waMethod.value as "callmebot" | "webhook") ?? "webhook");
    if (waNumber) setWhatsappNumber(waNumber.value ?? "");
    if (waApiKey) setWhatsappApiKey(waApiKey.value ?? "");
    if (waWebhook) setWhatsappWebhookUrl(waWebhook.value ?? "");
  }, [isLoading, data]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const clampedSec = Math.min(30, Math.max(2, carouselSec));
    const intervalMs = String(clampedSec * 1000);

    const entries: Array<[string, string]> = [
      ["logo", logoUrl],
      ["default_lang", defaultLang],
      ["carousel_interval", intervalMs],
      ["delivery_fee", String(deliveryFee)],
      ["free_delivery_threshold", String(freeDeliveryThreshold)],
      ["discounted_delivery_fee", String(discountedDeliveryFee)],
      ["whatsapp_enabled", String(whatsappEnabled)],
      ["whatsapp_method", whatsappMethod],
      ["whatsapp_number", whatsappNumber],
      ["whatsapp_api_key", whatsappApiKey],
      ["whatsapp_webhook_url", whatsappWebhookUrl],
    ];

    await db.transact(
      entries.map(([key, value]) => db.tx.settings[lookup("key", key)].update({ value }))
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdminLayout title="Settings">
      <div className="max-w-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure your store branding and preferences</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl h-20 skeleton" />)}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
            {/* Logo URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo URL</label>
              <p className="text-xs text-gray-400 mb-3">Paste a URL to your logo image. Leave empty to use the default logo.</p>
              <div className="mb-3 flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Logo Preview" fill className="object-contain p-2" onError={() => {}} />
                  ) : (
                    <Image src="/logo.png" alt="Default Logo" fill className="object-contain p-2" />
                  )}
                </div>
                <p className="text-xs text-gray-400">{logoUrl ? "Custom logo" : "Default logo"}</p>
              </div>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all"
                dir="ltr"
              />
            </div>

            <hr className="border-gray-100" />

            {/* Default Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Default Language</label>
              <p className="text-xs text-gray-400 mb-3">The language shown to customers when they first open the menu.</p>
              <div className="flex gap-3">
                {(["ar", "en"] as const).map((lang) => (
                  <label
                    key={lang}
                    className={`flex-1 flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all ${defaultLang === lang ? "border-brand-red bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <input type="radio" value={lang} checked={defaultLang === lang} onChange={() => setDefaultLang(lang)} className="text-brand-red" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{lang === "ar" ? "العربية" : "English"}</p>
                      <p className="text-xs text-gray-400">{lang === "ar" ? "Arabic (RTL)" : "English (LTR)"}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Carousel Interval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Carousel Auto-Slide Interval</label>
              <p className="text-xs text-gray-400 mb-3">How long each banner is displayed before auto-advancing. Min 2 s, max 30 s.</p>
              <div className="flex items-center gap-4">
                <input type="range" min={2} max={30} step={1} value={carouselSec} onChange={(e) => setCarouselSec(Number(e.target.value))} className="flex-1 accent-brand-red" />
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-24">
                  <input
                    type="number" min={2} max={30} value={carouselSec}
                    onChange={(e) => { const v = Number(e.target.value); setCarouselSec(Math.min(30, Math.max(2, isNaN(v) ? 5 : v))); }}
                    className="w-10 text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">sec</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Delivery Fee */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Fee</label>
              <p className="text-xs text-gray-400 mb-3">Set the default delivery fee for orders. Set to 0 for always free delivery.</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1 max-w-xs">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={deliveryFee}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setDeliveryFee(isNaN(v) ? 0 : Math.max(0, v));
                    }}
                    className="flex-1 text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500 font-medium">₪</span>
                </div>
                {deliveryFee === 0 && (
                  <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Free delivery
                  </span>
                )}
              </div>
            </div>

            {/* Conditional Free Delivery */}
            {deliveryFee > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-1">Free/Discounted Delivery Threshold</label>
                  <p className="text-xs text-green-600 mb-3">Offer free or reduced delivery when order reaches a minimum amount. Set to 0 to disable.</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-700">Orders above</span>
                    <div className="flex items-center gap-1.5 bg-white border border-green-300 rounded-xl px-4 py-2.5 w-32">
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={freeDeliveryThreshold}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setFreeDeliveryThreshold(isNaN(v) ? 0 : Math.max(0, v));
                        }}
                        className="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <span className="text-sm text-green-700 font-medium">₪</span>
                  </div>
                </div>

                {freeDeliveryThreshold > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-green-800 mb-1">Discounted Delivery Fee</label>
                    <p className="text-xs text-green-600 mb-3">The delivery fee when threshold is reached. Set to 0 for free delivery.</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-green-700">Delivery becomes</span>
                      <div className="flex items-center gap-1.5 bg-white border border-green-300 rounded-xl px-4 py-2.5 w-32">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={discountedDeliveryFee}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setDiscountedDeliveryFee(isNaN(v) ? 0 : Math.max(0, v));
                          }}
                          className="w-full text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-sm text-green-700 font-medium">₪</span>
                      {discountedDeliveryFee === 0 && (
                        <span className="text-green-600 text-xs font-medium">(Free!)</span>
                      )}
                    </div>
                  </div>
                )}

                {freeDeliveryThreshold > 0 && (
                  <div className="bg-white/60 rounded-lg p-3 mt-2">
                    <p className="text-xs text-green-800">
                      <strong>Preview:</strong> Orders under {freeDeliveryThreshold}₪ pay {deliveryFee}₪ delivery. 
                      Orders {freeDeliveryThreshold}₪+ get {discountedDeliveryFee === 0 ? "FREE" : `${discountedDeliveryFee}₪`} delivery.
                    </p>
                  </div>
                )}
              </div>
            )}

            <hr className="border-gray-100" />

            {/* WhatsApp Notifications */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">WhatsApp Order Notifications</label>
                <button
                  type="button"
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${whatsappEnabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${whatsappEnabled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">Receive WhatsApp notifications for every new order.</p>
              
              {whatsappEnabled && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Method Selection */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">Notification Method</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setWhatsappMethod("webhook")}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                          whatsappMethod === "webhook"
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Webhook (Recommended)
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhatsappMethod("callmebot")}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                          whatsappMethod === "callmebot"
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        CallMeBot
                      </button>
                    </div>
                  </div>

                  {/* Webhook Method */}
                  {whatsappMethod === "webhook" && (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Easy Setup with Make.com (Free)
                        </h4>
                        <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside">
                          <li>Go to <a href="https://www.make.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">make.com</a> and create a free account</li>
                          <li>Create a new scenario with &quot;Webhook&quot; → &quot;Custom webhook&quot;</li>
                          <li>Copy the webhook URL and paste it below</li>
                          <li>Add &quot;WhatsApp Business Cloud&quot; or &quot;WhatsApp by Twilio&quot; module</li>
                          <li>Map the order data to your WhatsApp message</li>
                        </ol>
                        <p className="text-xs text-blue-600 mt-2">Alternative: You can also use n8n, Zapier, or any webhook service</p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Webhook URL</label>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <input
                            type="url"
                            value={whatsappWebhookUrl}
                            onChange={(e) => setWhatsappWebhookUrl(e.target.value)}
                            placeholder="https://hook.make.com/xxx..."
                            className="flex-1 text-sm font-medium text-gray-800 bg-transparent focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Order data will be sent as JSON to this URL</p>
                      </div>

                      {whatsappWebhookUrl && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Webhook configured</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* CallMeBot Method */}
                  {whatsappMethod === "callmebot" && (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Setup Required (One-time)
                        </h4>
                        <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
                          <li>Save your WhatsApp number to your phone contacts</li>
                          <li>Send this message to <strong>+34 644 59 71 67</strong> on WhatsApp:</li>
                          <li className="bg-white/60 rounded-lg px-3 py-2 font-mono text-amber-900 ml-4">I allow callmebot to send me messages</li>
                          <li>You will receive an API key - paste it below</li>
                        </ol>
                        <a 
                          href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-amber-600 hover:text-amber-800 underline mt-2 inline-block"
                        >
                          View detailed instructions →
                        </a>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">WhatsApp Number</label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <input
                              type="tel"
                              value={whatsappNumber}
                              onChange={(e) => setWhatsappNumber(e.target.value)}
                              placeholder="+972501234567"
                              className="flex-1 text-sm font-medium text-gray-800 bg-transparent focus:outline-none"
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Include country code (e.g., +972 for Israel, +970 for Palestine)</p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">CallMeBot API Key</label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <input
                              type="text"
                              value={whatsappApiKey}
                              onChange={(e) => setWhatsappApiKey(e.target.value)}
                              placeholder="Your API key from CallMeBot"
                              className="flex-1 text-sm font-medium text-gray-800 bg-transparent focus:outline-none"
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">The API key you received after sending the activation message</p>
                      </div>

                      {whatsappNumber && whatsappApiKey && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>CallMeBot configured</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Save button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : "Save Settings"}
              </button>
              {saved && <span className="text-green-600 text-sm font-medium flex items-center gap-1">✅ Settings saved!</span>}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
