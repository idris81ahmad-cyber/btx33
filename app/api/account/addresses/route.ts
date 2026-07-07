import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession, authOptions } from "@/lib/auth";
import { getAddressesByUserId, createAddress, deleteAddress } from "@/lib/db/addresses";
import { hasDatabase } from "@/lib/db";

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ addresses: [] });

  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) return NextResponse.json({ addresses: [] });

  const addresses = await getAddressesByUserId(userId);
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: "Database required" }, { status: 503 });

  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: "Invalid user" }, { status: 400 });

  try {
    const body = addressSchema.parse(await req.json());
    const addr = await createAddress({ ...body, userId });
    return NextResponse.json({ address: addr });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "", 10);
  const userId = parseInt(session.user.id, 10);
  if (isNaN(id) || isNaN(userId)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const ok = await deleteAddress(id, userId);
  return NextResponse.json({ ok });
}