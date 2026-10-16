-- "Automatically expose new tables" was deliberately left off at project
-- creation for safer defaults, but that also withholds the grants PostgREST
-- needs to serve any table through the Data API — including for the
-- service_role used by our own server-side API routes. This grants exactly
-- that role, nothing broader (no anon/authenticated grants — those stay
-- withheld until real RLS policies are designed).

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

notify pgrst, 'reload schema';
