-- Lets a pocket be "for" someone who isn't a registered profile (a child,
-- say) without turning them into a real owner — functionally the pocket
-- stays owner_id = null (shared/unowned, same as "Partagé" for income-split
-- purposes), this is purely a nicer display label than the generic
-- "Partagé" when one applies.
alter table pockets add column if not exists custom_owner_label text;
