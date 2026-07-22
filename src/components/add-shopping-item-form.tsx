"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addShoppingListItem } from "@/lib/actions";

export function AddShoppingItemForm({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await addShoppingListItem(weekStart, name.trim());
        setName("");
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Ajouter un article..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <Button size="sm" onClick={handleAdd} disabled={pending}>
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
