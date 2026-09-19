-- Distributed, fail-closed rate-limit authority for public and paid Edge routes.
-- The key is an opaque route-scoped identifier. Callers hash personal values
-- before they reach this table.

create table if not exists public.edge_rate_limits (
  rate_limit_key text primary key,
  request_count integer not null,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint edge_rate_limits_key_length check (length(rate_limit_key) between 3 and 256),
  constraint edge_rate_limits_count_positive check (request_count > 0)
);

create index if not exists edge_rate_limits_reset_at_idx
  on public.edge_rate_limits (reset_at);

alter table public.edge_rate_limits enable row level security;
revoke all on table public.edge_rate_limits from public, anon, authenticated;

create or replace function public.check_rate_limit(
  p_rate_limit_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_rate_limit_key is null
     or length(p_rate_limit_key) not between 3 and 256
     or p_max_requests not between 1 and 10000
     or p_window_seconds not between 1 and 604800 then
    raise exception 'invalid rate-limit request' using errcode = '22023';
  end if;

  insert into public.edge_rate_limits as limits (
    rate_limit_key,
    request_count,
    reset_at,
    updated_at
  ) values (
    p_rate_limit_key,
    1,
    v_now + make_interval(secs => p_window_seconds),
    v_now
  )
  on conflict (rate_limit_key) do update
    set request_count = case when limits.reset_at <= v_now then 1 else limits.request_count + 1 end,
        reset_at = case when limits.reset_at <= v_now then v_now + make_interval(secs => p_window_seconds) else limits.reset_at end,
        updated_at = v_now
  returning limits.request_count, limits.reset_at
  into v_count, v_reset_at;

  return query
  select
    v_count <= p_max_requests,
    greatest(0, p_max_requests - v_count),
    v_reset_at;
end
$function$;

create or replace function public.cleanup_expired_edge_rate_limits()
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_deleted integer;
begin
  delete from public.edge_rate_limits
  where reset_at < clock_timestamp() - interval '1 day';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end
$function$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.cleanup_expired_edge_rate_limits() from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
grant execute on function public.cleanup_expired_edge_rate_limits() to service_role;

comment on table public.edge_rate_limits is
  'Opaque distributed counters for Edge Function abuse and spend controls.';
