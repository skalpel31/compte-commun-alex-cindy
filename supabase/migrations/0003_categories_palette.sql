-- Replace the placeholder grayscale categories with a validated, colorblind-safe
-- 8-slot categorical palette (see supabase/migrations/0001 for the original set;
-- no transactions/budgets reference these yet, safe to reset).
delete from categories;

insert into categories (name, icon, color, type) values
  ('Courses', 'shopping-cart', 'chart-1', 'expense'),
  ('Logement', 'home', 'chart-2', 'expense'),
  ('Transport', 'car', 'chart-3', 'expense'),
  ('Abonnements', 'repeat', 'chart-4', 'expense'),
  ('Loisirs', 'party-popper', 'chart-5', 'expense'),
  ('Santé', 'heart-pulse', 'chart-6', 'expense'),
  ('Autre', 'more-horizontal', 'chart-7', 'expense'),
  ('Salaire', 'wallet', 'chart-8', 'income');
