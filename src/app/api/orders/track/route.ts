import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { readServerAdminState } from "@/lib/server-admin-db";

const querySchema = z.object({
  ref: z
    .string()
    .trim()
    .min(5)
    .max(40)
    .regex(/^(ORD-\d{4}-\d{6}|TRK-\d{6})$/i),
});

function toTrackingResponse(order: Awaited<ReturnType<typeof readServerAdminState>>["orders"][number]) {
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethodLabel: order.paymentMethodLabel,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
  };
}

export async function GET(request: Request) {
  const rate = checkRateLimit(request, "order-track", 30, 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ ref: searchParams.get("ref") || "" });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid tracking reference" }, { status: 400 });
  }

  const normalized = parsed.data.ref.toUpperCase();
  const state = await readServerAdminState();
  const found = state.orders.find((order) => {
    const orderKey = order.id.toUpperCase();
    const trackingKey = `TRK-${order.id.replace("ORD-", "")}`.toUpperCase();
    return normalized === orderKey || normalized === trackingKey;
  });

  if (!found) {
    return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: toTrackingResponse(found) });
}
