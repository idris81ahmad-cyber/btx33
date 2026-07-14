import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getProducts, addProduct } from '@/lib/products-store';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
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
    logger.error('admin-products', 'Create product failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : 'Failed to create product';
    const status = message.includes('read-only') || message.includes('Blob') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}