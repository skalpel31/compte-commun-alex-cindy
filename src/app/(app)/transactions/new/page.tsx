import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewTransactionPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Nouvelle transaction</h1>
      <Card>
        <CardHeader>
          <CardTitle>Formulaire</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Le formulaire de saisie (montant, catégorie, répartition) arrive avec la connexion à la
          base de données.
        </CardContent>
      </Card>
    </div>
  );
}
