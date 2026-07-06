"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
}

export default function ActiveFilterChips({ chips, onClearAll }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="pl-3 pr-1.5 py-1.5 rounded-full bg-[#F8F4EC] border border-[#D4C9B8] text-[#2C2522] font-normal gap-1"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="ml-1 p-0.5 rounded-full hover:bg-[#6B2D3C]/10"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {onClearAll && chips.length > 1 && (
        <button type="button" onClick={onClearAll} className="text-xs text-[#C5A46E] hover:underline ml-1">
          Clear all
        </button>
      )}
    </div>
  );
}