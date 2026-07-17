import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 },
    );
  }

  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const hasGitHub = Boolean(process.env.GITHUB_TOKEN);
  const isVercel = Boolean(process.env.VERCEL);

  return NextResponse.json({
    isVercel,
    hasBlob,
    hasGitHub,
    canWrite: hasBlob || hasGitHub || !isVercel,
  });
}
