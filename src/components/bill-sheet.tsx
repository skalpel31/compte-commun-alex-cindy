"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { createBill, markBillPaid, updateBill, type BillInput } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { formatAmount, localDateString } from "@/lib/format";
import { JOINT_PAYER } from "@/lib/payer";
import type { Bill, Budget, Category, Pocket, Profile } from "@/lib/types";

function BillForm({
  bill,
  categories,
  profiles,
  pockets,
  budgets = [],
  onDone,
}: {
  bill?: Bill;
  categories: Category[];
  profiles: Profile[];
  pockets: Pocket[];
  budgets?: Budget[];
  onDone: () => void;
}) {
  const [name, setName] = useState(bill?.name ?? "");
  const [amount, setAmount] = useState(bill ? String(bill.amount) : "");
  const [dueDay, setDueDay] = useState(bill ? String(bill.due_day) : "1");
  const [categoryId, setCategoryId] = useState<string>(bill?.category_id ?? "none");
  const [pocketId, setPocketId] = useState<string>(bill?.pocket_id ?? "none");
  const [pocketTouched, setPocketTouched] = useState(!!bill?.pocket_id);
  const [payer, setPayer] = useState<string>(bill?.default_payer ?? "");
  const [autopay, setAutopay] = useState(bill?.autopay ?? false);
  const [hasInstallments, setHasInstallments] = useState(!!bill?.installments_total);
  const [installmentsTotal, setInstallmentsTotal] = useState(
    bill?.installments_total ? String(bill.installments_total) : ""
  );
  const [finalAmount, setFinalAmount] = useState(bill?.final_amount ? String(bill.final_amount) : "");
  const [firstAmount, setFirstAmount] = useState(bill?.first_amount ? String(bill.first_amount) : "");
  const [startDate, setStartDate] = useState(bill?.start_date ?? localDateString(new Date()));
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const overlappingBudget =
    categoryId !== "none" ? budgets.find((b) => b.category_id === categoryId && !b.auto) : undefined;

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    if (!pocketTouched) {
      const cat = categories.find((c) => c.id === value);
      setPocketId(cat?.default_pocket_id ?? "none");
    }
  }

  function handleSave() {
    const numericAmount = parseFloat(amount.replace(",", "."));
    const day = parseInt(dueDay, 10);
    if (!name.trim() || !numericAmount || numericAmount <= 0 || !day || day < 1 || day > 28) {
      toast.error("Vérifie le nom, le montant et le jour (1-28)");
      return;
    }
    const total = hasInstallments ? parseInt(installmentsTotal, 10) : null;
    if (hasInstallments && (!total || total < 1)) {
      toast.error("Indique un nombre de mensualités valide");
      return;
    }
    if (hasInstallments && !startDate) {
      toast.error("Indique depuis quand tu paies déjà");
      return;
    }
    if (!bill && alreadyPaid && !payer) {
      toast.error("Choisis qui a payé pour la marquer payée");
      return;
    }
    const finalAmountNumeric = finalAmount ? parseFloat(finalAmount.replace(",", ".")) : null;
    const firstAmountNumeric = firstAmount ? parseFloat(firstAmount.replace(",", ".")) : null;
    const input: BillInput = {
      name: name.trim(),
      amount: numericAmount,
      due_day: day,
      category_id: categoryId === "none" ? null : categoryId,
      default_payer: payer || null,
      pocket_id: pocketId === "none" ? null : pocketId,
      autopay,
      installments_total: total,
      final_amount: hasInstallments && finalAmountNumeric ? finalAmountNumeric : null,
      first_amount: hasInstallments && firstAmountNumeric ? firstAmountNumeric : null,
      start_date: hasInstallments ? startDate : null,
    };
    startTransition(async () => {
      try {
        if (bill) {
          await updateBill(bill.id, input);
          toast.success("Facture mise à jour");
        } else {
          const newBillId = await createBill(input);
          if (alreadyPaid) {
            await markBillPaid(newBillId, payer === JOINT_PAYER ? null : payer);
          }
          toast.success(alreadyPaid ? "Facture ajoutée, déjà marquée payée ce mois-ci" : "Facture ajoutée");
        }
        onDone();
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="bill-name">Nom</Label>
          <Input
            id="bill-name"
            placeholder="Loyer, électricité, internet..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bill-amount">Montant</Label>
            <Input
              id="bill-amount"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bill-day">Jour d&apos;échéance</Label>
            <Input
              id="bill-day"
              type="number"
              min={1}
              max={28}
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={(v) => handleCategoryChange(v ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Optionnel">
                  {(value: string) =>
                    value === "none" ? "Aucune" : categories.find((c) => c.id === value)?.name
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Compte</Label>
            <Select
              value={pocketId}
              onValueChange={(v) => {
                setPocketId(v ?? "none");
                setPocketTouched(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Aucune">
                  {(value: string) =>
                    value === "none" ? "Aucune" : pockets.find((p) => p.id === value)?.name
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {pockets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {overlappingBudget && (
          <p className="rounded-lg border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
            Cette catégorie a déjà un budget fixé à la main ({formatAmount(overlappingBudget.amount_limit)})
            dans Budgets & Enveloppes. Avec cette facture en plus, ce montant risque d&apos;être compté en
            double — pense à repasser ce budget en mode auto.
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Label>Payeur habituel</Label>
          <div className="grid grid-cols-3 gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPayer(payer === p.id ? "" : p.id)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                  payer === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                )}
              >
                {p.display_name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPayer(payer === JOINT_PAYER ? "" : JOINT_PAYER)}
              className={cn(
                "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                payer === JOINT_PAYER
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              Compte Joint
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {autopay
              ? "Nécessaire pour que le prélèvement automatique se marque tout seul."
              : "Optionnel — sinon on te demandera qui a payé à chaque fois."}
          </p>
        </div>
        {!bill && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Déjà payée ce mois-ci</p>
              <p className="text-xs text-muted-foreground">
                Pour une charge régulière déjà réglée — évite qu&apos;elle s&apos;affiche « en
                retard »
              </p>
            </div>
            <Switch checked={alreadyPaid} onCheckedChange={setAlreadyPaid} />
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Prélèvement automatique</p>
            <p className="text-xs text-muted-foreground">
              {autopay && !payer
                ? "Choisis un payeur habituel ci-dessus pour l'activer"
                : "Se marque payée toute seule à la date d'échéance"}
            </p>
          </div>
          <Switch checked={autopay} onCheckedChange={setAutopay} />
        </div>
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Nombre de fois limité</p>
              <p className="text-xs text-muted-foreground">
                Crédit, paiement en plusieurs fois... s&apos;arrête toute seule après la dernière
              </p>
            </div>
            <Switch checked={hasInstallments} onCheckedChange={setHasInstallments} />
          </div>
          {hasInstallments && (
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bill-start-date">Depuis quand tu paies déjà</Label>
                <Input
                  id="bill-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Déjà commencé ? Mets la date du 1er prélèvement, même passée — le nombre de
                  mensualités déjà payées se calcule tout seul.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="bill-installments">Nombre de mensualités</Label>
                <Input
                  id="bill-installments"
                  type="number"
                  min={1}
                  placeholder="ex. 4 ou 10"
                  value={installmentsTotal}
                  onChange={(e) => setInstallmentsTotal(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-first-amount">Premier montant (si différent)</Label>
                  <Input
                    id="bill-first-amount"
                    inputMode="decimal"
                    placeholder={amount || "0,00"}
                    value={firstAmount}
                    onChange={(e) => setFirstAmount(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bill-final-amount">Dernier montant (si différent)</Label>
                  <Input
                    id="bill-final-amount"
                    inputMode="decimal"
                    placeholder={amount || "0,00"}
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <SheetFooter>
        <Button onClick={handleSave} disabled={pending}>
          {bill ? "Enregistrer" : "Créer la facture"}
        </Button>
      </SheetFooter>
    </>
  );
}

export function NewBillSheet({
  categories,
  profiles,
  pockets,
  budgets,
}: {
  categories: Category[];
  profiles: Profile[];
  pockets: Pocket[];
  budgets?: Budget[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nouvelle facture
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouvelle facture récurrente</SheetTitle>
          </SheetHeader>
          <BillForm
            categories={categories}
            profiles={profiles}
            pockets={pockets}
            budgets={budgets}
            onDone={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function EditBillSheet({
  bill,
  categories,
  profiles,
  pockets,
  budgets,
  open,
  onOpenChange,
}: {
  bill: Bill;
  categories: Category[];
  profiles: Profile[];
  pockets: Pocket[];
  budgets?: Budget[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Modifier « {bill.name} »</SheetTitle>
        </SheetHeader>
        <BillForm
          bill={bill}
          categories={categories}
          profiles={profiles}
          pockets={pockets}
          budgets={budgets}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
