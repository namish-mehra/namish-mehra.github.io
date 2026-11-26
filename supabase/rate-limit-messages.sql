-- Security hardening: stop a script from flooding the contact-form inbox.
-- Paste this into Supabase > SQL Editor > New query, then Run. Safe to run more than once.
--
-- Why: "messages: visitors can send" (setup.sql) lets anyone insert a row, with no limit
-- on how many. The on-page form has a honeypot field, but that only stops bots that run
-- the page's JavaScript — a script that calls the Supabase REST API directly skips it
-- entirely. This adds a server-side limit so that path is covered too.
--
-- What it does: refuses more than 5 messages from the same email address within 10 minutes.
-- This is a basic throttle, not full bot protection — an attacker who rotates fake email
-- addresses can still get around it. For stronger protection, a Supabase Edge Function in
-- front of the insert, checking a Cloudflare Turnstile token, is the next step up; this
-- trigger does not require that extra setup.

create or replace function public.check_message_rate()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from public.messages
    where email = new.email
      and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Too many messages sent from this address. Please try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.check_message_rate();
