import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { currentMonth, formatAmount } from "@/lib/format";
import { installmentNumberFor } from "@/lib/bill-installments";

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendPush(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  title: string,
  body: string,
  url: string
) {
  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", userId)
    .single();
  if (!sub) return;

  try {
    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({ title, body, url })
    );
  } catch {
    // Subscription likely expired/revoked — drop it so we stop retrying.
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    "mailto:alex.skp31@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabase = adminClient();
  const month = currentMonth();
  const results: string[] = [];

  const { data: profiles } = await supabase.from("profiles").select("id");
  const userIds = (profiles ?? []).map((p) => p.id as string);

  // --- Budgets: notify at 80% and 100% of the monthly limit ---
  const { data: budgets } = await supabase
    .from("budgets")
    .select("id, category_id, amount_limit, category:categories(name)")
    .eq("month", month);

  for (const budget of budgets ?? []) {
    const { data: txs } = await supabase
      .from("transactions")
      .select("amount")
      .eq("category_id", budget.category_id)
      .gte("date", month)
      .lt("date", month.slice(0, 7) + "-32");
    const spent = (txs ?? []).reduce((s, t) => s + Number(t.amount), 0);
    const pct = (spent / Number(budget.amount_limit)) * 100;
    const threshold = pct >= 100 ? 100 : pct >= 80 ? 80 : null;
    if (!threshold) continue;

    const { data: already } = await supabase
      .from("budget_alerts_sent")
      .select("id")
      .eq("category_id", budget.category_id)
      .eq("month", month)
      .eq("threshold", threshold)
      .maybeSingle();
    if (already) continue;

    const categoryName = (budget.category as unknown as { name: string } | null)?.name ?? "Budget";
    const title = threshold === 100 ? `Budget dépassé : ${categoryName}` : `Budget bientôt atteint : ${categoryName}`;
    const body = `${formatAmount(spent)} dépensés sur ${formatAmount(Number(budget.amount_limit))} (${Math.round(pct)}%)`;

    for (const userId of userIds) {
      await sendPush(supabase, userId, title, body, "/budgets");
    }
    await supabase
      .from("budget_alerts_sent")
      .insert({ category_id: budget.category_id, month, threshold });
    results.push(`budget:${categoryName}:${threshold}`);
  }

  // --- Bills: notify 3 days before due, and the day it becomes overdue ---
  const { data: bills } = await supabase.from("bills").select("*").eq("active", true);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayDay = today.getDate();

  // --- Autopay bills: mark paid automatically once the due day has passed,
  // recording the real transaction just like a manual "marquer payée" would.
  for (const bill of bills ?? []) {
    if (!bill.autopay || !bill.default_payer) continue;
    if (todayDay < bill.due_day) continue;

    const { data: existing } = await supabase
      .from("bill_payments")
      .select("id")
      .eq("bill_id", bill.id)
      .eq("month", month)
      .maybeSingle();
    if (existing) continue;

    const { data: category } = bill.category_id
      ? await supabase.from("categories").select("default_pocket_id").eq("id", bill.category_id).single()
      : { data: null };
    const pocket_id = bill.pocket_id ?? category?.default_pocket_id ?? null;

    const isLastInstallment =
      !!bill.installments_total &&
      !!bill.start_date &&
      installmentNumberFor(bill.start_date) >= bill.installments_total;
    const amount = isLastInstallment && bill.final_amount != null ? bill.final_amount : bill.amount;

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        amount,
        description: bill.name,
        date: todayStr,
        category_id: bill.category_id,
        paid_by: bill.default_payer,
        pocket_id,
        split_type: "shared",
        split_ratio: {},
      })
      .select("id")
      .single();
    if (txError) continue;

    if (isLastInstallment) {
      await supabase.from("bills").update({ active: false }).eq("id", bill.id);
    }

    await supabase.from("bill_payments").upsert(
      {
        bill_id: bill.id,
        month,
        paid_at: new Date().toISOString(),
        paid_by: bill.default_payer,
        transaction_id: transaction.id,
        auto: true,
      },
      { onConflict: "bill_id,month" }
    );

    for (const userId of userIds) {
      await sendPush(
        supabase,
        userId,
        `Facture prélevée automatiquement : ${bill.name}`,
        `${formatAmount(Number(amount))}${isLastInstallment ? " (dernier prélèvement)" : ""} — si ce prélèvement n'a pas réellement eu lieu, décoche-la dans Factures.`,
        "/bills"
      );
    }
    results.push(`bill:${bill.name}:autopaid`);
  }

  for (const bill of bills ?? []) {
    const { data: payment } = await supabase
      .from("bill_payments")
      .select("paid_at")
      .eq("bill_id", bill.id)
      .eq("month", month)
      .maybeSingle();
    if (payment?.paid_at) continue;
    if (bill.autopay) continue;

    const dueDate = `${month.slice(0, 7)}-${String(bill.due_day).padStart(2, "0")}`;
    const diffDays = Math.round(
      (new Date(dueDate).getTime() - new Date(todayStr).getTime()) / 86_400_000
    );

    let kind: "upcoming" | "overdue" | null = null;
    if (diffDays === 3) kind = "upcoming";
    else if (diffDays === 0) kind = "overdue";
    if (!kind) continue;

    const { data: already } = await supabase
      .from("bill_alerts_sent")
      .select("id")
      .eq("bill_id", bill.id)
      .eq("month", month)
      .eq("kind", kind)
      .maybeSingle();
    if (already) continue;

    const title = kind === "upcoming" ? `Facture bientôt due : ${bill.name}` : `Facture due aujourd'hui : ${bill.name}`;
    const body = `${formatAmount(Number(bill.amount))} — échéance le ${bill.due_day}`;

    for (const userId of userIds) {
      await sendPush(supabase, userId, title, body, "/bills");
    }
    await supabase.from("bill_alerts_sent").insert({ bill_id: bill.id, month, kind });
    results.push(`bill:${bill.name}:${kind}`);
  }

  return NextResponse.json({ ok: true, sent: results });
}
