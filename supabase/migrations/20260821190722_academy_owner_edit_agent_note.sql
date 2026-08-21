alter table public.academy_content_owner_edits
  add column if not exists agent_note text null;
