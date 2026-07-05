import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
