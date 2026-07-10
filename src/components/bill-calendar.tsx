"use client";

import { useMemo, useState } from "react";
import { CategoryIcon } from "@/lib/category-style";
import { currentMonth, dayLabel, formatAmount, localDateString, monthLabel } from "@/lib/format";
import type { BillWithStatus } from "@/lib/types";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const DOT_CLASS: Record<BillWithStatus["status"], string> = {
  overdue: "bg-critical",
  upcoming: "bg-warning",
  later: "bg-muted-foreground",
  paid: "bg-muted-foreground",
};

type DayCell = {
  day: number;
  inMonth: boolean;
  dateStr: string;
  bills: BillWithStatus[];
};

function worstStatus(bills: BillWithStatus[]): BillWithStatus["status"] | null {
  if (bills.some((b) => b.status === "overdue")) return "overdue";
  if (bills.some((b) => b.status === "upcoming")) return "upcoming";
  if (bills.length > 0) return "later";
  return null;
}

const CELL_TINT: Record<string, string> = {
  overdue: "bg-critical/10",
  upcoming: "bg-warning/10",
  later: "bg-muted/60",
};

export function BillCalendar({ bills }: { bills: BillWithStatus[] }) {
  const month = currentMonth();
  const todayStr = localDateString(new Date());

  const cells = useMemo<DayCell[]>(() => {
    const [year, monthNum] = month.split("-").map(Number);
    const firstOfMonth = new Date(year, monthNum - 1, 1);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    // Convert JS getDay() (Sun=0) to a Monday-first index (Mon=0 ... Sun=6).
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

    const billsByDate = new Map<string, BillWithStatus[]>();
    for (const bill of bills) {
      const list = billsByDate.get(bill.dueDate) ?? [];
      list.push(bill);
      billsByDate.set(bill.dueDate, list);
    }

    const result: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      const d = new Date(year, monthNum - 1, 1 - (firstWeekday - i));
      result.push({ day: d.getDate(), inMonth: false, dateStr: localDateString(d), bills: [] });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, monthNum - 1, day);
      const dateStr = localDateString(d);
      result.push({ day, inMonth: true, dateStr, bills: billsByDate.get(dateStr) ?? [] });
    }
    let trailing = 1;
    while (result.length % 7 !== 0) {
      const d = new Date(year, monthNum, trailing);
      result.push({ day: d.getDate(), inMonth: false, dateStr: localDateString(d), bills: [] });
      trailing++;
    }
    return result;
  }, [bills, month]);

  const [selected, setSelected] = useState<string>(todayStr);

  const selectedBills = cells.find((c) => c.dateStr === selected)?.bills ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium capitalize">{monthLabel(month)}</p>

      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selected;
            const status = worstStatus(cell.bills);
            const tint = status ? CELL_TINT[status] : "";

            return (
              <button
                key={`${cell.dateStr}-${i}`}
                type="button"
                disabled={cell.bills.length === 0}
                onClick={() => setSelected(cell.dateStr)}
                aria-pressed={isSelected}
                aria-label={
                  cell.bills.length > 0
                    ? `${cell.day} — ${cell.bills.length} facture${cell.bills.length > 1 ? "s" : ""}`
                    : `${cell.day}`
                }
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-xs transition-colors ${
                  cell.inMonth ? "text-foreground" : "text-muted-foreground/40"
                } ${tint} ${isSelected ? "ring-2 ring-primary" : ""} ${
                  isToday && !isSelected ? "ring-1 ring-primary/60" : ""
                } ${cell.bills.length > 0 ? "cursor-pointer hover:bg-muted" : "cursor-default"}`}
              >
                <span className={isToday ? "font-semibold" : undefined}>{cell.day}</span>
                {cell.bills.length > 0 && (
                  <span className="flex gap-0.5">
                    {cell.bills.slice(0, 3).map((b) => (
                      <span key={b.id} className={`size-1.5 rounded-full ${DOT_CLASS[b.status]}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground capitalize">
          {selected ? dayLabel(selected) : ""}
        </p>
        {selectedBills.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            Aucune facture ce jour-là.
          </p>
        ) : (
          selectedBills.map((bill) => (
            <div key={bill.id} className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <CategoryIcon
                  icon={bill.category?.icon ?? null}
                  className="size-4 text-muted-foreground"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{bill.name}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatAmount(bill.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
