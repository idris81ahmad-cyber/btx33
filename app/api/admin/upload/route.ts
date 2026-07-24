import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

async function toWebpBuffer(file: File): Promise<{ buffer: Buffer; contentType: string; ext: string } | null> {
  try {
    // sharp is optional; Next also serves AVIF/WebP via image optimizer
    const sharp = (await import("sharp")).default;
    const input = Buffer.from(await file.arrayBuffer());
    const buffer = await sharp(input)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { buffer, contentType: "image/webp", ext: "webp" };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 },
    );
  }

  const ip = clientIp(req);
  const rl = rateLimit(`admin-upload:${session.user?.id || ip}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a minute." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Image upload requires Vercel Blob. Connect a Blob store in your Vercel project settings, or paste an image URL instead.",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Cap upload size (~8MB) to blunt abuse
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be 8MB or smaller" },
        { status: 400 },
      );
    }

    const converted = await toWebpBuffer(file);
    const safeBase =
      file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-") || "upload";

    let body: Buffer | File;
    let contentType: string;
    let ext: string;

    if (converted) {
      body = converted.buffer;
      contentType = converted.contentType;
      ext = converted.ext;
    } else {
      body = file;
      contentType = file.type || "image/jpeg";
      const originalExt = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      ext = originalExt || "jpg";
    }

    const pathname = `btx3/products/${Date.now()}-${safeBase}.${ext}`;

    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });

    return NextResponse.json(
      {
        url: blob.url,
        contentType,
        convertedToWebp: Boolean(converted),
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("admin-upload", "Image upload failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
