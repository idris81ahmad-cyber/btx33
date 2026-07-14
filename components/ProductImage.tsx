"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TEXTILE_BLUR } from "@/lib/image-blur";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  /** 1–100; default 80 for cards, use 85–90 for hero/gallery. */
  quality?: number;
  objectFit?: "cover" | "contain";
  placeholder?: "blur" | "empty";
  /** Extra class for the outer wrapper when fill is used */
  wrapperClassName?: string;
}

function isNativeImage(src: string): boolean {
  return !src || src.startsWith("data:") || src.startsWith("blob:");
}

const FALLBACK = "/images/ankara-premium.jpg";

/**
 * Optimized product/media image via next/image.
 * Always pass an explicit `sizes` for fill layouts to avoid oversized downloads.
 */
export default function ProductImage({
  src,
  alt,
  className,
  fill = false,
  width,
  height,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  quality = 80,
  objectFit = "cover",
  placeholder = "blur",
  wrapperClassName,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const safeSrc = !src || failed ? FALLBACK : src;
  const fitClass = objectFit === "cover" ? "object-cover" : "object-contain";
  const useBlur = placeholder === "blur" && !isNativeImage(safeSrc);
  const blurProps = useBlur
    ? { placeholder: "blur" as const, blurDataURL: TEXTILE_BLUR }
    : {};
  const q = Math.min(100, Math.max(40, quality));

  // data:/blob: previews (admin file pickers) cannot go through the optimizer
  if (isNativeImage(src) && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn(fitClass, className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  const imageClass = cn(
    fitClass,
    "transition-opacity duration-300",
    loaded ? "opacity-100" : "opacity-0",
    className,
  );

  if (fill) {
    return (
      <div className={cn("absolute inset-0", wrapperClassName)}>
        {!loaded && (
          <div className="absolute inset-0 skeleton" aria-hidden="true" />
        )}
        <Image
          src={safeSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={q}
          className={imageClass}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(false);
          }}
          {...blurProps}
        />
      </div>
    );
  }

  return (
    <span className={cn("relative inline-block", wrapperClassName)}>
      {!loaded && (
        <span
          className="absolute inset-0 skeleton rounded-[inherit]"
          aria-hidden="true"
        />
      )}
      <Image
        src={safeSrc}
        alt={alt}
        width={width ?? 400}
        height={height ?? 300}
        sizes={sizes || `${width ?? 400}px`}
        priority={priority}
        quality={q}
        className={imageClass}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(false);
        }}
        {...blurProps}
      />
    </span>
  );
}
