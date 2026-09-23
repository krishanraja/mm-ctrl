-- Keep what the gather found, not only what the feed showed.
--
-- live-headlines fetches from GDELT, Hacker News, nineteen curated RSS feeds
-- and, when their keys are set, Brave, NewsAPI and Exa. It clusters across
-- them, applies the trust floor, balances the nine lanes and keeps twenty
-- cards. Everything else is discarded in memory and has never been written
-- down anywhere.
--
-- Every one of those filters is right for the FEED. Home is a recent-only
-- surface for a leader with limited attention, and twenty balanced, corroborated
-- cards is the product. The problem is that the feed was the only output, so
-- the rejected majority (usually several hundred articles a day) has never
-- existed as data.
--
-- What that costs, concretely:
--   - No volume. "Is anyone writing about inference cost this month" cannot be
--     asked of twenty cards a day, because twenty is the answer every day.
--   - No share of voice. Which lab, which outlet, gaining or losing.
--   - No lead and lag. Which publisher breaks a theme and which follows it a
--     week later is visible only in what we did not keep.
--   - No audit of our own filters. The trust floor rejects lone-source stories
--     on purpose, and that rule has never been checkable against the stories it
--     rejected. A filter nobody can grade is a filter nobody can improve.
--
-- And separately, three places quietly destroy history:
--   - ?force=1 overwrites the day's cache row, so a prewarm after a user
--     request replaces what the user was served with no trace.
--   - ?backfill=1 rewrites every past day in place, keeping the original
--     created_at, so an edited day is indistinguishable from an original one.
--   - The Artificial Analysis leaderboard is cached for six hours and then
--     overwritten, so there is no model price or capability curve at all,
--     despite fetching the numbers every single day.
--
-- This migration adds the record underneath all of it. Nothing about what the
-- feed shows changes. The three tables here are append only, and that is
-- enforced by a trigger rather than left to convention, because convention is
-- exactly what produced the overwrites above.

-- ── 1. Every article, every gather ─────────────────────────────────────────

create table if not exists public.live_headlines_gather (
  id             bigint generated always as identity primary key,

  -- The day of the gather and the run it belonged to. run_id groups one
  -- gather so a re-run is separable from the world changing.
  gather_day     date not null,
  gathered_at    timestamptz not null default now(),
  run_id         uuid not null,

  -- The article, normalised exactly as RawArticle in
  -- supabase/functions/_shared/news-cluster.ts holds it.
  origin         text not null,
  title          text not null,
  url            text,
  description    text,
  source_host    text,
  source_tier    smallint,
  engagement     integer not null default 0,

  -- The source's own publication time, absolute and with a timezone.
  --
  -- This is the single most valuable column here. The cards carry `timeAgo`,
  -- a relative string ("3 hours ago") frozen at gather time, which is worse
  -- than useless once the row is a day old, and the only real date on a cached
  -- day is briefing_date, which is when CTRL looked rather than when the thing
  -- happened. Null when the source did not say, which is a fact about the
  -- source and is never replaced with the time we happened to look.
  published_at   timestamptz,

  -- What the pipeline decided about it, which is what makes the rejected
  -- majority worth keeping. ai_native and on_lens are the first filter;
  -- cluster_key says which story it was folded into; selected says whether it
  -- reached the twenty.
  ai_native      boolean not null default false,
  cluster_key    text,
  cluster_size   integer,
  selected       boolean not null default false,
  drop_reason    text,
  category       text,

  -- Identity. Same scheme as control-center's trend_observations so the two
  -- records can be joined: sha256 of the normalised URL, sha256 of the title
  -- and description. See supabase/functions/_shared/trend-memory.ts, which is
  -- the one place either hash is computed.
  url_hash       text,
  content_hash   text not null,

  raw            jsonb not null default '{}'::jsonb,

  -- One row per day per version of the text. A second gather on the same day
  -- that finds an identical article collapses; one that finds a CHANGED
  -- headline on the same URL is kept as its own row, because a publisher
  -- quietly rewriting a claim is precisely the mundane thing that turns out to
  -- be worth having. nulls not distinct so an article with no usable URL
  -- dedupes on its text rather than inserting afresh every run.
  constraint live_headlines_gather_identity
    unique nulls not distinct (gather_day, url_hash, content_hash),
  constraint live_headlines_gather_title_not_blank check (length(btrim(title)) > 0)
);

create index if not exists live_headlines_gather_day on public.live_headlines_gather (gather_day desc);
create index if not exists live_headlines_gather_host on public.live_headlines_gather (source_host, gather_day desc);
create index if not exists live_headlines_gather_origin on public.live_headlines_gather (origin, gather_day desc);
create index if not exists live_headlines_gather_selected on public.live_headlines_gather (selected, gather_day desc);
create index if not exists live_headlines_gather_run on public.live_headlines_gather (run_id);

