import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { forceSeedProductsToDb } from '@/lib/products-store';

export async function POST() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }

  try {
    const count = await forceSeedProductsToDb();

    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new products seeded (database may already have data or no legacy data found)',
        seeded: 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${count} products into the database`,
      seeded: count,
    });
  } catch (error) {
    console.error('Seed products error:', error);
    return NextResponse.json(
      { error: 'Failed to seed products into database' },
      { status: 500 }
    );
  }
}