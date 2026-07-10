-- "Règles de répartition": each category can have a default pocket, so new
-- transactions auto-select which envelope they draw from (e.g. "Courses"
-- always comes out of "Compte Joint") instead of asking every time.
alter table categories add column if not exists default_pocket_id uuid references pockets (id) on delete set null;