comment on table public.live_headlines_gather is
  'Every article every gather has seen, kept whether or not it reached the feed. The feed still shows twenty; this is the several hundred it chose them from. Append only, enforced by trigger. Volume, share of voice, lead and lag, and any audit of our own filters all need the rejected majority, and none of them was answerable before this existed.';
comment on column public.live_headlines_gather.published_at is
  'When the SOURCE says it was published, absolute. The cards only ever carried a relative string frozen at gather time, so this is the first real publication clock in the system. Null means the source was silent, and is never faked.';
comment on column public.live_headlines_gather.drop_reason is
  'Why it did not reach the feed: not_ai_native, too_old, below_trust_floor, capped_per_source, lane_full, damage. Null when selected. This column is the difference between a filter we can grade and one we cannot.';

-- ── 2. One row per gather run ──────────────────────────────────────────────
--
-- A per-source count per run, so a source that quietly dies is visible as a
-- zero next to its neighbours rather than as a feed that is merely a bit
-- thinner than usual. The pool has already gone dark once, for about four
-- weeks to 2026-08-05, and nothing noticed.

create table if not exists public.live_headlines_gather_runs (
  run_id          uuid primary key,
  gather_day      date not null,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  trigger         text not null,
  fetched         integer not null default 0,
  ai_native       integer not null default 0,
  clusters        integer not null default 0,
  selected        integer not null default 0,
  recorded        integer not null default 0,
  per_origin      jsonb not null default '{}'::jsonb,
  error           text
);

create index if not exists live_headlines_gather_runs_day on public.live_headlines_gather_runs (gather_day desc);

comment on table public.live_headlines_gather_runs is
  'One row per gather, with how much each source produced. A dead source shows up here as a zero beside its neighbours, which is the signal the four-week pool outage to 2026-08-05 had no way to give.';

-- ── 3. Every version of a cached day ───────────────────────────────────────
--
-- live_headlines_cache stays exactly as it is: one row per day, the thing the
-- feed reads, overwritten by force and by backfill. This table is the history
-- that overwriting has been destroying. Every write of a day's payload appends
-- a numbered version here first, so "what were we actually serving on the
-- morning of the 4th, before the backfill reclassified it" becomes answerable.

create table if not exists public.live_headlines_cache_versions (
  id             bigint generated always as identity primary key,
  briefing_date  date not null,
  version        integer not null,
  payload        jsonb not null,
  written_by     text not null,
  card_count     integer not null default 0,
  created_at     timestamptz not null default now(),
  constraint live_headlines_cache_versions_once unique (briefing_date, version)
);

create index if not exists live_headlines_cache_versions_day
  on public.live_headlines_cache_versions (briefing_date desc, version desc);

comment on table public.live_headlines_cache_versions is
  'Every version of every cached day, in order. The cache row itself is still overwritten by force and by backfill; this is what those writes used to destroy. written_by says which path produced the version: gather, force, or backfill.';

-- Next version number for a day. Concurrency is not a real concern here (one
-- prewarm, one operator) but taking the max under the unique constraint means
-- a race loses the insert rather than silently renumbering a prior version.
create or replace function public.next_live_headlines_cache_version(p_day date)
returns integer
language sql
stable
as $$
  select coalesce(max(version), 0) + 1
  from public.live_headlines_cache_versions
  where briefing_date = p_day;
$$;

-- ── 4. The model leaderboard, daily ────────────────────────────────────────
--
-- Artificial Analysis is fetched on every gather and its six-hour cache is
-- deleted before each insert, so nothing about model price or capability has
-- ever accumulated. A frontier price curve is about as durable and as
-- commercially useful a series as this system could hold, and it has been
-- thrown away daily for months. One row per model per day, from numbers we are
-- already paying to fetch.

create table if not exists public.model_benchmark_snapshots (
  id                 bigint generated always as identity primary key,
  snapshot_on        date not null,
  captured_at        timestamptz not null default now(),
  provider           text not null default 'artificial_analysis',
  model              text not null,
  model_key          text not null,
  intelligence_index numeric,
  price_per_1m       numeric,
  rank               integer,
  raw                jsonb not null default '{}'::jsonb,
  constraint model_benchmark_snapshots_once unique (snapshot_on, provider, model_key)
);

create index if not exists model_benchmark_snapshots_model
  on public.model_benchmark_snapshots (model_key, snapshot_on desc);
create index if not exists model_benchmark_snapshots_day
  on public.model_benchmark_snapshots (snapshot_on desc);

