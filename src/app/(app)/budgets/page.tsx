import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function BudgetsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Un budget par catégorie, avec alerte quand vous approchez de la limite.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Exemple — Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={0} />
          <p className="text-xs text-muted-foreground">0 € dépensés sur — €</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          Les budgets se créent une fois les catégories en place.
        </CardContent>
      </Card>
    </div>
  );
}
