"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Paperclip, X } from "lucide-react";
import { attachReceipt, getReceiptSignedUrl, removeReceipt } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";

export function ReceiptUpload({
  table,
  id,
  householdId,
  receiptUrl,
}: {
  table: "transactions" | "bills";
  id: string;
  householdId: string;
  receiptUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [pending, startTransition] = useTransition();

  function handlePick() {
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    startUpload(async () => {
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${householdId}/${table}/${id}-${Date.now()}.${ext}`;
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, file, { contentType: file.type, upsert: true });
        if (uploadError) throw uploadError;
        await attachReceipt(table, id, path);
        toast.success("Justificatif ajouté");
        router.refresh();
      } catch (err) {
        toast.error("Échec de l'envoi", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeReceipt(table, id);
        toast.success("Justificatif supprimé");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  async function handleView() {
    if (!receiptUrl) return;
    try {
      const url = await getReceiptSignedUrl(receiptUrl);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Impossible d'ouvrir le justificatif");
    }
  }

  if (receiptUrl) {
    return (
      <div className="flex items-center gap-1">
        <button type="button" onClick={handleView} className="text-xs text-primary hover:underline">
          Voir le justificatif
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={pending}
          aria-label="Supprimer le justificatif"
          className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={handlePick}
        disabled={uploading}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        {uploading ? <Loader2 className="size-3 animate-spin" /> : <Paperclip className="size-3" />}
        Joindre un justificatif
      </button>
    </>
  );
}
