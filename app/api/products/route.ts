import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products-store';

export async function GET() {
  const products = getProducts();
  return NextResponse.json(products);
}
