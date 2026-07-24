"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

export default function ShareFabric({
  name,
  slug,
}: {
  name: string;
  slug: string;
}) {
  const share = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/products/${slug}`
        : `/products/${slug}`;
    const text = `Look at this fabric from BIYORA SHOP: ${name}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
        return;
      } catch {
        /* fall through */
      }
    }

    const ok = await copyToClipboard(url);
    if (ok) {
      toast.success("Link copied — share with your tailor or squad", {
        description: "Tip: first orders can use KWARI10 when eligible",
      });
    } else {
      toast.error("Could not share — copy the page URL manually");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B5F54] hover:text-[#6B2D3C] min-h-[40px]"
    >
      <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
      Share this fabric
    </button>
  );
}
