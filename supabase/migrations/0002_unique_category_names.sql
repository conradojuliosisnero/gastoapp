-- Lets the default categories be seeded safely even if two requests race.
alter table public.categories add constraint categories_user_module_name_key unique (user_id, module, name);
