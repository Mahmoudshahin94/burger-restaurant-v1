"use server";

import { getUnverifiedInstantUser } from "@/lib/instant/cookie";
import { id } from "@instantdb/admin";
import { adminDb } from "@/lib/instant/admin";
import type { DeliveryAddress } from "@/types";

export interface CreateOrderInput {
  items: Array<{
    product_id: string;
    product_name_en: string;
    product_name_ar: string;
    size: string | null;
    quantity: number;
    unit_price: number;
  }>;
  delivery_address: DeliveryAddress;
  notes?: string;
  payment_method?: "cod" | "card";
  delivery_fee?: number;
}

// InstantDB has no request-scoped browser session on the server, so every
// Server Action verifies the httpOnly session cookie against the admin SDK
// itself (mirrors the old `supabase.auth.getUser()` calls).
async function getVerifiedUser() {
  const cookieUser = await getUnverifiedInstantUser(
    process.env.NEXT_PUBLIC_INSTANTDB_APP_ID!
  );
  if (!cookieUser) return null;

  try {
    return await adminDb.auth.verifyToken(cookieUser.refresh_token);
  } catch {
    return null;
  }
}

async function getSettingsMap(keys: string[]) {
  const { settings } = await adminDb.query({
    settings: { $: { where: { key: { $in: keys } } } },
  });
  const map = new Map<string, string | undefined>();
  for (const row of settings) {
    map.set(row.key, row.value ?? undefined);
  }
  return map;
}

async function sendWhatsAppNotification(
  order: { id: string; order_number: number; total: number; delivery_fee: number; subtotal: number },
  items: CreateOrderInput["items"],
  deliveryAddress: DeliveryAddress,
  customerNotes?: string
) {
  try {
    const settings = await getSettingsMap([
      "whatsapp_enabled",
      "whatsapp_method",
      "whatsapp_number",
      "whatsapp_api_key",
      "whatsapp_webhook_url",
    ]);

    const whatsappEnabled = settings.get("whatsapp_enabled") === "true";
    if (!whatsappEnabled) return;

    const whatsappMethod = settings.get("whatsapp_method") || "webhook";
    const whatsappNumber = settings.get("whatsapp_number");
    const whatsappApiKey = settings.get("whatsapp_api_key");
    const whatsappWebhookUrl = settings.get("whatsapp_webhook_url");

    const itemsList = items
      .map((item) => `• ${item.product_name_ar} (${item.quantity}x) - ${(item.unit_price * item.quantity).toFixed(2)}₪`)
      .join("\n");

    const addressText = [
      deliveryAddress.street,
      deliveryAddress.city,
      deliveryAddress.area,
      deliveryAddress.building ? `مبنى: ${deliveryAddress.building}` : null,
      deliveryAddress.floor ? `طابق: ${deliveryAddress.floor}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    if (whatsappMethod === "webhook" && whatsappWebhookUrl) {
      const webhookData = {
        order_id: order.id,
        order_number: order.order_number,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
        items: items.map((item) => ({
          name_ar: item.product_name_ar,
          name_en: item.product_name_en,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          size: item.size,
        })),
        delivery_address: {
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          area: deliveryAddress.area,
          building: deliveryAddress.building,
          floor: deliveryAddress.floor,
        },
        notes: customerNotes || null,
        message: `🛒 *طلب جديد #${order.order_number}*

📦 *المنتجات:*
${itemsList}

📍 *العنوان:*
${addressText}
${customerNotes ? `\n📝 *ملاحظات:* ${customerNotes}` : ""}

💰 *الإجمالي:* ${order.total.toFixed(2)}₪
${order.delivery_fee > 0 ? `🚚 *رسوم التوصيل:* ${order.delivery_fee.toFixed(2)}₪` : "🚚 *التوصيل:* مجاني"}

🆔 *رقم الطلب:* ${order.id}`,
        created_at: new Date().toISOString(),
      };

      await fetch(whatsappWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookData),
      }).catch((err) => console.error("Webhook failed:", err));
    } else if (whatsappMethod === "callmebot" && whatsappNumber && whatsappApiKey) {
      const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
      if (!cleanNumber) return;

      const message = `🛒 *طلب جديد #${order.order_number}*

📦 *المنتجات:*
${itemsList}

📍 *العنوان:*
${addressText}
${customerNotes ? `\n📝 *ملاحظات:* ${customerNotes}` : ""}

💰 *الإجمالي:* ${order.total.toFixed(2)}₪
${order.delivery_fee > 0 ? `🚚 *رسوم التوصيل:* ${order.delivery_fee.toFixed(2)}₪` : "🚚 *التوصيل:* مجاني"}

🆔 *رقم الطلب:* ${order.id}`;

      const encodedMessage = encodeURIComponent(message);
      const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${cleanNumber}&text=${encodedMessage}&apikey=${whatsappApiKey}`;

      const response = await fetch(callMeBotUrl, { method: "GET" });
      if (!response.ok) {
        console.error("WhatsApp notification failed:", await response.text());
      }
    }
  } catch (error) {
    console.error("Failed to send WhatsApp notification:", error);
  }
}

