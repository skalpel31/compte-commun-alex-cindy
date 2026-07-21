"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { CategoryIcon, categoryBg, nextPocketColor } from "@/lib/category-style";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  createPocket,
  deletePocket,
  updatePocketAllocation,
  updatePocketCustomLabel,
  updatePocketOwner,
  updatePocketReceivesSurplus,
} from "@/lib/actions";
import type { Pocket, Profile } from "@/lib/types";

/** New accounts all start with the same neutral icon — nobody could tell us
 * why they'd want to pick one at creation time, and it's not editable
 * anywhere afterward anyway, so asking was just friction. */
const DEFAULT_ACCOUNT_ICON = "wallet";

function PocketRow({ pocket, profiles }: { pocket: Pocket; profiles: Profile[] }) {
  const router = useRouter();
  const [value, setValue] = useState(String(pocket.allocation_pct));
  const [surplus, setSurplus] = useState(pocket.receives_surplus);
  const [editingCustom, setEditingCustom] = useState(false);
  const [customValue, setCustomValue] = useState(pocket.custom_owner_label ?? "");
  const [pending, startTransition] = useTransition();

  function handleOwnerChange(nextOwnerId: string | null) {
    setEditingCustom(false);
    if (nextOwnerId === pocket.owner_id && !pocket.custom_owner_label) return;
    startTransition(async () => {
      try {
        await updatePocketOwner(pocket.id, nextOwnerId);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleCustomLabelSave() {
    const trimmed = customValue.trim();
    if (!trimmed) {
      toast.error("Donne un nom");
      return;
    }
    startTransition(async () => {
      try {
        await updatePocketCustomLabel(pocket.id, trimmed);
        setEditingCustom(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function commit() {
    const numeric = Math.max(0, Math.min(100, Math.round(Number(value))));
    if (Number.isNaN(numeric)) {
      setValue(String(pocket.allocation_pct));
      return;
    }
    setValue(String(numeric));
    if (numeric === pocket.allocation_pct) return;
    startTransition(async () => {
      try {
        await updatePocketAllocation(pocket.id, numeric);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleSurplusChange(next: boolean) {
    setSurplus(next);
    startTransition(async () => {
      try {
        await updatePocketReceivesSurplus(pocket.id, next);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePocket(pocket.id);
        toast.success("Compte supprimé");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-3">
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${categoryBg(pocket.color)}`}>
          <CategoryIcon icon={pocket.icon} className="size-4" />
        </div>
        <span className="flex-1 text-sm">{pocket.name}</span>
        <div className="flex shrink-0 items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={value}
            disabled={pending}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-14 rounded-md border border-input bg-transparent px-2 py-1 text-right text-sm font-medium tabular-nums focus:border-ring focus:outline-none"
          />
          <span className="text-sm font-medium text-muted-foreground">%</span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Supprimer le compte"
          className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <label className="ml-11 flex items-center gap-2 text-xs text-muted-foreground">
        <Switch checked={surplus} onCheckedChange={handleSurplusChange} disabled={pending} />
        Reçoit le surplus non attribué (ex: livrets enfants)
      </label>
      {profiles.length > 0 && (
        <div className="ml-11 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          Propriétaire :
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending}
              onClick={() => handleOwnerChange(p.id)}
              className={`rounded-full border px-2 py-0.5 transition-colors disabled:opacity-50 ${
                pocket.owner_id === p.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {p.display_name}
            </button>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={() => handleOwnerChange(null)}
            className={`rounded-full border px-2 py-0.5 transition-colors disabled:opacity-50 ${
              pocket.owner_id === null && !pocket.custom_owner_label
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            Partagé
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditingCustom(true)}
            className={`rounded-full border px-2 py-0.5 transition-colors disabled:opacity-50 ${
              pocket.custom_owner_label
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {pocket.custom_owner_label ?? "Autre..."}
          </button>
        </div>
      )}
      {editingCustom && (
        <div className="ml-11 flex items-center gap-2">
          <Input
            autoFocus
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Mila, Lino..."
            className="h-8 max-w-40 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomLabelSave();
              if (e.key === "Escape") setEditingCustom(false);
            }}
          />
          <Button size="sm" onClick={handleCustomLabelSave} disabled={pending}>
            OK
          </Button>
        </div>
      )}
    </div>
  );
}

export function NewPocketSheet({
  nextColor,
  profiles = [],
  renderTrigger,
  isSavings = false,
}: {
  nextColor: string;
  profiles?: Profile[];
  renderTrigger?: (onClick: () => void) => React.ReactNode;
  isSavings?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [allocation, setAllocation] = useState(0);
  const [receivesSurplus, setReceivesSurplus] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [useCustomOwner, setUseCustomOwner] = useState(false);
  const [customOwnerLabel, setCustomOwnerLabel] = useState("");
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Donne un nom au compte");
      return;
    }
    if (useCustomOwner && !customOwnerLabel.trim()) {
      toast.error("Écris pour qui est ce compte");
      return;
    }
    startTransition(async () => {
      try {
        await createPocket({
          name: name.trim(),
          icon: DEFAULT_ACCOUNT_ICON,
          color: nextColor,
          allocation_pct: allocation,
          receives_surplus: receivesSurplus,
          owner_id: useCustomOwner ? null : ownerId,
          custom_owner_label: useCustomOwner ? customOwnerLabel.trim() : null,
          is_savings: isSavings,
        });
        toast.success("Compte créé");
        setName("");
        setAllocation(0);
        setReceivesSurplus(false);
        setOwnerId(null);
        setUseCustomOwner(false);
        setCustomOwnerLabel("");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {isSavings ? "Nouveau compte épargne" : "Nouveau compte"}
        </Button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{isSavings ? "Nouveau compte épargne" : "Nouveau compte"}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pocket-name">Nom</Label>
              <Input
                id="pocket-name"
                placeholder="Livret Mila, Livret Lino..."
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {profiles.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>À qui appartient ce compte ?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setOwnerId(p.id);
                        setUseCustomOwner(false);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        !useCustomOwner && ownerId === p.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {p.display_name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerId(null);
                      setUseCustomOwner(false);
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      !useCustomOwner && ownerId === null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    Partagé
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerId(null);
                      setUseCustomOwner(true);
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      useCustomOwner
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    Autre...
                  </button>
                </div>
                {useCustomOwner && (
                  <Input
                    autoFocus
                    placeholder="Mila, Lino, Giuliana..."
                    value={customOwnerLabel}
                    onChange={(e) => setCustomOwnerLabel(e.target.value)}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  &quot;Partagé&quot; = compte commun (ex: Compte Joint). &quot;Autre&quot; sert pour
                  quelqu&apos;un qui n&apos;a pas de compte de connexion (un enfant, par exemple) —
                  le compte reste géré comme un compte partagé, seul le nom affiché change.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="pocket-allocation">Part des revenus</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="pocket-allocation"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={allocation}
                  onChange={(e) => setAllocation(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-20"
                />
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Optionnel — laisse à 0% si ce compte ne reçoit pas directement une part du
                salaire (tu pourras y virer de l&apos;argent manuellement).
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={receivesSurplus} onCheckedChange={setReceivesSurplus} />
              Reçoit le surplus non attribué (ex: livrets enfants)
            </label>
          </div>
          <SheetFooter>
            <Button onClick={handleCreate} disabled={pending}>
              Créer le compte
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function PocketManager({ pockets, profiles = [] }: { pockets: Pocket[]; profiles?: Profile[] }) {
  const total = pockets.reduce((sum, p) => sum + p.allocation_pct, 0);
  const nextColor = nextPocketColor(pockets);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y">
        {pockets.map((p) => (
          <PocketRow key={p.id} pocket={p} profiles={profiles} />
        ))}
      </div>
      <p className={`text-xs ${total === 100 ? "text-muted-foreground" : "text-warning"}`}>
        Total : {total}% {total !== 100 && "— idéalement 100% pour répartir tout revenu"}
      </p>
      <NewPocketSheet nextColor={nextColor} profiles={profiles} />
    </div>
  );
}
