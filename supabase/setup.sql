-- =====================================================================
-- Namish Mehra portfolio — database setup.
-- Paste this whole file into Supabase > SQL Editor > New query, then Run.
-- It is safe to run more than once.
-- =====================================================================

-- Only this email can change the site.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'namish.mehra.01@gmail.com';
$$;

-- ---------------------------------------------------------------------
-- 1. Site content (one row, id = 'main')
-- ---------------------------------------------------------------------
create table if not exists public.site_content (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "content: everyone can read" on public.site_content;
create policy "content: everyone can read"
  on public.site_content for select
  using (true);

drop policy if exists "content: admin can insert" on public.site_content;
create policy "content: admin can insert"
  on public.site_content for insert
  with check (public.is_admin());

drop policy if exists "content: admin can update" on public.site_content;
create policy "content: admin can update"
  on public.site_content for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. Save history (for Undo / Restore). Keeps the last 30 saves.
-- ---------------------------------------------------------------------
create table if not exists public.content_history (
  id       bigserial primary key,
  data     jsonb not null,
  saved_at timestamptz not null default now()
);

alter table public.content_history enable row level security;

drop policy if exists "history: admin can read" on public.content_history;
create policy "history: admin can read"
  on public.content_history for select
  using (public.is_admin());

create or replace function public.log_content_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.content_history (data) values (new.data);
  delete from public.content_history
   where id not in (select id from public.content_history order by id desc limit 30);
  return new;
end;
$$;

drop trigger if exists site_content_history on public.site_content;
create trigger site_content_history
  after insert or update on public.site_content
  for each row execute function public.log_content_history();

-- ---------------------------------------------------------------------
-- 3. Contact form messages (a copy of each message, readable in /admin)
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id           bigserial primary key,
  name         text not null check (char_length(name) between 1 and 120),
  email        text not null check (char_length(email) between 3 and 200),
  project_type text check (char_length(project_type) <= 80),
  message      text not null check (char_length(message) between 1 and 5000),
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "messages: visitors can send" on public.messages;
create policy "messages: visitors can send"
  on public.messages for insert
  with check (is_read = false);

drop policy if exists "messages: admin can read" on public.messages;
create policy "messages: admin can read"
  on public.messages for select
  using (public.is_admin());

drop policy if exists "messages: admin can update" on public.messages;
create policy "messages: admin can update"
  on public.messages for update
  using (public.is_admin());

drop policy if exists "messages: admin can delete" on public.messages;
create policy "messages: admin can delete"
  on public.messages for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Page views (one count per day, no personal data)
-- ---------------------------------------------------------------------
create table if not exists public.page_views (
  day   date primary key,
  views integer not null default 0
);

alter table public.page_views enable row level security;

drop policy if exists "views: admin can read" on public.page_views;
create policy "views: admin can read"
  on public.page_views for select
  using (public.is_admin());

create or replace function public.track_view()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.page_views (day, views) values (current_date, 1)
  on conflict (day) do update set views = public.page_views.views + 1;
$$;

grant execute on function public.track_view() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Image storage (bucket "media": anyone can view, only admin can change)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media: admin can upload" on storage.objects;
create policy "media: admin can upload"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin can update" on storage.objects;
create policy "media: admin can update"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin can delete" on storage.objects;
create policy "media: admin can delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin can list" on storage.objects;
create policy "media: admin can list"
  on storage.objects for select
  using (bucket_id = 'media' and public.is_admin());
