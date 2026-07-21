"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function makeSchema(isClaimMode: boolean) {
  return z
    .object({
      mode: z.enum(["create", "join"]),
      displayName: z.string().optional(),
      email: z.email("Email invalide"),
      password: z.string().min(6, "6 caractères minimum"),
      confirmPassword: z.string().min(1, "Confirmation requise"),
      householdName: z.string().optional(),
      inviteCode: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (values.confirmPassword !== values.password) {
        ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas" });
      }
      if (isClaimMode) return;
      if (!values.displayName?.trim()) {
        ctx.addIssue({ code: "custom", path: ["displayName"], message: "Prénom requis" });
      }
      if (values.mode === "create" && !values.householdName?.trim()) {
        ctx.addIssue({ code: "custom", path: ["householdName"], message: "Nom du foyer requis" });
      }
      if (values.mode === "join" && !values.inviteCode?.trim()) {
        ctx.addIssue({ code: "custom", path: ["inviteCode"], message: "Code d'invitation requis" });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export function SignupForm({ claimCode }: { claimCode?: string }) {
  const isClaimMode = !!claimCode;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(makeSchema(isClaimMode)),
    defaultValues: { mode: "create" },
  });

  function handleModeChange(value: string) {
    const next = value as "create" | "join";
    setMode(next);
    setValue("mode", next);
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: isClaimMode
          ? { claim_code: claimCode }
          : {
              display_name: values.displayName,
              ...(values.mode === "create"
                ? { household_name: values.householdName?.trim() }
                : { invite_code: values.inviteCode?.trim() }),
            },
      },
    });
    setLoading(false);

    if (error) {
      toast.error("Inscription impossible", { description: error.message });
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    toast.success("Compte créé", {
      description: "Vérifiez votre boîte mail pour confirmer votre inscription.",
    });
    router.replace("/login");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {!isClaimMode && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">Prénom</Label>
          <Input id="displayName" placeholder="Alex" {...register("displayName")} />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="vous@exemple.com" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <PasswordInput id="password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {!isClaimMode && (
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="w-full">
            <TabsTrigger value="create" className="flex-1">
              Créer mon foyer
            </TabsTrigger>
            <TabsTrigger value="join" className="flex-1">
              Rejoindre un foyer
            </TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="mt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="householdName">Nom du foyer</Label>
              <Input id="householdName" placeholder="Nous Deux" {...register("householdName")} />
              {errors.householdName && (
                <p className="text-xs text-destructive">{errors.householdName.message}</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="join" className="mt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inviteCode">Code d&apos;invitation</Label>
              <Input id="inviteCode" placeholder="ex : 289e9cbc" {...register("inviteCode")} />
              {errors.inviteCode && <p className="text-xs text-destructive">{errors.inviteCode.message}</p>}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Création..." : "Créer mon compte"}
      </Button>
    </form>
  );
}
