import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/signup-form";
import { BrandMark } from "@/components/brand-mark";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>;
}) {
  const { claim } = await searchParams;

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <Card className="relative w-full max-w-sm">
        <CardHeader className="items-center gap-3 text-center">
          <BrandMark withLabel={false} />
          <div>
            <CardTitle className="text-lg">Créer un compte</CardTitle>
            <CardDescription>
              {claim
                ? "Vous rejoignez un foyer en tant que membre déjà invité."
                : "Créez votre foyer ou rejoignez celui de votre partenaire."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignupForm claimCode={claim} />
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
