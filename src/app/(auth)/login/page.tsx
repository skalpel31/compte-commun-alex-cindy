import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { BrandMark } from "@/components/brand-mark";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <Card className="relative w-full max-w-sm">
        <CardHeader className="items-center gap-3 text-center">
          <BrandMark withLabel={false} />
          <div>
            <CardTitle className="text-lg">Nous Deux</CardTitle>
            <CardDescription>Connectez-vous pour accéder au compte commun.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            Pas de compte ?{" "}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
              Créer un foyer
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
