import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendContactReply } from "@/lib/email";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(20),
});

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 15 * 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const body = contactSchema.parse(await req.json());

    await sendContactReply({
      to: body.email,
      name: body.name,
      subject: body.subject,
      message: body.message,
    });

    return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl) });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
