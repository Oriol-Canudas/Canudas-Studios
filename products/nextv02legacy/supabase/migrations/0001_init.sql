-- Living Family History — initial schema.
-- Deliberately simple for proof-of-concept scale (10 families, ~20
-- chapters total): JSONB columns stand in for further normalization where
-- the four-layers data doesn't need its own relational structure yet.
-- Service-role key only for now — no RLS policies for client-side access
-- in this pass, since all writes go through server-side API routes.

create extension if not exists "pgcrypto";

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table seniors (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  preferred_name text not null,
  phone text,
  language text not null check (language in ('es', 'ca')),
  setup_token text unique, -- used by the remote setup-link flow
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references seniors(id) on delete cascade,
  family_id uuid not null references families(id) on delete cascade,
  text text not null,
  status text not null default 'pending' check (status in ('pending', 'answered')),
  created_at timestamptz not null default now()
);

create table chapters (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references seniors(id) on delete cascade,
  question_id uuid references questions(id) on delete set null, -- null for "Something on your mind" chapters
  content_type text not null check (content_type in ('moment', 'view', 'legacy')),
  title text,
  testimony_text text,
  testimony_audio_url text,
  confirmed_context jsonb not null default '[]'::jsonb,       -- [{text, source}]
  researched_unconfirmed jsonb not null default '[]'::jsonb,  -- Director-internal only, never rendered
  interpretation jsonb not null default '[]'::jsonb,          -- [{text, voice}] — her reflection + labelled other voices
  illustration_url text,
  recipient_name text, -- set only for a Legacy / surprise-gift chapter
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'delivered')),
  created_at timestamptz not null default now()
);

create table conversation_turns (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references seniors(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete set null, -- null while the session is still in progress
  role text not null check (role in ('director', 'senior')),
  content text not null,
  created_at timestamptz not null default now()
);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  author_name text not null,
  text text,
  created_at timestamptz not null default now(),
  surfaced boolean not null default false -- has the Director already woven this into a session opening?
);

create table preference_signals (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references seniors(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create index on questions (senior_id, status);
create index on chapters (senior_id, status);
create index on conversation_turns (senior_id, chapter_id);
create index on reactions (chapter_id, surfaced);
create index on preference_signals (senior_id);
