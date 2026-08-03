"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ShoppingListItem } from "@/lib/types";

function itemLabel(item: ShoppingListItem) {
  const qty = item.quantity != null ? `${item.quantity}${item.unit ? " " + item.unit : ""} — ` : "";
  return `${qty}${item.name}`;
}

export function ShoppingListActions({
  items,
  weekStart,
}: {
  items: ShoppingListItem[];
  weekStart: string;
}) {
  const title = `Liste de courses — semaine du ${formatDate(weekStart)}`;
  const disabled = items.length === 0;

  function handleDownload() {
    const lines = items.map((item) => `${item.checked ? "[x]" : "[ ]"} ${itemLabel(item)}`);
    const content = [title, "", ...lines].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liste-de-courses-${weekStart}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) return;
    const rows = items
      .map(
        (item) => `
          <li style="padding:7px 0;border-bottom:1px solid #e5e5e5;display:flex;gap:8px;align-items:baseline;${
            item.checked ? "color:#999;text-decoration:line-through;" : ""
          }">
            <span>${item.checked ? "☑" : "☐"}</span>
            <span>${itemLabel(item)}</span>
          </li>`
      )
      .join("");
    win.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 16px; margin: 0 0 16px; }
            ul { list-style: none; margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <ul>${rows || "<li>Liste vide</li>"}</ul>
        </body>
      </html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={disabled}
        aria-label="Télécharger la liste"
      >
        <Download className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={disabled}
        aria-label="Imprimer la liste"
      >
        <Printer className="size-4" />
      </Button>
    </div>
  );
}
