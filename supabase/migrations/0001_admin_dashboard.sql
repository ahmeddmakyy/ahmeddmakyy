-- ─────────────────────────────────────────────────────────────
-- Admin dashboard schema for the portfolio.
--
-- Every user-visible text column is bilingual (_en / _ar) because the
-- public site renders both languages from the same row. A row with an
-- empty _ar is a broken Arabic site, so the app-side forms warn on it.
--
-- Safe to re-run: every statement is idempotent.
-- ─────────────────────────────────────────────────────────────

-- ── admins ───────────────────────────────────────────────────
-- Being in auth.users is NOT enough to write anything. A user only gets
-- write access once their id is in here, so an accidental public signup
-- can never touch content.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (select 1 from public.admins where user_id = auth.uid());
$fn$;

-- ── shared updated_at trigger ────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

-- ── reels ────────────────────────────────────────────────────
-- category: 0 = Cinematic AI Ads, 1 = Motion Graphics & Type, 2 = UI Animation
--   (matches the three filter chips in the Videos section)
-- sort_order: oldest → newest. The site shows newest first within a
--   category, exactly as the hardcoded arrays did.
-- poster_url: null → the bundled webp shipped with the site is used.
--   Set it only when overriding with an upload.
create table if not exists public.reels (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  sort_order     integer not null default 0,
  category       smallint not null default 0 check (category in (0, 1, 2)),
  is_featured    boolean not null default false,
  is_published   boolean not null default true,
  video_url      text not null,
  poster_url     text,
  title_en       text not null,
  title_ar       text not null,
  tag_en         text not null,
  tag_ar         text not null,
  client_en      text not null,
  client_ar      text not null,
  description_en text not null,
  description_ar text not null,
  view_count     bigint not null default 0,
  last_viewed_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists reels_display_idx
  on public.reels (is_published, category, sort_order);

drop trigger if exists reels_touch on public.reels;
create trigger reels_touch before update on public.reels
  for each row execute function public.touch_updated_at();

-- Only one reel can be the featured stage.
create unique index if not exists reels_one_featured
  on public.reels ((is_featured)) where is_featured;

-- ── work_cards (the "Selected Work" section) ─────────────────
-- title is a brand name — identical in both languages, so it is single.
create table if not exists public.work_cards (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  title        text not null,
  tag_en       text not null,
  tag_ar       text not null,
  period_en    text not null,
  period_ar    text not null,
  body_en      text not null,
  body_ar      text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists work_cards_display_idx
  on public.work_cards (is_published, sort_order);

drop trigger if exists work_cards_touch on public.work_cards;
create trigger work_cards_touch before update on public.work_cards
  for each row execute function public.touch_updated_at();

-- ── services ─────────────────────────────────────────────────
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  title_en     text not null,
  title_ar     text not null,
  body_en      text not null,
  body_ar      text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists services_display_idx
  on public.services (is_published, sort_order);

drop trigger if exists services_touch on public.services;
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();

-- ── view counter ─────────────────────────────────────────────
-- One row per reel per day: bounded growth (~17 rows/day worst case)
-- while still supporting "what got watched this month" later.
create table if not exists public.reel_views_daily (
  reel_id uuid not null references public.reels (id) on delete cascade,
  day     date not null default current_date,
  count   integer not null default 0,
  primary key (reel_id, day)
);

-- Called by anonymous visitors, so it is SECURITY DEFINER: it bumps the
-- counter without granting anon any write access to reels itself.
create or replace function public.increment_reel_view(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_id uuid;
begin
  update public.reels
     set view_count = view_count + 1,
         last_viewed_at = now()
   where slug = p_slug
     and is_published
  returning id into v_id;

  if v_id is null then
    return;  -- unknown or unpublished slug: silently ignore
  end if;

  insert into public.reel_views_daily (reel_id, day, count)
  values (v_id, current_date, 1)
  on conflict (reel_id, day)
  do update set count = public.reel_views_daily.count + 1;
end;
$fn$;

revoke all on function public.increment_reel_view(text) from public;
grant execute on function public.increment_reel_view(text) to anon, authenticated;

-- ── row level security ───────────────────────────────────────
alter table public.admins           enable row level security;
alter table public.reels            enable row level security;
alter table public.work_cards       enable row level security;
alter table public.services         enable row level security;
alter table public.reel_views_daily enable row level security;

-- admins: you may only see your own row.
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select using (user_id = auth.uid());

-- Content: the world reads published rows; admins read and write everything.
do $do$
declare
  t text;
begin
  foreach t in array array['reels', 'work_cards', 'services'] loop
    execute format('drop policy if exists %I_public_read on public.%I', t, t);
    execute format(
      'create policy %I_public_read on public.%I for select using (is_published)', t, t);

    execute format('drop policy if exists %I_admin_read on public.%I', t, t);
    execute format(
      'create policy %I_admin_read on public.%I for select to authenticated using (public.is_admin())', t, t);

    execute format('drop policy if exists %I_admin_write on public.%I', t, t);
    execute format(
      'create policy %I_admin_write on public.%I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end;
$do$;

-- Daily view rows are admin-only reading; writes happen through the
-- SECURITY DEFINER function, never directly.
drop policy if exists reel_views_admin_read on public.reel_views_daily;
create policy reel_views_admin_read on public.reel_views_daily
  for select to authenticated using (public.is_admin());

-- ── poster storage bucket ────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

drop policy if exists posters_public_read on storage.objects;
create policy posters_public_read on storage.objects
  for select using (bucket_id = 'posters');

drop policy if exists posters_admin_write on storage.objects;
create policy posters_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'posters' and public.is_admin())
  with check (bucket_id = 'posters' and public.is_admin());
