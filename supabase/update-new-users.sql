-- Update: count "new users" (each browser once, the first time it opens the site) next to visits.
-- Safe to run more than once. Run it in Supabase > SQL Editor > New query > Run.
-- No personal data is stored: only a count per day.

alter table public.page_views add column if not exists new_users integer not null default 0;

-- The old function had no inputs. It is replaced by one that takes "is_new" (default false), so old callers still work.
drop function if exists public.track_view();

create or replace function public.track_view(is_new boolean default false)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.page_views (day, views, new_users)
  values (current_date, 1, case when is_new then 1 else 0 end)
  on conflict (day) do update
    set views     = public.page_views.views + 1,
        new_users = public.page_views.new_users + case when is_new then 1 else 0 end;
$$;

grant execute on function public.track_view(boolean) to anon, authenticated;

-- Make the new function visible to the API at once.
notify pgrst, 'reload schema';
