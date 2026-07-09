import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { resetToDefaults } from '@/lib/products-store';

export async function POST() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  const products = await resetToDefaults();
  return NextResponse.json({ success: true, count: products.length });
}