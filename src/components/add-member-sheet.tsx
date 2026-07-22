"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { createMember } from "@/lib/actions";

export function AddMemberSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isChild, setIsChild] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Prénom requis");
      return;
    }
    startTransition(async () => {
      try {
        await createMember(name, isChild);
        toast.success("Membre ajouté");
        setName("");
        setIsChild(false);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error("Échec", { description: err instanceof Error ? err.message : undefined });
      }
    });
  }

  return (
    <>
      <Button type="button" size="xs" variant="secondary" className="w-fit" onClick={() => setOpen(true)}>
        <Plus className="size-3" />
        Ajouter un membre
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-sm rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Ajouter un membre</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            <Label htmlFor="member-name">Prénom</Label>
            <Input
              id="member-name"
              placeholder="Cindy"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Pas besoin de compte pour l&apos;instant — tu pourras gérer ses dépenses/revenus toi-même, et lui/elle
              pourra se connecter plus tard si elle veut, avec le même historique.
            </p>
            <label className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <span className="text-sm">
                C&apos;est un enfant
                <span className="block text-xs font-normal text-muted-foreground">
                  Son suivi Santé/Calisthenics sera visible par tous les parents, pas privé
                </span>
              </span>
              <Switch checked={isChild} onCheckedChange={setIsChild} />
            </label>
          </div>
          <SheetFooter>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? "Ajout..." : "Ajouter"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
