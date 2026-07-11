import Image from "next/image";
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
  objectFit?: "cover" | "contain";
  placeholder?: "blur" | "empty";
}

function isNativeImage(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("blob:");
}

export default function ProductImage({
  src,
  alt,
  className,
  fill = false,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  objectFit = "cover",
  placeholder = "blur",
}: ProductImageProps) {
  const fitClass = objectFit === "cover" ? "object-cover" : "object-contain";
  const blurProps = placeholder === "blur" && !isNativeImage(src)
    ? { placeholder: "blur" as const, blurDataURL: TEXTILE_BLUR }
    : {};

  if (isNativeImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn(fitClass, className)} />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={85}
        className={cn(fitClass, className)}
        {...blurProps}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 400}
      height={height ?? 300}
      sizes={sizes}
      priority={priority}
      quality={85}
      className={cn(fitClass, className)}
      {...blurProps}
    />
  );
}