-- Run this once in the Supabase SQL Editor to make your account an admin.
-- After this, logging in on the site will route you to /admin instead of
-- /dashboard, and the profile button will reflect it.

update public.profiles
set role = 'admin'
where id = '20da9de3-cebb-4e93-b2f9-0a240c545803';

-- Verify it took effect:
select id, full_name, role from public.profiles
where id = '20da9de3-cebb-4e93-b2f9-0a240c545803';
