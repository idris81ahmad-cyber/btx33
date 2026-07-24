import {
  DELIVERY_PIPELINE,
  deliveryStepIndex,
  orderStatusHelp,
  orderStatusLabel,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";

export type StatusHistoryEvent = {
  id?: number;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  actor?: string;
  createdAt: string;
};

/**
 * Visual delivery progress for customers.
 * Steps: Confirmed → Preparing → Out for delivery → Delivered
 */
export default function OrderDeliveryTimeline({
  status,
  history,
}: {
  status: string;
  history?: StatusHistoryEvent[];
}) {
  if (status === "cancelled") {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        role="status"
      >
        <p className="font-medium">{orderStatusLabel(status)}</p>
        <p className="text-xs mt-1 opacity-90">{orderStatusHelp(status)}</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div
        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        role="status"
      >
        <p className="font-medium">{orderStatusLabel(status)}</p>
        <p className="text-xs mt-1 opacity-90">{orderStatusHelp(status)}</p>
      </div>
    );
  }

  const step = deliveryStepIndex(status); // 1..4 for pipeline

  return (
    <div
      className="space-y-4 rounded-2xl border border-[#F0E9DC] bg-gradient-to-b from-white to-[#FBF8F3]/80 p-4 sm:p-5"
      aria-label="Delivery progress"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#C5A46E] font-medium">
          Delivery timeline
        </p>
        <p className="text-[11px] font-semibold text-[#6B2D3C]">
          {orderStatusLabel(status)}
        </p>
      </div>
      <ol className="flex items-start gap-0 w-full">
        {DELIVERY_PIPELINE.map((s, i) => {
          const pipelineStep = i + 1;
          const done = step > pipelineStep;
          const current = step === pipelineStep;
          const upcoming = step < pipelineStep;

          return (
            <li key={s} className="flex-1 flex flex-col items-center min-w-0 relative">
              {i > 0 && (
                <span
                  className={cn(
                    "absolute top-3.5 right-1/2 w-full h-[3px] -translate-y-1/2 rounded-full",
                    step > i ? "bg-gradient-to-r from-[#6B2D3C] to-[#C5A46E]" : "bg-[#EDE6D9]",
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-sm",
                  done && "bg-[#6B2D3C] border-[#6B2D3C] text-white",
                  current &&
                    "bg-white border-[#6B2D3C] text-[#6B2D3C] ring-4 ring-[#C5A46E]/25 scale-110",
                  upcoming && "bg-white border-[#D4C9B8] text-[#A89B8A]",
                )}
                aria-current={current ? "step" : undefined}
              >
                {done ? "✓" : pipelineStep}
              </span>
              <span
                className={cn(
                  "mt-2.5 text-[10px] sm:text-xs text-center leading-tight px-0.5",
                  current ? "text-[#6B2D3C] font-semibold" : "text-[#6B5F54]",
                )}
              >
                {orderStatusLabel(s).replace("Order ", "").replace("Preparing order", "Preparing")}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-[#6B5F54] leading-relaxed bg-white/70 rounded-xl px-3 py-2 border border-[#F0E9DC]">
        {orderStatusHelp(status)}
      </p>

      {history && history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#EDE6D9]">
          <h4 className="text-[10px] uppercase tracking-wide text-[#6B5F54] mb-2">
            Status history
          </h4>
          <ol className="space-y-2">
            {[...history].reverse().map((h, i) => (
              <li
                key={h.id ?? `${h.toStatus}-${h.createdAt}-${i}`}
                className="flex gap-2 text-xs text-[#6B5F54]"
              >
                <span className="tabular-nums shrink-0 w-[7.5rem] text-[10px]">
                  {new Date(h.createdAt).toLocaleString()}
                </span>
                <span className="min-w-0">
                  <span className="font-medium text-[#2C2522]">
                    {orderStatusLabel(h.toStatus)}
                  </span>
                  {h.fromStatus ? (
                    <span className="text-[#A89B8A]">
                      {" "}
                      (from {orderStatusLabel(h.fromStatus)})
                    </span>
                  ) : null}
                  {h.note ? <span className="block text-[10px]">{h.note}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
