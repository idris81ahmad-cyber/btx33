import { NextResponse } from 'next/server';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';
import { updateOrderStatus, getOrderByNumber } from '@/lib/db/orders';

export async function POST(req: Request) {
  const signature = req.headers.get('x-paystack-signature');
  const rawBody = await req.text();

  // Verify webhook signature
  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    console.warn('Invalid Paystack webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only handle successful charges
  if (event.event === 'charge.success') {
    const data = event.data;
    const reference = data.reference;
    const metadata = data.metadata || {};

    try {
      // Try to find existing order by reference or order number in metadata
      const orderNumber = metadata.orderNumber || reference;

      const existingOrder = await getOrderByNumber(orderNumber);

      if (existingOrder) {
        // Update order status to confirmed/paid
        await updateOrderStatus(orderNumber, 'confirmed');
        console.log(`Order ${orderNumber} marked as confirmed via webhook`);
      } else {
        // Order might have been created already via verify route
        console.log(`Webhook received for reference ${reference}, but no matching order found`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      // Still return 200 so Paystack doesn't retry
    }
  }

  // Always return 200 quickly to acknowledge receipt
  return NextResponse.json({ received: true });
}
