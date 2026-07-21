import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CategoryManager } from "@/components/category-manager";
import { PocketManager } from "@/components/pocket-manager";
import { SuggestAllocationSheet } from "@/components/suggest-allocation-sheet";
import { NotificationSettings } from "@/components/notification-settings";
import { HouseholdInviteCard } from "@/components/household-invite-card";
import { MemberClaimLink } from "@/components/member-claim-link";
import { AddMemberSheet } from "@/components/add-member-sheet";
import { EditableText } from "@/components/editable-text";
import {
  getBillsTotalByPocket,
  getCategories,
  getCurrentProfile,
  getHousehold,
  getMonthIncome,
  getPockets,
  getProfiles,
} from "@/lib/data";
import { updateDisplayName, updateHouseholdName, updateMemberName } from "@/lib/actions";

export default async function SettingsPage() {
  const [categories, profiles, pockets, household, currentProfile, billsTotalByPocket, { sources: incomeSources }] =
    await Promise.all([
      getCategories(),
      getProfiles(),
      getPockets(),
      getHousehold(),
      getCurrentProfile(),
      getBillsTotalByPocket(),
      getMonthIncome(),
    ]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            <EditableText
              value={household.name}
              onSave={updateHouseholdName}
              successMessage="Nom du foyer mis à jour"
              ariaLabel="Modifier le nom du foyer"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-3">
            {profiles.map((p) => {
              const isMe = p.id === currentProfile?.id;
              const isLinked = !!p.user_id;
              return (
                <div key={p.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    {isMe ? (
                      <EditableText
                        value={p.display_name}
                        onSave={updateDisplayName}
                        successMessage="Prénom mis à jour"
                        ariaLabel="Modifier mon prénom"
                      />
                    ) : isLinked ? (
                      <span>{p.display_name}</span>
                    ) : (
                      <EditableText
                        value={p.display_name}
                        onSave={updateMemberName.bind(null, p.id)}
                        successMessage="Prénom mis à jour"
                        ariaLabel={`Modifier le prénom de ${p.display_name}`}
                      />
                    )}
                    <Badge variant={isLinked ? "secondary" : "outline"}>
                      {isLinked ? "Connecté" : "En attente"}
                    </Badge>
                  </div>
                  {!isLinked && p.claim_code && <MemberClaimLink claimCode={p.claim_code} />}
                </div>
              );
            })}
          </div>
          <AddMemberSheet />
          <Separator />
          <HouseholdInviteCard inviteCode={household.invite_code} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Comptes &amp; répartition des revenus</CardTitle>
          {pockets.length > 0 && (
            <SuggestAllocationSheet
              pockets={pockets}
              profiles={profiles}
              billsTotalByPocket={billsTotalByPocket}
              incomeSources={incomeSources}
            />
          )}
        </CardHeader>
        <CardContent>
          <PocketManager pockets={pockets} profiles={profiles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catégories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} pockets={pockets} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <div>
            <p>Alertes budget &amp; factures</p>
            <p className="text-xs text-muted-foreground">
              Dépassement de budget, échéances de factures
            </p>
          </div>
          <NotificationSettings />
        </CardContent>
      </Card>
    </div>
  );
}
