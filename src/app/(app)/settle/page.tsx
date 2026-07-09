import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettlePage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Règlement</h1>
        <p className="text-sm text-muted-foreground">Qui doit combien à qui, en ce moment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl font-semibold">— €</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          Vous êtes à jour, pour l&apos;instant.
          <Button variant="secondary" disabled>
            Marquer comme réglé
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
