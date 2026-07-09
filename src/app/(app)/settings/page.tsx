import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryManager } from "@/components/category-manager";
import { NotificationSettings } from "@/components/notification-settings";
import { getCategories, getProfiles } from "@/lib/data";

export default async function SettingsPage() {
  const [categories, profiles] = await Promise.all([getCategories(), getProfiles()]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>

      <Card>
        <CardHeader>
          <CardTitle>Foyer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span>{p.display_name}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catégories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
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
