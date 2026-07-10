import { GoalsSection } from "@/components/goals-section";
import { getGoals, getPockets } from "@/lib/data";

export default async function ObjectifsPage() {
  const [goals, pockets] = await Promise.all([getGoals(), getPockets()]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Objectifs</h1>
        <p className="text-sm text-muted-foreground">
          Vacances, apport, fonds d&apos;urgence — vos projets d&apos;épargne.
        </p>
      </div>

      <GoalsSection goals={goals} pockets={pockets} />
    </div>
  );
}
