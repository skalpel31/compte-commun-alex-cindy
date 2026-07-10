import { RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { AdvisorCard, type AdvisorItem } from "@/components/advisor-card";
import { AdvisorChat } from "@/components/advisor-chat";
import { getBills, getGoals, getMonthIncome, getMonthTransactions, getPocketBalances } from "@/lib/data";
import { formatAmount } from "@/lib/format";

export default async function ConseillerIaPage() {
  const [pockets, bills, monthTransactions, goals, income] = await Promise.all([
    getPocketBalances(),
    getBills(),
    getMonthTransactions(),
    getGoals(),
    getMonthIncome(),
  ]);

  const jointPocket = pockets.find((p) => p.name.toLowerCase().includes("joint"));
  const pendingBills = bills.filter((b) => b.status !== "paid");
  const alertBills = pendingBills.filter((b) => b.status === "overdue" || b.status === "upcoming");

  const misplaced = monthTransactions.filter(
    (t) =>
      t.category?.type === "expense" &&
      t.category?.default_pocket_id &&
      t.pocket_id &&
      t.pocket_id !== t.category.default_pocket_id
  );

  const items: AdvisorItem[] = [];
  if (jointPocket && jointPocket.balance > 200) {
    const potential = Math.round(jointPocket.balance * 0.1);
    if (potential >= 20) {
      items.push({
        icon: TrendingUp,
        tone: "good",
        text: `Vous pouvez épargner ${formatAmount(potential)} ce mois-ci sans impacter votre budget.`,
        actionLabel: "Épargner maintenant",
        actionHref: "/epargne",
      });
    }
  }
  if (alertBills.length > 0) {
    const lastDay = new Date(alertBills[alertBills.length - 1].dueDate).getDate();
    items.push({
      icon: Sparkles,
      tone: "warning",
      text: `${alertBills.length} prélèvement${alertBills.length > 1 ? "s" : ""} important${alertBills.length > 1 ? "s" : ""} à venir d'ici le ${lastDay}.`,
      actionLabel: "Voir le calendrier",
      actionHref: "/alertes",
    });
  }
  if (misplaced.length >= 2) {
    items.push({
      icon: RefreshCw,
      tone: "info",
      text: "Vous utilisez souvent un compte perso pour des dépenses habituellement communes.",
      actionLabel: "Voir les remboursements",
      actionHref: "/settle",
    });
  }

  const analyzedAt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date()
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Conseiller IA</h1>
        <p className="text-sm text-muted-foreground">
          Des suggestions basées sur vos vraies habitudes de dépense.
        </p>
      </div>

      <AdvisorCard items={items} analyzedAt={analyzedAt} />
      <AdvisorChat pockets={pockets} bills={bills} goals={goals} income={income} />
    </div>
  );
}
