-- Visitor analytics: total visits (with country) + live presence heartbeats.
-- Applied to the live project on 2026-07-24 via MCP; kept here as the record.
-- Public writes happen ONLY through SECURITY DEFINER RPCs; raw rows are
-- admin-readable, and dashboard_stats() is admin-gated inside the function.

create table if not exists public.visits (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  country text
);
alter table public.visits enable row level security;
create policy "admins read visits" on public.visits
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create table if not exists public.presence (
  sid uuid primary key,
  last_seen timestamptz not null default now(),
  country text
);
alter table public.presence enable row level security;
create policy "admins read presence" on public.presence
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create or replace function public.record_visit(p_country text default null)
returns void language sql security definer set search_path = public as $$
  insert into visits (country) values (nullif(upper(trim(p_country)), ''));
$$;

create or replace function public.heartbeat(p_sid uuid, p_country text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into presence (sid, last_seen, country)
  values (p_sid, now(), nullif(upper(trim(p_country)), ''))
  on conflict (sid) do update set last_seen = now();
  delete from presence where last_seen < now() - interval '10 minutes';
end $$;

create or replace function public.dashboard_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not exists (select 1 from admins where user_id = auth.uid()) then
    return null;
  end if;
  select jsonb_build_object(
    'total_visits', (select count(*) from visits),
    'visits_today', (select count(*) from visits
      where (at at time zone 'Africa/Cairo')::date = (now() at time zone 'Africa/Cairo')::date),
    'live_now', (select count(*) from presence where last_seen > now() - interval '75 seconds'),
    'by_country', (select coalesce(jsonb_agg(jsonb_build_object('c', country, 'n', n) order by n desc), '[]'::jsonb)
      from (select coalesce(country, '??') as country, count(*) n
            from visits group by 1 order by n desc limit 30) t),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d), '[]'::jsonb)
      from (select ((at at time zone 'Africa/Cairo')::date)::text d, count(*) n
            from visits where at > now() - interval '14 days' group by 1) t)
  ) into result;
  return result;
end $$;
