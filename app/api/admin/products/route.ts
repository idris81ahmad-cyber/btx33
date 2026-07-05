import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { getProducts, addProduct } from '@/lib/products-store';

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Basic validation
    if (!body.name || !body.category || !body.price) {
      return NextResponse.json({ error: 'Missing required fields (name, category, price)' }, { status: 400 });
    }

    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newProduct = await addProduct({
      ...body,
      slug,
      images: body.images || [],
      lengthOptions: body.lengthOptions || ['5 yards', '6 yards'],
      specifications: body.specifications || {},
      rating: body.rating || 4.5,
      reviewCount: body.reviewCount || 0,
      inStock: body.inStock ?? 10,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Failed to create product';
    const status = message.includes('read-only') || message.includes('Blob') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
