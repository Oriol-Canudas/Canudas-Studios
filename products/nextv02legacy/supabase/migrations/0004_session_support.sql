-- Owner-session support for the v1 stage-1 rebuild.
--
-- No new table and no new column: `seniors.id` is already the natural
-- ownership boundary (every chapters/questions/conversation_turns row
-- already references it). What was missing was a real session mechanism
-- instead of the proof-of-concept's single hardcoded row — that lives in
-- application code (api/session.ts), not the schema.
--
-- One real pre-existing bug this uncovers: the language check only ever
-- allowed ('es','ca'), even though the app has supported 'en' throughout.
-- It was latent because no code path has ever inserted a *new* seniors
-- row before now — the proof-of-concept senior was seeded once, by hand.
-- api/session.ts is the first code path that creates seniors rows at
-- runtime, so this would fail on first use by an English-language visitor
-- without this fix.

alter table seniors drop constraint if exists seniors_language_check;
alter table seniors add constraint seniors_language_check check (language in ('es', 'ca', 'en'));

-- preferred_name and name were NOT NULL with no default, which fit the
-- one-time manual seed but not an anonymous bootstrap that hasn't asked
-- her name yet. Minimal placeholders, not a UI change — the real name is
-- filled in later via whatever profile-update path the next stage adds.
alter table seniors alter column preferred_name set default '';
alter table seniors alter column name set default 'Sense nom';
