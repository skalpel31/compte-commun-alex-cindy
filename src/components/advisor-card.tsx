import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type AdvisorItem = {
  icon: LucideIcon;
  tone: "good" | "warning" | "info";
  text: string;
  actionLabel: string;
  actionHref: string;
};

const TONE_BG: Record<AdvisorItem["tone"], string> = {
  good: "bg-good/10 text-good",
  warning: "bg-warning/10 text-warning",
  info: "bg-primary/10 text-primary",
};

export function AdvisorCard({ items, analyzedAt }: { items: AdvisorItem[]; analyzedAt: string }) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">Le conseiller</CardTitle>
        <p className="text-xs text-muted-foreground">Dernière analyse à {analyzedAt}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Rien à signaler pour le moment.
          </p>
        ) : (
          items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${TONE_BG[item.tone]}`}>
                  <Icon className="size-4" />
                </div>
                <p className="flex-1 text-sm">{item.text}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  nativeButton={false}
                  render={<Link href={item.actionHref} />}
                >
                  {item.actionLabel}
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
