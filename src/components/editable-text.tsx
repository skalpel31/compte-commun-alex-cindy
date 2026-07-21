"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EditableText({
  value: initialValue,
  onSave,
  successMessage,
  ariaLabel,
  className,
  inputClassName,
}: {
  value: string;
  onSave: (next: string) => Promise<void>;
  successMessage: string;
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function commit() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialValue) {
      setValue(initialValue);
      setEditing(false);
      return;
    }
    startTransition(async () => {
      try {
        await onSave(trimmed);
        toast.success(successMessage);
        setEditing(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
        setValue(initialValue);
      }
    });
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(initialValue);
            setEditing(false);
          }
        }}
        className={cn("h-8 max-w-56", inputClassName)}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span>{initialValue}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 text-muted-foreground"
        onClick={() => setEditing(true)}
        aria-label={ariaLabel}
      >
        <Pencil className="size-3.5" />
      </Button>
    </div>
  );
}
