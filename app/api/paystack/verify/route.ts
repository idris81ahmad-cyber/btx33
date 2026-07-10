import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackPayment } from '@/lib/paystack';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    // Verify with Paystack
    const verification = await verifyPaystackPayment(reference);

    if (!verification.status || verification.data.status !== 'success') {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment verification failed' 
      }, { status: 400 });
    }

    const paymentData = verification.data;

    // Check if order already exists
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, reference),
    });

    if (existingOrder) {
      return NextResponse.json({ 
        success: true, 
        order: existingOrder,
        alreadyExists: true 
      });
    }

    // Create order in database
    const metadata = paymentData.metadata || {};
    const cartItems = metadata.cartItems || [];

    const newOrder = await db.insert(orders).values({
      orderNumber: reference,
      userId: metadata.userId ? parseInt(metadata.userId) : null,
      email: paymentData.customer.email,
      fullName: metadata.fullName || 'Customer',
      phone: metadata.phone || '',
      status: 'confirmed',
      items: cartItems,
      shipping: metadata.shipping || {},
      subtotal: Math.round(paymentData.amount / 100),
      shippingFee: metadata.shippingFee || 0,
      discount: metadata.discount || 0,
      total: Math.round(paymentData.amount / 100),
      paymentMethod: 'paystack',
      notes: metadata.notes || null,
    }).returning();

    return NextResponse.json({ 
      success: true, 
      order: newOrder[0] 
    });

  } catch (error: any) {
    console.error('Paystack verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