export async function createOrder(input: CreateOrderInput) {
  let verifiedUser;
  try {
    verifiedUser = await getVerifiedUser();
  } catch {
    return { error: "Unable to reach authentication server. Please try again." };
  }
  if (!verifiedUser) {
    return { error: "Not authenticated" };
  }

  const { profiles } = await adminDb.query({
    profiles: { $: { where: { "$user.id": verifiedUser.id } } },
  });
  const profileId = profiles[0]?.id;
  if (!profileId) {
    return { error: "Profile not found" };
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  let deliveryFee = input.delivery_fee ?? 0;
  if (input.delivery_fee === undefined) {
    const deliverySettings = await getSettingsMap([
      "delivery_fee",
      "free_delivery_threshold",
      "discounted_delivery_fee",
    ]);

    const baseFeeValue = parseFloat(deliverySettings.get("delivery_fee") ?? "");
    const thresholdValue = parseFloat(deliverySettings.get("free_delivery_threshold") ?? "");
    const discountedValue = parseFloat(deliverySettings.get("discounted_delivery_fee") ?? "");

    if (!isNaN(baseFeeValue)) {
      deliveryFee = baseFeeValue;
      if (thresholdValue > 0 && subtotal >= thresholdValue && !isNaN(discountedValue)) {
        deliveryFee = discountedValue;
      }
    }
  }

  const total = subtotal + deliveryFee;

  // InstantDB has no auto-increment, so `order_number` is tracked via a
  // dedicated `counters` row. Bumping it in the same `transact` call as the
  // order/items keeps everything atomic (all-or-nothing).
  const { counters } = await adminDb.query({
    counters: { $: { where: { key: "order_number" } } },
  });
  const counterRow = counters[0];
  const nextOrderNumber = (counterRow?.value ?? 0) + 1;

  const orderId = id();
  const now = new Date().toISOString();

  try {
    await adminDb.transact([
      adminDb.tx.orders[orderId]
        .update({
          order_number: nextOrderNumber,
          status: "pending",
          payment_method: input.payment_method ?? "cod",
          payment_status: "pending",
          subtotal,
          delivery_fee: deliveryFee,
          total,
          notes: input.notes,
          delivery_address: input.delivery_address,
          created_at: now,
        })
        .link({ profile: profileId, $user: verifiedUser.id }),
      ...input.items.map((item) =>
        adminDb.tx.orderItems[id()]
          .update({
            product_name_en: item.product_name_en,
            product_name_ar: item.product_name_ar,
            size: item.size,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
          })
          .link({ order: orderId, product: item.product_id })
      ),
      counterRow
        ? adminDb.tx.counters[counterRow.id].update({ value: nextOrderNumber })
        : adminDb.tx.counters[id()].update({ key: "order_number", value: nextOrderNumber }),
    ]);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create order" };
  }

  const order = {
    id: orderId,
    order_number: nextOrderNumber,
    status: "pending" as const,
    payment_method: input.payment_method ?? "cod",
    payment_status: "pending" as const,
    subtotal,
    delivery_fee: deliveryFee,
    total,
    notes: input.notes ?? null,
    delivery_address: input.delivery_address,
    created_at: now,
  };

  // Fire-and-forget: never block order confirmation on a notification webhook.
  sendWhatsAppNotification(
    { id: order.id, order_number: order.order_number, total, delivery_fee: deliveryFee, subtotal },
    input.items,
    input.delivery_address,
    input.notes
  );

  return { order };
}

export async function getOrders() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) return { error: "Not authenticated" };

  const { orders } = await adminDb.query({
    orders: {
      $: { where: { "$user.id": verifiedUser.id }, order: { created_at: "desc" } },
      order_items: {},
    },
  });

  return { orders };
}

export async function getOrderById(orderId: string) {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) return { error: "Not authenticated" };

  const { orders } = await adminDb.query({
    orders: {
      $: { where: { id: orderId, "$user.id": verifiedUser.id } },
      order_items: {},
    },
  });

  const order = orders[0];
  if (!order) return { error: "Order not found" };

  return { order };
}
