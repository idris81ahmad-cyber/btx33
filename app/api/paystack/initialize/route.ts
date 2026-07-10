import { NextRequest, NextResponse } from 'next/server';
import { initializePaystackPayment } from '@/lib/paystack';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { email, amount, metadata } = body;

    if (!email || !amount) {
      return NextResponse.json({ error: 'Email and amount are required' }, { status: 400 });
    }

    const reference = `BIYORA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const result = await initializePaystackPayment({
      email,
      amount: Math.round(amount * 100), // convert NGN to kobo
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?reference=${reference}`,
      metadata: {
        ...metadata,
        userId: session?.user?.id || null,
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
    });
  } catch (error: any) {
    console.error('Paystack initialize error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
