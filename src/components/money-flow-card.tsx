"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryIcon, categoryBg, nextPocketColor } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import { EditIncomeSheet } from "@/components/edit-income-sheet";
import { AddIncomeSheet } from "@/components/add-income-sheet";
import { NewPocketSheet } from "@/components/pocket-manager";
import type { IncomeSource } from "@/lib/data";
import type { Pocket, Profile } from "@/lib/types";

function colorVar(color: string): string {
  return `var(--${color})`;
}

function rowY(i: number, count: number): number {
  if (count <= 1) return 50;
  return (i / (count - 1)) * 100;
}

function payerColor(payerId: string | null, pockets: Pocket[]): string {
  const jointPocket = pockets.find((p) => p.name.toLowerCase().includes("joint"));
  const owned = payerId ? pockets.find((p) => p.owner_id === payerId) : null;
  return owned?.color ?? jointPocket?.color ?? "chart-1";
}

type SourceBlock = {
  label: string;
  amount: number;
  color: string;
  isTotal?: boolean;
  href?: string;
  source?: IncomeSource;
};

function MoneyFlowDiagram({
  incomeSources,
  incomeTotal,
  pockets,
  profiles,
  byPayerPocket,
  otherIncomeCategoryId,
}: {
  incomeSources: IncomeSource[];
  incomeTotal: number;
  pockets: Pocket[];
  profiles: Profile[];
  byPayerPocket: Record<string, Record<string, number>>;
  otherIncomeCategoryId?: string;
}) {
  const [editing, setEditing] = useState<IncomeSource | null>(null);

  // The lines are drawn from a measured Y (real DOM position of each row,
  // as a % of the container height) rather than an assumed even spread —
  // so they land exactly on the box they're connecting to, no matter how
  // padding/borders/wrapping shift the real layout.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const leftRefs = useRef<Record<string, HTMLElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLElement | null>>({});
  const [measured, setMeasured] = useState<{
    left: Record<string, number>;
    right: Record<string, number>;
    center: number;
  } | null>(null);

  const sourceBlocks: SourceBlock[] = [
    { label: "Revenu du mois", amount: incomeTotal, color: "chart-5", href: "/transactions", isTotal: true },
    ...incomeSources.map((s) => ({
      label: s.label,
      amount: s.amount,
      color: payerColor(s.paidBy, pockets),
      source: s,
    })),
  ];

  if (!incomeSources.some((s) => s.label === "Autres revenus")) {
    sourceBlocks.push({
      label: "Autres revenus / Prime",
      amount: 0,
      color: "chart-3",
      href: otherIncomeCategoryId
        ? `/transactions/new?category=${otherIncomeCategoryId}`
        : "/transactions/new",
    });
  }

  // Every account is shown on the right (even ones with no flow yet, e.g.
  // just created) so creating one is visible immediately — but only ones
  // that actually received money this month get a connecting line drawn.
  const allPocketRows = pockets.map((p) => ({
    pocket: p,
    total: Object.values(byPayerPocket).reduce((s, byPocket) => s + (byPocket[p.id] ?? 0), 0),
  }));
  const pocketRows = allPocketRows.filter((r) => r.total > 0);

  const hasPockets = allPocketRows.length > 0;
  const flowSources = sourceBlocks.filter((b) => b.amount > 0 && !b.isTotal);
  const maxPocketFlow = Math.max(1, ...pocketRows.map((pr) => pr.total));
  const rowCount = Math.max(sourceBlocks.length, allPocketRows.length, 3);
  const height = Math.max(200, rowCount * 50);

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const center = centerRef.current;
      if (!container || !center) return;
      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;
      if (!containerHeight) return;

      // getBoundingClientRect (not offsetTop) because the circle is
      // positioned with a CSS transform (-translate-y-1/2) — offsetTop
      // reflects the untransformed `top` value, not the actual visual
      // position, which threw the center measurement off by half its height.
      const toPct = (el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        return ((rect.top - containerRect.top + rect.height / 2) / containerHeight) * 100;
      };

      const left: Record<string, number> = {};
      for (const [key, el] of Object.entries(leftRefs.current)) {
        if (el) left[key] = toPct(el);
      }
      const right: Record<string, number> = {};
      for (const [key, el] of Object.entries(rightRefs.current)) {
        if (el) right[key] = toPct(el);
      }
      setMeasured({ left, right, center: toPct(center) });
    }

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [sourceBlocks.length, allPocketRows.length, height]);

  // Lines only travel through the empty middle zone (between LEFT_X and
  // RIGHT_X) so they never cross over the label blocks on either side.
  const LEFT_X = 30;
  const RIGHT_X = 66;
  // Where left/right curves overshoot to, inside the household circle's
  // footprint (roughly 44–56), so they visually disappear behind it.
  const CENTER_LEFT_END = 56;
  const CENTER_RIGHT_START = 44;

  const centerY = measured?.center ?? 50;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        {/* Curves deliberately overshoot past the center (into CENTER_LEFT_END /
            CENTER_RIGHT_START) instead of stopping exactly at x=50 — the circle
            renders on top and hides the overlap, so each flow reads as one
            continuous line passing behind the household circle rather than
            two segments meeting at a point. */}
        {flowSources.map((b) => {
          const y = measured?.left[b.label] ?? rowY(sourceBlocks.indexOf(b), sourceBlocks.length);
          const midX = (LEFT_X + CENTER_LEFT_END) / 2;
          return (
            <path
              key={b.label}
              d={`M ${LEFT_X},${y} C ${midX},${y} ${midX},${centerY} ${CENTER_LEFT_END},${centerY}`}
              fill="none"
              stroke={colorVar(b.color)}
              strokeOpacity={0.65}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 2.5, filter: `drop-shadow(0 0 3px ${colorVar(b.color)})` }}
            />
          );
        })}
        {pocketRows.map((pr) => {
          const i = allPocketRows.findIndex((r) => r.pocket.id === pr.pocket.id);
          const y = measured?.right[pr.pocket.id] ?? rowY(i, allPocketRows.length);
          const strokeWidth = 1 + (pr.total / maxPocketFlow) * 2.5;
          const midX = (CENTER_RIGHT_START + RIGHT_X) / 2;
          return (
            <path
              key={pr.pocket.id}
              d={`M ${CENTER_RIGHT_START},${centerY} C ${midX},${centerY} ${midX},${y} ${RIGHT_X},${y}`}
              fill="none"
              stroke={colorVar(pr.pocket.color)}
              strokeOpacity={0.65}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth, filter: `drop-shadow(0 0 3px ${colorVar(pr.pocket.color)})` }}
            />
          );
        })}
      </svg>

      <div
        ref={centerRef}
        className="absolute top-1/2 left-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] via-[#ec4899] to-[#4f8cff] p-1"
      >
        <div className="flex size-full flex-col items-center justify-center gap-0.5 rounded-full bg-background px-2 text-center">
          <span className="text-[0.65rem] leading-none text-muted-foreground">Argent du foyer</span>
          <span className="text-lg leading-none font-semibold tabular-nums">{formatAmount(incomeTotal)}</span>
        </div>
      </div>

      <div className="absolute inset-y-0 left-0 flex w-[28%] flex-col justify-between py-1">
        {sourceBlocks.map((b) => {
          const className = `flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left transition-colors hover:bg-card ${
            b.isTotal ? "border-primary/40 bg-primary/10" : "border-border/60 bg-card/70"
          }`;
          const content = (
            <>
              {!b.isTotal && (
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colorVar(b.color) }} />
              )}
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-medium">{b.label}</p>
                <p
                  className={`tabular-nums ${b.isTotal ? "text-sm font-semibold" : "text-[0.68rem] text-muted-foreground"}`}
                >
                  {formatAmount(b.amount)}
                </p>
              </div>
              {!b.isTotal && <ChevronRight className="size-3 shrink-0 text-muted-foreground" />}
            </>
          );
          const refCallback = (el: HTMLElement | null) => {
            leftRefs.current[b.label] = el;
          };
          if (b.source) {
            return (
              <button key={b.label} ref={refCallback} type="button" onClick={() => setEditing(b.source!)} className={className}>
                {content}
              </button>
            );
          }
          return (
            <Link key={b.label} ref={refCallback} href={b.href ?? "/transactions"} className={className}>
              {content}
            </Link>
          );
        })}
      </div>

      <div className="absolute inset-y-0 right-0 flex w-[32%] flex-col justify-center py-1">
        {hasPockets ? (
          <div className="flex h-full flex-col justify-between">
            {allPocketRows.map((pr) => (
              <div
                key={pr.pocket.id}
                ref={(el) => {
                  rightRefs.current[pr.pocket.id] = el;
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/70 px-2 py-1.5"
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colorVar(pr.pocket.color) }} />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-xs font-medium">{pr.pocket.name}</p>
                  <p className="text-[0.68rem] text-muted-foreground tabular-nums">
                    {pr.total > 0 ? formatAmount(pr.total) : "Rien reçu ce mois-ci"}
                  </p>
                </div>
              </div>
            ))}
            <NewPocketSheet
              nextColor={nextPocketColor(pockets)}
              profiles={profiles}
              renderTrigger={(onClick) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="w-full rounded-lg border border-dashed p-1.5 text-center text-[0.65rem] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  + Ajouter un compte
                </button>
              )}
            />
          </div>
        ) : (
          <NewPocketSheet
            nextColor={nextPocketColor(pockets)}
            profiles={profiles}
            renderTrigger={(onClick) => (
              <button
                type="button"
                onClick={onClick}
                className="w-full rounded-lg border border-dashed p-2 text-center text-[0.65rem] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                + Créer un compte pour répartir ce revenu
              </button>
            )}
          />
        )}
      </div>

      {editing && (
        <EditIncomeSheet
          source={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}

export function MoneyFlowCard({
  incomeSources,
  incomeTotal,
  byPayerPocket,
  pockets,
  profiles,
  otherIncomeCategoryId,
  showEditLink = true,
}: {
  incomeSources: IncomeSource[];
  incomeTotal: number;
  byPayerPocket: Record<string, Record<string, number>>;
  pockets: Pocket[];
  profiles: Profile[];
  otherIncomeCategoryId?: string;
  showEditLink?: boolean;
}) {
  const hasRealIncome = incomeTotal > 0;

  return (
    <Card className="glass">
      <CardHeader className="grid grid-cols-3 items-center">
        <AddIncomeSheet profiles={profiles} className="justify-self-start" />
        <CardTitle className="justify-self-center text-base">Flux d&apos;argent du mois</CardTitle>
        {showEditLink ? (
          <Button
            size="sm"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/flux-argent" />}
            className="justify-self-end"
          >
            Modifier la répartition
          </Button>
        ) : (
          <span />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {hasRealIncome ? (
          <MoneyFlowDiagram
            incomeSources={incomeSources}
            incomeTotal={incomeTotal}
            pockets={pockets}
            profiles={profiles}
            byPayerPocket={byPayerPocket}
            otherIncomeCategoryId={otherIncomeCategoryId}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Ajoute un revenu (catégorie « Salaire ») pour voir la répartition.
            </p>
            {pockets.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <div className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(p.color)}`}>
                  <CategoryIcon icon={p.icon} className="size-3" />
                </div>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatAmount(incomeTotal * (p.allocation_pct / 100))}
                </span>
              </div>
            ))}
            {pockets.length === 0 && (
              <NewPocketSheet
                nextColor={nextPocketColor(pockets)}
                profiles={profiles}
                renderTrigger={(onClick) => (
                  <button
                    type="button"
                    onClick={onClick}
                    className="w-full rounded-lg border border-dashed p-2 text-center text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    + Créer un compte
                  </button>
                )}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
