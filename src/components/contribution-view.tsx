import { Card, CardContent } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { formatAmount } from "@/lib/format";
import type { Contribution } from "@/lib/data";

function ContributionCard({ contribution, index }: { contribution: Contribution; index: number }) {
  const { profile, paid } = contribution;
  const color = index === 0 ? "bg-chart-1" : "bg-chart-5";

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
        <ProfileAvatar profile={profile} index={index} size="lg" />
        <span className="text-sm font-medium">{profile.display_name}</span>
        <span className="text-2xl font-semibold tabular-nums">{formatAmount(paid)}</span>
        <div className={`h-1.5 w-10 rounded-full ${color}`} />
      </CardContent>
    </Card>
  );
}

export function ContributionView({
  contributions,
  total,
}: {
  contributions: Contribution[];
  total: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Dépenses du compte commun ce mois-ci :{" "}
        <span className="font-medium text-foreground">{formatAmount(total)}</span>
      </p>

      <div className="grid grid-cols-2 gap-3">
        {contributions.map((c, i) => (
          <ContributionCard key={c.profile.id} contribution={c} index={i} />
        ))}
      </div>
    </div>
  );
}
