"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  createIncomeSchedule,
  deleteIncomeSchedule,
  updateIncomeSchedule,
  updateIncomeScheduleActive,
  type IncomeScheduleInput,
} from "@/lib/actions";
import { formatAmount, formatDate, localDateString } from "@/lib/format";
import { nextOccurrenceOnOrAfter } from "@/lib/income-forecast";
import { payerLabel } from "@/lib/payer";
import type { IncomeSchedule, Profile } from "@/lib/types";

const INTERVAL_LABELS: Record<IncomeSchedule["interval_type"], string> = { days: "jours", months: "mois" };

function ScheduleFormFields({
  profiles,
  payerId,
  setPayerId,
  label,
  setLabel,
  intervalType,
  setIntervalType,
  intervalValue,
  setIntervalValue,
  anchorDate,
  setAnchorDate,
  amountEstimate,
  setAmountEstimate,
}: {
  profiles: Profile[];
  payerId: string | null;
  setPayerId: (v: string | null) => void;
  label: string;
  setLabel: (v: string) => void;
  intervalType: IncomeSchedule["interval_type"];
  setIntervalType: (v: IncomeSchedule["interval_type"]) => void;
  intervalValue: string;
  setIntervalValue: (v: string) => void;
  anchorDate: string;
  setAnchorDate: (v: string) => void;
  amountEstimate: string;
  setAmountEstimate: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="flex flex-col gap-2">
        <Label>De qui ?</Label>
        <div className="grid grid-cols-2 gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPayerId(p.id)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                payerId === p.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {p.display_name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-label">Libellé</Label>
        <Input
          id="schedule-label"
          placeholder="ProBTP, Sécu..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="schedule-interval-value">Tous les</Label>
          <Input
            id="schedule-interval-value"
            type="number"
            inputMode="numeric"
            min={1}
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Unité</Label>
          <Select value={intervalType} onValueChange={(v) => setIntervalType((v ?? "months") as IncomeSchedule["interval_type"])}>
            <SelectTrigger className="w-full">
              <SelectValue>{(value: string) => INTERVAL_LABELS[value as IncomeSchedule["interval_type"]]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Jours</SelectItem>
              <SelectItem value="months">Mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-anchor">Dernier versement reçu le</Label>
        <Input
          id="schedule-anchor"
          type="date"
          value={anchorDate}
          onChange={(e) => setAnchorDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Sert de point de départ pour calculer les prochaines dates.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-amount">Montant estimé (optionnel)</Label>
        <Input
          id="schedule-amount"
          inputMode="decimal"
          placeholder="500"
          value={amountEstimate}
          onChange={(e) => setAmountEstimate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Nécessaire pour que les factures à venir tiennent compte de ce versement.
        </p>
      </div>
    </div>
  );
}

function IncomeScheduleRow({ schedule, profiles }: { schedule: IncomeSchedule; profiles: Profile[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [payerId, setPayerId] = useState<string | null>(schedule.payer_id);
  const [label, setLabel] = useState(schedule.label);
  const [intervalType, setIntervalType] = useState<IncomeSchedule["interval_type"]>(schedule.interval_type);
  const [intervalValue, setIntervalValue] = useState(String(schedule.interval_value));
  const [anchorDate, setAnchorDate] = useState(schedule.anchor_date);
  const [amountEstimate, setAmountEstimate] = useState(
    schedule.amount_estimate != null ? String(schedule.amount_estimate) : ""
  );

  function handleActiveChange(next: boolean) {
    startTransition(async () => {
      try {
        await updateIncomeScheduleActive(schedule.id, next);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteIncomeSchedule(schedule.id);
        toast.success("Revenu programmé supprimé");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleSave() {
    if (!payerId) {
      toast.error("Choisis qui reçoit ce revenu");
      return;
    }
    if (!label.trim()) {
      toast.error("Donne un libellé");
      return;
    }
    const input: IncomeScheduleInput = {
      payer_id: payerId,
      label: label.trim(),
      interval_type: intervalType,
      interval_value: Math.max(1, Math.round(Number(intervalValue))),
      anchor_date: anchorDate,
      amount_estimate: amountEstimate ? parseFloat(amountEstimate.replace(",", ".")) : null,
    };
    startTransition(async () => {
      try {
        await updateIncomeSchedule(schedule.id, input);
        toast.success("Revenu programmé mis à jour");
        setEditOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  const next = nextOccurrenceOnOrAfter(schedule, new Date());

  return (
    <div className="flex items-center gap-3 py-2">
      <button type="button" onClick={() => setEditOpen(true)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{schedule.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {payerLabel(schedule.payer_id, profiles)} · tous les {schedule.interval_value}{" "}
          {INTERVAL_LABELS[schedule.interval_type]}
          {schedule.amount_estimate != null && ` · ~${formatAmount(schedule.amount_estimate)}`} · prochain le{" "}
          {formatDate(localDateString(next))}
        </p>
      </button>
      <Switch checked={schedule.active} onCheckedChange={handleActiveChange} disabled={pending} />
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label="Supprimer"
        className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Modifier le revenu programmé</SheetTitle>
          </SheetHeader>
          <ScheduleFormFields
            profiles={profiles}
            payerId={payerId}
            setPayerId={setPayerId}
            label={label}
            setLabel={setLabel}
            intervalType={intervalType}
            setIntervalType={setIntervalType}
            intervalValue={intervalValue}
            setIntervalValue={setIntervalValue}
            anchorDate={anchorDate}
            setAnchorDate={setAnchorDate}
            amountEstimate={amountEstimate}
            setAmountEstimate={setAmountEstimate}
          />
          <SheetFooter>
            <Button onClick={handleSave} disabled={pending}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function NewIncomeScheduleSheet({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [payerId, setPayerId] = useState<string | null>(profiles[0]?.id ?? null);
  const [label, setLabel] = useState("");
  const [intervalType, setIntervalType] = useState<IncomeSchedule["interval_type"]>("months");
  const [intervalValue, setIntervalValue] = useState("1");
  const [anchorDate, setAnchorDate] = useState(() => localDateString(new Date()));
  const [amountEstimate, setAmountEstimate] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setPayerId(profiles[0]?.id ?? null);
    setLabel("");
    setIntervalType("months");
    setIntervalValue("1");
    setAnchorDate(localDateString(new Date()));
    setAmountEstimate("");
  }

  function handleCreate() {
    if (!payerId) {
      toast.error("Choisis qui reçoit ce revenu");
      return;
    }
    if (!label.trim()) {
      toast.error("Donne un libellé");
      return;
    }
    const input: IncomeScheduleInput = {
      payer_id: payerId,
      label: label.trim(),
      interval_type: intervalType,
      interval_value: Math.max(1, Math.round(Number(intervalValue))),
      anchor_date: anchorDate,
      amount_estimate: amountEstimate ? parseFloat(amountEstimate.replace(",", ".")) : null,
    };
    startTransition(async () => {
      try {
        await createIncomeSchedule(input);
        toast.success("Revenu programmé ajouté");
        reset();
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nouveau revenu programmé
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Nouveau revenu programmé</SheetTitle>
          </SheetHeader>
          <ScheduleFormFields
            profiles={profiles}
            payerId={payerId}
            setPayerId={setPayerId}
            label={label}
            setLabel={setLabel}
            intervalType={intervalType}
            setIntervalType={setIntervalType}
            intervalValue={intervalValue}
            setIntervalValue={setIntervalValue}
            anchorDate={anchorDate}
            setAnchorDate={setAnchorDate}
            amountEstimate={amountEstimate}
            setAmountEstimate={setAmountEstimate}
          />
          <SheetFooter>
            <Button onClick={handleCreate} disabled={pending}>
              {pending ? "Ajout..." : "Ajouter"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function IncomeScheduleManager({ schedules, profiles }: { schedules: IncomeSchedule[]; profiles: Profile[] }) {
  return (
    <div className="flex flex-col gap-3">
      {schedules.length > 0 && (
        <div className="flex flex-col divide-y">
          {schedules.map((s) => (
            <IncomeScheduleRow key={s.id} schedule={s} profiles={profiles} />
          ))}
        </div>
      )}
      <NewIncomeScheduleSheet profiles={profiles} />
    </div>
  );
}
