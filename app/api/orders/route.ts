import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/db/orders";
import { hasDatabase } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email";
import { getServerSession, authOptions } from "@/lib/auth";
import { getProducts, updateProductStock } from "@/lib/products-store";

const orderSchema = z.object({
  orderNumber: z.string(),
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  items: z.array(
    z.object({
      productId: z.number(),
      name: z.string(),
      slug: z.string(),
      category: z.string(),
      image: z.string(),
      selectedLength: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      lineTotal: z.number(),
    }),
  ),
  shipping: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }),
  subtotal: z.number(),
  shippingFee: z.number(),
  discount: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = orderSchema.parse(await req.json());
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;

    const shipping = {
      fullName: body.shipping.fullName || body.fullName,
      phone: body.shipping.phone || body.phone,
      address: body.shipping.address,
      city: body.shipping.city,
      state: body.shipping.state,
      postalCode: body.shipping.postalCode,
      country: body.shipping.country || "Nigeria",
    };

    let persisted = false;
    if (hasDatabase()) {
      const order = await createOrder({
        ...body,
        shipping,
        userId: userId && !isNaN(userId) ? userId : undefined,
      });
      persisted = !!order;

      const products = await getProducts();
      for (const item of body.items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          await updateProductStock(item.productId, Math.max(0, product.inStock - item.quantity));
        }
      }
    }

    await sendOrderConfirmation({
      to: body.email,
      orderNumber: body.orderNumber,
      customerName: body.fullName,
      shipping,
      items: body.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        length: i.selectedLength,
        lineTotal: i.lineTotal,
      })),
      subtotal: body.subtotal,
      shippingFee: body.shippingFee,
      discount: body.discount,
      total: body.total,
    });

    return NextResponse.json({
      ok: true,
      persisted,
      orderNumber: body.orderNumber,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}