"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryIcon, categoryBg, categoryText } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import type { PocketBalance } from "@/lib/data";

export function IncomeSimulator({
  pockets,
  currentIncome,
}: {
  pockets: PocketBalance[];
  currentIncome: number;
}) {
  const [newIncome, setNewIncome] = useState(String(currentIncome || 0));
  const parsed = parseFloat(newIncome.replace(",", ".")) || 0;
  const delta = parsed - currentIncome;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Et si mon revenu changeait ?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Revenu actuel : <span className="font-medium text-foreground">{formatAmount(currentIncome)}</span> / mois
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-income">Nouveau revenu mensuel</Label>
            <Input
              id="new-income"
              inputMode="decimal"
              value={newIncome}
              onChange={(e) => setNewIncome(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Impact sur la répartition</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {pockets.map((p) => {
            const impact = delta * (p.allocation_pct / 100);
            return (
              <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
                <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(p.color)}`}>
                  <CategoryIcon icon={p.icon} className="size-3.5" />
                </div>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                  {p.allocation_pct}%
                </span>
                <span
                  className={`w-24 shrink-0 text-right font-medium tabular-nums ${
                    impact === 0 ? "text-muted-foreground" : impact > 0 ? "text-good" : "text-critical"
                  }`}
                >
                  {impact >= 0 ? "+" : ""}
                  {formatAmount(impact)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {jointImpactNote(pockets, delta)}
    </div>
  );
}

function jointImpactNote(pockets: PocketBalance[], delta: number) {
  const joint = pockets.find((p) => p.name.toLowerCase().includes("joint"));
  if (!joint || delta === 0) return null;
  const impact = delta * (joint.allocation_pct / 100);
  return (
    <p className={`text-sm ${categoryText(joint.color)}`}>
      {joint.name} passerait à {formatAmount(joint.balance + impact)} le mois prochain avec ce
      changement.
    </p>
  );
}
