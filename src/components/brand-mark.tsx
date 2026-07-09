import { Sparkles } from "lucide-react";

export function BrandMark({ withLabel = true }: { withLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2554d6] to-[#6d3fe0] text-white shadow-sm">
        <Sparkles className="size-4" />
      </div>
      {withLabel && <span className="text-base font-semibold tracking-tight">Nous Deux</span>}
    </div>
  );
}
