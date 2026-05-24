"use server";

import { createClient } from "@/lib/supabase/server";
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

async function sendWhatsAppNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  order: { id: string; order_number: number; total: number; delivery_fee: number; subtotal: number },
  items: CreateOrderInput["items"],
  deliveryAddress: DeliveryAddress,
  customerNotes?: string
) {
  try {
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["whatsapp_enabled", "whatsapp_method", "whatsapp_number", "whatsapp_api_key", "whatsapp_webhook_url"]);

    const whatsappEnabled = settings?.find((s) => s.key === "whatsapp_enabled")?.value === "true";
    if (!whatsappEnabled) return;

    const whatsappMethod = settings?.find((s) => s.key === "whatsapp_method")?.value || "webhook";
    const whatsappNumber = settings?.find((s) => s.key === "whatsapp_number")?.value;
    const whatsappApiKey = settings?.find((s) => s.key === "whatsapp_api_key")?.value;
    const whatsappWebhookUrl = settings?.find((s) => s.key === "whatsapp_webhook_url")?.value;

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
  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return { error: "Unable to reach authentication server. Please try again." };
  }
  if (!user) {
    return { error: "Not authenticated" };
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  
  let deliveryFee = input.delivery_fee ?? 0;
  if (input.delivery_fee === undefined) {
    const { data: deliverySettings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["delivery_fee", "free_delivery_threshold", "discounted_delivery_fee"]);
    
    if (deliverySettings) {
      const baseFee = deliverySettings.find((s) => s.key === "delivery_fee");
      const threshold = deliverySettings.find((s) => s.key === "free_delivery_threshold");
      const discounted = deliverySettings.find((s) => s.key === "discounted_delivery_fee");
      
      const baseFeeValue = baseFee?.value ? parseFloat(baseFee.value) : 0;
      const thresholdValue = threshold?.value ? parseFloat(threshold.value) : 0;
      const discountedValue = discounted?.value ? parseFloat(discounted.value) : 0;
      
      if (!isNaN(baseFeeValue)) {
        deliveryFee = baseFeeValue;
        if (thresholdValue > 0 && subtotal >= thresholdValue && !isNaN(discountedValue)) {
          deliveryFee = discountedValue;
        }
      }
    }
  }
  
  const total = subtotal + deliveryFee;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      payment_method: input.payment_method ?? "cod",
      payment_status: "pending",
      subtotal,
      delivery_fee: deliveryFee,
      total,
      notes: input.notes,
      delivery_address: input.delivery_address as unknown as import("@/lib/supabase/types").Json,
    })
    .select()
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Failed to create order" };
  }

  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name_en: item.product_name_en,
    product_name_ar: item.product_name_ar,
    size: item.size,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: itemsError.message };
  }

  sendWhatsAppNotification(
    supabase,
    { id: order.id, order_number: order.order_number, total, delivery_fee: deliveryFee, subtotal },
    input.items,
    input.delivery_address,
    input.notes
  );

  return { order };
}

export async function getOrders() {
  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return { error: "Unable to reach authentication server. Please try again." };
  }
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { orders: data };
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return { error: "Unable to reach authentication server. Please try again." };
  }
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error) return { error: error.message };
  return { order: data };
}
