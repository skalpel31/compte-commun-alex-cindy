import { CategoryIcon, categoryBg, categoryText } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import { Sparkline } from "@/components/sparkline";
import type { PocketBalance } from "@/lib/data";

export function PocketCards({ pockets }: { pockets: PocketBalance[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {pockets.map((p) => (
        <div key={p.id} className="glass flex flex-col gap-2 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className={`flex size-8 items-center justify-center rounded-full text-white ${categoryBg(p.color)}`}>
              <CategoryIcon icon={p.icon} className="size-4" />
            </div>
          </div>
          <p className="truncate text-xs text-muted-foreground">{p.name}</p>
          <p className={`text-lg font-semibold tabular-nums ${categoryText(p.color)}`}>
            {formatAmount(p.balance)}
          </p>
          <Sparkline values={p.sparkline} color={p.color} />
        </div>
      ))}
    </div>
  );
}
