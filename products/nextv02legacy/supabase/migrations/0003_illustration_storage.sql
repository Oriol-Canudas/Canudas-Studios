-- Public storage bucket for chapter illustrations (generated at confirm
-- time by api/chapter-finalize.ts). Public so the stored URL is directly
-- servable to the Library screen without signed-URL plumbing; uploads
-- only ever happen server-side via the service_role key, which bypasses
-- storage RLS regardless, so no object-level write policy is needed here.
insert into storage.buckets (id, name, public)
values ('chapter-illustrations', 'chapter-illustrations', true)
on conflict (id) do nothing;