comment on table public.model_benchmark_snapshots is
  'The Artificial Analysis leaderboard, once a day, kept. Intelligence index, blended price and rank per model. These numbers are already fetched on every gather and were being overwritten every six hours; this is the price and capability curve that was being thrown away.';

-- ── 5. Append only, enforced ───────────────────────────────────────────────
--
-- The same rule as control-center's trend_observations, for the same reason:
-- every overwrite this migration exists to stop was individually reasonable
-- and none was noticed for months. A rule in the database fails loudly on a
-- Tuesday afternoon; a rule in a comment costs a year of history.
--
-- live_headlines_gather_runs is deliberately NOT covered: a run row is opened
-- when the gather starts and closed with its counts when it finishes, so it
-- has a legitimate update. Its counts are a report about a run, not an
-- observation of the world.

create or replace function public.gathered_history_is_append_only()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception '% is append only: row cannot be deleted', tg_table_name
      using hint = 'A wrong row is corrected by inserting a corrected one. What the gather saw at the time is part of the record.';
  end if;
  raise exception '% is append only: row cannot be updated', tg_table_name
    using hint = 'Re-classifying or re-scoring writes a new row. The earlier reading stays readable.';
end;
$$;

drop trigger if exists live_headlines_gather_append_only on public.live_headlines_gather;
create trigger live_headlines_gather_append_only
  before update or delete on public.live_headlines_gather
  for each row execute function public.gathered_history_is_append_only();

drop trigger if exists live_headlines_cache_versions_append_only on public.live_headlines_cache_versions;
create trigger live_headlines_cache_versions_append_only
  before update or delete on public.live_headlines_cache_versions
  for each row execute function public.gathered_history_is_append_only();

drop trigger if exists model_benchmark_snapshots_append_only on public.model_benchmark_snapshots;
create trigger model_benchmark_snapshots_append_only
  before update or delete on public.model_benchmark_snapshots
  for each row execute function public.gathered_history_is_append_only();

-- ── 6. Reading views ───────────────────────────────────────────────────────

-- What each day's gather found and what became of it. The retention question
-- in one view, and the first honest answer to "is a source quietly dying",
-- measured on what it fetched rather than on what survived the filters.
create or replace view public.live_headlines_gather_yield as
select
  gather_day,
  origin,
  count(*)::integer as fetched,
  count(*) filter (where ai_native)::integer as ai_native,
  count(*) filter (where selected)::integer as selected,
  count(distinct source_host)::integer as hosts,
  count(*) filter (where published_at is null)::integer as undated,
  min(gathered_at) as first_seen,
  max(gathered_at) as last_seen
from public.live_headlines_gather
group by gather_day, origin;

comment on view public.live_headlines_gather_yield is
  'Per day, per source: how much arrived, how much was AI-native, how much reached the feed. A source at zero beside neighbours at forty is a dead source.';

-- Daily volume per lane, over everything gathered rather than over the twenty
-- that were shown. This is the series the nine categories were always meant to
-- support and never could.
create or replace view public.live_headlines_category_volume as
select
  gather_day,
  coalesce(category, 'unclassified') as category,
  count(*)::integer as articles,
  count(distinct source_host)::integer as hosts,
  count(*) filter (where selected)::integer as selected,
  round(avg(source_tier)::numeric, 2) as mean_tier
from public.live_headlines_gather
where ai_native
group by gather_day, coalesce(category, 'unclassified');

comment on view public.live_headlines_category_volume is
  'How much was written in each lane each day, across the whole gather. The feed shows at most four cards per lane by design, so lane volume was invisible in the cache and is visible here.';

-- ── 7. Access ──────────────────────────────────────────────────────────────
--
-- Same posture as live_headlines_cache: shared industry data, not user data,
-- reachable only through the service role. RLS on with no policy means nothing
-- is directly selectable by an anon or authenticated client, and the 2026-09-05
-- containment posture is unchanged by this migration.

alter table public.live_headlines_gather enable row level security;
alter table public.live_headlines_gather_runs enable row level security;
alter table public.live_headlines_cache_versions enable row level security;
alter table public.model_benchmark_snapshots enable row level security;

revoke all on public.live_headlines_gather from anon, authenticated;
revoke all on public.live_headlines_gather_runs from anon, authenticated;
revoke all on public.live_headlines_cache_versions from anon, authenticated;
revoke all on public.model_benchmark_snapshots from anon, authenticated;

revoke update, delete on public.live_headlines_gather from public;
revoke update, delete on public.live_headlines_cache_versions from public;
revoke update, delete on public.model_benchmark_snapshots from public;
