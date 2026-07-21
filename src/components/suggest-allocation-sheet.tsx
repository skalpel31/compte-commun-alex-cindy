"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { applyPocketAllocations } from "@/lib/actions";
import { formatAmount } from "@/lib/format";
import type { Pocket, Profile } from "@/lib/types";
import type { IncomeSource } from "@/lib/data";

const MIN_PERSONAL_BUFFER = 100;

type Kind = "personal" | "savingsGoal" | "remainder";

type Row = {
  pocket: Pocket;
  billsTotal: number;
  defaultBasis: number;
  ownerLabel: string;
  kind: Kind;
};

export function SuggestAllocationSheet({
  pockets,
  profiles,
  billsTotalByPocket,
  incomeSources,
}: {
  pockets: Pocket[];
  profiles: Profile[];
  billsTotalByPocket: Record<string, number>;
  incomeSources: IncomeSource[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const householdTotal = incomeSources.reduce((sum, s) => sum + s.amount, 0);

  const rows: Row[] = pockets.map((p) => {
    const owner = p.owner_id ? profiles.find((pr) => pr.id === p.owner_id) : null;
    const defaultBasis = owner
      ? incomeSources.filter((s) => s.paidBy === owner.id).reduce((sum, s) => sum + s.amount, 0)
      : householdTotal;
    const billsTotal = billsTotalByPocket[p.id] ?? 0;
    // A personal account is always bill-driven. Among shared accounts, the
    // one(s) that actually carry real bills are "the family's living
    // account" — they absorb whatever's left once everything else is
    // covered. A shared account with NO bills at all is a savings/goal
    // envelope — nothing to derive a % from, so we ask instead of guessing.
    const kind: Kind = owner ? "personal" : billsTotal > 0 ? "remainder" : "savingsGoal";
    return {
      pocket: p,
      billsTotal,
      defaultBasis,
      ownerLabel: owner ? owner.display_name : "Foyer (revenu total)",
      kind,
    };
  });

  const [basisOverride, setBasisOverride] = useState<Record<string, string>>({});
  const [buffer, setBuffer] = useState<Record<string, string>>({});
  const [savingsPct, setSavingsPct] = useState<Record<string, string>>({});

  function basisFor(row: Row) {
    const override = basisOverride[row.pocket.id];
    if (override !== undefined && override !== "") return Number(override);
    return row.defaultBasis;
  }

  function bufferFor(row: Row) {
    if (row.kind !== "personal") return 0;
    const typed = buffer[row.pocket.id];
    if (typed === undefined || typed === "") return MIN_PERSONAL_BUFFER;
    return Math.max(MIN_PERSONAL_BUFFER, Number(typed) || 0);
  }

  const suggestions = useMemo(() => {
    const computed = rows.map((row) => {
      if (row.kind === "savingsGoal") {
        const typed = savingsPct[row.pocket.id];
        const pct = typed === undefined || typed === "" ? null : Math.max(0, Number(typed) || 0);
        return { row, pct };
      }
      if (row.kind === "remainder") {
        return { row, pct: null as number | null }; // filled in below
      }
      const basis = basisFor(row);
      if (!basis || basis <= 0) return { row, pct: null as number | null };
      const pct = Math.round(((row.billsTotal + bufferFor(row)) / basis) * 100);
      return { row, pct };
    });

    const fixedTotal = computed
      .filter((c) => c.row.kind !== "remainder")
      .reduce((sum, c) => sum + (c.pct ?? 0), 0);
    const remainderRows = computed.filter((c) => c.row.kind === "remainder");
    if (remainderRows.length === 0) return computed;

    const remainder = Math.max(0, 100 - fixedTotal);
    const share = Math.floor(remainder / remainderRows.length);
    let leftover = remainder - share * remainderRows.length;
    return computed.map((c) => {
      if (c.row.kind !== "remainder") return c;
      const pct = share + (leftover > 0 ? 1 : 0);
      if (leftover > 0) leftover -= 1;
      return { ...c, pct };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, basisOverride, buffer, savingsPct]);

  const totalSuggested = suggestions.reduce((sum, s) => sum + (s.pct ?? 0), 0);

  function applyAll() {
    startTransition(async () => {
      try {
        const updates = suggestions
          .filter((s) => s.pct !== null)
          .map((s) => ({
            id: s.row.pocket.id,
            allocation_pct: Math.max(0, Math.min(100, s.pct as number)),
            // The "remainder" account is exactly the one that should absorb
            // any unclaimed share when a salary is split — without this
            // flag, the old "give it back to the payer's own personal
            // pocket" fallback kicks back in and silently breaks these %.
            receives_surplus: s.row.kind === "remainder",
          }));
        await applyPocketAllocations(updates);
        toast.success("% appliqués");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Calculator className="size-4" />
        Calculer mes %
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Calculer mes %</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <p className="text-xs text-muted-foreground">
              Les comptes perso couvrent leurs factures + au moins {formatAmount(MIN_PERSONAL_BUFFER)}{" "}
              d&apos;argent de poche. Pour un compte sans facture (épargne, objectif...), dis-nous combien tu
              veux y mettre. Le compte qui porte les charges communes récupère automatiquement le reste, car
              c&apos;est de là que part l&apos;argent qui fait vivre le foyer au quotidien.
            </p>
            {suggestions.map(({ row, pct }) => (
              <div key={row.pocket.id} className="flex flex-col gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{row.pocket.name}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {pct === null ? "—" : `${pct}%`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.kind === "remainder"
                    ? `Factures : ${formatAmount(row.billsTotal)} + le reste · ${row.ownerLabel}`
                    : row.kind === "savingsGoal"
                      ? `Pas de facture · ${row.ownerLabel}`
                      : `Factures : ${formatAmount(row.billsTotal)} · ${row.ownerLabel}`}
                </p>

                {row.kind === "savingsGoal" && (
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`savings-${row.pocket.id}`} className="text-xs text-muted-foreground">
                      Combien veux-tu y mettre chaque mois ?
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id={`savings-${row.pocket.id}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={100}
                        value={savingsPct[row.pocket.id] ?? ""}
                        onChange={(e) =>
                          setSavingsPct((prev) => ({ ...prev, [row.pocket.id]: e.target.value }))
                        }
                        placeholder="ex : 5"
                        className="w-20"
                      />
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                    </div>
                  </div>
                )}

                {(row.kind === "personal" || row.kind === "remainder") && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`basis-${row.pocket.id}`} className="text-xs text-muted-foreground">
                        Salaire pris en compte
                      </Label>
                      <Input
                        id={`basis-${row.pocket.id}`}
                        type="number"
                        inputMode="decimal"
                        value={basisOverride[row.pocket.id] ?? (row.defaultBasis || "")}
                        onChange={(e) =>
                          setBasisOverride((prev) => ({ ...prev, [row.pocket.id]: e.target.value }))
                        }
                        placeholder="0"
                        disabled={row.kind === "remainder"}
                      />
                    </div>
                    {row.kind === "personal" && (
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`buffer-${row.pocket.id}`} className="text-xs text-muted-foreground">
                          + argent de poche (min. {MIN_PERSONAL_BUFFER}€)
                        </Label>
                        <Input
                          id={`buffer-${row.pocket.id}`}
                          type="number"
                          inputMode="decimal"
                          value={buffer[row.pocket.id] ?? MIN_PERSONAL_BUFFER}
                          onChange={(e) => setBuffer((prev) => ({ ...prev, [row.pocket.id]: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <p className={`text-xs ${totalSuggested === 100 ? "text-muted-foreground" : "text-warning"}`}>
              Total suggéré : {totalSuggested}%
              {totalSuggested !== 100 && " — remplis les champs ci-dessus pour arriver à 100%"}
            </p>
          </div>
          <SheetFooter>
            <Button onClick={applyAll} disabled={pending}>
              {pending ? "Application..." : "Appliquer ces %"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
