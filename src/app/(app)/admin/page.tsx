import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import { isSuperAdmin, getAllHouseholdsOverview } from "@/lib/admin";
import { adminDeleteHousehold, adminDeleteUser } from "./actions";

export default async function AdminPage() {
  if (!(await isSuperAdmin())) notFound();

  const households = await getAllHouseholdsOverview();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-5 text-destructive" />
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Tous les foyers inscrits sur l&apos;appli. Vue lecture seule + suppression — accès réservé à toi seul.
      </p>

      {households.map((h) => (
        <Card key={h.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{h.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Code : {h.invite_code} · créé le {new Date(h.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link href={`/admin/${h.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Eye className="size-3.5" />
                Voir
              </Link>
              <AdminDeleteButton
                confirmMessage={`Supprimer tout le foyer "${h.name}" ? Toutes ses données (transactions, comptes, factures...) seront perdues définitivement.`}
                action={adminDeleteHousehold.bind(null, h.id)}
                successMessage="Foyer supprimé"
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {h.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email ?? "Pas de compte"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={m.user_id ? "secondary" : "outline"}>
                    {m.user_id ? "Connecté" : "En attente"}
                  </Badge>
                  {m.user_id && (
                    <AdminDeleteButton
                      confirmMessage={`Supprimer le compte de ${m.display_name} ? Cette action est irréversible.`}
                      action={adminDeleteUser.bind(null, m.user_id)}
                      successMessage="Compte supprimé"
                    />
                  )}
                </div>
              </div>
            ))}
            {h.members.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun membre.</p>
            )}
          </CardContent>
        </Card>
      ))}

      {households.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun foyer inscrit pour l&apos;instant.</p>
      )}
    </div>
  );
}
