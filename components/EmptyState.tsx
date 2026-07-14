import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

type EmptyStateProps = {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actions?: Action[];
  className?: string;
};

export default function EmptyState({
  icon: Icon = Package,
  eyebrow,
  title,
  description,
  actions = [],
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[#E8DFD0] bg-gradient-to-b from-white via-[#FBF8F3] to-[#F8F4EC] px-6 py-14 sm:py-16 text-center shadow-[0_8px_40px_-16px_rgba(44,37,34,0.12)]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(197,164,110,0.22), transparent 45%), radial-gradient(circle at 80% 70%, rgba(107,45,60,0.1), transparent 40%)",
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <div className="mx-auto mb-5 w-20 h-20 rounded-full border border-[#E8DFD0] bg-white shadow-inner flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6B2D3C]/10 to-[#C5A46E]/25 flex items-center justify-center">
            <Icon className="w-7 h-7 text-[#6B2D3C]" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>
        {eyebrow ? (
          <p className="text-[11px] tracking-[0.28em] text-[#C5A46E] font-medium mb-2">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#2C2522] mb-2">
          {title}
        </h2>
        <p className="text-sm text-[#6B5F54] max-w-sm mx-auto leading-relaxed mb-8">
          {description}
        </p>
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {actions.map((action) => {
              const cls =
                action.variant === "secondary"
                  ? "inline-flex items-center justify-center px-7 py-3 rounded-2xl border border-[#D4C9B8] bg-white text-sm font-medium min-h-[48px] hover:border-[#6B2D3C]/40 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46E]"
                  : "btn-primary inline-flex items-center justify-center px-7 py-3 rounded-2xl text-sm font-medium min-h-[48px]";

              if (action.href) {
                return (
                  <Link key={action.label} href={action.href} className={cls}>
                    {action.label}
                  </Link>
                );
              }
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={cls}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
