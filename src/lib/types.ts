export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "expense" | "income";
};

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description: string | null;
  category_id: string | null;
  paid_by: string;
  split_type: "shared" | "personal";
  split_ratio: Record<string, number>;
  is_recurring: boolean;
  recurring_rule: string | null;
  created_at: string;
  category: Category | null;
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

export type Settlement = {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  default_payer: string | null;
  autopay: boolean;
  active: boolean;
  category: Category | null;
};

export type BillWithStatus = Bill & {
  status: "paid" | "overdue" | "upcoming" | "later";
  dueDate: string;
};
