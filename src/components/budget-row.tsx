"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { deleteBudget, upsertBudget, updateCategoryRollover, renameCategory, setBudgetAuto } from "@/lib/actions";
import { CategoryIcon, categoryBg, categoryText } from "@/lib/category-style";
import { formatAmount } from "@/lib/format";
import { EditableText } from "@/components/editable-text";
import type { Category, BillWithStatus, Profile } from "@/lib/types";

const SHARED = "shared";

export function BudgetRow({
  category,
  budgetId,
  limit,
  baseLimit,
  spent,
  available,
  auto,
  bills = [],
  month,
  profiles = [],
  scope = "shared",
  ownerId = null,
}: {
  category: Category;
  budgetId: string | null;
  limit: number | null;
  baseLimit?: number | null;
  spent: number;
  available?: number;
  auto: boolean;
  bills?: BillWithStatus[];
  month?: string;
  profiles?: Profile[];
  scope?: "shared" | "personal";
  ownerId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(baseLimit ? String(baseLimit) : "");
  const [rollover, setRollover] = useState(category.budget_rollover);
  const [autoState, setAutoState] = useState(auto);
  const [owner, setOwner] = useState<string>(scope === "personal" && ownerId ? ownerId : SHARED);
  const [pending, startTransition] = useTransition();
  const ownerProfile = profiles.find((p) => p.id === ownerId);

  // limit/available can legitimately be 0 (budget fully used) — never treat
  // that as "no budget set", only `null`/`undefined` mean that.
  const hasLimit = limit !== null && limit !== undefined;
  const pct = hasLimit && limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : hasLimit ? 100 : 0;
  const severity = !hasLimit ? "" : pct >= 100 ? "bg-critical" : pct >= 80 ? "bg-warning" : categoryBg(category.color);

  function handleSave() {
    const trimmed = amount.trim();
    const numeric = trimmed ? parseFloat(trimmed.replace(",", ".")) : 0;
    if (Number.isNaN(numeric) || numeric < 0) {
      toast.error("Montant invalide");
      return;
    }
    // 0 (or blank) means "no fixed amount" — switch to auto instead of
    // blocking, it'll fill itself in once a bill lands in this category.
    if (numeric === 0) {
      handleAutoChange(true);
      setOpen(false);
      return;
    }
    if (owner !== SHARED) {
      // Personal budgets are always a fixed amount — auto mode only ever
      // computes a shared/household number from bills.
      setAutoState(false);
    }
    startTransition(async () => {
      try {
        await upsertBudget({
          category_id: category.id,
          amount_limit: numeric,
          scope: owner === SHARED ? "shared" : "personal",
          user_id: owner === SHARED ? null : owner,
          month,
        });
        toast.success("Budget enregistré");
        setAutoState(false);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec de l'enregistrement", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  function handleRolloverChange(next: boolean) {
    setRollover(next);
    startTransition(async () => {
      try {
        await updateCategoryRollover(category.id, next);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleAutoChange(next: boolean) {
    if (next && owner !== SHARED) {
      toast.error("Un budget personnel ne peut pas être en mode auto");
      return;
    }
    setAutoState(next);
    startTransition(async () => {
      try {
        await setBudgetAuto(category.id, next, month);
        toast.success(
          next ? "Calcul automatique activé" : "Montant figé, ne suivra plus les factures"
        );
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
        setAutoState(!next);
      }
    });
  }

  function handleDelete() {
    if (!budgetId) return;
    startTransition(async () => {
      try {
        await deleteBudget(budgetId);
        toast.success("Budget supprimé");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec de la suppression", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col gap-2 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <CategoryIcon icon={category.icon} className={`size-4 shrink-0 ${categoryText(category.color)}`} />
          <span className="flex-1 truncate text-sm font-medium">
            {category.name}
            {ownerProfile && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                {ownerProfile.display_name}
              </span>
            )}
          </span>
          {hasLimit ? (
            <span className="text-xs text-muted-foreground">
              {formatAmount(spent)} / {formatAmount(limit)}
              {auto && <span className="ml-1 text-primary">· auto</span>}
              {category.budget_rollover && <span className="ml-1 text-primary">· cumulé</span>}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Définir un budget</span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          {hasLimit && (
            <div
              className={`h-full rounded-full transition-all ${severity}`}
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          )}
        </div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CategoryIcon icon={category.icon} className={`size-4 shrink-0 ${categoryText(category.color)}`} />
              <EditableText
                value={category.name}
                onSave={(next) => renameCategory(category.id, next)}
                successMessage="Nom mis à jour"
                ariaLabel="Renommer la catégorie"
              />
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            <Label htmlFor="budget-amount">Budget mensuel</Label>
            <Input
              id="budget-amount"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Déjà dépensé {rollover ? "depuis le début du cumul" : "ce mois-ci"} : {formatAmount(spent)}
            </p>
            {profiles.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Pour qui ?</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOwner(SHARED)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      owner === SHARED
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    Commun
                  </button>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setOwner(p.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        owner === p.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {p.display_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={rollover} onCheckedChange={handleRolloverChange} disabled={pending} />
              Ce qui n&apos;est pas dépensé se reporte au mois suivant
            </label>
            {rollover && available !== undefined && (
              <p className="text-xs text-muted-foreground">
                Disponible ce mois-ci (cumulé) : {formatAmount(available)}
              </p>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={autoState}
                onCheckedChange={handleAutoChange}
                disabled={pending || owner !== SHARED}
              />
              Calculer automatiquement depuis les factures de cette catégorie
            </label>
            {owner !== SHARED && (
              <p className="text-xs text-muted-foreground">
                Un budget personnel est toujours un montant fixe.
              </p>
            )}
            {autoState && (
              <p className="text-xs text-primary">
                Calculé automatiquement depuis tes factures — l&apos;enregistrer ici fixera un
                montant fixe à la place.
              </p>
            )}
            {bills.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Factures dans cette catégorie ({bills.length})
                </p>
                {bills.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span>{b.name}</span>
                    <span className="flex items-center gap-2 tabular-nums">
                      {formatAmount(b.effectiveAmount)}
                      {b.status === "paid" && (
                        <span className="text-xs text-primary">payée</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <SheetFooter className="flex-row gap-2">
            {budgetId && (
              <Button variant="outline" className="flex-1" onClick={handleDelete} disabled={pending}>
                Supprimer
              </Button>
            )}
            <Button className="flex-1" onClick={handleSave} disabled={pending}>
              Enregistrer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
