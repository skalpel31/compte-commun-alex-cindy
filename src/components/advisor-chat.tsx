"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatAmount, formatDate } from "@/lib/format";
import type { PocketBalance, IncomeSource } from "@/lib/data";
import type { BillWithStatus, Goal } from "@/lib/types";

type AdvisorChatProps = {
  pockets: PocketBalance[];
  bills: BillWithStatus[];
  goals: Goal[];
  income: { sources: IncomeSource[]; total: number };
};

type QA = { id: number; question: string; answer: string };

const SUGGESTIONS = [
  "Combien puis-je épargner ce mois-ci ?",
  "Quelles sont mes prochaines factures ?",
  "Où en est mon objectif ?",
  "Et si je gagne 400€ de plus par mois ?",
];

function billStatusLabel(bill: BillWithStatus) {
  if (bill.status === "overdue") return "en retard depuis le";
  return "échéance le";
}

function answerSavings(pockets: PocketBalance[], bills: BillWithStatus[]): string {
  const joint = pockets.find((p) => p.name.toLowerCase().includes("joint"));
  if (!joint) {
    return "Je ne trouve pas de compte joint pour calculer une capacité d'épargne.";
  }
  const unpaidJointBills = bills
    .filter((b) => b.pocket_id === joint.id && b.status !== "paid")
    .reduce((sum, b) => sum + b.amount, 0);
  const potential = joint.balance - unpaidJointBills;

  if (potential <= 0) {
    return `Le solde de ${joint.name} (${formatAmount(joint.balance)}) est déjà couvert par ${formatAmount(
      unpaidJointBills
    )} de prélèvements à venir. Difficile d'épargner ce mois-ci sans ajuster le budget.`;
  }
  return `Vous pourriez épargner environ ${formatAmount(potential)} ce mois-ci depuis ${joint.name}, une fois déduits ${formatAmount(
    unpaidJointBills
  )} de prélèvements à venir.`;
}

function answerBills(bills: BillWithStatus[]): string {
  const upcoming = bills
    .filter((b) => b.status !== "paid")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  if (upcoming.length === 0) {
    return "Aucune facture en attente pour le moment, tout est payé !";
  }
  const lines = upcoming.map(
    (b) => `- ${b.name} : ${formatAmount(b.amount)} (${billStatusLabel(b)} ${formatDate(b.dueDate)})`
  );
  return `Voici vos prochaines factures :\n${lines.join("\n")}`;
}

function answerGoal(query: string, goals: Goal[]): string | null {
  const lower = query.toLowerCase();
  const matchedGoal = goals.find((g) => lower.includes(g.name.toLowerCase()));
  if (!matchedGoal && !lower.includes("objectif")) return null;

  const goal = matchedGoal ?? goals[0];
  if (!goal) {
    return "Vous n'avez pas encore d'objectif d'épargne enregistré.";
  }
  const pct = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
  return `Votre objectif "${goal.name}" est à ${formatAmount(goal.current_amount)} sur ${formatAmount(
    goal.target_amount
  )}, soit ${pct}% atteint.`;
}

function answerIncomeDelta(query: string, pockets: PocketBalance[]): string | null {
  const lower = query.toLowerCase();
  const mentionsIncomeChange = lower.includes("si je gagne") || lower.includes("revenu");
  if (!mentionsIncomeChange) return null;

  const numberMatch = query.match(/(\d+(?:[.,]\d+)?)/);
  if (!numberMatch) return null;

  const delta = parseFloat(numberMatch[1].replace(",", "."));
  if (!delta) return null;

  const lines = pockets.map(
    (p) => `- ${p.name} : ${delta >= 0 ? "+" : ""}${formatAmount(delta * (p.allocation_pct / 100))}`
  );
  return `Avec ${delta >= 0 ? "+" : ""}${formatAmount(delta)} de revenu mensuel, la répartition changerait ainsi :\n${lines.join(
    "\n"
  )}`;
}

function answerFallback(): string {
  return "Je peux vous aider sur : votre capacité d'épargne ce mois-ci, vos prochaines factures, l'avancement d'un objectif, ou l'impact d'un changement de revenu (ex. \"Et si je gagne 400€ de plus par mois ?\"). N'hésitez pas à reformuler !";
}

function answerQuestion(query: string, ctx: AdvisorChatProps): string {
  const lower = query.toLowerCase();

  const goalAnswer = answerGoal(query, ctx.goals);
  if (goalAnswer) return goalAnswer;

  const incomeAnswer = answerIncomeDelta(query, ctx.pockets);
  if (incomeAnswer) return incomeAnswer;

  if (lower.includes("facture") || lower.includes("prélèvement") || lower.includes("prelevement")) {
    return answerBills(ctx.bills);
  }

  if (lower.includes("épargner") || lower.includes("épargne") || lower.includes("economiser") || lower.includes("économiser")) {
    return answerSavings(ctx.pockets, ctx.bills);
  }

  return answerFallback();
}

export function AdvisorChat(props: AdvisorChatProps) {
  const [messages, setMessages] = useState<QA[]>([]);
  const [value, setValue] = useState("");

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = answerQuestion(trimmed, props);
    setMessages((prev) => [...prev, { id: prev.length, question: trimmed, answer }]);
    setValue("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(value);
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-base">Poser une question</CardTitle>
        <p className="text-xs text-muted-foreground">
          Réponses calculées à partir de vos données réelles.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2 py-2">
            <p className="text-xs text-muted-foreground">Exemples de questions :</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((qa) => (
              <div key={qa.id} className="flex flex-col gap-2">
                <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-primary/10 px-3 py-2 text-sm text-foreground">
                  {qa.question}
                </div>
                <div className="flex max-w-[90%] items-start gap-2 rounded-xl rounded-tl-sm border p-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <p className="flex-1 whitespace-pre-line text-sm">{qa.answer}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Poser une question..."
            aria-label="Poser une question au conseiller"
          />
          <Button type="submit" size="icon" aria-label="Envoyer">
            <Send />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
