import type { Db } from './index.ts'

/**
 * Forward-only SQL migrations, kept inline (not .sql files) so the Netlify bundler
 * always ships them with the function. Append new entries; never edit applied ones.
 */
export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: '001_init',
    sql: `
      create table users (
        id            uuid primary key default gen_random_uuid(),
        username      text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
        display_name  text not null check (char_length(display_name) between 1 and 40),
        email         text unique,
        password_hash text,
        bio           text not null default '' check (char_length(bio) <= 160),
        avatar_hue    smallint not null default 190 check (avatar_hue between 0 and 359),
        role          text not null default 'member' check (role in ('member', 'admin')),
        kind          text not null default 'member' check (kind in ('member', 'demo', 'guest')),
        created_at    timestamptz not null default now()
      );

      create table sessions (
        token_hash text primary key,
        user_id    uuid not null references users(id) on delete cascade,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null
      );
      create index sessions_user_idx on sessions(user_id);

      create table watch_entries (
        id            uuid primary key default gen_random_uuid(),
        user_id       uuid not null references users(id) on delete cascade,
        tmdb_id       integer not null check (tmdb_id > 0),
        title         text not null,
        poster_path   text,
        backdrop_path text,
        release_year  smallint,
        genres        text[] not null default '{}',
        status        text not null check (status in ('watching', 'completed', 'planned', 'dropped')),
        rating        smallint check (rating between 1 and 10),
        note          text not null default '' check (char_length(note) <= 280),
        created_at    timestamptz not null default now(),
        updated_at    timestamptz not null default now(),
        unique (user_id, tmdb_id)
      );
      create index watch_entries_user_idx on watch_entries(user_id, updated_at desc);

      create table activity (
        id           uuid primary key default gen_random_uuid(),
        user_id      uuid not null references users(id) on delete cascade,
        tmdb_id      integer not null,
        title        text not null,
        poster_path  text,
        release_year smallint,
        status       text not null check (status in ('watching', 'completed', 'planned', 'dropped')),
        rating       smallint check (rating between 1 and 10),
        note         text not null default '' check (char_length(note) <= 280),
        created_at   timestamptz not null default now()
      );
      create index activity_feed_idx on activity(created_at desc, id desc);
      create index activity_user_idx on activity(user_id, created_at desc);

      create table activity_likes (
        activity_id uuid not null references activity(id) on delete cascade,
        user_id     uuid not null references users(id) on delete cascade,
        created_at  timestamptz not null default now(),
        primary key (activity_id, user_id)
      );
    `,
  },
]

export async function migrate(db: Db) {
  await db.transaction(async (tx) => {
    // Serialise concurrent cold starts that race to migrate the same database.
    await tx.query('select pg_advisory_xact_lock(727274)')
    await tx.query(
      'create table if not exists schema_migrations (id text primary key, applied_at timestamptz not null default now())',
    )
    const done = new Set(
      (await tx.query<{ id: string }>('select id from schema_migrations')).map((r) => r.id),
    )
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue
      for (const stmt of splitSql(m.sql)) await tx.query(stmt)
      await tx.query('insert into schema_migrations (id) values ($1)', [m.id])
    }
  })
}

// Extended-protocol queries take one statement at a time.
function splitSql(sql: string) {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean)
}
