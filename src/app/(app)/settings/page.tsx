import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>

      <Card>
        <CardHeader>
          <CardTitle>Catégories</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Gestion des catégories de dépenses/revenus — à venir.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span>Alertes de dépassement de budget</span>
          <Switch disabled />
        </CardContent>
      </Card>
    </div>
  );
}
