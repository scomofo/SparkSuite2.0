-- One versioned, user-scoped snapshot for SparkSuite learning and practice state.
-- Keep user_id as TEXT to match Better Auth ids and the local preview dev user.
create table if not exists spark_profile_sync (
  user_id text primary key references "user" ("id") on delete cascade,
  payload jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default CURRENT_TIMESTAMP
);
