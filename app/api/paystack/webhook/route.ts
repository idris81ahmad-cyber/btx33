import { NextResponse } from 'next/server';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';
import { updateOrderStatus, getOrderByNumber } from '@/lib/db/orders';

export async function POST(req: Request) {
  const signature = req.headers.get('x-paystack-signature');
  const rawBody = await req.text();

  // Verify webhook signature
  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    console.warn('[Paystack Webhook] Invalid signature received');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (parseError) {
    console.error('[Paystack Webhook] Failed to parse JSON body:', parseError);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[Paystack Webhook] Received event: ${event.event}`);

  // Only handle successful charges
  if (event.event === 'charge.success') {
    const data = event.data;
    const reference = data.reference;
    const metadata = data.metadata || {};

    try {
      // Try to find existing order by reference or order number in metadata
      const orderNumber = metadata.orderNumber || reference;

      console.log(`[Paystack Webhook] Processing charge.success for reference: ${reference}, orderNumber: ${orderNumber}`);

      const existingOrder = await getOrderByNumber(orderNumber);

      if (existingOrder) {
        // Update order status to confirmed/paid
        const updated = await updateOrderStatus(orderNumber, 'confirmed');

        if (updated) {
          console.log(`[Paystack Webhook] Successfully updated order ${orderNumber} to confirmed`);
        } else {
          console.warn(`[Paystack Webhook] Failed to update order ${orderNumber} (updateOrderStatus returned false)`);
        }
      } else {
        console.log(`[Paystack Webhook] No existing order found for ${orderNumber}. It may have been created via verify route.`);
      }
    } catch (error) {
      console.error('[Paystack Webhook] Error processing charge.success event:', error);
      // Still return 200 so Paystack doesn't keep retrying
    }
  } else {
    console.log(`[Paystack Webhook] Ignoring unhandled event type: ${event.event}`);
  }

  // Always return 200 quickly to acknowledge receipt
  return NextResponse.json({ received: true });
}
