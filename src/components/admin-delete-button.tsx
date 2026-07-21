"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminDeleteButton({
  confirmMessage,
  action,
  successMessage,
  label,
}: {
  confirmMessage: string;
  action: () => Promise<void>;
  successMessage: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={label ? "sm" : "icon"}
      className={label ? "text-destructive hover:text-destructive" : "size-7 text-destructive hover:text-destructive"}
      onClick={handleClick}
      disabled={pending}
    >
      <Trash2 className="size-3.5" />
      {label}
    </Button>
  );
}
