export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export type Pocket = {
  id: string;
  name: string;
  icon: string;
  color: string;
  owner_id: string | null;
  allocation_pct: number;
  sort_order: number;
};

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "expense" | "income";
  default_pocket_id: string | null;
};

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  category_id: string | null;
  paid_by: string;
  pocket_id: string | null;
  split_type: "shared" | "personal";
  split_ratio: Record<string, number>;
  is_recurring: boolean;
  recurring_rule: string | null;
  created_at: string;
  category: Category | null;
  pocket: Pocket | null;
};

export type Budget = {
  id: string;
  category_id: string;
  month: string;
  amount_limit: number;
  scope: "shared" | "personal";
  user_id: string | null;
  auto: boolean;
  category: Category | null;
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  pocket_id: string | null;
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  default_payer: string | null;
  pocket_id: string | null;
  split_type: "shared" | "personal";
  autopay: boolean;
  active: boolean;
  installments_total: number | null;
  final_amount: number | null;
  start_date: string | null;
  category: Category | null;
};

export type BillWithStatus = Bill & {
  status: "paid" | "overdue" | "upcoming" | "later";
  dueDate: string;
  autoMarked: boolean;
  installmentsPaid: number;
  isLastInstallment: boolean;
  effectiveAmount: number;
};
