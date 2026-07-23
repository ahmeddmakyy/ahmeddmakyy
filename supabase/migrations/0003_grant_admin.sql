-- ─────────────────────────────────────────────────────────────
-- Run this LAST, and only after the admin user exists.
--
-- 1. Supabase dashboard → Authentication → Users → "Add user"
--    → "Create new user". Use a real email + a strong password.
--    Tick "Auto Confirm User" so no confirmation email is needed.
-- 2. Put that same email on the line below.
-- 3. Run this file.
--
-- Until an email is in public.admins, that account can log in but
-- cannot read or change a single row — RLS blocks all of it.
-- ─────────────────────────────────────────────────────────────

insert into public.admins (user_id, email)
select id, email
  from auth.users
 where email = 'ahmeddmakyy@gmail.com'   -- ←←← CHANGE THIS
on conflict (user_id) do nothing;

-- Sanity check: should return exactly one row.
select a.email, a.created_at
  from public.admins a;
