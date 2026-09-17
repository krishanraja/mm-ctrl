


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "ctrl_discovery";


ALTER SCHEMA "ctrl_discovery" OWNER TO "postgres";


COMMENT ON SCHEMA "ctrl_discovery" IS 'Private append-only product discovery ledger for the mm-ctrl evolution session. Not exposed to the Data API.';



CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


CREATE TYPE "public"."action_signal_level" AS ENUM (
    'low',
    'mid',
    'high'
);


ALTER TYPE "public"."action_signal_level" OWNER TO "postgres";


CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'moderator',
    'user',
    'facilitator'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."consent_purpose" AS ENUM (
    'index_publication',
    'sales_outreach',
    'case_study',
    'product_improvements',
    'research_partnerships'
);


ALTER TYPE "public"."consent_purpose" OWNER TO "postgres";


CREATE TYPE "public"."exec_role" AS ENUM (
    'CEO',
    'CTO',
    'COO',
    'CMO',
    'CFO',
    'VP',
    'Director',
    'Other'
);


ALTER TYPE "public"."exec_role" OWNER TO "postgres";


CREATE TYPE "public"."fact_category" AS ENUM (
    'identity',
    'business',
    'objective',
    'blocker',
    'preference'
);


ALTER TYPE "public"."fact_category" OWNER TO "postgres";


CREATE TYPE "public"."lead_source" AS ENUM (
    'ctrl',
    'mindmaker_site',
    'mindmaker_live',
    'builder_economy'
);


ALTER TYPE "public"."lead_source" OWNER TO "postgres";


CREATE TYPE "public"."memory_source_type" AS ENUM (
    'voice',
    'form',
    'linkedin',
    'calendar',
    'enrichment',
    'manual',
    'kit',
    'capsule'
);


ALTER TYPE "public"."memory_source_type" OWNER TO "postgres";


CREATE TYPE "public"."momentum_tier" AS ENUM (
    'experimenting',
    'scaling',
    'institutionalizing'
);


ALTER TYPE "public"."momentum_tier" OWNER TO "postgres";


CREATE TYPE "public"."roi_provenance" AS ENUM (
    'instrumented',
    'system_report',
    'estimate'
);


ALTER TYPE "public"."roi_provenance" OWNER TO "postgres";


CREATE TYPE "public"."roi_unit_type" AS ENUM (
    'hours_saved',
    'revenue_increase',
    'cost_reduction',
    'nps_increase',
    'time_to_market'
);


ALTER TYPE "public"."roi_unit_type" OWNER TO "postgres";


CREATE TYPE "public"."verification_status" AS ENUM (
    'inferred',
    'verified',
    'corrected',
    'rejected',
    'disputed'
);


ALTER TYPE "public"."verification_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ctrl_discovery"."prepare_record_append"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'ctrl_discovery'
    AS $$
declare
  prior ctrl_discovery.records%rowtype;
  expected_prefix text;
  secret_candidate text;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(new.session_key || ':' || new.record_key, 0)
  );

  expected_prefix := case new.record_type
    when 'decision' then 'D'
    when 'hypothesis' then 'H'
    when 'assumption' then 'A'
    when 'evidence' then 'E'
    when 'contradiction' then 'C'
    when 'open_question' then 'Q'
    when 'milestone' then 'M'
    when 'risk' then 'R'
    when 'source' then 'S'
  end;

  if split_part(new.record_key, '-', 1) <> expected_prefix then
    raise exception using
      errcode = '23514',
      message = 'record key prefix does not match record type';
  end if;

  select *
  into prior
  from ctrl_discovery.records
  where session_key = new.session_key
    and record_key = new.record_key
  order by version desc
  limit 1;

  if not found then
    if new.version <> 1 then
      raise exception using
        errcode = '23514',
        message = 'the first version of a record must be version 1';
    end if;
    new.previous_record_uuid := null;
  else
    if new.version <> prior.version + 1 then
      raise exception using
        errcode = '23514',
        message = 'record versions must be contiguous';
    end if;
    if new.record_type <> prior.record_type then
      raise exception using
        errcode = '23514',
        message = 'record type cannot change across versions';
    end if;
    new.previous_record_uuid := prior.record_uuid;
  end if;

  secret_candidate :=
    new.title || E'\n' ||
    new.statement || E'\n' ||
    new.private_content::text || E'\n' ||
    coalesce(new.export_content::text, '') || E'\n' ||
    new.source_ref;

  if secret_candidate ~* '(ghp_[a-z0-9]{20,}|github_pat_[a-z0-9_]{20,}|sbp_[a-z0-9]{20,}|vcp_[a-z0-9]{20,}|sk_(live|test)_[a-z0-9]{16,})' then
    raise exception using
      errcode = '22023',
      message = 'possible credential detected; record rejected';
  end if;

  new.record_sha256 := encode(
    extensions.digest(
      jsonb_build_object(
        'session_key', new.session_key,
        'record_key', new.record_key,
        'version', new.version,
        'previous_record_uuid', new.previous_record_uuid,
        'record_type', new.record_type,
        'state', new.state,
        'title', new.title,
        'statement', new.statement,
        'private_content', new.private_content,
        'export_content', new.export_content,
        'export_policy', new.export_policy,
        'redaction_reason', new.redaction_reason,
        'authority', new.authority,
        'capture_method', new.capture_method,
        'source_ref', new.source_ref,
        'source_commit', new.source_commit,
        'sensitivity', new.sensitivity,
        'observed_at', new.observed_at,
        'recorded_at', new.recorded_at,
        'recorded_by', new.recorded_by,
        'idempotency_key', new.idempotency_key
      )::text,
      'sha256'
    ),
    'hex'
  );

  return new;
end;
$$;


ALTER FUNCTION "ctrl_discovery"."prepare_record_append"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ctrl_discovery"."reject_history_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog'
    AS $$
begin
  raise exception using
    errcode = '55000',
    message = 'ctrl_discovery history is append-only; append a new version instead';
end;
$$;


ALTER FUNCTION "ctrl_discovery"."reject_history_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."brain_assertion_scope_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  source_record record;
begin
  select workspace_id, subject_id, audience
    into source_record
  from public.brain_sources
  where id = new.source_id;

  if source_record.workspace_id is null
    or source_record.workspace_id <> new.workspace_id
    or source_record.subject_id <> new.subject_id
    or source_record.audience <> new.audience then
    raise exception 'Brain assertion must preserve source workspace, subject, and audience';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."brain_assertion_scope_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."brain_item_evidence_scope_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  version_record record;
  assertion_record record;
begin
  select workspace_id, audience into version_record
  from public.brain_item_versions where id = new.item_version_id;

  select workspace_id, audience into assertion_record
  from public.brain_assertions where id = new.assertion_id;

  if version_record.workspace_id is null
    or assertion_record.workspace_id is null
    or version_record.workspace_id <> new.workspace_id
    or assertion_record.workspace_id <> new.workspace_id
    or version_record.audience <> new.audience
    or assertion_record.audience <> new.audience then
    raise exception 'Brain item evidence cannot cross workspace or audience boundaries';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."brain_item_evidence_scope_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."brain_item_version_scope_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  item_record record;
  predecessor_record record;
begin
  select workspace_id, subject_id
    into item_record
  from public.brain_items
  where id = new.brain_item_id;

  if item_record.workspace_id is null
    or item_record.workspace_id <> new.workspace_id
    or item_record.subject_id <> new.subject_id then
    raise exception 'Brain item version must preserve item workspace and subject';
  end if;

  if new.version = 1 and new.predecessor_version_id is not null then
    raise exception 'First Brain item version cannot have a predecessor';
  end if;

  if new.predecessor_version_id is not null then
    select brain_item_id, version
      into predecessor_record
    from public.brain_item_versions
    where id = new.predecessor_version_id;

    if predecessor_record.brain_item_id is null
      or predecessor_record.brain_item_id <> new.brain_item_id
      or predecessor_record.version + 1 <> new.version then
      raise exception 'Brain item predecessor must be the immediately prior version of the same item';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."brain_item_version_scope_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."brain_relationship_evidence_scope_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  version_record record;
  assertion_record record;
begin
  select workspace_id, audience into version_record
  from public.brain_relationship_versions where id = new.relationship_version_id;

  select workspace_id, audience into assertion_record
  from public.brain_assertions where id = new.assertion_id;

  if version_record.workspace_id is null
    or assertion_record.workspace_id is null
    or version_record.workspace_id <> new.workspace_id
    or assertion_record.workspace_id <> new.workspace_id
    or version_record.audience <> new.audience
    or assertion_record.audience <> new.audience then
    raise exception 'Brain relationship evidence cannot cross workspace or audience boundaries';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."brain_relationship_evidence_scope_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."brain_relationship_version_scope_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  relationship_record record;
  from_version record;
  to_version record;
  predecessor_record record;
begin
  select workspace_id, subject_id, from_item_id, to_item_id
    into relationship_record
  from public.brain_relationships
  where id = new.relationship_id;

  select brain_item_id, workspace_id, subject_id, standing
    into from_version
  from public.brain_item_versions
  where id = new.from_item_version_id;

  select brain_item_id, workspace_id, subject_id, standing
    into to_version
  from public.brain_item_versions
  where id = new.to_item_version_id;

  if relationship_record.workspace_id is null
    or from_version.brain_item_id is null
    or to_version.brain_item_id is null
    or relationship_record.workspace_id <> new.workspace_id
    or relationship_record.subject_id <> new.subject_id
    or from_version.workspace_id <> new.workspace_id
    or to_version.workspace_id <> new.workspace_id
    or from_version.subject_id <> new.subject_id
    or to_version.subject_id <> new.subject_id
    or from_version.brain_item_id <> relationship_record.from_item_id
    or to_version.brain_item_id <> relationship_record.to_item_id then
    raise exception 'Brain relationship version must connect the identity endpoints in one workspace';
  end if;

  if new.standing = 'current'
    and (from_version.standing <> 'current' or to_version.standing <> 'current') then
    raise exception 'Current Brain relationships require current endpoint versions';
  end if;

  if new.version = 1 and new.predecessor_version_id is not null then
    raise exception 'First Brain relationship version cannot have a predecessor';
  end if;

  if new.predecessor_version_id is not null then
    select relationship_id, version
      into predecessor_record
    from public.brain_relationship_versions
    where id = new.predecessor_version_id;

    if predecessor_record.relationship_id is null
      or predecessor_record.relationship_id <> new.relationship_id
      or predecessor_record.version + 1 <> new.version then
      raise exception 'Brain relationship predecessor must be the immediately prior version of the same relationship';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."brain_relationship_version_scope_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."brain_require_item_support"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  target_version_id uuid;
begin
  if tg_table_name = 'brain_item_versions' then
    target_version_id := new.id;
  elsif tg_op = 'DELETE' then
    target_version_id := old.item_version_id;
  else
    target_version_id := new.item_version_id;
  end if;

  if exists (
    select 1
    from public.brain_item_versions version_row
    where version_row.id = target_version_id
      and version_row.standing = 'current'
      and version_row.maturity in ('held', 'trusted')
      and not exists (
        select 1
        from public.brain_item_version_assertions evidence_row
        where evidence_row.item_version_id = version_row.id
          and evidence_row.evidence_role = 'supporting'
      )
  ) then
    raise exception 'Current held or trusted Brain item versions require supporting evidence';
  end if;

  return null;
end;
$$;


ALTER FUNCTION "private"."brain_require_item_support"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."brain_require_relationship_evidence"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  target_version_id uuid;
begin
  if tg_table_name = 'brain_relationship_versions' then
    target_version_id := new.id;
  elsif tg_op = 'DELETE' then
    target_version_id := old.relationship_version_id;
  else
    target_version_id := new.relationship_version_id;
  end if;

  if exists (
    select 1
    from public.brain_relationship_versions version_row
    where version_row.id = target_version_id
      and not exists (
        select 1
        from public.brain_relationship_version_assertions evidence_row
        where evidence_row.relationship_version_id = version_row.id
      )
  ) then
    raise exception 'Brain relationship versions require evidence';
  end if;

  return null;
end;
$$;


ALTER FUNCTION "private"."brain_require_relationship_evidence"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."mindmake_brief_rpc"("p_operation" "text", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_row private.mindmake_brief_requests%rowtype;
  v_token uuid;
  v_kind text;
  v_state text;
  v_attempts integer;
  v_attempted_at timestamptz;
  v_current_token uuid;
  v_ok boolean;
  v_stale_seconds integer;
  v_existing_outcome text := 'existing';
begin
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload) <> 'object' then
    raise exception 'RPC payload must be an object' using errcode = '22023';
  end if;

  if p_operation = 'begin' then
    if (p_payload ->> 'request_payload_sha256') !~ '^[0-9a-f]{64}$'
      or (p_payload ->> 'verification_code_hash') !~ '^[0-9a-f]{64}$'
      or (p_payload ->> 'rate_limit_ip_hash') !~ '^[0-9a-f]{64}$'
      or (p_payload ->> 'rate_limit_email_hash') !~ '^[0-9a-f]{64}$'
      or (
        p_payload ->> 'user_agent_hash' is not null
        and (p_payload ->> 'user_agent_hash') !~ '^[0-9a-f]{64}$'
      )
    then
      raise exception 'Invalid hashed identifier' using errcode = '22023';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('mindmake:request:' || (p_payload ->> 'request_id'), 0)
    );
    select * into v_row
    from private.mindmake_brief_requests as request
    where request.request_id = p_payload ->> 'request_id'
    for update;

    if found then
      if v_row.request_payload_sha256 <> p_payload ->> 'request_payload_sha256' then
        return pg_catalog.jsonb_build_object('outcome', 'conflict');
      end if;
      if v_row.verified_at is not null then
        return pg_catalog.jsonb_build_object(
          'outcome', 'already_confirmed',
          'row', pg_catalog.to_jsonb(v_row)
        );
      end if;

      if v_row.verification_expires_at <= v_now then
        if not private.mindmake_consume_brief_rate(
          p_payload ->> 'rate_limit_ip_hash',
          p_payload ->> 'rate_limit_email_hash',
          v_now
        ) then
          return pg_catalog.jsonb_build_object('outcome', 'rate_limited');
        end if;

        update private.mindmake_brief_requests
        set verification_nonce = (p_payload ->> 'verification_nonce')::uuid,
            verification_code_hash = p_payload ->> 'verification_code_hash',
            verification_expires_at = v_now + interval '10 minutes',
            verification_failed_attempts = 0,
            verification_delivery = 'pending',
            verification_delivery_id = null,
            verification_attempts = 0,
            verification_attempted_at = null,
            verification_claim_token = null,
            rate_limit_ip_hash = p_payload ->> 'rate_limit_ip_hash',
            rate_limit_email_hash = p_payload ->> 'rate_limit_email_hash',
            user_agent_hash = p_payload ->> 'user_agent_hash',
            updated_at = v_now
        where id = v_row.id
        returning * into v_row;
        v_existing_outcome := 'renewed';
      end if;

      if v_row.assembly_state = 'ready' and v_row.company_research is not null then
        return pg_catalog.jsonb_build_object(
          'outcome', v_existing_outcome,
          'row', pg_catalog.to_jsonb(v_row)
        );
      end if;

      v_stale_seconds := greatest(
        30,
        least(600, coalesce((p_payload ->> 'stale_seconds')::integer, 120))
      );
      if v_row.assembly_state = 'sending'
        and v_row.assembly_attempted_at > v_now - pg_catalog.make_interval(secs => v_stale_seconds)
      then
        return pg_catalog.jsonb_build_object(
          'outcome', 'processing',
          'row', pg_catalog.to_jsonb(v_row)
        );
      end if;
      if v_row.assembly_attempts >= 3 then
        return pg_catalog.jsonb_build_object(
          'outcome', 'assembly_failed',
          'row', pg_catalog.to_jsonb(v_row)
        );
      end if;

      v_token := pg_catalog.gen_random_uuid();
      update private.mindmake_brief_requests
      set assembly_state = 'sending',
          assembly_attempts = assembly_attempts + 1,
          assembly_attempted_at = v_now,
          assembly_claim_token = v_token,
          updated_at = v_now
      where id = v_row.id
      returning * into v_row;
      return pg_catalog.jsonb_build_object(
        'outcome', 'assemble',
        'claim_token', v_token,
        'row', pg_catalog.to_jsonb(v_row)
      );
    end if;

    if not private.mindmake_consume_brief_rate(
      p_payload ->> 'rate_limit_ip_hash',
      p_payload ->> 'rate_limit_email_hash',
      v_now
    ) then
      return pg_catalog.jsonb_build_object('outcome', 'rate_limited');
    end if;

    v_token := pg_catalog.gen_random_uuid();
    insert into private.mindmake_brief_requests (
      version,
      request_id,
      request_payload_sha256,
      email,
      company_domain,
      pressure_id,
      returned_time_id,
      entry_route,
      publication_requested,
      consent_wording_version,
      consent_recorded_at,
      assembly_state,
      assembly_attempts,
      assembly_attempted_at,
      assembly_claim_token,
      rate_limit_ip_hash,
      rate_limit_email_hash,
      user_agent_hash,
      verification_nonce,
      verification_code_hash,
      verification_expires_at
    ) values (
      2,
      p_payload ->> 'request_id',
      p_payload ->> 'request_payload_sha256',
      p_payload ->> 'email',
      p_payload ->> 'company_domain',
      p_payload ->> 'pressure_id',
      p_payload ->> 'returned_time_id',
      p_payload ->> 'entry_route',
      (p_payload ->> 'publication_requested')::boolean,
      p_payload ->> 'consent_wording_version',
      v_now,
      'sending',
      1,
      v_now,
      v_token,
      p_payload ->> 'rate_limit_ip_hash',
      p_payload ->> 'rate_limit_email_hash',
      p_payload ->> 'user_agent_hash',
      (p_payload ->> 'verification_nonce')::uuid,
      p_payload ->> 'verification_code_hash',
      v_now + interval '10 minutes'
    )
    returning * into v_row;
    return pg_catalog.jsonb_build_object(
      'outcome', 'assemble',
      'claim_token', v_token,
      'row', pg_catalog.to_jsonb(v_row)
    );

  elsif p_operation = 'finish_assembly' then
    select * into v_row
    from private.mindmake_brief_requests as request
    where request.id = (p_payload ->> 'row_id')::uuid
    for update;
    if not found then return pg_catalog.jsonb_build_object('outcome', 'not_found'); end if;

    v_token := (p_payload ->> 'claim_token')::uuid;
    if v_row.assembly_state <> 'sending' or v_row.assembly_claim_token is distinct from v_token then
      return pg_catalog.jsonb_build_object(
        'outcome', 'stale_claim',
        'row', pg_catalog.to_jsonb(v_row)
      );
    end if;
    v_ok := (p_payload ->> 'ok')::boolean;
    if v_ok then
      if pg_catalog.jsonb_typeof(p_payload -> 'company_research') <> 'object' then
        raise exception 'Company research must be an object' using errcode = '22023';
      end if;
      update private.mindmake_brief_requests
      set company_research = p_payload -> 'company_research',
          assembly_state = 'ready',
          assembly_claim_token = null,
          updated_at = v_now
      where id = v_row.id
      returning * into v_row;
    else
      update private.mindmake_brief_requests
      set assembly_state = 'failed',
          assembly_claim_token = null,
          updated_at = v_now
      where id = v_row.id
      returning * into v_row;
    end if;
    return pg_catalog.jsonb_build_object('outcome', 'finished', 'row', pg_catalog.to_jsonb(v_row));

  elsif p_operation = 'confirm' then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('mindmake:request:' || (p_payload ->> 'request_id'), 0)
    );
    select * into v_row
    from private.mindmake_brief_requests as request
    where request.request_id = p_payload ->> 'request_id'
      and request.email = p_payload ->> 'email'
    for update;
    if not found then return pg_catalog.jsonb_build_object('outcome', 'invalid'); end if;

    if v_row.verified_at is null and v_row.verification_failed_attempts >= 5 then
      return pg_catalog.jsonb_build_object('outcome', 'locked');
    end if;
    if v_row.verification_code_hash <> p_payload ->> 'verification_code_hash' then
      if v_row.verified_at is null then
        update private.mindmake_brief_requests
        set verification_failed_attempts = least(5, verification_failed_attempts + 1),
            updated_at = v_now
        where id = v_row.id
        returning * into v_row;
      end if;
      return pg_catalog.jsonb_build_object('outcome', 'invalid');
    end if;
    if v_row.verified_at is not null then
      return pg_catalog.jsonb_build_object(
        'outcome', 'already_confirmed',
        'row', pg_catalog.to_jsonb(v_row)
      );
    end if;
    if v_row.verification_expires_at <= v_now then
      return pg_catalog.jsonb_build_object('outcome', 'expired');
    end if;
    if v_row.assembly_state <> 'ready' or v_row.company_research is null then
      return pg_catalog.jsonb_build_object('outcome', 'not_ready');
    end if;

    update private.mindmake_brief_requests
    set verified_at = v_now,
        updated_at = v_now
    where id = v_row.id
    returning * into v_row;
    return pg_catalog.jsonb_build_object('outcome', 'verified', 'row', pg_catalog.to_jsonb(v_row));

  elsif p_operation = 'claim_delivery' then
    select * into v_row
    from private.mindmake_brief_requests as request
    where request.id = (p_payload ->> 'row_id')::uuid
    for update;
    if not found then return pg_catalog.jsonb_build_object('outcome', 'not_found'); end if;

    v_kind := p_payload ->> 'delivery_kind';
    v_stale_seconds := greatest(
      30,
      least(600, coalesce((p_payload ->> 'stale_seconds')::integer, 120))
    );
    if v_kind = 'verification' then
      if v_row.verified_at is not null then
        return pg_catalog.jsonb_build_object('outcome', 'not_claimed', 'row', pg_catalog.to_jsonb(v_row));
      end if;
      if v_row.verification_expires_at <= v_now then
        return pg_catalog.jsonb_build_object('outcome', 'expired', 'row', pg_catalog.to_jsonb(v_row));
      end if;
      v_state := v_row.verification_delivery;
      v_attempts := v_row.verification_attempts;
      v_attempted_at := v_row.verification_attempted_at;
      v_current_token := v_row.verification_claim_token;
    elsif v_kind = 'visitor' then
      if v_row.verified_at is null or v_row.assembly_state <> 'ready' then
        return pg_catalog.jsonb_build_object('outcome', 'not_verified', 'row', pg_catalog.to_jsonb(v_row));
      end if;
      v_state := v_row.visitor_delivery;
      v_attempts := v_row.visitor_attempts;
      v_attempted_at := v_row.visitor_attempted_at;
      v_current_token := v_row.visitor_claim_token;
    elsif v_kind = 'operator' then
      if v_row.verified_at is null or v_row.assembly_state <> 'ready' then
        return pg_catalog.jsonb_build_object('outcome', 'not_verified', 'row', pg_catalog.to_jsonb(v_row));
      end if;
      v_state := v_row.operator_delivery;
      v_attempts := v_row.operator_attempts;
      v_attempted_at := v_row.operator_attempted_at;
      v_current_token := v_row.operator_claim_token;
    else
      raise exception 'Unsupported delivery kind' using errcode = '22023';
    end if;

    if v_state = 'queued' then
      return pg_catalog.jsonb_build_object('outcome', 'not_claimed', 'row', pg_catalog.to_jsonb(v_row));
    end if;
    if v_attempts >= 3 then
      return pg_catalog.jsonb_build_object('outcome', 'exhausted', 'row', pg_catalog.to_jsonb(v_row));
    end if;
    if v_state = 'sending'
      and v_attempted_at > v_now - pg_catalog.make_interval(secs => v_stale_seconds)
    then
      return pg_catalog.jsonb_build_object('outcome', 'not_claimed', 'row', pg_catalog.to_jsonb(v_row));
    end if;

    v_token := pg_catalog.gen_random_uuid();
    if v_kind = 'verification' then
      update private.mindmake_brief_requests
      set verification_delivery = 'sending',
          verification_attempts = verification_attempts + 1,
          verification_attempted_at = v_now,
          verification_claim_token = v_token,
          updated_at = v_now
      where id = v_row.id returning * into v_row;
    elsif v_kind = 'visitor' then
      update private.mindmake_brief_requests
      set visitor_delivery = 'sending',
          visitor_attempts = visitor_attempts + 1,
          visitor_attempted_at = v_now,
          visitor_claim_token = v_token,
          updated_at = v_now
      where id = v_row.id returning * into v_row;
    else
      update private.mindmake_brief_requests
      set operator_delivery = 'sending',
          operator_attempts = operator_attempts + 1,
          operator_attempted_at = v_now,
          operator_claim_token = v_token,
          updated_at = v_now
      where id = v_row.id returning * into v_row;
    end if;
    return pg_catalog.jsonb_build_object(
      'outcome', 'claimed',
      'claim_token', v_token,
      'row', pg_catalog.to_jsonb(v_row)
    );

  elsif p_operation = 'finish_delivery' then
    select * into v_row
    from private.mindmake_brief_requests as request
    where request.id = (p_payload ->> 'row_id')::uuid
    for update;
    if not found then return pg_catalog.jsonb_build_object('outcome', 'not_found'); end if;

    v_kind := p_payload ->> 'delivery_kind';
    v_token := (p_payload ->> 'claim_token')::uuid;
    v_ok := (p_payload ->> 'ok')::boolean;
    if v_kind = 'verification' then
      v_state := v_row.verification_delivery;
      v_current_token := v_row.verification_claim_token;
    elsif v_kind = 'visitor' then
      v_state := v_row.visitor_delivery;
      v_current_token := v_row.visitor_claim_token;
    elsif v_kind = 'operator' then
      v_state := v_row.operator_delivery;
      v_current_token := v_row.operator_claim_token;
    else
      raise exception 'Unsupported delivery kind' using errcode = '22023';
    end if;

    if v_state <> 'sending' or v_current_token is distinct from v_token then
      return pg_catalog.jsonb_build_object(
        'outcome', 'stale_claim',
        'row', pg_catalog.to_jsonb(v_row)
      );
    end if;

    if v_kind = 'verification' then
      update private.mindmake_brief_requests
      set verification_delivery = case when v_ok then 'queued' else 'failed' end,
          verification_delivery_id = case when v_ok then p_payload ->> 'delivery_id' else null end,
          verification_claim_token = null,
          updated_at = v_now
      where id = v_row.id returning * into v_row;
    elsif v_kind = 'visitor' then
      update private.mindmake_brief_requests
      set visitor_delivery = case when v_ok then 'queued' else 'failed' end,
          visitor_delivery_id = case when v_ok then p_payload ->> 'delivery_id' else null end,
          visitor_claim_token = null,
          updated_at = v_now
      where id = v_row.id returning * into v_row;
    else
      update private.mindmake_brief_requests
      set operator_delivery = case when v_ok then 'queued' else 'failed' end,
          operator_delivery_id = case when v_ok then p_payload ->> 'delivery_id' else null end,
          operator_claim_token = null,
          updated_at = v_now
      where id = v_row.id returning * into v_row;
    end if;
    return pg_catalog.jsonb_build_object('outcome', 'finished', 'row', pg_catalog.to_jsonb(v_row));

  elsif p_operation = 'get' then
    select * into v_row
    from private.mindmake_brief_requests as request
    where request.id = (p_payload ->> 'row_id')::uuid;
    if not found then return pg_catalog.jsonb_build_object('outcome', 'not_found'); end if;
    return pg_catalog.jsonb_build_object('outcome', 'found', 'row', pg_catalog.to_jsonb(v_row));
  end if;

  raise exception 'Unsupported Mindmake brief RPC operation' using errcode = '22023';
end;
$_$;


ALTER FUNCTION "private"."mindmake_brief_rpc"("p_operation" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."mindmake_consume_brief_rate"("p_ip_hash" "text", "p_email_hash" "text", "p_now" timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $_$
declare
  v_ip_lock bigint;
  v_email_lock bigint;
  v_count bigint;
begin
  if p_ip_hash !~ '^[0-9a-f]{64}$' or p_email_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate identifier' using errcode = '22023';
  end if;

  v_ip_lock := pg_catalog.hashtextextended('mindmake:ip:' || p_ip_hash, 0);
  v_email_lock := pg_catalog.hashtextextended('mindmake:email:' || p_email_hash, 0);
  if v_ip_lock <= v_email_lock then
    perform pg_catalog.pg_advisory_xact_lock(v_ip_lock);
    if v_email_lock <> v_ip_lock then
      perform pg_catalog.pg_advisory_xact_lock(v_email_lock);
    end if;
  else
    perform pg_catalog.pg_advisory_xact_lock(v_email_lock);
    perform pg_catalog.pg_advisory_xact_lock(v_ip_lock);
  end if;

  select pg_catalog.count(*) into v_count
  from private.mindmake_brief_rate_events as event
  where event.email_identifier_hash = p_email_hash
    and event.created_at >= p_now - interval '1 hour';
  if v_count >= 4 then return false; end if;

  select pg_catalog.count(*) into v_count
  from private.mindmake_brief_rate_events as event
  where event.ip_identifier_hash = p_ip_hash
    and event.created_at >= p_now - interval '10 minutes';
  if v_count >= 6 then return false; end if;

  select pg_catalog.count(*) into v_count
  from private.mindmake_brief_rate_events as event
  where event.ip_identifier_hash = p_ip_hash
    and event.created_at >= p_now - interval '1 day';
  if v_count >= 30 then return false; end if;

  insert into private.mindmake_brief_rate_events (
    id,
    created_at,
    ip_identifier_hash,
    email_identifier_hash
  ) values (
    pg_catalog.gen_random_uuid(),
    p_now,
    p_ip_hash,
    p_email_hash
  );
  return true;
end;
$_$;


ALTER FUNCTION "private"."mindmake_consume_brief_rate"("p_ip_hash" "text", "p_email_hash" "text", "p_now" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."mindmake_consume_personal_read_rate"("p_ip_hash" "text", "p_email_hash" "text", "p_now" timestamp with time zone DEFAULT "now"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_email_recent integer;
  v_ip_recent integer;
  v_ip_daily integer;
begin
  perform pg_advisory_xact_lock(hashtext('mindmake_personal_read_ip'), hashtext(p_ip_hash));
  perform pg_advisory_xact_lock(hashtext('mindmake_personal_read_email'), hashtext(p_email_hash));

  select count(*) into v_email_recent
  from private.mindmake_personal_read_rate_events
  where email_identifier_hash = p_email_hash and created_at > p_now - interval '1 hour';
  if v_email_recent >= 3 then return false; end if;

  select count(*) into v_ip_recent
  from private.mindmake_personal_read_rate_events
  where ip_identifier_hash = p_ip_hash and created_at > p_now - interval '10 minutes';
  if v_ip_recent >= 5 then return false; end if;

  select count(*) into v_ip_daily
  from private.mindmake_personal_read_rate_events
  where ip_identifier_hash = p_ip_hash and created_at > p_now - interval '1 day';
  if v_ip_daily >= 20 then return false; end if;

  insert into private.mindmake_personal_read_rate_events (ip_identifier_hash, email_identifier_hash)
  values (p_ip_hash, p_email_hash);
  return true;
end;
$$;


ALTER FUNCTION "private"."mindmake_consume_personal_read_rate"("p_ip_hash" "text", "p_email_hash" "text", "p_now" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."mindmake_purge_brief_data"() RETURNS TABLE("unverified_deleted" integer, "rate_events_deleted" integer, "verified_deleted" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_unverified integer;
  v_rate integer;
  v_verified integer;
begin
  delete from private.mindmake_brief_requests
    where verified_at is null
      and created_at < now() - interval '7 days';
  get diagnostics v_unverified = row_count;

  delete from private.mindmake_brief_rate_events
    where created_at < now() - interval '48 hours';
  get diagnostics v_rate = row_count;

  delete from private.mindmake_brief_requests
    where verified_at is not null
      and updated_at < now() - interval '12 months';
  get diagnostics v_verified = row_count;

  return query select v_unverified, v_rate, v_verified;
end;
$$;


ALTER FUNCTION "private"."mindmake_purge_brief_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."mindmake_purge_follow_ups"() RETURNS TABLE("sent_deleted" integer, "stale_deleted" integer, "rate_events_deleted" integer, "reads_deleted" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_sent integer;
  v_stale integer;
  v_rate integer;
  v_reads integer;
begin
  delete from public.follow_up_queue
  where sent_at is not null and sent_at < now() - interval '7 days';
  get diagnostics v_sent = row_count;

  delete from public.follow_up_queue
  where sent_at is null and created_at < now() - interval '60 days';
  get diagnostics v_stale = row_count;

  delete from private.mindmake_personal_read_rate_events
  where created_at < now() - interval '48 hours';
  get diagnostics v_rate = row_count;

  delete from public.mindmake_personal_reads
  where created_at < now() - interval '12 months';
  get diagnostics v_reads = row_count;

  return query select v_sent, v_stale, v_rate, v_reads;
end;
$$;


ALTER FUNCTION "private"."mindmake_purge_follow_ups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_outcome_to_brain"("p_outcome_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_outcome RECORD;
  v_dir INT;
  v_count INT := 0;
  v_fact_ids UUID[];
BEGIN
  SELECT * INTO v_outcome FROM decision_outcomes WHERE id = p_outcome_id;
  IF NOT FOUND OR v_outcome.applied_to_brain THEN
    RETURN 0;  -- nothing to do / already applied (idempotent)
  END IF;

  -- Credit direction from how the decision PLAYED OUT (process-judged, not luck).
  v_dir := CASE v_outcome.played_out
             WHEN 'true'  THEN 1    -- played out well -> the facts that fed it were good anchors
             WHEN 'false' THEN -1   -- broke -> the facts that fed it were less load-bearing
             ELSE 0                 -- too_early / unknown -> no change yet
           END;

  IF v_dir <> 0 THEN
    -- The contributing MEMORY facts = those reachable from the decision in the lineage DAG.
    SELECT array_agg(DISTINCT l.to_id) INTO v_fact_ids
    FROM lineage_of(v_outcome.decision_case_id, 5) l
    WHERE l.to_type = 'memory';

    IF v_fact_ids IS NOT NULL THEN
      UPDATE user_memory um
      SET importance = GREATEST(1, LEAST(10, COALESCE(um.importance, 5) + v_dir))
      WHERE um.id = ANY(v_fact_ids)
        AND um.user_id = v_outcome.user_id;
      GET DIAGNOSTICS v_count = ROW_COUNT;

      -- Record each adjustment (audit + Calibration Mirror feed).
      INSERT INTO memory_events (user_id, fact_id, kind, strategy, payload)
      SELECT v_outcome.user_id, fid, 'importance_adjusted', 'outcome',
             jsonb_build_object('outcome_id', p_outcome_id,
                                'decision_case_id', v_outcome.decision_case_id,
                                'direction', v_dir)
      FROM unnest(v_fact_ids) AS fid;
    END IF;
  END IF;

  UPDATE decision_outcomes SET applied_to_brain = true WHERE id = p_outcome_id;
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."apply_outcome_to_brain"("p_outcome_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."be_audience_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "public"."be_audience_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bump_content_changed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if (tg_op = 'INSERT') then
    new.content_changed_at := now();
  elsif (tg_op = 'UPDATE') then
    if (new.fact_value is distinct from old.fact_value)
       or (new.fact_context is distinct from old.fact_context)
       or (new.verification_status is distinct from old.verification_status)
       or (new.is_current is distinct from old.is_current) then
      new.content_changed_at := now();
    end if;
    -- else: pure touch (reference_count/last_referenced_at only) -> leave content_changed_at untouched
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."bump_content_changed_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."burn_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_id" "uuid") RETURNS TABLE("burned" boolean, "anchor_fingerprint" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_fingerprint text;
BEGIN
  IF p_user_id IS NULL OR p_pattern_id IS NULL THEN
    RAISE EXCEPTION 'Invalid burn request';
  END IF;

  SELECT up.anchor_fingerprint INTO v_fingerprint
  FROM public.user_patterns up
  WHERE up.id = p_pattern_id
    AND up.user_id = p_user_id
    AND up.pattern_type = 'blindspot';

  IF v_fingerprint IS NULL THEN
    RETURN QUERY SELECT false, NULL::text;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || v_fingerprint, 0));

  DELETE FROM public.blind_spot_experiments
  WHERE pattern_id = p_pattern_id AND user_id = p_user_id;

  DELETE FROM public.blind_spot_evidence_links
  WHERE pattern_id = p_pattern_id AND user_id = p_user_id;

  DELETE FROM public.user_patterns
  WHERE id = p_pattern_id AND user_id = p_user_id;

  INSERT INTO public.blind_spot_rejections (user_id, anchor_fingerprint, reason, updated_at)
  VALUES (p_user_id, v_fingerprint, 'wrong_pattern', now())
  ON CONFLICT (user_id, anchor_fingerprint)
  DO UPDATE SET reason = 'wrong_pattern', updated_at = now();

  RETURN QUERY SELECT true, v_fingerprint;
END;
$$;


ALTER FUNCTION "public"."burn_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."burn_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_id" "uuid") IS 'Deletes a confirmed Blind Spot pattern, its evidence links and its experiment. Retains only the content-free anchor fingerprint so the same read is not regenerated.';



CREATE OR REPLACE FUNCTION "public"."calculate_bootstrap_ci"("sample_values" numeric[], "confidence_level" numeric DEFAULT 0.95, "iterations" integer DEFAULT 1000) RETURNS TABLE("mean" numeric, "ci_lower" numeric, "ci_upper" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  sample_size INTEGER;
  bootstrap_means NUMERIC[];
  lower_percentile NUMERIC;
  upper_percentile NUMERIC;
  i INTEGER;
  bootstrap_sample NUMERIC[];
  bootstrap_mean NUMERIC;
BEGIN
  sample_size := array_length(sample_values, 1);
  
  IF sample_size < 10 THEN
    RETURN QUERY SELECT 
      AVG(v)::NUMERIC,
      NULL::NUMERIC,
      NULL::NUMERIC
    FROM unnest(sample_values) AS v;
    RETURN;
  END IF;
  
  bootstrap_means := ARRAY[]::NUMERIC[];
  FOR i IN 1..iterations LOOP
    SELECT array_agg(sample_values[1 + floor(random() * sample_size)::int])
    INTO bootstrap_sample
    FROM generate_series(1, sample_size);
    
    SELECT AVG(v) INTO bootstrap_mean FROM unnest(bootstrap_sample) AS v;
    bootstrap_means := array_append(bootstrap_means, bootstrap_mean);
  END LOOP;
  
  lower_percentile := (1 - confidence_level) / 2;
  upper_percentile := 1 - lower_percentile;
  
  RETURN QUERY
  WITH stats AS (
    SELECT 
      AVG(v) AS sample_mean,
      percentile_cont(lower_percentile) WITHIN GROUP (ORDER BY v) AS ci_low,
      percentile_cont(upper_percentile) WITHIN GROUP (ORDER BY v) AS ci_high
    FROM unnest(bootstrap_means) AS v
  )
  SELECT 
    sample_mean::NUMERIC,
    ci_low::NUMERIC,
    ci_high::NUMERIC
  FROM stats;
END;
$$;


ALTER FUNCTION "public"."calculate_bootstrap_ci"("sample_values" numeric[], "confidence_level" numeric, "iterations" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_conversion_metrics"("session_uuid" "uuid") RETURNS TABLE("total_sessions" integer, "conversion_rate" numeric, "avg_lead_score" numeric, "high_value_conversions" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT cs.id)::INTEGER as total_sessions,
    (COUNT(DISTINCT br.id)::DECIMAL / NULLIF(COUNT(DISTINCT cs.id), 0) * 100) as conversion_rate,
    AVG(lqs.total_score) as avg_lead_score,
    COUNT(DISTINCT CASE WHEN br.priority = 'high' THEN br.id END)::INTEGER as high_value_conversions
  FROM public.conversation_sessions cs
  LEFT JOIN public.booking_requests br ON cs.id = br.session_id
  LEFT JOIN public.lead_qualification_scores lqs ON cs.id = lqs.session_id
  WHERE (session_uuid IS NULL OR cs.id = session_uuid);
END;
$$;


ALTER FUNCTION "public"."calculate_conversion_metrics"("session_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_momentum_components"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Repeat rate (capped at 10)
  NEW.repeat_rate_capped := LEAST(
    CASE WHEN NEW.days_between_first_last > 0 
      THEN (NEW.total_assessments::NUMERIC / NEW.days_between_first_last) * 30
      ELSE 0
    END,
    10.0
  );
  
  -- Team growth (square root)
  NEW.team_growth_sqrt := SQRT(NEW.total_unique_users::NUMERIC);
  
  -- Referral quality
  NEW.referral_quality_score := NEW.verified_referrals::NUMERIC * 1.0;
  
  -- Recency decay (time-based)
  NEW.recency_decay := CASE 
    WHEN NEW.latest_assessment_date >= NOW() - INTERVAL '30 days' THEN 1.0
    WHEN NEW.latest_assessment_date >= NOW() - INTERVAL '60 days' THEN 0.7
    WHEN NEW.latest_assessment_date >= NOW() - INTERVAL '90 days' THEN 0.4
    ELSE 0.1
  END;
  
  -- Final momentum score
  NEW.momentum_score := ROUND(
    40 * NEW.repeat_rate_capped +
    30 * LEAST(NEW.team_growth_sqrt, 5.0) +
    20 * LEAST(NEW.referral_quality_score, 3.0) +
    10 * NEW.recency_decay
  )::INTEGER;
  
  -- Set momentum tier
  NEW.momentum_tier := CASE
    WHEN NEW.momentum_score >= 70 THEN 'institutionalizing'::public.momentum_tier
    WHEN NEW.momentum_score >= 40 THEN 'scaling'::public.momentum_tier
    ELSE 'experimenting'::public.momentum_tier
  END;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_momentum_components"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_memories"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.user_memory
    WHERE retention_expires_at IS NOT NULL
      AND retention_expires_at < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_memories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_research_cache"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.company_research_cache
  WHERE expires_at < now();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_research_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_llm_logs"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.llm_call_log
  WHERE created_at < now() - interval '90 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_llm_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."close_validity_on_retire"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.is_current = true AND NEW.is_current = false AND NEW.valid_until IS NULL THEN
    NEW.valid_until := now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."close_validity_on_retire"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_blind_spot_candidate_v2"("p_user_id" "uuid", "p_pattern_text" "text", "p_explanation" "text", "p_anchor_fingerprint" "text", "p_evidence_strength" "jsonb", "p_anchors" "jsonb", "p_experiment" "jsonb", "p_idempotency_key" "text") RETURNS TABLE("pattern_id" "uuid", "experiment_id" "uuid", "created" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_pattern_id uuid;
  v_experiment_id uuid;
  v_created boolean := false;
  v_anchor jsonb;
  v_source_id uuid;
  v_source_owned boolean;
  v_existing_fingerprint text;
BEGIN
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Invalid user';
  END IF;
  IF char_length(btrim(coalesce(p_pattern_text, ''))) < 3
    OR char_length(p_pattern_text) > 96
    OR array_length(regexp_split_to_array(btrim(p_pattern_text), '[[:space:]]+'), 1) > 8 THEN
    RAISE EXCEPTION 'Invalid Blind Spot headline';
  END IF;
  IF char_length(coalesce(p_anchor_fingerprint, '')) <> 64
    OR char_length(btrim(coalesce(p_idempotency_key, ''))) < 8 THEN
    RAISE EXCEPTION 'Invalid confirmation identity';
  END IF;
  IF jsonb_typeof(p_anchors) <> 'array'
    OR jsonb_array_length(p_anchors) < 3
    OR jsonb_typeof(p_experiment) <> 'object' THEN
    RAISE EXCEPTION 'Pattern confirmation requires evidence and an experiment';
  END IF;
  IF (SELECT count(*) FROM jsonb_array_elements(p_anchors) anchor WHERE anchor->>'role' = 'intention') <> 1
    OR (SELECT count(*) FROM jsonb_array_elements(p_anchors) anchor WHERE anchor->>'role' = 'recurrence') < 2
    OR (SELECT count(DISTINCT (anchor->>'sourceKind') || ':' || (anchor->>'sourceId')) FROM jsonb_array_elements(p_anchors) anchor) <> jsonb_array_length(p_anchors) THEN
    RAISE EXCEPTION 'Pattern confirmation requires one intention and two distinct recurrences';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_anchor_fingerprint, 0));

  SELECT up.id, up.anchor_fingerprint INTO v_pattern_id, v_existing_fingerprint
  FROM public.user_patterns up
  WHERE up.user_id = p_user_id
    AND (up.confirmation_key = p_idempotency_key OR up.anchor_fingerprint = p_anchor_fingerprint)
  ORDER BY up.created_at ASC
  LIMIT 1;

  IF v_pattern_id IS NOT NULL AND v_existing_fingerprint IS DISTINCT FROM p_anchor_fingerprint THEN
    RAISE EXCEPTION 'Idempotency key already belongs to different evidence';
  END IF;

  IF v_pattern_id IS NULL THEN
    INSERT INTO public.user_patterns (
      user_id,
      pattern_type,
      pattern_text,
      explanation,
      anchor_fingerprint,
      evidence_strength,
      confirmation_key,
      evidence_count,
      confidence,
      status,
      last_confirmed_at
    ) VALUES (
      p_user_id,
      'blindspot',
      btrim(p_pattern_text),
      nullif(btrim(p_explanation), ''),
      p_anchor_fingerprint,
      coalesce(p_evidence_strength, '{}'::jsonb),
      p_idempotency_key,
      jsonb_array_length(p_anchors),
      1,
      'confirmed',
      now()
    ) RETURNING id INTO v_pattern_id;
    v_created := true;
  ELSE
    UPDATE public.user_patterns
    SET last_confirmed_at = now(),
        evidence_count = greatest(evidence_count, jsonb_array_length(p_anchors)),
        evidence_strength = coalesce(p_evidence_strength, evidence_strength),
        status = 'confirmed'
    WHERE id = v_pattern_id AND user_id = p_user_id;
  END IF;

  FOR v_anchor IN SELECT value FROM jsonb_array_elements(p_anchors)
  LOOP
    IF (v_anchor->>'sourceKind') NOT IN ('memory', 'decision', 'decision_case', 'mission', 'check_in')
      OR (v_anchor->>'role') NOT IN ('intention', 'recurrence') THEN
      RAISE EXCEPTION 'Invalid evidence anchor';
    END IF;

    v_source_id := (v_anchor->>'sourceId')::uuid;
    v_source_owned := CASE v_anchor->>'sourceKind'
      WHEN 'memory' THEN EXISTS (
        SELECT 1 FROM public.user_memory WHERE id = v_source_id AND user_id = p_user_id
      )
      WHEN 'decision' THEN EXISTS (
        SELECT 1 FROM public.user_decisions WHERE id = v_source_id AND user_id = p_user_id
      )
      WHEN 'decision_case' THEN EXISTS (
        SELECT 1 FROM public.decision_cases WHERE id = v_source_id AND user_id = p_user_id
      )
      WHEN 'mission' THEN EXISTS (
        SELECT 1 FROM public.leader_missions lm
        LEFT JOIN public.leaders l ON l.id = lm.leader_id
        WHERE lm.id = v_source_id AND (lm.leader_id = p_user_id OR l.user_id = p_user_id)
      )
      WHEN 'check_in' THEN EXISTS (
        SELECT 1 FROM public.leader_check_ins lci
        LEFT JOIN public.leaders l ON l.id = lci.leader_id
        WHERE lci.id = v_source_id AND (lci.leader_id = p_user_id OR l.user_id = p_user_id)
      ) OR EXISTS (
        SELECT 1 FROM public.blind_spot_experiments bse
        WHERE bse.id = v_source_id AND bse.user_id = p_user_id AND bse.outcome = 'positive'
      )
      ELSE false
    END;

    IF NOT v_source_owned THEN
      RAISE EXCEPTION 'Evidence source is not owned by the confirming user';
    END IF;

    INSERT INTO public.blind_spot_evidence_links (
      user_id,
      pattern_id,
      source_kind,
      source_id,
      source_snapshot,
      observed_at,
      role
    ) VALUES (
      p_user_id,
      v_pattern_id,
      v_anchor->>'sourceKind',
      v_source_id,
      jsonb_build_object(
        'label', v_anchor->>'label',
        'excerpt', v_anchor->>'excerpt'
      ),
      (v_anchor->>'observedAt')::timestamptz,
      v_anchor->>'role'
    )
    ON CONFLICT (pattern_id, source_kind, source_id, role) DO NOTHING;
  END LOOP;

  SELECT bse.id INTO v_experiment_id
  FROM public.blind_spot_experiments bse
  WHERE bse.pattern_id = v_pattern_id AND bse.status = 'active'
  LIMIT 1;

  IF v_experiment_id IS NULL THEN
    INSERT INTO public.blind_spot_experiments (
      user_id,
      pattern_id,
      title,
      instruction,
      check_in_prompt,
      duration_minutes,
      due_at,
      expires_at
    ) VALUES (
      p_user_id,
      v_pattern_id,
      left(btrim(p_experiment->>'title'), 80),
      left(btrim(p_experiment->>'instruction'), 240),
      left(btrim(p_experiment->>'checkInPrompt'), 180),
      least(15, greatest(5, coalesce((p_experiment->>'durationMinutes')::integer, 15))),
      now() + interval '24 hours',
      now() + interval '14 days'
    ) RETURNING id INTO v_experiment_id;
  END IF;

  RETURN QUERY SELECT v_pattern_id, v_experiment_id, v_created;
END;
$$;


ALTER FUNCTION "public"."confirm_blind_spot_candidate_v2"("p_user_id" "uuid", "p_pattern_text" "text", "p_explanation" "text", "p_anchor_fingerprint" "text", "p_evidence_strength" "jsonb", "p_anchors" "jsonb", "p_experiment" "jsonb", "p_idempotency_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_text" "text", "p_evidence_count" integer, "p_confidence" numeric) RETURNS TABLE("pattern_id" "uuid", "created" boolean)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_pattern_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      p_user_id::TEXT || '|blindspot|' || lower(btrim(p_pattern_text)),
      0
    )
  );

  SELECT id
  INTO v_pattern_id
  FROM public.user_patterns
  WHERE user_id = p_user_id
    AND pattern_type = 'blindspot'
    AND lower(btrim(pattern_text)) = lower(btrim(p_pattern_text))
  ORDER BY created_at ASC, id ASC
  LIMIT 1;

  IF v_pattern_id IS NOT NULL THEN
    UPDATE public.user_patterns
    SET evidence_count = GREATEST(COALESCE(evidence_count, 0), GREATEST(p_evidence_count, 2)),
        confidence = GREATEST(COALESCE(confidence, 0), LEAST(1, GREATEST(0, p_confidence))),
        status = 'confirmed',
        last_confirmed_at = now()
    WHERE id = v_pattern_id
      AND user_id = p_user_id;

    RETURN QUERY SELECT v_pattern_id, false;
    RETURN;
  END IF;

  INSERT INTO public.user_patterns (
    user_id,
    pattern_type,
    pattern_text,
    evidence_count,
    confidence,
    status,
    last_confirmed_at
  )
  VALUES (
    p_user_id,
    'blindspot',
    btrim(p_pattern_text),
    GREATEST(p_evidence_count, 2),
    LEAST(1, GREATEST(0, p_confidence)),
    'confirmed',
    now()
  )
  RETURNING id INTO v_pattern_id;

  RETURN QUERY SELECT v_pattern_id, true;
END;
$$;


ALTER FUNCTION "public"."confirm_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_text" "text", "p_evidence_count" integer, "p_confidence" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_kit_skill"("p_redemption_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  UPDATE public.kit_redemptions
  SET skills_used = skills_used + 1
  WHERE id = p_redemption_id AND skills_used < skill_quota
  RETURNING true INTO v_ok;
  RETURN COALESCE(v_ok, false);
END;
$$;


ALTER FUNCTION "public"."consume_kit_skill"("p_redemption_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."export_user_memory"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(m))
    FROM (
      SELECT 
        id,
        fact_key,
        fact_category,
        fact_label,
        fact_value,
        fact_context,
        confidence_score,
        verification_status,
        source_type,
        created_at,
        updated_at
      FROM public.user_memory
      WHERE user_id = p_user_id
        AND is_current = true
      ORDER BY created_at DESC
    ) m
  );
END;
$$;


ALTER FUNCTION "public"."export_user_memory"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fix_memory_fact"("p_fact_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_fact_key TEXT;
  v_fact_label TEXT;
  v_prior_value TEXT;
BEGIN
  SELECT user_id, fact_key, fact_label, fact_value
    INTO v_user_id, v_fact_key, v_fact_label, v_prior_value
  FROM public.user_memory WHERE id = p_fact_id;

  IF v_user_id IS NULL OR v_user_id <> auth.uid() THEN
    RETURN false;
  END IF;

  UPDATE public.user_memory
  SET verification_status = 'disputed',
      is_current = false
  WHERE id = p_fact_id
    AND user_id = auth.uid();

  UPDATE public.memory_edges
  SET is_active = false
  WHERE user_id = auth.uid()
    AND (from_fact_id = p_fact_id OR to_fact_id = p_fact_id);

  INSERT INTO public.memory_events (user_id, fact_id, kind, payload)
  VALUES (v_user_id, p_fact_id, 'user_disputed', jsonb_build_object(
    'fact_key', v_fact_key,
    'fact_label', v_fact_label,
    'prior_value', v_prior_value
  ));

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."fix_memory_fact"("p_fact_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_referral_code"("p_assessment_id" "uuid", "p_email" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_code TEXT;
  v_timestamp TEXT;
  v_hash TEXT;
BEGIN
  -- Create timestamp component
  v_timestamp := EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Create hash from assessment + email + timestamp
  v_hash := encode(
    digest(p_assessment_id::TEXT || p_email || v_timestamp, 'sha256'),
    'base64'
  );
  
  -- Take first 12 characters and make URL-safe
  v_code := UPPER(
    substring(
      regexp_replace(v_hash, '[+/=]', '', 'g'),
      1, 12
    )
  );
  
  RETURN v_code;
END;
$$;


ALTER FUNCTION "public"."generate_referral_code"("p_assessment_id" "uuid", "p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_intake_for_registration"("intake_uuid" "uuid") RETURNS TABLE("id" "uuid", "company_name" "text", "organizer_name" "text", "industry" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ei.id,
    ei.company_name,
    ei.organizer_name,
    ei.industry,
    ei.created_at
  FROM exec_intakes ei
  WHERE ei.id = intake_uuid;
END;
$$;


ALTER FUNCTION "public"."get_intake_for_registration"("intake_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_intake_for_registration"("intake_uuid" "uuid") IS 'Allows public access to minimal intake data for registration flow. Returns only non-sensitive fields needed for participant registration.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."user_memory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "fact_key" "text" NOT NULL,
    "fact_category" "public"."fact_category" NOT NULL,
    "fact_label" "text" NOT NULL,
    "fact_value" "text" NOT NULL,
    "fact_context" "text",
    "confidence_score" numeric(3,2) DEFAULT 0.5,
    "is_high_stakes" boolean DEFAULT false,
    "verification_status" "public"."verification_status" DEFAULT 'inferred'::"public"."verification_status",
    "verified_at" timestamp with time zone,
    "source_type" "public"."memory_source_type" DEFAULT 'voice'::"public"."memory_source_type" NOT NULL,
    "source_session_id" "uuid",
    "source_transcript_id" "uuid",
    "is_current" boolean DEFAULT true,
    "superseded_by" "uuid",
    "supersedes" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "temperature" "text" DEFAULT 'warm'::"text",
    "last_referenced_at" timestamp with time zone DEFAULT "now"(),
    "reference_count" integer DEFAULT 0,
    "archived_at" timestamp with time zone,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "embedding" "public"."vector"(1536),
    "fact_subtype" "text",
    "training_material_version" integer DEFAULT 0,
    "content_changed_at" timestamp with time zone DEFAULT "now"(),
    "encrypted_content" "text",
    "encryption_version" integer DEFAULT 1,
    "importance" smallint,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "retention_expires_at" timestamp with time zone,
    CONSTRAINT "user_memory_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric))),
    CONSTRAINT "user_memory_importance_check" CHECK ((("importance" IS NULL) OR (("importance" >= 1) AND ("importance" <= 10)))),
    CONSTRAINT "user_memory_temperature_check" CHECK (("temperature" = ANY (ARRAY['hot'::"text", 'warm'::"text", 'cold'::"text"])))
);


ALTER TABLE "public"."user_memory" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_memory" IS 'Stores extracted facts about users from voice conversations with confidence scoring and verification status';



COMMENT ON COLUMN "public"."user_memory"."fact_subtype" IS 'For fact_category=preference: one of communication_style | decision_style | work_style | tool_or_method. Null for other categories.';



COMMENT ON COLUMN "public"."user_memory"."retention_expires_at" IS 'When this fact becomes eligible for retention cleanup. NULL means keep for the life of the account.';



CREATE OR REPLACE FUNCTION "public"."get_memory_by_temperature"("p_user_id" "uuid", "p_temperature" "text") RETURNS SETOF "public"."user_memory"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_memory
  WHERE user_id = p_user_id
    AND temperature = p_temperature
    AND archived_at IS NULL
    AND is_current = true
    AND (valid_until IS NULL OR valid_until > now())
  ORDER BY importance DESC NULLS LAST, last_referenced_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_memory_by_temperature"("p_user_id" "uuid", "p_temperature" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_memory_sweep_batch"("p_limit" integer DEFAULT 25) RETURNS TABLE("user_id" "uuid", "last_fact_change" timestamp with time zone, "last_synth" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select um.user_id,
         max(um.content_changed_at) as last_fact_change,   -- touch-immune signal
         b.last_synthesized_at      as last_synth
  from user_memory um
  left join user_memory_budget b on b.user_id = um.user_id
  where um.is_current = true and um.archived_at is null
  group by um.user_id, b.last_synthesized_at
  order by b.last_synthesized_at asc nulls first
  limit p_limit;
$$;


ALTER FUNCTION "public"."get_memory_sweep_batch"("p_limit" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_memory_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "store_memory_enabled" boolean DEFAULT true,
    "store_voice_transcripts" boolean DEFAULT true,
    "auto_summarize_enabled" boolean DEFAULT true,
    "retention_days" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_memory_settings_retention_days_check" CHECK ((("retention_days" IS NULL) OR ("retention_days" = ANY (ARRAY[30, 90]))))
);


ALTER TABLE "public"."user_memory_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_memory_settings" IS 'User preferences for memory storage, retention, and privacy controls';



CREATE OR REPLACE FUNCTION "public"."get_or_create_memory_settings"("p_user_id" "uuid") RETURNS "public"."user_memory_settings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_settings public.user_memory_settings;
BEGIN
  SELECT * INTO v_settings
  FROM public.user_memory_settings
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_memory_settings (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_settings;
  END IF;
  
  RETURN v_settings;
END;
$$;


ALTER FUNCTION "public"."get_or_create_memory_settings"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_profile"("p_email" "text", "p_name" "text" DEFAULT NULL::"text", "p_role" "text" DEFAULT NULL::"text", "p_company" "text" DEFAULT NULL::"text", "p_source_tool" "text" DEFAULT 'teams'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.unified_profiles
  WHERE email = p_email;
  
  IF v_profile_id IS NULL THEN
    INSERT INTO public.unified_profiles (email, name, role, company, source_tool)
    VALUES (p_email, p_name, p_role, p_company, p_source_tool)
    RETURNING id INTO v_profile_id;
  ELSE
    UPDATE public.unified_profiles
    SET 
      last_active_at = NOW(),
      total_interactions = total_interactions + 1,
      name = COALESCE(p_name, name),
      role = COALESCE(p_role, role),
      company = COALESCE(p_company, company)
    WHERE id = v_profile_id;
  END IF;
  
  RETURN v_profile_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_profile"("p_email" "text", "p_name" "text", "p_role" "text", "p_company" "text", "p_source_tool" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_verifications"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "fact_key" "text", "fact_category" "public"."fact_category", "fact_label" "text", "fact_value" "text", "fact_context" "text", "confidence_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id,
    um.fact_key,
    um.fact_category,
    um.fact_label,
    um.fact_value,
    um.fact_context,
    um.confidence_score
  FROM public.user_memory um
  WHERE um.user_id = p_user_id
    AND um.is_current = true
    AND um.verification_status = 'inferred'
  ORDER BY um.is_high_stakes DESC, um.confidence_score DESC
  LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."get_pending_verifications"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_share_card"("p_id" "uuid") RETURNS TABLE("archetype_title" "text", "archetype_variant" character, "q1_week_needs_me" integer, "q2_extra_self" "text", "q3_company_ai" integer, "q4_company_future" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    archetype_title,
    archetype_variant,
    q1_week_needs_me,
    q2_extra_self,
    q3_company_ai,
    q4_company_future
  from public.cannes_responses
  where id = p_id;
$$;


ALTER FUNCTION "public"."get_share_card"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_track_record"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("decision_id" "uuid", "statement" "text", "status" "text", "decision_kind" "text", "decided_at" timestamp with time zone, "resolution" "text", "played_out" "text", "process_quality" smallint, "breakpoint_call" "text", "breakpoint_verdict" "text", "importance_adjustments" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  -- An authed user may only read their own; service-role (auth.uid() null) may pass any id.
  IF auth.uid() IS NOT NULL AND v_user <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.statement,
    dc.status,
    dc.decision_kind,
    dc.updated_at,
    o.resolution,
    o.played_out,
    o.process_quality,
    uc.call,
    bp.verdict,
    COALESCE(adj.cnt, 0)::INT
  FROM decision_cases dc
  LEFT JOIN LATERAL (
    SELECT * FROM decision_outcomes d
    WHERE d.decision_case_id = dc.id ORDER BY d.judged_at DESC LIMIT 1
  ) o ON true
  LEFT JOIN decision_claims bp ON bp.id = dc.breakpoint_assumption_id
  LEFT JOIN LATERAL (
    SELECT c.call FROM decision_user_calls c
    WHERE c.decision_case_id = dc.id AND c.claim_id = dc.breakpoint_assumption_id
    ORDER BY c.created_at DESC LIMIT 1
  ) uc ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt FROM memory_events me
    WHERE me.kind = 'importance_adjusted' AND me.payload->>'decision_case_id' = dc.id::text
  ) adj ON true
  WHERE dc.user_id = v_user
  ORDER BY dc.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_track_record"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_memory_context"("p_user_id" "uuid") RETURNS TABLE("fact_key" "text", "fact_category" "public"."fact_category", "fact_label" "text", "fact_value" "text", "confidence_score" numeric, "verification_status" "public"."verification_status")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.fact_key,
    um.fact_category,
    um.fact_label,
    um.fact_value,
    um.confidence_score,
    um.verification_status
  FROM public.user_memory um
  WHERE um.user_id = p_user_id
    AND um.is_current = true
    AND (
      um.verification_status IN ('verified', 'corrected')
      OR um.confidence_score >= 0.7
    )
  ORDER BY 
    CASE um.verification_status 
      WHEN 'verified' THEN 1 
      WHEN 'corrected' THEN 2 
      ELSE 3 
    END,
    um.fact_category,
    um.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_memory_context"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_base_username text;
  v_username text;
  v_counter int := 0;
BEGIN
  -- Get base username from metadata or email
  v_base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Ensure it meets constraints (alphanumeric + underscore, 3-20 chars)
  v_base_username := regexp_replace(v_base_username, '[^a-zA-Z0-9_]', '_', 'g');
  v_base_username := substring(v_base_username, 1, 15); -- Leave room for suffix
  
  -- If too short, pad it
  IF length(v_base_username) < 3 THEN
    v_base_username := v_base_username || '_user';
  END IF;
  
  v_username := v_base_username;
  
  -- Handle collisions by appending a number
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := v_base_username || '_' || v_counter;
  END LOOP;
  
  -- Insert profile with collision-safe username
  INSERT INTO public.profiles (id, username, display_name, email)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'username',
      v_base_username
    ),
    NEW.email
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error in handle_new_user_profile: %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT exists (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hash_company_identifier"("email_domain" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  active_salt TEXT;
  normalized_domain TEXT;
BEGIN
  SELECT salt_value INTO active_salt
  FROM public.company_identifier_salt
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  normalized_domain := LOWER(TRIM(email_domain));
  
  RETURN encode(
    digest(active_salt || normalized_domain, 'sha256'),
    'hex'
  );
END;
$$;


ALTER FUNCTION "public"."hash_company_identifier"("email_domain" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_automator_usage"("p_user_id" "uuid", "p_month" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ DECLARE new_used INT; BEGIN INSERT INTO automator_usage (user_id, month, exports_used, updated_at) VALUES (p_user_id, p_month, 1, now()) ON CONFLICT (user_id, month) DO UPDATE SET exports_used = automator_usage.exports_used + 1, updated_at = now() RETURNING exports_used INTO new_used; RETURN new_used; END; $$;


ALTER FUNCTION "public"."increment_automator_usage"("p_user_id" "uuid", "p_month" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lineage_of"("p_root_id" "uuid", "p_max_depth" integer DEFAULT 5) RETURNS TABLE("depth" integer, "from_type" "text", "from_id" "uuid", "to_type" "text", "to_id" "uuid", "edge_type" "text", "weight" numeric)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  WITH RECURSIVE walk AS (
    SELECT 1 AS depth, ml.from_type, ml.from_id, ml.to_type, ml.to_id, ml.edge_type, ml.weight
    FROM memory_links ml
    WHERE ml.from_id = p_root_id
    UNION ALL
    SELECT w.depth + 1, ml.from_type, ml.from_id, ml.to_type, ml.to_id, ml.edge_type, ml.weight
    FROM memory_links ml
    JOIN walk w ON ml.from_id = w.to_id
    WHERE w.depth < p_max_depth
  )
  SELECT depth, from_type, from_id, to_type, to_id, edge_type, weight FROM walk;
$$;


ALTER FUNCTION "public"."lineage_of"("p_root_id" "uuid", "p_max_depth" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_mcp_tokens"() RETURNS TABLE("id" "uuid", "token_prefix" "text", "label" "text", "scopes" "text"[], "created_at" timestamp with time zone, "last_used_at" timestamp with time zone, "revoked_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id, token_prefix, label, scopes, created_at, last_used_at, revoked_at
  FROM public.mcp_tokens
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC;
$$;


ALTER FUNCTION "public"."list_mcp_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_booking_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    action,
    resource_type,
    resource_id,
    user_id,
    details
  ) VALUES (
    TG_OP,
    'booking_request',
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object(
      'contact_email', COALESCE(NEW.contact_email, OLD.contact_email),
      'service_type', COALESCE(NEW.service_type, OLD.service_type),
      'timestamp', now()
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_booking_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_consent_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.consent_flags IS DISTINCT FROM NEW.consent_flags THEN
    INSERT INTO public.consent_audit (
      participant_id,
      user_id,
      consent_purpose,
      previous_value,
      new_value,
      changed_by
    )
    SELECT 
      NEW.id,
      NEW.user_id,
      purpose::public.consent_purpose,
      (OLD.consent_flags->>purpose)::boolean,
      (NEW.consent_flags->>purpose)::boolean,
      'user'
    FROM jsonb_object_keys(NEW.consent_flags) AS purpose
    WHERE (OLD.consent_flags->>purpose)::boolean IS DISTINCT FROM (NEW.consent_flags->>purpose)::boolean;
    
    NEW.consent_updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_consent_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_user_memory"("query_embedding" "public"."vector", "match_count" integer DEFAULT 10, "user_uuid" "uuid" DEFAULT NULL::"uuid", "min_similarity" double precision DEFAULT 0.5) RETURNS TABLE("id" "uuid", "fact_category" "text", "fact_label" "text", "fact_value" "text", "temperature" "text", "confidence_score" double precision, "similarity" double precision)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT
    um.id,
    um.fact_category,
    um.fact_label,
    um.fact_value,
    um.temperature,
    um.confidence_score::float,
    1 - (um.embedding <=> query_embedding) as similarity
  FROM public.user_memory um
  WHERE
    um.user_id = user_uuid
    AND um.is_current = true
    AND um.archived_at IS NULL
    AND um.embedding IS NOT NULL
    AND (1 - (um.embedding <=> query_embedding)) >= min_similarity
  ORDER BY um.embedding <=> query_embedding
  LIMIT match_count;
$$;


ALTER FUNCTION "public"."match_user_memory"("query_embedding" "public"."vector", "match_count" integer, "user_uuid" "uuid", "min_similarity" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mindmake_brief_rpc"("p_operation" "text", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  select private.mindmake_brief_rpc(p_operation, p_payload);
$$;


ALTER FUNCTION "public"."mindmake_brief_rpc"("p_operation" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mindmake_consume_personal_read_rate"("p_ip_hash" "text", "p_email_hash" "text") RETURNS boolean
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  select private.mindmake_consume_personal_read_rate(p_ip_hash, p_email_hash, now());
$$;


ALTER FUNCTION "public"."mindmake_consume_personal_read_rate"("p_ip_hash" "text", "p_email_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mindmake_purge_follow_ups"() RETURNS TABLE("sent_deleted" integer, "stale_deleted" integer, "rate_events_deleted" integer, "reads_deleted" integer)
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  select * from private.mindmake_purge_follow_ups();
$$;


ALTER FUNCTION "public"."mindmake_purge_follow_ups"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mint_mcp_token"("p_label" "text" DEFAULT NULL::"text", "p_include_briefing" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plain text; v_hash text; v_prefix text; v_id uuid;
  v_scopes text[] := CASE WHEN p_include_briefing THEN ARRAY['read','briefing'] ELSE ARRAY['read'] END;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF (SELECT count(*) FROM public.mcp_tokens WHERE user_id = v_uid AND revoked_at IS NULL) >= 10 THEN
    RAISE EXCEPTION 'token limit reached (revoke an existing token first)';
  END IF;
  v_plain := 'ctrl_mcp_' || encode(gen_random_bytes(24), 'hex');
  v_hash := encode(digest(v_plain, 'sha256'), 'hex');
  v_prefix := left(v_plain, 17);
  INSERT INTO public.mcp_tokens(user_id, token_hash, token_prefix, label, scopes)
  VALUES (v_uid, v_hash, v_prefix, NULLIF(trim(coalesce(p_label, '')), ''), v_scopes)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'token', v_plain, 'prefix', v_prefix, 'label', p_label, 'scopes', v_scopes);
END;
$$;


ALTER FUNCTION "public"."mint_mcp_token"("p_label" "text", "p_include_briefing" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ns_brain_min_facts"() RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$select 5$$;


ALTER FUNCTION "public"."ns_brain_min_facts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pin_decision"("p_case_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user uuid;
begin
  select user_id into v_user from decision_cases where id = p_case_id;
  if v_user is null or v_user <> auth.uid() then
    raise exception 'not allowed';
  end if;
  update decision_cases
    set pinned_at = null
    where user_id = v_user and pinned_at is not null and id <> p_case_id;
  update decision_cases
    set pinned_at = now()
    where id = p_case_id;
end;
$$;


ALTER FUNCTION "public"."pin_decision"("p_case_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_pending_sync_logs"() RETURNS TABLE("processed_count" integer, "success_count" integer, "error_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  supabase_url text;
  pending_log record;
  http_response text;
  total_processed integer := 0;
  total_success integer := 0;
  total_errors integer := 0;
BEGIN
  supabase_url := 'https://bkyuxvschuwngtcdhsyg.supabase.co';
  
  -- Process each pending sync log
  FOR pending_log IN 
    SELECT id, sync_type, sync_data, sync_metadata 
    FROM public.google_sheets_sync_log 
    WHERE status = 'pending' 
    ORDER BY created_at ASC
    LIMIT 50  -- Process in batches
  LOOP
    total_processed := total_processed + 1;
    
    BEGIN
      -- Make HTTP call to Edge Function
      SELECT INTO http_response
        net.http_post(
          url := supabase_url || '/functions/v1/sync-to-google-sheets',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'type', pending_log.sync_type,
            'trigger_type', 'batch_processing',
            'sync_log_id', pending_log.id,
            'data', pending_log.sync_data
          )
        );
      
      -- Update log as http_sent
      UPDATE public.google_sheets_sync_log
      SET 
        status = 'http_sent',
        last_updated_at = now(),
        sync_metadata = sync_metadata || jsonb_build_object(
          'batch_processed_at', now(),
          'http_response', http_response
        )
      WHERE id = pending_log.id;
      
      total_success := total_success + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Update log as failed but continue processing others
      UPDATE public.google_sheets_sync_log
      SET 
        status = 'batch_failed',
        error_message = SQLERRM,
        last_updated_at = now(),
        sync_metadata = sync_metadata || jsonb_build_object(
          'batch_error_at', now(),
          'batch_error_details', SQLERRM
        )
      WHERE id = pending_log.id;
      
      total_errors := total_errors + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT total_processed, total_success, total_errors;
END;
$$;


ALTER FUNCTION "public"."process_pending_sync_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_blind_spot_experiment_outcome"("p_user_id" "uuid", "p_experiment_id" "uuid", "p_outcome" "text", "p_note" "text" DEFAULT NULL::"text") RETURNS TABLE("experiment_id" "uuid", "status" "text", "outcome" "text", "due_at" timestamp with time zone, "defer_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_experiment public.blind_spot_experiments%ROWTYPE;
BEGIN
  IF p_outcome NOT IN ('positive', 'not_really', 'not_yet') THEN
    RAISE EXCEPTION 'Invalid experiment outcome';
  END IF;

  SELECT * INTO v_experiment
  FROM public.blind_spot_experiments
  WHERE id = p_experiment_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_experiment.id IS NULL THEN
    RAISE EXCEPTION 'Experiment not found';
  END IF;
  IF v_experiment.status <> 'active' THEN
    RETURN QUERY SELECT v_experiment.id, v_experiment.status, v_experiment.outcome,
      v_experiment.due_at, v_experiment.defer_count;
    RETURN;
  END IF;
  IF v_experiment.expires_at <= now() THEN
    UPDATE public.blind_spot_experiments
    SET status = 'expired', updated_at = now()
    WHERE id = v_experiment.id;
  ELSIF p_outcome = 'not_yet' AND v_experiment.defer_count = 0 THEN
    UPDATE public.blind_spot_experiments
    SET outcome = 'not_yet', defer_count = 1, due_at = least(now() + interval '48 hours', expires_at),
        user_note = left(nullif(btrim(p_note), ''), 500), updated_at = now()
    WHERE id = v_experiment.id;
  ELSIF p_outcome = 'not_yet' THEN
    RAISE EXCEPTION 'Experiment has already been deferred once';
  ELSE
    UPDATE public.blind_spot_experiments
    SET status = 'completed', outcome = p_outcome,
        user_note = left(nullif(btrim(p_note), ''), 500), completed_at = now(), updated_at = now()
    WHERE id = v_experiment.id;
  END IF;

  RETURN QUERY
  SELECT bse.id, bse.status, bse.outcome, bse.due_at, bse.defer_count
  FROM public.blind_spot_experiments bse
  WHERE bse.id = v_experiment.id;
END;
$$;


ALTER FUNCTION "public"."record_blind_spot_experiment_outcome"("p_user_id" "uuid", "p_experiment_id" "uuid", "p_outcome" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_decision_outcome"("p_decision_case_id" "uuid", "p_resolution" "text" DEFAULT NULL::"text", "p_played_out" "text" DEFAULT NULL::"text", "p_process_quality" smallint DEFAULT NULL::smallint, "p_note" "text" DEFAULT NULL::"text", "p_source" "text" DEFAULT 'thumbs'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user UUID := auth.uid();
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM decision_cases WHERE id = p_decision_case_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'decision not found for this user';
  END IF;

  INSERT INTO decision_outcomes (user_id, decision_case_id, resolution, played_out, process_quality, outcome_note, source)
  VALUES (v_user, p_decision_case_id, p_resolution, p_played_out, p_process_quality, p_note, p_source)
  RETURNING id INTO v_id;

  -- Sharpen the brain on the spot (instant feedback, not just nightly).
  PERFORM apply_outcome_to_brain(v_id);
  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."record_decision_outcome"("p_decision_case_id" "uuid", "p_resolution" "text", "p_played_out" "text", "p_process_quality" smallint, "p_note" "text", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_kit_code"("p_code" "text", "p_user_id" "uuid", "p_preset_version" "text") RETURNS TABLE("result" "text", "redemption_id" "uuid", "class_slug" "text", "preset_version" "text", "expires_at" timestamp with time zone, "skill_quota" integer, "skills_used" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_code public.kit_codes%ROWTYPE;
  v_redemption public.kit_redemptions%ROWTYPE;
BEGIN
  SELECT * INTO v_code
  FROM public.kit_codes
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND OR NOT v_code.is_active THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text, NULL::timestamptz, NULL::int, NULL::int;
    RETURN;
  END IF;

  IF v_code.starts_at IS NOT NULL AND now() < v_code.starts_at THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::uuid, NULL::text, NULL::text, NULL::timestamptz, NULL::int, NULL::int;
    RETURN;
  END IF;

  IF v_code.expires_at IS NOT NULL AND now() > v_code.expires_at THEN
    RETURN QUERY SELECT 'expired'::text, NULL::uuid, NULL::text, NULL::text, NULL::timestamptz, NULL::int, NULL::int;
    RETURN;
  END IF;

  -- Idempotent: re-scanning the QR returns the existing pass.
  SELECT * INTO v_redemption
  FROM public.kit_redemptions r
  WHERE r.code_id = v_code.id AND r.user_id = p_user_id;

  IF FOUND THEN
    RETURN QUERY SELECT 'ok'::text, v_redemption.id, v_redemption.class_slug,
      v_redemption.preset_version, v_redemption.expires_at,
      v_redemption.skill_quota, v_redemption.skills_used;
    RETURN;
  END IF;

  IF v_code.max_redemptions IS NOT NULL AND v_code.redemption_count >= v_code.max_redemptions THEN
    RETURN QUERY SELECT 'expired'::text, NULL::uuid, NULL::text, NULL::text, NULL::timestamptz, NULL::int, NULL::int;
    RETURN;
  END IF;

  INSERT INTO public.kit_redemptions (code_id, user_id, class_slug, preset_version, expires_at, skill_quota)
  VALUES (
    v_code.id,
    p_user_id,
    v_code.class_slug,
    p_preset_version,
    now() + make_interval(days => v_code.pass_days),
    v_code.skill_quota
  )
  RETURNING * INTO v_redemption;

  UPDATE public.kit_codes
  SET redemption_count = redemption_count + 1
  WHERE id = v_code.id;

  RETURN QUERY SELECT 'ok'::text, v_redemption.id, v_redemption.class_slug,
    v_redemption.preset_version, v_redemption.expires_at,
    v_redemption.skill_quota, v_redemption.skills_used;
END;
$$;


ALTER FUNCTION "public"."redeem_kit_code"("p_code" "text", "p_user_id" "uuid", "p_preset_version" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_decision"("p_decision_case_id" "uuid", "p_played_out" "text" DEFAULT NULL::"text", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user UUID := auth.uid();
  v_id UUID;
  v_statement TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  SELECT statement INTO v_statement
  FROM decision_cases WHERE id = p_decision_case_id AND user_id = v_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'decision not found for this user';
  END IF;

  INSERT INTO decision_outcomes (user_id, decision_case_id, resolution, played_out, process_quality, outcome_note, source)
  VALUES (v_user, p_decision_case_id, NULL, p_played_out, NULL, p_note, 'resolve')
  RETURNING id INTO v_id;

  UPDATE decision_cases
  SET status = 'decided', pinned_at = NULL, updated_at = now()
  WHERE id = p_decision_case_id AND user_id = v_user;

  -- Archive the leader's other ACTIVE runs of this same decision so the close sticks.
  UPDATE decision_cases
  SET status = 'archived', pinned_at = NULL, updated_at = now()
  WHERE user_id = v_user
    AND id <> p_decision_case_id
    AND status = 'active'
    AND lower(regexp_replace(statement, '\s+', ' ', 'g'))
        = lower(regexp_replace(v_statement, '\s+', ' ', 'g'));

  -- Best-effort brain sharpening: never let the harvest block the close.
  BEGIN
    PERFORM apply_outcome_to_brain(v_id);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."resolve_decision"("p_decision_case_id" "uuid", "p_played_out" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_mcp_token"("p_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.mcp_tokens SET revoked_at = now()
  WHERE id = p_id AND user_id = v_uid AND revoked_at IS NULL;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."revoke_mcp_token"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."round_percentile"("raw_percentile" numeric, "rounding" integer DEFAULT 5) RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (ROUND(raw_percentile / rounding) * rounding)::INTEGER;
END;
$$;


ALTER FUNCTION "public"."round_percentile"("raw_percentile" numeric, "rounding" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_brain_adapt"("p_limit" integer DEFAULT 200) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  r RECORD;
  total INT := 0;
BEGIN
  PERFORM sync_decision_lineage();  -- keep lineage current before crediting
  FOR r IN
    SELECT id FROM decision_outcomes
    WHERE applied_to_brain = false
    ORDER BY judged_at
    LIMIT p_limit
  LOOP
    PERFORM apply_outcome_to_brain(r.id);
    total := total + 1;
  END LOOP;
  RETURN total;
END;
$$;


ALTER FUNCTION "public"."run_brain_adapt"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."schedule_sync_processing"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- This function can be called by a cron job or scheduler
  -- It triggers the Google Sheets sync function for any pending syncs
  
  -- Log the scheduled sync attempt
  INSERT INTO public.google_sheets_sync_log (
    sync_type,
    status,
    sync_metadata
  ) VALUES (
    'scheduled_batch',
    'pending',
    jsonb_build_object(
      'triggered_by', 'scheduler',
      'trigger_time', now()
    )
  );
  
  -- In a production environment, this would make an HTTP call to the sync function
  -- For now, we'll just log that it should be triggered
  RAISE NOTICE 'Scheduled sync processing should trigger google-sheets-sync function';
END;
$$;


ALTER FUNCTION "public"."schedule_sync_processing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_memory_retention_expiration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_retention_days INTEGER;
BEGIN
  SELECT retention_days INTO v_retention_days
  FROM public.user_memory_settings
  WHERE user_id = NEW.user_id;
  
  IF v_retention_days IS NOT NULL THEN
    NEW.retention_expires_at = NEW.created_at + (v_retention_days || ' days')::INTERVAL;
  ELSE
    NEW.retention_expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_memory_retention_expiration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."snapshot_north_star"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into north_star_daily (day, flywheel_users, brain_rich_users, active_deciders, weekly_active_users, computed_at)
  select current_date, flywheel_users, brain_rich_users, active_deciders, weekly_active_users, now()
  from north_star_flywheel
  on conflict (day) do update set
    flywheel_users = excluded.flywheel_users,
    brain_rich_users = excluded.brain_rich_users,
    active_deciders = excluded.active_deciders,
    weekly_active_users = excluded.weekly_active_users,
    computed_at = now();
end;
$$;


ALTER FUNCTION "public"."snapshot_north_star"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sp_aggregate_briefing_feedback"("window_days" integer DEFAULT 30, "promote_threshold" integer DEFAULT 3) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  scanned_rows integer := 0;
  bucket_count integer := 0;
  promoted_count integer := 0;
  touched_users integer := 0;
  since_ts timestamptz;
BEGIN
  since_ts := now() - make_interval(days => window_days);

  WITH v2_briefings AS (
    SELECT
      b.id,
      b.user_id,
      b.context_snapshot->'lens' AS lens
    FROM briefings b
    WHERE b.context_snapshot IS NOT NULL
      AND jsonb_typeof(b.context_snapshot->'lens') = 'array'
  ),
  feedback_rows AS (
    SELECT f.lens_item_id, f.briefing_id
    FROM briefing_feedback f
    WHERE f.reaction = 'not_useful'
      AND f.lens_item_id IS NOT NULL
      AND f.created_at >= since_ts
  ),
  joined AS (
    SELECT
      b.user_id,
      li->>'type' AS lens_item_type,
      li->>'text' AS lens_item_text
    FROM feedback_rows f
    JOIN v2_briefings b ON b.id = f.briefing_id
    CROSS JOIN LATERAL jsonb_array_elements(b.lens) AS li
    WHERE li->>'id' = f.lens_item_id
      AND li->>'text' IS NOT NULL
      AND li->>'type' IS NOT NULL
  ),
  signature_counts AS (
    SELECT
      user_id,
      lens_item_type,
      lens_item_text,
      encode(digest(
        CASE
          WHEN lens_item_type = 'interest_beat'   THEN 'interest_beat'
          WHEN lens_item_type = 'interest_entity' THEN 'interest_entity'
          WHEN lens_item_type = 'watchlist'       THEN 'entity'
          WHEN lens_item_type = 'pattern'         THEN 'pattern'
          ELSE 'goal'
        END
        || '|'
        || regexp_replace(lower(btrim(lens_item_text)), '\s+', ' ', 'g'),
        'sha256'
      ), 'hex') AS signature,
      COUNT(*) AS cnt
    FROM joined
    GROUP BY user_id, lens_item_type, lens_item_text
  ),
  -- Pick the most-frequent (type, text) per (user, signature) so the stored
  -- row is stable even when the same logical signature appears with slight
  -- text variations (e.g. capitalisation drift).
  best_per_signature AS (
    SELECT DISTINCT ON (user_id, signature)
      user_id, signature, lens_item_type, lens_item_text, cnt
    FROM signature_counts
    ORDER BY user_id, signature, cnt DESC
  ),
  promoted_rows AS (
    INSERT INTO briefing_lens_feedback AS target
      (user_id, lens_item_signature, lens_item_type, lens_item_text,
       weight_delta, source, evidence_count, is_active, updated_at)
    SELECT
      user_id,
      signature,
      lens_item_type,
      lens_item_text,
      -0.4,
      'not_useful_aggregate',
      cnt,
      true,
      now()
    FROM best_per_signature
    WHERE cnt >= promote_threshold
    ON CONFLICT (user_id, lens_item_signature, source)
    DO UPDATE SET
      evidence_count = EXCLUDED.evidence_count,
      lens_item_text = EXCLUDED.lens_item_text,
      weight_delta = EXCLUDED.weight_delta,
      is_active = true,
      updated_at = now()
    RETURNING user_id
  )
  SELECT
    (SELECT COUNT(*) FROM joined),
    (SELECT COUNT(*) FROM best_per_signature),
    (SELECT COUNT(*) FROM promoted_rows),
    (SELECT COUNT(DISTINCT user_id) FROM promoted_rows)
  INTO scanned_rows, bucket_count, promoted_count, touched_users;

  RETURN jsonb_build_object(
    'scanned_feedback_rows', scanned_rows,
    'buckets', bucket_count,
    'promoted', promoted_count,
    'users_touched', touched_users,
    'window_days', window_days,
    'promote_threshold', promote_threshold,
    'run_at', now()
  );
END;
$$;


ALTER FUNCTION "public"."sp_aggregate_briefing_feedback"("window_days" integer, "promote_threshold" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sp_aggregate_briefing_feedback"("window_days" integer, "promote_threshold" integer) IS 'Promotes lens signatures with >= promote_threshold not_useful reactions in the last window_days to a -0.4 weight delta. Idempotent; safe to re-run.';



CREATE OR REPLACE FUNCTION "public"."strengthen_memory_fact"("p_fact_id" "uuid") RETURNS "public"."user_memory"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_row public.user_memory;
BEGIN
  UPDATE public.user_memory
  SET confidence_score = least(1, confidence_score + 0.15),
      verification_status = 'verified',
      verified_at = now()
  WHERE id = p_fact_id
    AND user_id = auth.uid()
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Fact not found or not owned by caller';
  END IF;

  RETURN v_row;
END;
$$;


ALTER FUNCTION "public"."strengthen_memory_fact"("p_fact_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_contest"("p_kind" "text", "p_target_type" "text" DEFAULT NULL::"text", "p_target_id" "uuid" DEFAULT NULL::"uuid", "p_surface" "text" DEFAULT NULL::"text", "p_element" "text" DEFAULT NULL::"text", "p_note" "text" DEFAULT NULL::"text", "p_context" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_report_id uuid;
  v_honored boolean := false;
  v_claim public.decision_claims%ROWTYPE;
  v_evidence_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_kind NOT IN ('visual','functional','factual') THEN
    RAISE EXCEPTION 'invalid contest kind: %', p_kind;
  END IF;

  INSERT INTO public.contest_reports(user_id, kind, target_type, target_id, surface, element, note, context)
  VALUES (v_uid, p_kind, p_target_type, p_target_id, p_surface, p_element, p_note, COALESCE(p_context, '{}'::jsonb))
  RETURNING id INTO v_report_id;

  -- Factual contest on the user's OWN decision claim => honor live + feed the brain.
  IF p_kind = 'factual' AND p_target_type = 'decision_claim' AND p_target_id IS NOT NULL THEN
    SELECT * INTO v_claim FROM public.decision_claims WHERE id = p_target_id AND user_id = v_uid;
    IF FOUND THEN
      -- (1) the leader's overrule, recorded as a HIGH-AUTHORITY refutation
      INSERT INTO public.decision_evidence(claim_id, user_id, source_type, source_title, excerpt, stance, retriever, relevance_score)
      VALUES (v_claim.id, v_uid, 'user', 'Contested by the leader', p_note, 'refutes', 'user_contest', 1.0)
      RETURNING id INTO v_evidence_id;
      -- (2) honor it in the read: verdict -> contested, knock confidence down
      UPDATE public.decision_claims
        SET verdict = 'contested',
            confidence = LEAST(COALESCE(confidence, 0.5), 0.30),
            updated_at = now()
        WHERE id = v_claim.id;
      -- (3) immutable audit + a re-check signal (decision-watch re-verifies load-bearing claims;
      --     the alert resurfaces it and marks the loop "go re-verify this").
      INSERT INTO public.decision_events(decision_case_id, user_id, type, payload)
      VALUES (v_claim.decision_case_id, v_uid, 'contested_by_user',
              jsonb_build_object('claim_id', v_claim.id, 'note', p_note, 'contest_report_id', v_report_id));
      INSERT INTO public.decision_alerts(decision_case_id, user_id, claim_id, kind, headline, detail)
      VALUES (v_claim.decision_case_id, v_uid, v_claim.id, 'new_contradiction',
              'You flagged a claim - re-checking it against sources', left(COALESCE(p_note, ''), 280));
      v_honored := true;
      UPDATE public.contest_reports SET honored = true, status = 'honored' WHERE id = v_report_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'report_id', v_report_id,
    'honored', v_honored,
    'verdict', CASE WHEN v_honored THEN 'contested' ELSE NULL END,
    'evidence_id', v_evidence_id
  );
END;
$$;


ALTER FUNCTION "public"."submit_contest"("p_kind" "text", "p_target_type" "text", "p_target_id" "uuid", "p_surface" "text", "p_element" "text", "p_note" "text", "p_context" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_decision_lineage"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_before BIGINT;
  v_after BIGINT;
BEGIN
  SELECT count(*) INTO v_before FROM memory_links;

  -- decision -> memory (objective_fact_ids)
  INSERT INTO memory_links (user_id, from_type, from_id, to_type, to_id, edge_type, weight)
  SELECT dc.user_id, 'decision', dc.id, 'memory', fid, 'supported_by', 1.0
  FROM decision_cases dc, unnest(dc.objective_fact_ids) AS fid
  ON CONFLICT DO NOTHING;

  -- decision -> claim
  INSERT INTO memory_links (user_id, from_type, from_id, to_type, to_id, edge_type, weight)
  SELECT cl.user_id, 'decision', cl.decision_case_id, 'claim', cl.id, 'supported_by',
         CASE WHEN cl.is_load_bearing THEN 2.0 ELSE 1.0 END
  FROM decision_claims cl
  ON CONFLICT DO NOTHING;

  -- claim -> evidence
  INSERT INTO memory_links (user_id, from_type, from_id, to_type, to_id, edge_type, weight)
  SELECT ev.user_id, 'claim', ev.claim_id, 'evidence', ev.id, 'supported_by', 1.0
  FROM decision_evidence ev
  WHERE ev.claim_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  SELECT count(*) INTO v_after FROM memory_links;
  RETURN (v_after - v_before)::INT;  -- new edges added
END;
$$;


ALTER FUNCTION "public"."sync_decision_lineage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_lead_to_sheets"("lead_user_id" "uuid", "lead_session_id" "uuid" DEFAULT NULL::"uuid", "sync_type_param" "text" DEFAULT 'booking'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  sync_id uuid;
  lead_data jsonb := '{}';
  booking_data record;
  conversation_data record;
  qualification_data record;
BEGIN
  -- Get the most recent booking request for this session or user
  SELECT * INTO booking_data FROM public.booking_requests 
  WHERE (lead_session_id IS NOT NULL AND session_id = lead_session_id) 
     OR (lead_session_id IS NULL AND user_id = lead_user_id)
  ORDER BY created_at DESC LIMIT 1;
  
  -- Get conversation session data
  SELECT 
    cs.*,
    COUNT(cm.id) as message_count,
    MAX(cm.created_at) as last_message_at
  INTO conversation_data
  FROM public.conversation_sessions cs
  LEFT JOIN public.chat_messages cm ON cs.id = cm.session_id
  WHERE (lead_session_id IS NOT NULL AND cs.id = lead_session_id)
     OR (lead_session_id IS NULL AND cs.user_id = lead_user_id)
  GROUP BY cs.id
  ORDER BY cs.last_activity DESC
  LIMIT 1;
  
  -- Get lead qualification scores
  SELECT * INTO qualification_data FROM public.lead_qualification_scores 
  WHERE (lead_session_id IS NOT NULL AND session_id = lead_session_id)
     OR (lead_session_id IS NULL AND user_id = lead_user_id)
  ORDER BY created_at DESC LIMIT 1;
  
  -- Build comprehensive lead data JSON using actual booking data
  lead_data := jsonb_build_object(
    'contact_info', jsonb_build_object(
      'full_name', COALESCE(booking_data.contact_name, 'Unknown'),
      'email', COALESCE(booking_data.contact_email, 'Unknown'),
      'company_name', COALESCE(booking_data.company_name, 'Unknown'),
      'role', COALESCE(booking_data.role, 'Unknown'),
      'phone', booking_data.phone,
      'industry', 'Unknown', -- Will be extracted from assessment data
      'company_size', 'Unknown' -- Will be extracted from assessment data
    ),
    'business_context', jsonb_build_object(
      'ai_readiness_score', COALESCE(booking_data.lead_score, qualification_data.total_score, 0),
      'service_type', booking_data.service_type,
      'service_title', booking_data.service_title,
      'priority', booking_data.priority,
      'preferred_time', booking_data.preferred_time,
      'specific_needs', booking_data.specific_needs
    ),
    'assessment_data', CASE 
      WHEN booking_data.specific_needs IS NOT NULL AND 
           booking_data.specific_needs::text ~ 'Assessment data: ({.*})$' THEN
        substring(booking_data.specific_needs::text from 'Assessment data: ({.*})$')::jsonb
      ELSE '{}'::jsonb
    END,
    'engagement_data', jsonb_build_object(
      'session_count', 1,
      'total_messages', COALESCE(conversation_data.message_count, 0),
      'last_activity', COALESCE(conversation_data.last_activity, booking_data.created_at),
      'session_duration', CASE 
        WHEN conversation_data.completed_at IS NOT NULL AND conversation_data.started_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (conversation_data.completed_at - conversation_data.started_at))/60
        ELSE NULL
      END
    ),
    'qualification_scores', CASE 
      WHEN qualification_data.id IS NOT NULL THEN
        jsonb_build_object(
          'total_score', qualification_data.total_score,
          'engagement_score', qualification_data.engagement_score,
          'business_readiness_score', qualification_data.business_readiness_score,
          'pain_point_severity', qualification_data.pain_point_severity,
          'implementation_readiness', qualification_data.implementation_readiness
        )
      ELSE '{}'::jsonb
    END,
    'booking_request', jsonb_build_object(
      'id', booking_data.id,
      'service_type', booking_data.service_type,
      'service_title', booking_data.service_title,
      'status', booking_data.status,
      'priority', booking_data.priority,
      'preferred_time', booking_data.preferred_time,
      'specific_needs', booking_data.specific_needs,
      'requested_at', booking_data.created_at,
      'scheduled_date', booking_data.scheduled_date
    ),
    'sync_metadata', jsonb_build_object(
      'user_id', lead_user_id,
      'session_id', lead_session_id,
      'booking_id', booking_data.id,
      'sync_timestamp', now(),
      'data_sources', jsonb_build_array(
        CASE WHEN booking_data.id IS NOT NULL THEN 'booking_request' END,
        CASE WHEN conversation_data.id IS NOT NULL THEN 'conversation_data' END,
        CASE WHEN qualification_data.id IS NOT NULL THEN 'qualification_scores' END
      )
    )
  );
  
  -- Create sync log entry
  INSERT INTO public.google_sheets_sync_log (
    sync_type,
    status,
    data_count,
    sync_data,
    sync_metadata,
    lead_id
  ) VALUES (
    sync_type_param,
    'pending',
    1,
    lead_data,
    jsonb_build_object(
      'user_id', lead_user_id,
      'session_id', lead_session_id,
      'booking_id', booking_data.id,
      'created_at', now()
    ),
    COALESCE(lead_user_id, booking_data.user_id)
  ) RETURNING id INTO sync_id;
  
  RETURN sync_id;
END;
$_$;


ALTER FUNCTION "public"."sync_lead_to_sheets"("lead_user_id" "uuid", "lead_session_id" "uuid", "sync_type_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_memory_fact"("p_fact_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.user_memory
  set reference_count    = reference_count + 1,
      last_referenced_at = now()
  where id = p_fact_id
    and is_current = true
    and (user_id = auth.uid() or auth.uid() is null);
end;
$$;


ALTER FUNCTION "public"."touch_memory_fact"("p_fact_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_memory_facts"("p_fact_ids" "uuid"[]) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_touched integer;
begin
  if p_fact_ids is null or array_length(p_fact_ids, 1) is null then
    return 0;
  end if;
  update public.user_memory
  set reference_count    = reference_count + 1,
      last_referenced_at = now()
  where id = any(p_fact_ids)
    and is_current = true
    and (user_id = auth.uid() or auth.uid() is null);
  get diagnostics v_touched = row_count;
  return v_touched;
end;
$$;


ALTER FUNCTION "public"."touch_memory_facts"("p_fact_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_referral_conversion"("p_referral_code" "text", "p_referee_assessment_id" "uuid", "p_referee_email" "text", "p_referee_name" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_referrer_email TEXT;
  v_company_hash TEXT;
BEGIN
  -- Update referral record
  UPDATE assessment_referrals
  SET 
    referee_assessment_id = p_referee_assessment_id,
    referee_email = p_referee_email,
    referee_name = p_referee_name,
    converted = TRUE,
    converted_at = NOW()
  WHERE referral_code = p_referral_code
  RETURNING referrer_email INTO v_referrer_email;
  
  IF v_referrer_email IS NOT NULL THEN
    -- Extract company from email domain
    v_company_hash := hash_company_identifier(
      split_part(v_referrer_email, '@', 2)
    );
    
    -- Update company momentum (increment referral count)
    UPDATE adoption_momentum
    SET 
      verified_referrals = COALESCE(verified_referrals, 0) + 1,
      referred_companies = COALESCE(referred_companies, 0) + 1,
      updated_at = NOW()
    WHERE company_identifier_hash = v_company_hash;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."track_referral_conversion"("p_referral_code" "text", "p_referee_assessment_id" "uuid", "p_referee_email" "text", "p_referee_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_analytics_sheets_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only sync for certain conversion types
  IF NEW.conversion_type IN ('booking', 'high_engagement', 'qualified_lead') THEN
    PERFORM public.sync_lead_to_sheets(
      NEW.user_id,
      NEW.session_id,
      'booking'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_analytics_sheets_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_anonymous_booking_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Use internal sync function instead of net.http_post()
  PERFORM public.sync_lead_to_sheets(
    NEW.user_id,
    NEW.session_id,
    'booking'
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_anonymous_booking_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_anonymous_lead_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only sync for anonymous high-value leads
  IF NEW.total_score > 50 THEN
    PERFORM public.sync_lead_to_sheets(
      NEW.user_id,
      NEW.session_id,
      'booking'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_anonymous_lead_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_booking_http_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Log the sync attempt first
  PERFORM public.sync_lead_to_sheets(
    NEW.user_id,
    NEW.session_id,
    'booking'
  );
  
  -- Create a log entry indicating that manual processing is needed
  INSERT INTO public.google_sheets_sync_log (
    sync_type,
    status,
    sync_metadata
  ) VALUES (
    'booking',
    'needs_processing',
    jsonb_build_object(
      'booking_id', NEW.id,
      'trigger_time', now(),
      'trigger_source', 'simplified_trigger',
      'note', 'Use batch-process-pending-syncs function to process this'
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_booking_http_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_booking_requests_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Log the sync attempt using the existing sync function
  PERFORM public.sync_lead_to_sheets(
    NEW.user_id,
    NEW.session_id,
    'booking'
  );
  
  -- Mark all pending syncs for immediate HTTP processing
  UPDATE public.google_sheets_sync_log 
  SET status = 'ready_for_http',
      sync_metadata = sync_metadata || jsonb_build_object(
        'booking_trigger_time', now(),
        'trigger_booking_id', NEW.id,
        'needs_immediate_processing', true
      )
  WHERE status = 'pending' 
    AND sync_type = 'booking'
    AND created_at >= now() - interval '5 minutes';
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_booking_requests_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_booking_sheets_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Use internal sync function instead of net.http_post()
  PERFORM public.sync_lead_to_sheets(
    NEW.user_id,
    NEW.session_id,
    'booking'
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_booking_sheets_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_booking_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Trigger sync for new booking requests using valid sync_type 'booking'
  PERFORM public.sync_lead_to_sheets(
    NEW.user_id,
    NEW.session_id,
    'booking'
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_booking_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_business_context_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only trigger sync for significant updates (when AI readiness score is set or context data changes)
  IF (NEW.ai_readiness_score IS NOT NULL AND NEW.ai_readiness_score != COALESCE(OLD.ai_readiness_score, 0)) OR
     (NEW.context_data IS NOT NULL AND NEW.context_data != COALESCE(OLD.context_data, '{}'::jsonb)) THEN
    PERFORM public.sync_lead_to_sheets(
      NEW.user_id,
      NULL,
      'booking'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_business_context_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_contact_collection_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Use internal sync function with actual table columns only
  PERFORM public.sync_lead_to_sheets(
    NEW.user_id,  -- Remove the COALESCE and contact_data reference since it doesn't exist
    NEW.session_id,
    'booking'
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_contact_collection_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_google_sheets_edge_function"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  supabase_url text;
BEGIN
  -- Get Supabase URL from environment
  supabase_url := 'https://bkyuxvschuwngtcdhsyg.supabase.co';
  
  -- Call the sync function to create the sync log
  PERFORM public.sync_lead_to_sheets(
    NEW.user_id,
    NEW.session_id,
    'booking'
  );
  
  -- In production, make HTTP call to the edge function
  -- For now, we'll use a simple log with valid sync_type
  INSERT INTO public.google_sheets_sync_log (
    sync_type,
    status,
    sync_metadata
  ) VALUES (
    'booking',  -- Changed from 'edge_function_trigger' to 'booking' to comply with check constraint
    'pending',
    jsonb_build_object(
      'booking_id', NEW.id,
      'trigger_time', now(),
      'trigger_source', 'edge_function_trigger',
      'function_url', supabase_url || '/functions/v1/sync-to-google-sheets'
    )
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_google_sheets_edge_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_google_sheets_sync"("sync_type_param" "text" DEFAULT 'booking'::"text") RETURNS TABLE("sync_id" "uuid", "records_prepared" integer, "sync_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_sync_id UUID;
  record_count INTEGER := 0;
BEGIN
  -- Create sync log entry
  INSERT INTO public.google_sheets_sync_log (sync_type, status)
  VALUES (sync_type_param, 'pending')
  RETURNING id INTO new_sync_id;
  
  -- Count records based on sync type
  CASE sync_type_param
    WHEN 'booking' THEN
      SELECT COUNT(*) INTO record_count FROM public.booking_requests WHERE created_at >= NOW() - INTERVAL '7 days';
    WHEN 'analytics' THEN
      SELECT COUNT(*) INTO record_count FROM public.conversion_analytics WHERE created_at >= NOW() - INTERVAL '7 days';
    WHEN 'lead_scores' THEN
      SELECT COUNT(*) INTO record_count FROM public.lead_qualification_scores WHERE created_at >= NOW() - INTERVAL '7 days';
    ELSE
      record_count := 0;
  END CASE;
  
  -- Update sync log with count
  UPDATE public.google_sheets_sync_log 
  SET data_count = record_count,
      sync_metadata = jsonb_build_object('trigger_time', NOW(), 'record_count', record_count)
  WHERE id = new_sync_id;
  
  RETURN QUERY SELECT new_sync_id, record_count, 'pending'::TEXT;
END;
$$;


ALTER FUNCTION "public"."trigger_google_sheets_sync"("sync_type_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_lead_score_sheets_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only sync if it's a high-value lead (score > 50)
  IF NEW.total_score > 50 THEN
    PERFORM public.sync_lead_to_sheets(
      NEW.user_id,
      NEW.session_id,
      'booking'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_lead_score_sheets_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_context_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_company_context_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_leader_assessments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_leader_assessments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_leaders_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_leaders_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_meeting_prep_sessions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_meeting_prep_sessions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_memory_edges_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_memory_edges_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_from_insights"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.unified_profiles
  SET 
    latest_readiness_score = (
      SELECT score FROM public.profile_insights
      WHERE profile_id = NEW.profile_id 
        AND dimension_key = 'ai_readiness'
      ORDER BY created_at DESC
      LIMIT 1
    ),
    latest_assessment_tier = (
      SELECT label FROM public.profile_insights
      WHERE profile_id = NEW.profile_id 
        AND dimension_key = 'readiness_tier'
      ORDER BY created_at DESC
      LIMIT 1
    ),
    updated_at = NOW()
  WHERE id = NEW.profile_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_from_insights"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_memory_retention"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.retention_days IS DISTINCT FROM NEW.retention_days THEN
    IF NEW.retention_days IS NULL THEN
      UPDATE public.user_memory
      SET retention_expires_at = NULL
      WHERE user_id = NEW.user_id;
    ELSE
      UPDATE public.user_memory
      SET retention_expires_at = created_at + (NEW.retention_days || ' days')::INTERVAL
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_memory_retention"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_memory_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_memory_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_memory_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_memory_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_memory_fact"("p_fact_id" "uuid", "p_new_value" "text" DEFAULT NULL::"text", "p_is_correct" boolean DEFAULT true) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_fact_key TEXT;
  v_fact_label TEXT;
  v_prior_value TEXT;
BEGIN
  SELECT user_id, fact_key, fact_label, fact_value
    INTO v_user_id, v_fact_key, v_fact_label, v_prior_value
  FROM public.user_memory WHERE id = p_fact_id;

  -- Verify ownership
  IF v_user_id != auth.uid() THEN
    RETURN false;
  END IF;

  IF p_is_correct AND p_new_value IS NULL THEN
    -- User confirmed the fact as-is
    UPDATE public.user_memory
    SET verification_status = 'verified',
        verified_at = now()
    WHERE id = p_fact_id;
  ELSIF p_is_correct AND p_new_value IS NOT NULL THEN
    -- User corrected the fact: the new value IS the truth, but the prior
    -- value persists as a correction signal for the extractor.
    UPDATE public.user_memory
    SET verification_status = 'corrected',
        fact_value = p_new_value,
        verified_at = now()
    WHERE id = p_fact_id;

    INSERT INTO public.memory_events (user_id, fact_id, kind, payload)
    VALUES (v_user_id, p_fact_id, 'user_corrected', jsonb_build_object(
      'fact_key', v_fact_key,
      'fact_label', v_fact_label,
      'prior_value', v_prior_value,
      'new_value', p_new_value
    ));
  ELSE
    -- User rejected the fact
    UPDATE public.user_memory
    SET verification_status = 'rejected',
        is_current = false,
        verified_at = now()
    WHERE id = p_fact_id;

    INSERT INTO public.memory_events (user_id, fact_id, kind, payload)
    VALUES (v_user_id, p_fact_id, 'user_rejected', jsonb_build_object(
      'fact_key', v_fact_key,
      'fact_label', v_fact_label,
      'prior_value', v_prior_value
    ));
  END IF;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."verify_memory_fact"("p_fact_id" "uuid", "p_new_value" "text", "p_is_correct" boolean) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ctrl_discovery"."records" (
    "sequence_no" bigint NOT NULL,
    "record_uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_key" "text" NOT NULL,
    "record_key" "text" NOT NULL,
    "version" integer NOT NULL,
    "previous_record_uuid" "uuid",
    "record_type" "text" NOT NULL,
    "state" "text" NOT NULL,
    "title" "text" NOT NULL,
    "statement" "text" NOT NULL,
    "private_content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "export_content" "jsonb",
    "export_policy" "text" NOT NULL,
    "redaction_reason" "text",
    "authority" "text" NOT NULL,
    "capture_method" "text" NOT NULL,
    "source_ref" "text" NOT NULL,
    "source_commit" "text",
    "sensitivity" "text" NOT NULL,
    "observed_at" timestamp with time zone NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "statement_timestamp"() NOT NULL,
    "recorded_by" "text" NOT NULL,
    "idempotency_key" "text" NOT NULL,
    "private_content_sha256" "text" GENERATED ALWAYS AS ("encode"("extensions"."digest"(("private_content")::"text", 'sha256'::"text"), 'hex'::"text")) STORED,
    "export_content_sha256" "text" GENERATED ALWAYS AS (
CASE
    WHEN ("export_content" IS NULL) THEN NULL::"text"
    ELSE "encode"("extensions"."digest"(("export_content")::"text", 'sha256'::"text"), 'hex'::"text")
END) STORED,
    "record_sha256" "text" NOT NULL,
    CONSTRAINT "records_authority_check" CHECK (("authority" = ANY (ARRAY['user'::"text", 'agent'::"text", 'external'::"text", 'system'::"text"]))),
    CONSTRAINT "records_capture_method_check" CHECK (("capture_method" = ANY (ARRAY['user_statement'::"text", 'user_selection'::"text", 'user_authorization'::"text", 'direct_user_instruction'::"text", 'agent_synthesis'::"text", 'repository_audit'::"text", 'live_site_audit'::"text", 'external_research'::"text", 'system_readback'::"text", 'migration_event'::"text"]))),
    CONSTRAINT "records_check" CHECK (((("export_policy" = ANY (ARRAY['include'::"text", 'redact'::"text"])) AND ("export_content" IS NOT NULL)) OR (("export_policy" = 'exclude'::"text") AND ("export_content" IS NULL)))),
    CONSTRAINT "records_check1" CHECK (((("export_policy" = 'include'::"text") AND ("redaction_reason" IS NULL)) OR (("export_policy" = ANY (ARRAY['redact'::"text", 'exclude'::"text"])) AND ("length"("btrim"("redaction_reason")) > 0)))),
    CONSTRAINT "records_check2" CHECK ((("sensitivity" <> ALL (ARRAY['personal'::"text", 'restricted'::"text", 'secret'::"text"])) OR ("export_policy" = 'exclude'::"text"))),
    CONSTRAINT "records_check3" CHECK ((("record_type" <> 'decision'::"text") OR ("state" <> 'final'::"text") OR (("authority" = 'user'::"text") AND ("capture_method" = ANY (ARRAY['user_statement'::"text", 'user_selection'::"text", 'user_authorization'::"text", 'direct_user_instruction'::"text"])) AND ("private_content" ?& ARRAY['decider'::"text", 'accountable_owner'::"text", 'scope'::"text", 'affected_entities'::"text", 'rationale'::"text", 'alternatives'::"text", 'dissent'::"text", 'tradeoffs'::"text", 'evidence_refs'::"text", 'assumption_refs'::"text", 'revisit'::"text", 'authority_granted'::"text", 'decided_on'::"text", 'capture_method'::"text", 'paraphrase_status'::"text", 'outcome'::"text", 'events'::"text"])))),
    CONSTRAINT "records_export_content_check" CHECK ((("export_content" IS NULL) OR ("jsonb_typeof"("export_content") = 'object'::"text"))),
    CONSTRAINT "records_export_policy_check" CHECK (("export_policy" = ANY (ARRAY['include'::"text", 'redact'::"text", 'exclude'::"text"]))),
    CONSTRAINT "records_private_content_check" CHECK (("jsonb_typeof"("private_content") = 'object'::"text")),
    CONSTRAINT "records_record_key_check" CHECK (("record_key" ~ '^[A-Z]+-[0-9]{3,}$'::"text")),
    CONSTRAINT "records_record_type_check" CHECK (("record_type" = ANY (ARRAY['decision'::"text", 'hypothesis'::"text", 'assumption'::"text", 'evidence'::"text", 'contradiction'::"text", 'open_question'::"text", 'milestone'::"text", 'risk'::"text", 'source'::"text"]))),
    CONSTRAINT "records_sensitivity_check" CHECK (("sensitivity" = ANY (ARRAY['public'::"text", 'internal'::"text", 'personal'::"text", 'restricted'::"text", 'secret'::"text"]))),
    CONSTRAINT "records_source_commit_check" CHECK ((("source_commit" IS NULL) OR ("source_commit" ~ '^[0-9a-f]{40}$'::"text"))),
    CONSTRAINT "records_source_ref_check" CHECK (("length"("btrim"("source_ref")) > 0)),
    CONSTRAINT "records_state_check" CHECK (("state" = ANY (ARRAY['final'::"text", 'provisional'::"text", 'observed'::"text", 'open'::"text", 'answered'::"text", 'resolved'::"text", 'pending'::"text", 'in_progress'::"text", 'complete'::"text", 'superseded'::"text", 'withdrawn'::"text", 'blocked'::"text"]))),
    CONSTRAINT "records_statement_check" CHECK (("length"("btrim"("statement")) > 0)),
    CONSTRAINT "records_title_check" CHECK (("length"("btrim"("title")) > 0)),
    CONSTRAINT "records_version_check" CHECK (("version" > 0))
);

ALTER TABLE ONLY "ctrl_discovery"."records" FORCE ROW LEVEL SECURITY;


ALTER TABLE "ctrl_discovery"."records" OWNER TO "postgres";


COMMENT ON TABLE "ctrl_discovery"."records" IS 'Append-only typed, versioned records. Private and export-safe content are separate.';



CREATE OR REPLACE VIEW "ctrl_discovery"."current_records" WITH ("security_invoker"='true') AS
 SELECT DISTINCT ON ("session_key", "record_key") "sequence_no",
    "record_uuid",
    "session_key",
    "record_key",
    "version",
    "previous_record_uuid",
    "record_type",
    "state",
    "title",
    "statement",
    "private_content",
    "export_content",
    "export_policy",
    "redaction_reason",
    "authority",
    "capture_method",
    "source_ref",
    "source_commit",
    "sensitivity",
    "observed_at",
    "recorded_at",
    "recorded_by",
    "private_content_sha256",
    "export_content_sha256",
    "record_sha256"
   FROM "ctrl_discovery"."records"
  ORDER BY "session_key", "record_key", "version" DESC, "sequence_no" DESC;


ALTER VIEW "ctrl_discovery"."current_records" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ctrl_discovery"."export_snapshot" WITH ("security_invoker"='true') AS
 SELECT "session_key",
    "record_key",
    "version",
    "record_type",
    "state",
    "authority",
    "capture_method",
    "export_content" AS "content",
    "export_content_sha256" AS "content_sha256",
    "source_ref",
    "source_commit"
   FROM "ctrl_discovery"."current_records"
  WHERE (("export_policy" = ANY (ARRAY['include'::"text", 'redact'::"text"])) AND ("export_content" IS NOT NULL));


ALTER VIEW "ctrl_discovery"."export_snapshot" OWNER TO "postgres";


COMMENT ON VIEW "ctrl_discovery"."export_snapshot" IS 'Allowlisted source for deterministic public Git JSONL. Never exports private_content or private hashes.';



CREATE OR REPLACE VIEW "ctrl_discovery"."progress" WITH ("security_invoker"='true') AS
 SELECT "session_key",
    "record_key" AS "milestone_key",
    "state",
    "title",
    "statement",
    "private_content",
    "record_sha256"
   FROM "ctrl_discovery"."current_records"
  WHERE ("record_type" = 'milestone'::"text");


ALTER VIEW "ctrl_discovery"."progress" OWNER TO "postgres";


ALTER TABLE "ctrl_discovery"."records" ALTER COLUMN "sequence_no" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "ctrl_discovery"."records_sequence_no_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "ctrl_discovery"."sessions" (
    "session_key" "text" NOT NULL,
    "objective" "text" NOT NULL,
    "status" "text" NOT NULL,
    "repository_full_name" "text" NOT NULL,
    "repository_ref" "text" NOT NULL,
    "source_thread_ref" "text" NOT NULL,
    "sensitivity" "text" DEFAULT 'internal'::"text" NOT NULL,
    "export_policy" "text" DEFAULT 'redact'::"text" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "created_by" "text" NOT NULL,
    CONSTRAINT "sessions_export_policy_check" CHECK (("export_policy" = ANY (ARRAY['include'::"text", 'redact'::"text", 'exclude'::"text"]))),
    CONSTRAINT "sessions_objective_check" CHECK (("length"("btrim"("objective")) > 0)),
    CONSTRAINT "sessions_repository_ref_check" CHECK (("repository_ref" ~ '^[0-9a-f]{40}$'::"text")),
    CONSTRAINT "sessions_sensitivity_check" CHECK (("sensitivity" = ANY (ARRAY['public'::"text", 'internal'::"text", 'personal'::"text", 'restricted'::"text", 'secret'::"text"]))),
    CONSTRAINT "sessions_session_key_check" CHECK (("session_key" ~ '^[a-z0-9][a-z0-9-]{7,127}$'::"text")),
    CONSTRAINT "sessions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'complete'::"text", 'paused'::"text", 'abandoned'::"text"])))
);

ALTER TABLE ONLY "ctrl_discovery"."sessions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "ctrl_discovery"."sessions" OWNER TO "postgres";


COMMENT ON TABLE "ctrl_discovery"."sessions" IS 'Immutable discovery-session metadata. Lifecycle is represented by milestone records.';



CREATE TABLE IF NOT EXISTS "private"."mindmake_brief_rate_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_identifier_hash" "text" NOT NULL,
    "email_identifier_hash" "text" NOT NULL,
    CONSTRAINT "mindmake_brief_rate_events_email_identifier_hash_check" CHECK (("email_identifier_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "mindmake_brief_rate_events_ip_identifier_hash_check" CHECK (("ip_identifier_hash" ~ '^[0-9a-f]{64}$'::"text"))
);


ALTER TABLE "private"."mindmake_brief_rate_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "private"."mindmake_brief_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "version" smallint DEFAULT 2 NOT NULL,
    "request_id" "text" NOT NULL,
    "request_payload_sha256" "text" NOT NULL,
    "email" "text" NOT NULL,
    "company_domain" "text" NOT NULL,
    "pressure_id" "text" NOT NULL,
    "returned_time_id" "text" NOT NULL,
    "entry_route" "text" NOT NULL,
    "publication_requested" boolean NOT NULL,
    "consent_wording_version" "text" NOT NULL,
    "consent_recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_research" "jsonb",
    "assembly_state" "text" DEFAULT 'pending'::"text" NOT NULL,
    "assembly_attempts" smallint DEFAULT 0 NOT NULL,
    "assembly_attempted_at" timestamp with time zone,
    "assembly_claim_token" "uuid",
    "rate_limit_ip_hash" "text" NOT NULL,
    "rate_limit_email_hash" "text" NOT NULL,
    "user_agent_hash" "text",
    "verification_nonce" "uuid" NOT NULL,
    "verification_code_hash" "text" NOT NULL,
    "verification_expires_at" timestamp with time zone NOT NULL,
    "verification_failed_attempts" smallint DEFAULT 0 NOT NULL,
    "verified_at" timestamp with time zone,
    "verification_delivery" "text" DEFAULT 'pending'::"text" NOT NULL,
    "verification_delivery_id" "text",
    "verification_attempts" smallint DEFAULT 0 NOT NULL,
    "verification_attempted_at" timestamp with time zone,
    "verification_claim_token" "uuid",
    "visitor_delivery" "text" DEFAULT 'pending'::"text" NOT NULL,
    "visitor_delivery_id" "text",
    "visitor_attempts" smallint DEFAULT 0 NOT NULL,
    "visitor_attempted_at" timestamp with time zone,
    "visitor_claim_token" "uuid",
    "operator_delivery" "text" DEFAULT 'pending'::"text" NOT NULL,
    "operator_delivery_id" "text",
    "operator_attempts" smallint DEFAULT 0 NOT NULL,
    "operator_attempted_at" timestamp with time zone,
    "operator_claim_token" "uuid",
    CONSTRAINT "mindmake_brief_requests_assembly_attempts_check" CHECK ((("assembly_attempts" >= 0) AND ("assembly_attempts" <= 3))),
    CONSTRAINT "mindmake_brief_requests_assembly_state_check" CHECK (("assembly_state" = ANY (ARRAY['pending'::"text", 'sending'::"text", 'ready'::"text", 'failed'::"text"]))),
    CONSTRAINT "mindmake_brief_requests_check" CHECK (((("entry_route" = 'home'::"text") AND ("pressure_id" = ANY (ARRAY['customers-can-do-more-without-us'::"text", 'price-no-longer-matches-value'::"text", 'team-building-faster-than-it-can-choose'::"text", 'real-problem-still-unclear'::"text"]))) OR (("entry_route" = 'brain'::"text") AND ("pressure_id" = ANY (ARRAY['important-context-lives-in-my-head'::"text", 'avoid-work-that-needs-my-judgement'::"text", 'searching-for-things-i-should-know'::"text", 'need-room-for-important-decisions'::"text"]))) OR (("entry_route" = 'gtm'::"text") AND ("pressure_id" = ANY (ARRAY['customers-can-do-more-without-us'::"text", 'product-moving-faster-than-message'::"text", 'price-still-reflects-old-work'::"text", 'team-has-too-many-possible-moves'::"text"]))))),
    CONSTRAINT "mindmake_brief_requests_company_domain_check" CHECK (((("char_length"("company_domain") >= 3) AND ("char_length"("company_domain") <= 253)) AND ("company_domain" = "lower"("company_domain")))),
    CONSTRAINT "mindmake_brief_requests_company_research_check" CHECK ((("company_research" IS NULL) OR (("jsonb_typeof"("company_research") = 'object'::"text") AND ("octet_length"(("company_research")::"text") <= 65536)))),
    CONSTRAINT "mindmake_brief_requests_consent_wording_version_check" CHECK (("consent_wording_version" = 'mindmake-publication-consent-v1'::"text")),
    CONSTRAINT "mindmake_brief_requests_email_check" CHECK (((("char_length"("email") >= 3) AND ("char_length"("email") <= 254)) AND ("email" = "lower"("email")))),
    CONSTRAINT "mindmake_brief_requests_entry_route_check" CHECK (("entry_route" = ANY (ARRAY['home'::"text", 'brain'::"text", 'gtm'::"text"]))),
    CONSTRAINT "mindmake_brief_requests_operator_attempts_check" CHECK ((("operator_attempts" >= 0) AND ("operator_attempts" <= 3))),
    CONSTRAINT "mindmake_brief_requests_operator_delivery_check" CHECK (("operator_delivery" = ANY (ARRAY['pending'::"text", 'sending'::"text", 'queued'::"text", 'failed'::"text"]))),
    CONSTRAINT "mindmake_brief_requests_pressure_id_check" CHECK (("pressure_id" = ANY (ARRAY['customers-can-do-more-without-us'::"text", 'price-no-longer-matches-value'::"text", 'team-building-faster-than-it-can-choose'::"text", 'real-problem-still-unclear'::"text", 'important-context-lives-in-my-head'::"text", 'avoid-work-that-needs-my-judgement'::"text", 'searching-for-things-i-should-know'::"text", 'need-room-for-important-decisions'::"text", 'product-moving-faster-than-message'::"text", 'price-still-reflects-old-work'::"text", 'team-has-too-many-possible-moves'::"text"]))),
    CONSTRAINT "mindmake_brief_requests_rate_limit_email_hash_check" CHECK (("rate_limit_email_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "mindmake_brief_requests_rate_limit_ip_hash_check" CHECK (("rate_limit_ip_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "mindmake_brief_requests_request_id_check" CHECK (("request_id" ~* '^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|mindmake-[a-z0-9](?:[a-z0-9-]{5,118}[a-z0-9])?)$'::"text")),
    CONSTRAINT "mindmake_brief_requests_request_payload_sha256_check" CHECK (("request_payload_sha256" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "mindmake_brief_requests_returned_time_id_check" CHECK (("returned_time_id" = ANY (ARRAY['grow-this-business'::"text", 'help-more-companies'::"text", 'build-my-ai-skill'::"text", 'make-room-for-important-decisions'::"text"]))),
    CONSTRAINT "mindmake_brief_requests_user_agent_hash_check" CHECK ((("user_agent_hash" IS NULL) OR ("user_agent_hash" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "mindmake_brief_requests_verification_attempts_check" CHECK ((("verification_attempts" >= 0) AND ("verification_attempts" <= 3))),
    CONSTRAINT "mindmake_brief_requests_verification_code_hash_check" CHECK (("verification_code_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "mindmake_brief_requests_verification_delivery_check" CHECK (("verification_delivery" = ANY (ARRAY['pending'::"text", 'sending'::"text", 'queued'::"text", 'failed'::"text"]))),
    CONSTRAINT "mindmake_brief_requests_verification_failed_attempts_check" CHECK ((("verification_failed_attempts" >= 0) AND ("verification_failed_attempts" <= 5))),
    CONSTRAINT "mindmake_brief_requests_version_check" CHECK (("version" = 2)),
    CONSTRAINT "mindmake_brief_requests_visitor_attempts_check" CHECK ((("visitor_attempts" >= 0) AND ("visitor_attempts" <= 3))),
    CONSTRAINT "mindmake_brief_requests_visitor_delivery_check" CHECK (("visitor_delivery" = ANY (ARRAY['pending'::"text", 'sending'::"text", 'queued'::"text", 'failed'::"text"])))
);


ALTER TABLE "private"."mindmake_brief_requests" OWNER TO "postgres";


COMMENT ON TABLE "private"."mindmake_brief_requests" IS 'Private V2 Mindmake brief requests. Email verification gates two independent server-rendered deliveries.';



COMMENT ON COLUMN "private"."mindmake_brief_requests"."publication_requested" IS 'Unverified publication interest only. This is never a subscription instruction and must never trigger an automatic import.';



COMMENT ON COLUMN "private"."mindmake_brief_requests"."verification_code_hash" IS 'HMAC of the request, normalised email and six-digit code. The code itself is never stored.';



CREATE TABLE IF NOT EXISTS "private"."mindmake_personal_read_rate_events" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_identifier_hash" "text" NOT NULL,
    "email_identifier_hash" "text" NOT NULL,
    CONSTRAINT "mindmake_personal_read_rate_events_email_identifier_hash_check" CHECK (("email_identifier_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "mindmake_personal_read_rate_events_ip_identifier_hash_check" CHECK (("ip_identifier_hash" ~ '^[0-9a-f]{64}$'::"text"))
);


ALTER TABLE "private"."mindmake_personal_read_rate_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "private"."mindmake_personal_read_rate_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "private"."mindmake_personal_read_rate_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "private"."mindmake_personal_read_rate_events_id_seq" OWNED BY "private"."mindmake_personal_read_rate_events"."id";



CREATE TABLE IF NOT EXISTS "public"."aa_model_snapshots" (
    "snapshot_date" "date" NOT NULL,
    "model_id" "text" NOT NULL,
    "name" "text",
    "creator" "text",
    "input_price_per_m" numeric,
    "output_price_per_m" numeric,
    "intelligence" numeric,
    "tokens_per_sec" numeric,
    "ttft_s" numeric,
    "raw" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."aa_model_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."aa_model_snapshots" IS 'Daily published model prices and quality. Written by the aa-price-snapshot function at 11:00 UTC.';



CREATE TABLE IF NOT EXISTS "public"."activity_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "activity_type" "text" NOT NULL,
    "qr_code_url" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "activity_sessions_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['bottleneck'::"text", 'effortless_map'::"text", 'simulation_vote'::"text", 'dot_voting'::"text", 'working_group'::"text"])))
);


ALTER TABLE "public"."activity_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."adoption_momentum" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_identifier_hash" "text" NOT NULL,
    "total_assessments" integer DEFAULT 0,
    "total_unique_users" integer DEFAULT 0,
    "total_advisory_sprints" integer DEFAULT 0,
    "total_workshop_bookings" integer DEFAULT 0,
    "first_assessment_date" timestamp with time zone,
    "latest_assessment_date" timestamp with time zone,
    "days_between_first_last" integer,
    "referred_companies" integer DEFAULT 0,
    "verified_referrals" integer DEFAULT 0,
    "repeat_rate_capped" numeric(5,2) DEFAULT 0,
    "team_growth_sqrt" numeric(5,2) DEFAULT 0,
    "referral_quality_score" numeric(5,2) DEFAULT 0,
    "recency_decay" numeric(5,2) DEFAULT 1.0,
    "momentum_score" integer DEFAULT 0,
    "momentum_tier" "public"."momentum_tier",
    "industry" "text",
    "company_size" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."adoption_momentum" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "response" "text" NOT NULL,
    "business_context" "jsonb",
    "insights_generated" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_insights_generated" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "insight_type" "text" NOT NULL,
    "insight_content" "text" NOT NULL,
    "business_context" "jsonb",
    "relevance_score" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_insights_generated" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_leadership_index_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quarter" "text" NOT NULL,
    "methodology_version" "text",
    "published_at" timestamp with time zone DEFAULT "now"(),
    "total_assessments" integer DEFAULT 0,
    "effective_sample_size" numeric(6,2) DEFAULT 0,
    "consent_rate" numeric(5,2),
    "avg_readiness_score" numeric(5,2),
    "avg_readiness_score_ci_lower" numeric(5,2),
    "avg_readiness_score_ci_upper" numeric(5,2),
    "median_readiness_score" numeric(5,2),
    "tier_emerging_pct" numeric(5,2),
    "tier_establishing_pct" numeric(5,2),
    "tier_advancing_pct" numeric(5,2),
    "tier_leading_pct" numeric(5,2),
    "industry_benchmarks" "jsonb" DEFAULT '{}'::"jsonb",
    "company_size_benchmarks" "jsonb" DEFAULT '{}'::"jsonb",
    "role_benchmarks" "jsonb" DEFAULT '{}'::"jsonb",
    "dimension_benchmarks" "jsonb" DEFAULT '{}'::"jsonb",
    "qoq_change" numeric(5,2),
    "qoq_change_significant" boolean,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_leadership_index_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_literacy_modules" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "tier" "text" NOT NULL,
    "credits" integer NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "target_audience" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "challenges" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "team_sizes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "urgency" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "learning_styles" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "prerequisites" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_literacy_modules_category_check" CHECK (("category" = ANY (ARRAY['LEADERSHIP'::"text", 'IMPLEMENTATION'::"text"]))),
    CONSTRAINT "ai_literacy_modules_tier_check" CHECK (("tier" = ANY (ARRAY['Basic'::"text", 'Advanced'::"text", 'Expert'::"text"])))
);


ALTER TABLE "public"."ai_literacy_modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_response_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prompt_hash" "text" NOT NULL,
    "model" "text" NOT NULL,
    "response" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_response_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_response_cache" IS 'AI response cache. Per-call-site TTL via expires_at; cleanup via DELETE WHERE expires_at < NOW(). Service-role only.';



CREATE TABLE IF NOT EXISTS "public"."ai_usage_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "function_name" "text" NOT NULL,
    "provider" "text",
    "model" "text",
    "purpose" "text",
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "latency_ms" integer,
    "status" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "est_cost_usd" numeric
);


ALTER TABLE "public"."ai_usage_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_behavioral_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "experimentation_weight" numeric,
    "delegation_weight" numeric,
    "stakeholder_complexity" numeric,
    "time_optimization" numeric,
    "adjustment_rationale" "jsonb" DEFAULT '{}'::"jsonb",
    "raw_inputs" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessment_behavioral_adjustments" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment_behavioral_adjustments" IS 'Audit trail of behavioral score adjustments with full rationale';



CREATE TABLE IF NOT EXISTS "public"."assessment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "session_id" "uuid",
    "profile_id" "uuid",
    "event_type" "text" NOT NULL,
    "tool_name" "text" NOT NULL,
    "flow_name" "text",
    "question_id" "text",
    "question_text" "text" NOT NULL,
    "dimension_key" "text",
    "raw_input" "text" NOT NULL,
    "structured_values" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "response_duration_seconds" integer,
    "context_snapshot" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "assessment_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['question_answered'::"text", 'voice_recorded'::"text", 'deep_profile_completed'::"text", 'behavioral_input'::"text"]))),
    CONSTRAINT "assessment_events_tool_name_check" CHECK (("tool_name" = ANY (ARRAY['quiz'::"text", 'voice'::"text", 'chat'::"text", 'deep_profile'::"text"])))
);


ALTER TABLE "public"."assessment_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessment_events" IS 'Raw event log storing question+answer pairs for full context traceability';



COMMENT ON COLUMN "public"."assessment_events"."question_text" IS 'Full question text stored WITH answer - questions provide critical context';



CREATE TABLE IF NOT EXISTS "public"."assessment_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_key" "text" NOT NULL,
    "tool_name" "text" NOT NULL,
    "dimension_key" "text" NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" DEFAULT 'likert_5'::"text",
    "options" "jsonb" DEFAULT '[]'::"jsonb",
    "weight" numeric DEFAULT 1.0,
    "reverse_scored" boolean DEFAULT false,
    "display_order" integer,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assessment_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['likert_5'::"text", 'open_ended'::"text", 'voice_prompt'::"text", 'multiple_choice'::"text"]))),
    CONSTRAINT "assessment_questions_tool_name_check" CHECK (("tool_name" = ANY (ARRAY['quiz'::"text", 'voice'::"text", 'compass'::"text", 'deep_profile'::"text"])))
);


ALTER TABLE "public"."assessment_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_assessment_id" "uuid",
    "referrer_email" "text" NOT NULL,
    "referrer_name" "text",
    "referral_code" "text" NOT NULL,
    "referee_email" "text",
    "referee_name" "text",
    "referee_assessment_id" "uuid",
    "referred_at" timestamp with time zone DEFAULT "now"(),
    "converted_at" timestamp with time zone,
    "converted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessment_referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audience_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "public"."lead_source" NOT NULL,
    "name" "text",
    "status" "text" DEFAULT 'subscribed'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "synced_to_os_at" timestamp with time zone
);


ALTER TABLE "public"."audience_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automator_usage" (
    "user_id" "uuid" NOT NULL,
    "month" "text" NOT NULL,
    "exports_used" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."automator_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_workshop_sessions" (
    "id" "uuid",
    "intake_id" "uuid",
    "facilitator_name" "text",
    "workshop_date" timestamp with time zone,
    "status" "text",
    "current_segment" integer,
    "segment_timers" "jsonb",
    "participant_count" integer,
    "cognitive_baseline_data" "jsonb",
    "workshop_metadata" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "facilitator_email" "text",
    "bootcamp_plan_id" "uuid"
);


ALTER TABLE "public"."backup_workshop_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."be_episodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "guest_name" "text",
    "guest_title" "text",
    "description" "text",
    "episode_url" "text" NOT NULL,
    "cover_image_url" "text",
    "episode_number" integer,
    "published_at" timestamp with time zone DEFAULT "now"(),
    "is_published" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."be_episodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."be_guest_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "linkedin_url" "text",
    "what_building" "text",
    "how_using_ai" "text",
    "surprise_insight" "text",
    "stage" "text",
    "product_link" "text",
    "takeaway" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."be_guest_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."be_guests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "title" "text",
    "photo_url" "text",
    "quote" "text",
    "episode_id" "uuid",
    "approved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."be_guests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."be_testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote" "text" NOT NULL,
    "author" "text" NOT NULL,
    "role" "text",
    "featured" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."be_testimonials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blind_spot_evidence_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pattern_id" "uuid" NOT NULL,
    "source_kind" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "source_snapshot" "jsonb" NOT NULL,
    "observed_at" timestamp with time zone NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blind_spot_evidence_links_role_check" CHECK (("role" = ANY (ARRAY['intention'::"text", 'recurrence'::"text"]))),
    CONSTRAINT "blind_spot_evidence_links_source_kind_check" CHECK (("source_kind" = ANY (ARRAY['memory'::"text", 'decision'::"text", 'decision_case'::"text", 'mission'::"text", 'check_in'::"text"])))
);


ALTER TABLE "public"."blind_spot_evidence_links" OWNER TO "postgres";


COMMENT ON TABLE "public"."blind_spot_evidence_links" IS 'Owner-scoped immutable evidence snapshots for user-confirmed Blind Spot patterns.';



CREATE TABLE IF NOT EXISTS "public"."blind_spot_experiments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pattern_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "instruction" "text" NOT NULL,
    "check_in_prompt" "text" NOT NULL,
    "duration_minutes" integer DEFAULT 15 NOT NULL,
    "due_at" timestamp with time zone NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "outcome" "text",
    "defer_count" integer DEFAULT 0 NOT NULL,
    "user_note" "text",
    "surfaced_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blind_spot_experiments_check" CHECK (("expires_at" > "due_at")),
    CONSTRAINT "blind_spot_experiments_check_in_prompt_check" CHECK ((("char_length"("check_in_prompt") >= 1) AND ("char_length"("check_in_prompt") <= 180))),
    CONSTRAINT "blind_spot_experiments_defer_count_check" CHECK ((("defer_count" >= 0) AND ("defer_count" <= 1))),
    CONSTRAINT "blind_spot_experiments_duration_minutes_check" CHECK ((("duration_minutes" >= 5) AND ("duration_minutes" <= 15))),
    CONSTRAINT "blind_spot_experiments_instruction_check" CHECK ((("char_length"("instruction") >= 1) AND ("char_length"("instruction") <= 240))),
    CONSTRAINT "blind_spot_experiments_outcome_check" CHECK (("outcome" = ANY (ARRAY['positive'::"text", 'not_really'::"text", 'not_yet'::"text"]))),
    CONSTRAINT "blind_spot_experiments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'expired'::"text"]))),
    CONSTRAINT "blind_spot_experiments_title_check" CHECK ((("char_length"("title") >= 1) AND ("char_length"("title") <= 80))),
    CONSTRAINT "blind_spot_experiments_user_note_check" CHECK ((("user_note" IS NULL) OR ("char_length"("user_note") <= 500)))
);


ALTER TABLE "public"."blind_spot_experiments" OWNER TO "postgres";


COMMENT ON TABLE "public"."blind_spot_experiments" IS 'One low-cost experiment per confirmed Blind Spot pattern, surfaced later in a briefing.';



CREATE TABLE IF NOT EXISTS "public"."blind_spot_rejections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "anchor_fingerprint" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blind_spot_rejections_anchor_fingerprint_check" CHECK (("char_length"("anchor_fingerprint") = 64)),
    CONSTRAINT "blind_spot_rejections_reason_check" CHECK (("reason" = ANY (ARRAY['wrong_pattern'::"text", 'evidence_stale'::"text", 'missing_context'::"text"])))
);


ALTER TABLE "public"."blind_spot_rejections" OWNER TO "postgres";


COMMENT ON TABLE "public"."blind_spot_rejections" IS 'Stores only a rejection reason and evidence fingerprint so unchanged evidence is suppressed.';



CREATE TABLE IF NOT EXISTS "public"."booking_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "service_type" "text" NOT NULL,
    "service_title" "text" NOT NULL,
    "contact_name" "text" NOT NULL,
    "contact_email" "text" NOT NULL,
    "company_name" "text",
    "role" "text",
    "phone" "text",
    "preferred_time" "text",
    "specific_needs" "text",
    "lead_score" integer DEFAULT 0,
    "priority" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "scheduled_date" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "booking_requests_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "booking_requests_service_type_check" CHECK (("service_type" = ANY (ARRAY['consultation'::"text", 'workshop'::"text", 'assessment'::"text", 'implementation'::"text", 'strategy_call'::"text", 'learn_more'::"text"]))),
    CONSTRAINT "booking_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'contacted'::"text", 'scheduled'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."booking_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bootcamp_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "intake_id" "uuid",
    "simulation_1_id" "text",
    "simulation_1_snapshot" "jsonb" DEFAULT '{}'::"jsonb",
    "simulation_2_id" "text",
    "simulation_2_snapshot" "jsonb" DEFAULT '{}'::"jsonb",
    "agenda_config" "jsonb" DEFAULT '{}'::"jsonb",
    "required_prework" "jsonb" DEFAULT '[]'::"jsonb",
    "cognitive_baseline" "jsonb" DEFAULT '{}'::"jsonb",
    "calendly_booking_url" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "booked_at" timestamp with time zone,
    "ai_myths_concerns" "jsonb" DEFAULT '[]'::"jsonb",
    "current_bottlenecks" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_experience_level" "text",
    "strategic_goals_2026" "jsonb" DEFAULT '[]'::"jsonb",
    "competitive_landscape" "text",
    "risk_tolerance" integer,
    "pilot_expectations" "jsonb" DEFAULT '{}'::"jsonb",
    "data_governance_notes" "text",
    "pilot_metrics_notes" "text",
    CONSTRAINT "bootcamp_plans_risk_tolerance_check" CHECK ((("risk_tolerance" >= 1) AND ("risk_tolerance" <= 5)))
);


ALTER TABLE "public"."bootcamp_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bottleneck_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "activity_session_id" "uuid",
    "participant_name" "text" NOT NULL,
    "bottleneck_text" "text" NOT NULL,
    "cluster_id" "text",
    "cluster_name" "text",
    "position_x" numeric,
    "position_y" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid"
);

ALTER TABLE ONLY "public"."bottleneck_submissions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."bottleneck_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brain_assertions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "speaker_user_id" "uuid",
    "epistemic_basis" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "statement_ciphertext" "text" NOT NULL,
    "encryption_version" smallint NOT NULL,
    "source_span_start" integer,
    "source_span_end" integer,
    "source_span_sha256" "text",
    "valid_at" timestamp with time zone,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "brain_assertions_audience_check" CHECK (("audience" = ANY (ARRAY['person_private'::"text", 'delivery_team_private'::"text", 'named_company_or_project'::"text", 'approved_pattern_commons'::"text", 'public_release'::"text"]))),
    CONSTRAINT "brain_assertions_check" CHECK (((("source_span_start" IS NOT NULL) AND ("source_span_end" IS NOT NULL) AND ("source_span_end" > "source_span_start")) OR ("source_span_sha256" IS NOT NULL))),
    CONSTRAINT "brain_assertions_encryption_version_check" CHECK (("encryption_version" > 0)),
    CONSTRAINT "brain_assertions_epistemic_basis_check" CHECK (("epistemic_basis" = ANY (ARRAY['user_stated'::"text", 'user_demonstrated'::"text", 'observed'::"text", 'inferred'::"text", 'outcome_tested'::"text", 'external_claim'::"text"]))),
    CONSTRAINT "brain_assertions_source_span_end_check" CHECK ((("source_span_end" IS NULL) OR ("source_span_end" > 0))),
    CONSTRAINT "brain_assertions_source_span_sha256_check" CHECK ((("source_span_sha256" IS NULL) OR ("source_span_sha256" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "brain_assertions_source_span_start_check" CHECK ((("source_span_start" IS NULL) OR ("source_span_start" >= 0))),
    CONSTRAINT "brain_assertions_statement_ciphertext_check" CHECK (("char_length"("statement_ciphertext") > 0))
);

ALTER TABLE ONLY "public"."brain_assertions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_assertions" OWNER TO "postgres";


COMMENT ON TABLE "public"."brain_assertions" IS 'Atomic encrypted claims with source-span integrity and preserved epistemic basis.';



CREATE TABLE IF NOT EXISTS "public"."brain_audience_grants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "grantee_user_id" "uuid" NOT NULL,
    "audience" "text" NOT NULL,
    "purpose" "text" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "brain_audience_grants_audience_check" CHECK (("audience" = ANY (ARRAY['person_private'::"text", 'delivery_team_private'::"text", 'named_company_or_project'::"text", 'approved_pattern_commons'::"text", 'public_release'::"text"]))),
    CONSTRAINT "brain_audience_grants_check" CHECK ((("expires_at" IS NULL) OR ("expires_at" > "granted_at"))),
    CONSTRAINT "brain_audience_grants_check1" CHECK ((("revoked_at" IS NULL) OR ("revoked_at" >= "granted_at"))),
    CONSTRAINT "brain_audience_grants_purpose_check" CHECK ((("char_length"("btrim"("purpose")) >= 1) AND ("char_length"("btrim"("purpose")) <= 160)))
);

ALTER TABLE ONLY "public"."brain_audience_grants" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_audience_grants" OWNER TO "postgres";


COMMENT ON TABLE "public"."brain_audience_grants" IS 'Explicit, purpose-bound audience access. Trust or role alone never widens content visibility.';



CREATE TABLE IF NOT EXISTS "public"."brain_item_version_assertions" (
    "item_version_id" "uuid" NOT NULL,
    "assertion_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "audience" "text" NOT NULL,
    "evidence_role" "text" NOT NULL,
    "linked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "linked_by" "uuid",
    CONSTRAINT "brain_item_version_assertions_audience_check" CHECK (("audience" = ANY (ARRAY['person_private'::"text", 'delivery_team_private'::"text", 'named_company_or_project'::"text", 'approved_pattern_commons'::"text", 'public_release'::"text"]))),
    CONSTRAINT "brain_item_version_assertions_evidence_role_check" CHECK (("evidence_role" = ANY (ARRAY['supporting'::"text", 'contrary'::"text"])))
);

ALTER TABLE ONLY "public"."brain_item_version_assertions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_item_version_assertions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brain_item_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "brain_item_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "title" "text" NOT NULL,
    "meaning_ciphertext" "text" NOT NULL,
    "encryption_version" smallint NOT NULL,
    "human_views" "text"[] NOT NULL,
    "epistemic_basis" "text" NOT NULL,
    "maturity" "text" NOT NULL,
    "standing" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "consequence_permission" "text" NOT NULL,
    "applicability" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "exclusions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "evidence_quality" numeric(4,3) DEFAULT 0 NOT NULL,
    "corroboration" numeric(4,3) DEFAULT 0 NOT NULL,
    "recency" numeric(4,3) DEFAULT 0 NOT NULL,
    "transfer" numeric(4,3) DEFAULT 0 NOT NULL,
    "human_confirmation" numeric(4,3) DEFAULT 0 NOT NULL,
    "valid_from" timestamp with time zone NOT NULL,
    "valid_until" timestamp with time zone,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "predecessor_version_id" "uuid",
    "superseded_by_version_id" "uuid",
    "created_by" "uuid",
    CONSTRAINT "brain_item_versions_applicability_check" CHECK (("jsonb_typeof"("applicability") = 'object'::"text")),
    CONSTRAINT "brain_item_versions_audience_check" CHECK (("audience" = ANY (ARRAY['person_private'::"text", 'delivery_team_private'::"text", 'named_company_or_project'::"text", 'approved_pattern_commons'::"text", 'public_release'::"text"]))),
    CONSTRAINT "brain_item_versions_check" CHECK ((("valid_until" IS NULL) OR ("valid_until" > "valid_from"))),
    CONSTRAINT "brain_item_versions_check1" CHECK (((("standing" = ANY (ARRAY['current'::"text", 'disputed'::"text"])) AND ("valid_until" IS NULL)) OR (("standing" = ANY (ARRAY['superseded'::"text", 'retired'::"text", 'expired'::"text"])) AND ("valid_until" IS NOT NULL)))),
    CONSTRAINT "brain_item_versions_check2" CHECK ((("version" = 1) OR ("predecessor_version_id" IS NOT NULL))),
    CONSTRAINT "brain_item_versions_check3" CHECK (("id" IS DISTINCT FROM "predecessor_version_id")),
    CONSTRAINT "brain_item_versions_check4" CHECK (("id" IS DISTINCT FROM "superseded_by_version_id")),
    CONSTRAINT "brain_item_versions_consequence_permission_check" CHECK (("consequence_permission" = ANY (ARRAY['personalise_presentation'::"text", 'suggest_or_retrieve'::"text", 'shape_reversible_work'::"text", 'confirm_before_consequential_use'::"text", 'prohibited_in_context'::"text"]))),
    CONSTRAINT "brain_item_versions_corroboration_check" CHECK ((("corroboration" >= (0)::numeric) AND ("corroboration" <= (1)::numeric))),
    CONSTRAINT "brain_item_versions_encryption_version_check" CHECK (("encryption_version" > 0)),
    CONSTRAINT "brain_item_versions_epistemic_basis_check" CHECK (("epistemic_basis" = ANY (ARRAY['user_stated'::"text", 'user_demonstrated'::"text", 'observed'::"text", 'inferred'::"text", 'outcome_tested'::"text", 'external_claim'::"text"]))),
    CONSTRAINT "brain_item_versions_evidence_quality_check" CHECK ((("evidence_quality" >= (0)::numeric) AND ("evidence_quality" <= (1)::numeric))),
    CONSTRAINT "brain_item_versions_exclusions_check" CHECK (("jsonb_typeof"("exclusions") = ANY (ARRAY['array'::"text", 'object'::"text"]))),
    CONSTRAINT "brain_item_versions_human_confirmation_check" CHECK ((("human_confirmation" >= (0)::numeric) AND ("human_confirmation" <= (1)::numeric))),
    CONSTRAINT "brain_item_versions_human_views_check" CHECK (("cardinality"("human_views") > 0)),
    CONSTRAINT "brain_item_versions_human_views_check1" CHECK (("human_views" <@ ARRAY['what_matters'::"text", 'how_i_judge'::"text", 'my_calls'::"text", 'unresolved'::"text", 'what_changed'::"text"])),
    CONSTRAINT "brain_item_versions_maturity_check" CHECK (("maturity" = ANY (ARRAY['staged'::"text", 'proposed'::"text", 'held'::"text", 'trusted'::"text"]))),
    CONSTRAINT "brain_item_versions_meaning_ciphertext_check" CHECK (("char_length"("meaning_ciphertext") > 0)),
    CONSTRAINT "brain_item_versions_recency_check" CHECK ((("recency" >= (0)::numeric) AND ("recency" <= (1)::numeric))),
    CONSTRAINT "brain_item_versions_standing_check" CHECK (("standing" = ANY (ARRAY['current'::"text", 'disputed'::"text", 'superseded'::"text", 'retired'::"text", 'expired'::"text"]))),
    CONSTRAINT "brain_item_versions_title_check" CHECK ((("char_length"("btrim"("title")) >= 1) AND ("char_length"("btrim"("title")) <= 160))),
    CONSTRAINT "brain_item_versions_transfer_check" CHECK ((("transfer" >= (0)::numeric) AND ("transfer" <= (1)::numeric))),
    CONSTRAINT "brain_item_versions_version_check" CHECK (("version" > 0))
);

ALTER TABLE ONLY "public"."brain_item_versions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_item_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."brain_item_versions" IS 'Versioned Brain meaning, scope, authority, applicability, time and confidence components.';



CREATE TABLE IF NOT EXISTS "public"."brain_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "item_key" "text" NOT NULL,
    "semantic_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "brain_items_item_key_check" CHECK (("item_key" ~ '^[a-z0-9][a-z0-9._-]{2,95}$'::"text")),
    CONSTRAINT "brain_items_semantic_type_check" CHECK (("semantic_type" = ANY (ARRAY['aim'::"text", 'standard'::"text", 'preference'::"text", 'pattern'::"text", 'example'::"text", 'tension'::"text", 'context'::"text"])))
);

ALTER TABLE ONLY "public"."brain_items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."brain_items" IS 'Stable identity for a reusable Brain item across immutable meaning versions.';



CREATE TABLE IF NOT EXISTS "public"."briefing_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "text" "text" NOT NULL,
    "weight" numeric DEFAULT 1.0 NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "briefing_interests_kind_check" CHECK (("kind" = ANY (ARRAY['beat'::"text", 'entity'::"text", 'exclude'::"text"])))
);


ALTER TABLE "public"."briefing_interests" OWNER TO "postgres";


COMMENT ON TABLE "public"."briefing_interests" IS 'User-declared interests that seed the importance lens. beat = topic, entity = person/company, exclude = never-show-me.';



COMMENT ON COLUMN "public"."briefing_interests"."source" IS 'Provenance: manual (user added), seed_accepted (tapped an industry seed), feedback_promoted (system promoted from repeated likes).';



CREATE TABLE IF NOT EXISTS "public"."news_preferences" (
    "user_id" "uuid" NOT NULL,
    "boosted_categories" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "bias" "text" DEFAULT 'balanced'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."news_preferences" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."brain_profile_inputs" WITH ("security_invoker"='on') AS
 SELECT "np"."user_id",
    'boosted_category'::"text" AS "kind",
    "c"."c" AS "value",
    NULL::"uuid" AS "ref_id",
    NULL::"text" AS "interest_kind",
    "np"."updated_at" AS "created_at"
   FROM ("public"."news_preferences" "np"
     CROSS JOIN LATERAL "unnest"(COALESCE("np"."boosted_categories", '{}'::"text"[])) "c"("c"))
UNION ALL
 SELECT "np"."user_id",
    'bias'::"text" AS "kind",
    "np"."bias" AS "value",
    NULL::"uuid" AS "ref_id",
    NULL::"text" AS "interest_kind",
    "np"."updated_at" AS "created_at"
   FROM "public"."news_preferences" "np"
  WHERE ("np"."bias" IS NOT NULL)
UNION ALL
 SELECT "bi"."user_id",
    'interest'::"text" AS "kind",
    "bi"."text" AS "value",
    "bi"."id" AS "ref_id",
    "bi"."kind" AS "interest_kind",
    "bi"."created_at"
   FROM "public"."briefing_interests" "bi"
  WHERE ("bi"."is_active" = true);


ALTER VIEW "public"."brain_profile_inputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brain_relationship_version_assertions" (
    "relationship_version_id" "uuid" NOT NULL,
    "assertion_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "audience" "text" NOT NULL,
    "linked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "linked_by" "uuid",
    CONSTRAINT "brain_relationship_version_assertions_audience_check" CHECK (("audience" = ANY (ARRAY['person_private'::"text", 'delivery_team_private'::"text", 'named_company_or_project'::"text", 'approved_pattern_commons'::"text", 'public_release'::"text"])))
);

ALTER TABLE ONLY "public"."brain_relationship_version_assertions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_relationship_version_assertions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brain_relationship_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "relationship_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "from_item_version_id" "uuid" NOT NULL,
    "to_item_version_id" "uuid" NOT NULL,
    "relation_type" "text" NOT NULL,
    "explanation_ciphertext" "text" NOT NULL,
    "encryption_version" smallint NOT NULL,
    "epistemic_basis" "text" NOT NULL,
    "maturity" "text" NOT NULL,
    "standing" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "consequence_permission" "text" NOT NULL,
    "valid_from" timestamp with time zone NOT NULL,
    "valid_until" timestamp with time zone,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "predecessor_version_id" "uuid",
    "superseded_by_version_id" "uuid",
    "created_by" "uuid",
    CONSTRAINT "brain_relationship_versions_audience_check" CHECK (("audience" = ANY (ARRAY['person_private'::"text", 'delivery_team_private'::"text", 'named_company_or_project'::"text", 'approved_pattern_commons'::"text", 'public_release'::"text"]))),
    CONSTRAINT "brain_relationship_versions_check" CHECK (("from_item_version_id" <> "to_item_version_id")),
    CONSTRAINT "brain_relationship_versions_check1" CHECK ((("valid_until" IS NULL) OR ("valid_until" > "valid_from"))),
    CONSTRAINT "brain_relationship_versions_check2" CHECK (((("standing" = ANY (ARRAY['current'::"text", 'disputed'::"text"])) AND ("valid_until" IS NULL)) OR (("standing" = ANY (ARRAY['superseded'::"text", 'retired'::"text", 'expired'::"text"])) AND ("valid_until" IS NOT NULL)))),
    CONSTRAINT "brain_relationship_versions_check3" CHECK ((("version" = 1) OR ("predecessor_version_id" IS NOT NULL))),
    CONSTRAINT "brain_relationship_versions_check4" CHECK (("id" IS DISTINCT FROM "predecessor_version_id")),
    CONSTRAINT "brain_relationship_versions_check5" CHECK (("id" IS DISTINCT FROM "superseded_by_version_id")),
    CONSTRAINT "brain_relationship_versions_consequence_permission_check" CHECK (("consequence_permission" = ANY (ARRAY['personalise_presentation'::"text", 'suggest_or_retrieve'::"text", 'shape_reversible_work'::"text", 'confirm_before_consequential_use'::"text", 'prohibited_in_context'::"text"]))),
    CONSTRAINT "brain_relationship_versions_encryption_version_check" CHECK (("encryption_version" > 0)),
    CONSTRAINT "brain_relationship_versions_epistemic_basis_check" CHECK (("epistemic_basis" = ANY (ARRAY['user_stated'::"text", 'user_demonstrated'::"text", 'observed'::"text", 'inferred'::"text", 'outcome_tested'::"text", 'external_claim'::"text"]))),
    CONSTRAINT "brain_relationship_versions_explanation_ciphertext_check" CHECK (("char_length"("explanation_ciphertext") > 0)),
    CONSTRAINT "brain_relationship_versions_maturity_check" CHECK (("maturity" = ANY (ARRAY['staged'::"text", 'proposed'::"text", 'held'::"text", 'trusted'::"text"]))),
    CONSTRAINT "brain_relationship_versions_relation_type_check" CHECK (("relation_type" = ANY (ARRAY['supports'::"text", 'contradicts'::"text", 'qualifies'::"text", 'in_tension_with'::"text", 'depends_on'::"text", 'informs'::"text", 'exemplifies'::"text"]))),
    CONSTRAINT "brain_relationship_versions_standing_check" CHECK (("standing" = ANY (ARRAY['current'::"text", 'disputed'::"text", 'superseded'::"text", 'retired'::"text", 'expired'::"text"]))),
    CONSTRAINT "brain_relationship_versions_version_check" CHECK (("version" > 0))
);

ALTER TABLE ONLY "public"."brain_relationship_versions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_relationship_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."brain_relationship_versions" IS 'Typed, version-specific semantic relationships whose current endpoints and evidence are enforced.';



CREATE TABLE IF NOT EXISTS "public"."brain_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "relationship_key" "text" NOT NULL,
    "from_item_id" "uuid" NOT NULL,
    "to_item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "brain_relationships_check" CHECK (("from_item_id" <> "to_item_id")),
    CONSTRAINT "brain_relationships_relationship_key_check" CHECK (("relationship_key" ~ '^[a-z0-9][a-z0-9._-]{2,95}$'::"text"))
);

ALTER TABLE ONLY "public"."brain_relationships" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brain_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "actor_user_id" "uuid",
    "speaker_label" "text",
    "captured_at" timestamp with time zone NOT NULL,
    "purpose" "text" NOT NULL,
    "audience" "text" NOT NULL,
    "retention_expires_at" timestamp with time zone,
    "integrity_sha256" "text",
    "external_locator" "text",
    "content_ciphertext" "text",
    "encryption_version" smallint,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "brain_sources_audience_check" CHECK (("audience" = ANY (ARRAY['person_private'::"text", 'delivery_team_private'::"text", 'named_company_or_project'::"text", 'approved_pattern_commons'::"text", 'public_release'::"text"]))),
    CONSTRAINT "brain_sources_check" CHECK ((("retention_expires_at" IS NULL) OR ("retention_expires_at" > "captured_at"))),
    CONSTRAINT "brain_sources_check1" CHECK ((("integrity_sha256" IS NOT NULL) OR (NULLIF("btrim"("external_locator"), ''::"text") IS NOT NULL))),
    CONSTRAINT "brain_sources_check2" CHECK (((("content_ciphertext" IS NULL) AND ("encryption_version" IS NULL)) OR (("content_ciphertext" IS NOT NULL) AND ("encryption_version" IS NOT NULL) AND ("encryption_version" > 0)))),
    CONSTRAINT "brain_sources_integrity_sha256_check" CHECK ((("integrity_sha256" IS NULL) OR ("integrity_sha256" ~ '^[0-9a-f]{64}$'::"text"))),
    CONSTRAINT "brain_sources_purpose_check" CHECK ((("char_length"("btrim"("purpose")) >= 1) AND ("char_length"("btrim"("purpose")) <= 160))),
    CONSTRAINT "brain_sources_source_type_check" CHECK (("source_type" = ANY (ARRAY['voice'::"text", 'text'::"text", 'meeting'::"text", 'document'::"text", 'correction'::"text", 'observed_action'::"text", 'external'::"text"])))
);

ALTER TABLE ONLY "public"."brain_sources" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."brain_sources" IS 'Immutable encrypted evidence envelopes or governed external pointers.';



CREATE TABLE IF NOT EXISTS "public"."brain_workspace_roles" (
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "brain_workspace_roles_check" CHECK ((("revoked_at" IS NULL) OR ("revoked_at" >= "granted_at"))),
    CONSTRAINT "brain_workspace_roles_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'operator'::"text", 'contributor'::"text", 'viewer'::"text", 'approver'::"text"])))
);

ALTER TABLE ONLY "public"."brain_workspace_roles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_workspace_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."brain_workspace_roles" IS 'Membership and responsibility only; content access still requires an audience grant.';



CREATE TABLE IF NOT EXISTS "public"."brain_workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "tenant_key" "text" NOT NULL,
    "workspace_kind" "text" DEFAULT 'personal'::"text" NOT NULL,
    "lifecycle_state" "text" DEFAULT 'active'::"text" NOT NULL,
    "default_retention_days" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "brain_workspaces_check" CHECK ((("workspace_kind" <> 'personal'::"text") OR ("subject_id" = "owner_id"))),
    CONSTRAINT "brain_workspaces_default_retention_days_check" CHECK ((("default_retention_days" IS NULL) OR (("default_retention_days" >= 1) AND ("default_retention_days" <= 3650)))),
    CONSTRAINT "brain_workspaces_lifecycle_state_check" CHECK (("lifecycle_state" = ANY (ARRAY['active'::"text", 'paused'::"text", 'archived'::"text"]))),
    CONSTRAINT "brain_workspaces_workspace_kind_check" CHECK (("workspace_kind" = ANY (ARRAY['personal'::"text", 'company'::"text", 'project'::"text"])))
);

ALTER TABLE ONLY "public"."brain_workspaces" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_workspaces" OWNER TO "postgres";


COMMENT ON TABLE "public"."brain_workspaces" IS 'Tenant and subject boundary for one versioned Living Brain.';



CREATE TABLE IF NOT EXISTS "public"."briefing_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "briefing_id" "uuid" NOT NULL,
    "segment_index" integer NOT NULL,
    "reaction" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "lens_item_id" "text",
    "dwell_ms" integer,
    "replayed" boolean DEFAULT false NOT NULL,
    CONSTRAINT "briefing_feedback_reaction_check" CHECK (("reaction" = ANY (ARRAY['useful'::"text", 'not_useful'::"text", 'save'::"text"])))
);


ALTER TABLE "public"."briefing_feedback" OWNER TO "postgres";


COMMENT ON COLUMN "public"."briefing_feedback"."lens_item_id" IS 'The LensItem id the reacted segment matched against. Used to weight future generations.';



COMMENT ON COLUMN "public"."briefing_feedback"."dwell_ms" IS 'Milliseconds the user kept the segment open. Signal beyond the binary reaction.';



COMMENT ON COLUMN "public"."briefing_feedback"."replayed" IS 'True if the user replayed the segment audio. Strong positive signal.';



CREATE TABLE IF NOT EXISTS "public"."briefing_lens_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lens_item_signature" "text" NOT NULL,
    "lens_item_type" "text" NOT NULL,
    "lens_item_text" "text" NOT NULL,
    "weight_delta" numeric NOT NULL,
    "source" "text" NOT NULL,
    "evidence_count" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "briefing_lens_feedback_source_check" CHECK (("source" = ANY (ARRAY['kill'::"text", 'not_useful_aggregate'::"text"])))
);


ALTER TABLE "public"."briefing_lens_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."briefing_lens_feedback" IS 'Persistent negative weight deltas on lens item signatures. Feeds into buildImportanceLens to suppress or down-weight items the user has rejected.';



COMMENT ON COLUMN "public"."briefing_lens_feedback"."lens_item_signature" IS 'SHA-256 hex of normalized "type|text". Stable across daily lens regenerations.';



COMMENT ON COLUMN "public"."briefing_lens_feedback"."evidence_count" IS 'For aggregate rows: the number of individual not_useful reactions that contributed. Useful for diagnostics.';



CREATE TABLE IF NOT EXISTS "public"."briefings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "briefing_date" "date" NOT NULL,
    "script_text" "text",
    "segments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "audio_url" "text",
    "audio_duration_seconds" integer,
    "context_snapshot" "jsonb",
    "news_sources" "jsonb",
    "generation_model" "text" DEFAULT 'gpt-4o'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "briefing_type" "text" DEFAULT 'default'::"text" NOT NULL,
    "custom_context" "text",
    "voice_note_url" "text",
    "is_pro_only" boolean DEFAULT false NOT NULL,
    "schema_version" integer DEFAULT 1 NOT NULL,
    "stage" "text",
    "error_text" "text",
    "generation_started_at" timestamp with time zone,
    CONSTRAINT "briefings_briefing_type_check" CHECK (("briefing_type" = ANY (ARRAY['default'::"text", 'macro_trends'::"text", 'vendor_landscape'::"text", 'competitive_intel'::"text", 'boardroom_prep'::"text", 'team_update'::"text", 'ai_landscape'::"text", 'custom_voice'::"text"])))
);


ALTER TABLE "public"."briefings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."briefings"."schema_version" IS 'Output-contract version. 1 = legacy prompt-flattened pipeline. 2 = evidence-based lens pipeline (segments carry lens_item_id, relevance_score, matched_profile_fact).';



COMMENT ON COLUMN "public"."briefings"."stage" IS 'Background-job pipeline stage: queued|scanning|searching|curating|scripting|complete|failed. Null = legacy synchronous row.';



CREATE TABLE IF NOT EXISTS "public"."cannes_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "q1_week_needs_me" integer,
    "q2_extra_self" "text",
    "q3_company_ai" integer,
    "q4_company_future" "text",
    "q5_decision" "text",
    "archetype_title" "text",
    "archetype_variant" character(1),
    "result_prose_12mo" "text",
    "result_prose_3yr" "text",
    "email" "text",
    "email_captured_at" timestamp with time zone,
    "email_sent_at" timestamp with time zone,
    "fork_choice" "text",
    "fork_clicked_at" timestamp with time zone,
    "user_agent" "text",
    "source" "text",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "completion_time_ms" integer,
    "enrichment_status" "text",
    "enrichment_kind" "text",
    "enrichment_name" "text",
    "enrichment_role" "text",
    "enrichment_company" "text",
    "enrichment_company_blurb" "text",
    "enrichment_signals" "jsonb",
    "enrichment_started_at" timestamp with time zone,
    "enrichment_completed_at" timestamp with time zone,
    "entry_variant" "text",
    "enrichment_raw_input" "jsonb",
    "resolved_linkedin_url" "text",
    "resolution_confidence" "text",
    "resolution_provenance" "jsonb",
    "providers_hit" "jsonb",
    "email_deliverable" boolean,
    "company_domain" "text",
    "company_context" "jsonb",
    "person_experience" "jsonb",
    "email_send_claimed_at" timestamp with time zone,
    "dossier_confirmed_at" timestamp with time zone,
    CONSTRAINT "cannes_responses_entry_variant_check" CHECK ((("entry_variant" IS NULL) OR ("entry_variant" = ANY (ARRAY['decide'::"text", 'extend'::"text", 'imagine'::"text"]))))
);


ALTER TABLE "public"."cannes_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "message_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb",
    "insights" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'user'::"text",
    "tool_context" "text",
    "assessment_id" "uuid",
    CONSTRAINT "chat_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['user'::"text", 'ai'::"text", 'system'::"text"]))),
    CONSTRAINT "chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_context" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leader_id" "uuid" NOT NULL,
    "assessment_id" "uuid",
    "company_name" "text" NOT NULL,
    "apollo_data" "jsonb" DEFAULT '{}'::"jsonb",
    "website_url" "text",
    "website_content" "text",
    "board_deck_urls" "text"[] DEFAULT '{}'::"text"[],
    "board_deck_content" "jsonb" DEFAULT '[]'::"jsonb",
    "calendar_connected" boolean DEFAULT false,
    "calendar_events" "jsonb" DEFAULT '[]'::"jsonb",
    "enrichment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "company_context_enrichment_status_check" CHECK (("enrichment_status" = ANY (ARRAY['pending'::"text", 'partial'::"text", 'complete'::"text"])))
);


ALTER TABLE "public"."company_context" OWNER TO "postgres";


COMMENT ON TABLE "public"."company_context" IS 'Stores enriched company intelligence from Apollo.io and user-provided context';



CREATE TABLE IF NOT EXISTS "public"."company_identifier_salt" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "salt_value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "rotated_at" timestamp with time zone,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."company_identifier_salt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_research_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "domain" "text" NOT NULL,
    "research_data" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_research_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participant_id" "uuid",
    "user_id" "uuid",
    "consent_purpose" "public"."consent_purpose" NOT NULL,
    "previous_value" boolean,
    "new_value" boolean NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "changed_by" "text",
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."consent_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."constructs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scope" "text" DEFAULT 'person'::"text" NOT NULL,
    "emergent_pole" "text" NOT NULL,
    "contrast_pole" "text",
    "rationale" "text",
    "observable" "text",
    "status" "text" DEFAULT 'candidate'::"text" NOT NULL,
    "evidence_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "constructs_scope_check" CHECK (("scope" = 'person'::"text")),
    CONSTRAINT "constructs_status_check" CHECK (("status" = ANY (ARRAY['candidate'::"text", 'elicited'::"text", 'compiled'::"text", 'retired'::"text"]))),
    CONSTRAINT "elicited_needs_both_poles" CHECK ((("status" = 'candidate'::"text") OR (("contrast_pole" IS NOT NULL) AND ("length"("contrast_pole") > 0)))),
    CONSTRAINT "elicited_needs_evidence" CHECK ((("status" = 'candidate'::"text") OR ("array_length"("evidence_ids", 1) >= 2)))
);


ALTER TABLE "public"."constructs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contest_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "surface" "text",
    "element" "text",
    "note" "text",
    "context" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "honored" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contest_reports_kind_check" CHECK (("kind" = ANY (ARRAY['visual'::"text", 'functional'::"text", 'factual'::"text"]))),
    CONSTRAINT "contest_reports_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'honored'::"text", 'triaged'::"text", 'resolved'::"text"]))),
    CONSTRAINT "contest_reports_target_type_check" CHECK (("target_type" = ANY (ARRAY['decision_claim'::"text", 'memory_fact'::"text", 'market_read'::"text", 'ui_element'::"text"])))
);


ALTER TABLE "public"."contest_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_title" "text",
    "session_summary" "text",
    "business_context" "jsonb",
    "lead_qualification_score" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "last_activity" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "conversation_sessions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."conversation_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversion_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "conversion_type" "text" NOT NULL,
    "service_type" "text",
    "lead_score" integer,
    "session_duration" integer,
    "messages_exchanged" integer DEFAULT 0,
    "topics_explored" integer DEFAULT 0,
    "insights_generated" integer DEFAULT 0,
    "conversion_value" numeric(10,2),
    "source_channel" "text" DEFAULT 'ai_chat'::"text",
    "conversion_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "conversion_analytics_conversion_type_check" CHECK (("conversion_type" = ANY (ARRAY['booking_request'::"text", 'email_signup'::"text", 'resource_download'::"text", 'consultation_scheduled'::"text"])))
);


ALTER TABLE "public"."conversion_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."criteria" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scope" "text" DEFAULT 'person'::"text" NOT NULL,
    "owner_label" "text",
    "construct_id" "uuid",
    "surface" "text" NOT NULL,
    "name" "text" NOT NULL,
    "check_text" "text" NOT NULL,
    "observable" "text",
    "weight" "text" NOT NULL,
    "holds_example" "text",
    "breaks_example" "text",
    "n_rejected" integer,
    "n_rejected_failing" integer,
    "n_accepted" integer,
    "n_accepted_failing" integer,
    "disc_verdict" "text" DEFAULT 'untested'::"text" NOT NULL,
    "provenance" "jsonb" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "is_current" boolean DEFAULT true NOT NULL,
    "disposition" "text" DEFAULT 'advisory'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "criteria_disc_verdict_check" CHECK (("disc_verdict" = ANY (ARRAY['keep'::"text", 'delete'::"text", 'untested'::"text"]))),
    CONSTRAINT "criteria_disposition_check" CHECK (("disposition" = ANY (ARRAY['advisory'::"text", 'blocking'::"text", 'retired'::"text"]))),
    CONSTRAINT "criteria_scope_check" CHECK (("scope" = 'person'::"text")),
    CONSTRAINT "criteria_weight_check" CHECK (("weight" = ANY (ARRAY['essential'::"text", 'important'::"text", 'optional'::"text", 'pitfall'::"text"]))),
    CONSTRAINT "provenance_is_real" CHECK ((("jsonb_typeof"("provenance") = 'object'::"text") AND ("provenance" <> '{}'::"jsonb")))
);


ALTER TABLE "public"."criteria" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "actor_id" "uuid",
    "action_type" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "text",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "metadata" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."data_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "decision_case_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "claim_id" "uuid",
    "kind" "text" NOT NULL,
    "headline" "text" NOT NULL,
    "detail" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "surfaced_in_briefing_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "acknowledged_at" timestamp with time zone,
    CONSTRAINT "decision_alerts_kind_check" CHECK (("kind" = ANY (ARRAY['assumption_broke'::"text", 'evidence_shifted'::"text", 'new_contradiction'::"text"]))),
    CONSTRAINT "decision_alerts_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'acknowledged'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."decision_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "statement" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "decision_kind" "text" DEFAULT 'other'::"text",
    "source" "text" DEFAULT 'advisor'::"text",
    "stage" "text" DEFAULT 'decomposing'::"text" NOT NULL,
    "objective_fact_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "user_decision_id" "uuid",
    "recommendation" "text",
    "counter_case" "text",
    "breakpoint_assumption_id" "uuid",
    "confidence" numeric(3,2),
    "error_detail" "text",
    "last_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "validate_next" "text"[] DEFAULT '{}'::"text"[],
    "goal_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "reframed" boolean DEFAULT false NOT NULL,
    "reframed_statement" "text",
    "reframe_note" "text",
    "lifecycle_stage" "text",
    "pinned_at" timestamp with time zone,
    "force_labels" "jsonb",
    CONSTRAINT "decision_cases_decision_kind_check" CHECK (("decision_kind" = ANY (ARRAY['binary'::"text", 'directional'::"text", 'investment'::"text", 'hiring'::"text", 'gtm'::"text", 'other'::"text"]))),
    CONSTRAINT "decision_cases_lifecycle_stage_check" CHECK ((("lifecycle_stage" IS NULL) OR ("lifecycle_stage" = ANY (ARRAY['build'::"text", 'orchestrate'::"text", 'productize'::"text", 'gtm'::"text", 'substrate'::"text"])))),
    CONSTRAINT "decision_cases_source_check" CHECK (("source" = ANY (ARRAY['advisor'::"text", 'capture'::"text", 'voice'::"text", 'fireflies'::"text"]))),
    CONSTRAINT "decision_cases_stage_check" CHECK (("stage" = ANY (ARRAY['decomposing'::"text", 'verifying'::"text", 'cross_examining'::"text", 'advising'::"text", 'complete'::"text", 'error'::"text"]))),
    CONSTRAINT "decision_cases_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'decided'::"text", 'stale'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."decision_cases" OWNER TO "postgres";


COMMENT ON COLUMN "public"."decision_cases"."reframed" IS 'true when a general-business statement was reframed into its AI-native version before the engine reasoned on it.';



COMMENT ON COLUMN "public"."decision_cases"."reframed_statement" IS 'the AI-native restatement the pipeline decomposed/advised on; null when no reframe was needed (the original statement was already AI-native).';



COMMENT ON COLUMN "public"."decision_cases"."reframe_note" IS 'the honest, leader-facing note explaining that and why the decision was reframed.';



COMMENT ON COLUMN "public"."decision_cases"."lifecycle_stage" IS 'the AI-native lifecycle stage (build/orchestrate/productize/gtm/substrate) the decision lives in, when known.';



CREATE TABLE IF NOT EXISTS "public"."decision_check_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "decision_case_id" "uuid" NOT NULL,
    "item_key" "text" NOT NULL,
    "item_text" "text" NOT NULL,
    "done" boolean DEFAULT false NOT NULL,
    "done_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."decision_check_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "decision_case_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "type" "text" NOT NULL,
    "is_load_bearing" boolean DEFAULT false NOT NULL,
    "verdict" "text" DEFAULT 'pending'::"text" NOT NULL,
    "confidence" numeric(3,2),
    "rationale" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "reaction_value" "text",
    "reaction_descriptor" "text",
    "reaction_kind" "text",
    "reaction_evidence_id" "uuid",
    "dimension" "text",
    CONSTRAINT "decision_claims_dimension_check" CHECK ((("dimension" IS NULL) OR ("dimension" = ANY (ARRAY['capability'::"text", 'economics'::"text", 'risk'::"text", 'build_buy'::"text", 'team'::"text", 'timing'::"text"])))),
    CONSTRAINT "decision_claims_reaction_kind_check" CHECK ((("reaction_kind" IS NULL) OR ("reaction_kind" = ANY (ARRAY['sourced'::"text", 'modelled'::"text"])))),
    CONSTRAINT "decision_claims_type_check" CHECK (("type" = ANY (ARRAY['factual'::"text", 'market'::"text", 'causal'::"text", 'assumption'::"text", 'forecast'::"text"]))),
    CONSTRAINT "decision_claims_verdict_check" CHECK (("verdict" = ANY (ARRAY['supported'::"text", 'contested'::"text", 'unverified'::"text", 'unverifiable'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."decision_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_eval_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_text" "text" NOT NULL,
    "claim_type" "text" NOT NULL,
    "gold_verdict" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "decision_eval_cases_claim_type_check" CHECK (("claim_type" = ANY (ARRAY['factual'::"text", 'market'::"text", 'causal'::"text", 'assumption'::"text", 'forecast'::"text"]))),
    CONSTRAINT "decision_eval_cases_gold_verdict_check" CHECK (("gold_verdict" = ANY (ARRAY['supported'::"text", 'contested'::"text", 'unverified'::"text", 'unverifiable'::"text"])))
);


ALTER TABLE "public"."decision_eval_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "decision_case_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "decision_events_type_check" CHECK (("type" = ANY (ARRAY['created'::"text", 'verified'::"text", 'advice_updated'::"text", 'assumption_broke'::"text", 'acknowledged'::"text", 'contested_by_user'::"text"])))
);


ALTER TABLE "public"."decision_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_evidence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_url" "text",
    "source_type" "text",
    "source_title" "text",
    "excerpt" "text",
    "stance" "text" DEFAULT 'neutral'::"text",
    "retriever" "text",
    "relevance_score" numeric,
    "retrieved_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "reliability_tier" "text",
    "key_point" "text",
    "published_at" timestamp with time zone,
    "evidence_score" numeric,
    "theme" "text",
    CONSTRAINT "decision_evidence_reliability_tier_check" CHECK ((("reliability_tier" IS NULL) OR ("reliability_tier" = ANY (ARRAY['primary'::"text", 'reputable'::"text", 'community'::"text", 'unverified'::"text"])))),
    CONSTRAINT "decision_evidence_retriever_check" CHECK (("retriever" = ANY (ARRAY['perplexity'::"text", 'exa'::"text", 'brave'::"text", 'tavily'::"text", 'newsapi'::"text", 'pdl'::"text", 'builtwith'::"text", 'tranco'::"text", 'memory'::"text", 'user_contest'::"text", 'artificialanalysis'::"text"]))),
    CONSTRAINT "decision_evidence_score_range" CHECK ((("evidence_score" IS NULL) OR (("evidence_score" >= (0)::numeric) AND ("evidence_score" <= (100)::numeric)))),
    CONSTRAINT "decision_evidence_stance_check" CHECK (("stance" = ANY (ARRAY['supports'::"text", 'refutes'::"text", 'neutral'::"text"])))
);


ALTER TABLE "public"."decision_evidence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_frameworks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "decision_process" "text",
    "decision_criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "tension_map" "jsonb" DEFAULT '{}'::"jsonb",
    "key_concepts" "jsonb" DEFAULT '[]'::"jsonb",
    "sample_artifacts" "jsonb" DEFAULT '{}'::"jsonb",
    "next_steps" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "decision_style_observed" "text",
    "time_to_alignment_minutes" integer,
    "major_tensions" "text"[] DEFAULT ARRAY[]::"text"[],
    "unresolved_disagreements" "text"[] DEFAULT ARRAY[]::"text"[]
);


ALTER TABLE "public"."decision_frameworks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."decision_frameworks"."decision_style_observed" IS 'consensus, executive_override, delegation, avoidance';



COMMENT ON COLUMN "public"."decision_frameworks"."time_to_alignment_minutes" IS 'Total time from first battle test to final framework';



COMMENT ON COLUMN "public"."decision_frameworks"."major_tensions" IS 'Key tensions surfaced across all battle tests';



COMMENT ON COLUMN "public"."decision_frameworks"."unresolved_disagreements" IS 'Disagreements that remained unresolved by end of session';



CREATE TABLE IF NOT EXISTS "public"."decision_outcomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "decision_case_id" "uuid" NOT NULL,
    "resolution" "text",
    "played_out" "text",
    "process_quality" smallint,
    "outcome_note" "text",
    "source" "text",
    "applied_to_brain" boolean DEFAULT false,
    "judged_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "decision_outcomes_played_out_check" CHECK (("played_out" = ANY (ARRAY['true'::"text", 'false'::"text", 'too_early'::"text"]))),
    CONSTRAINT "decision_outcomes_process_quality_check" CHECK ((("process_quality" >= 1) AND ("process_quality" <= 5))),
    CONSTRAINT "decision_outcomes_resolution_check" CHECK (("resolution" = ANY (ARRAY['proceed'::"text", 'hold'::"text", 'reopen'::"text"])))
);


ALTER TABLE "public"."decision_outcomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_tensions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "decision_case_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "description" "text" NOT NULL,
    "severity" "text" DEFAULT 'medium'::"text",
    "related_claim_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "decision_tensions_kind_check" CHECK (("kind" = ANY (ARRAY['vs_profile'::"text", 'vs_evidence'::"text", 'internal'::"text", 'model_disagreement'::"text"]))),
    CONSTRAINT "decision_tensions_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."decision_tensions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_user_calls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "decision_case_id" "uuid" NOT NULL,
    "claim_id" "uuid",
    "call" "text" NOT NULL,
    "reasoning" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "decision_user_calls_call_check" CHECK (("call" = ANY (ARRAY['accept'::"text", 'reject'::"text", 'unsure'::"text"])))
);


ALTER TABLE "public"."decision_user_calls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "onboarding_response_id" "uuid",
    "channel" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "destination_hash" "text" NOT NULL,
    "provider_connection_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "content_modes" "text"[] DEFAULT ARRAY['text'::"text", 'audio'::"text"] NOT NULL,
    "timezone" "text" DEFAULT 'UTC'::"text" NOT NULL,
    "delivery_hour" smallint DEFAULT 8 NOT NULL,
    "consent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consent_source" "text" DEFAULT 'ctrl_onboarding'::"text" NOT NULL,
    "unsubscribe_token" "text" NOT NULL,
    "unsubscribe_token_hash" "text" NOT NULL,
    "last_sent_date" "date",
    "delivery_claimed_at" timestamp with time zone,
    "last_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "delivery_subscriptions_channel_check" CHECK (("channel" = ANY (ARRAY['email'::"text", 'slack'::"text", 'whatsapp'::"text"]))),
    CONSTRAINT "delivery_subscriptions_delivery_hour_check" CHECK ((("delivery_hour" >= 0) AND ("delivery_hour" <= 23))),
    CONSTRAINT "delivery_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'unsubscribed'::"text", 'bounced'::"text"])))
);


ALTER TABLE "public"."delivery_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."delivery_subscriptions" IS 'Canonical delivery spine for CTRL briefings. Service-role only; public subscribe/unsubscribe functions enforce consent and token checks.';



CREATE TABLE IF NOT EXISTS "public"."edge_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "capability_key" "text" NOT NULL,
    "target_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "input_context" "jsonb" DEFAULT '{}'::"jsonb",
    "output_content" "text",
    "output_format" "text" DEFAULT 'markdown'::"text" NOT NULL,
    "delivered_via" "text",
    "delivered_to_email" "text",
    "user_rating" integer,
    "was_used" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "edge_actions_action_type_check" CHECK (("action_type" = ANY (ARRAY['sharpen'::"text", 'cover'::"text"]))),
    CONSTRAINT "edge_actions_delivered_via_check" CHECK (("delivered_via" = ANY (ARRAY['app'::"text", 'email'::"text", 'both'::"text"]))),
    CONSTRAINT "edge_actions_user_rating_check" CHECK ((("user_rating" >= 1) AND ("user_rating" <= 5)))
);


ALTER TABLE "public"."edge_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edge_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feedback_type" "text" NOT NULL,
    "target_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "edge_feedback_feedback_type_check" CHECK (("feedback_type" = ANY (ARRAY['strength_confirm'::"text", 'strength_reject'::"text", 'weakness_confirm'::"text", 'weakness_reject'::"text"])))
);


ALTER TABLE "public"."edge_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edge_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "strengths" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "weaknesses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "intelligence_gaps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "profile_version" integer DEFAULT 1 NOT NULL,
    "last_synthesized_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "synthesis_inputs" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."edge_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edge_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "edge_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'past_due'::"text", 'canceled'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."edge_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."effortless_map_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "activity_session_id" "uuid",
    "participant_name" "text" NOT NULL,
    "item_text" "text" NOT NULL,
    "lane" "text" NOT NULL,
    "constraint_inverted" boolean DEFAULT false,
    "sponsor_name" "text",
    "vote_count" integer DEFAULT 0,
    "priority_rank" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid",
    CONSTRAINT "effortless_map_items_lane_check" CHECK (("lane" = ANY (ARRAY['customers'::"text", 'content'::"text", 'operations'::"text", 'risk'::"text"])))
);

ALTER TABLE ONLY "public"."effortless_map_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."effortless_map_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engagement_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."engagement_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engagement_intelligence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "offer_id" "text" NOT NULL,
    "tier_id" "text",
    "currency" "text",
    "company_label" "text",
    "sector" "text",
    "headcount_band" "text",
    "engagement_started_on" "date",
    "engagement_ended_on" "date",
    "pricing_and_packaging" "text",
    "what_converted" "text",
    "what_had_to_change" "text",
    "commercial_constraint" "text",
    "structured" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "retention_consented" boolean DEFAULT false NOT NULL,
    "consent_note" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "engagement_intelligence_currency_check" CHECK (("currency" = ANY (ARRAY['USD'::"text", 'GBP'::"text", 'AUD'::"text"]))),
    CONSTRAINT "engagement_intelligence_offer_id_check" CHECK (("offer_id" = ANY (ARRAY['teardown'::"text", 'handover'::"text"])))
);


ALTER TABLE "public"."engagement_intelligence" OWNER TO "postgres";


COMMENT ON TABLE "public"."engagement_intelligence" IS 'What each engagement systematically captures. Typed columns so it can be queried across clients, not a memo per engagement. Service-role only, never surfaced to the site or to Mindy.';



CREATE TABLE IF NOT EXISTS "public"."evidence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "body" "text" NOT NULL,
    "quote" "text",
    "source_id" "uuid",
    "quote_start" integer,
    "quote_end" integer,
    "source_label" "text" NOT NULL,
    "source_ref" "text",
    "occurred_at" timestamp with time zone,
    "captured_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "situated" boolean DEFAULT true NOT NULL,
    "situation" "text",
    "standing_promoted_by" "uuid",
    "standing_at" timestamp with time zone,
    "standing_evidence_ids" "uuid"[],
    "speaker_is_owner" boolean,
    "redacted_at" timestamp with time zone,
    "retention_expires_at" timestamp with time zone,
    "memory_fact_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "derived_must_point_somewhere" CHECK ((("kind" <> 'derived'::"text") OR ("source_ref" IS NOT NULL))),
    CONSTRAINT "evidence_kind_check" CHECK (("kind" = ANY (ARRAY['utterance'::"text", 'artefact'::"text", 'grade'::"text", 'observation'::"text", 'declared'::"text", 'derived'::"text"]))),
    CONSTRAINT "offsets_come_together" CHECK (((("quote_start" IS NULL) AND ("quote_end" IS NULL)) OR (("quote_start" IS NOT NULL) AND ("quote_end" IS NOT NULL) AND ("quote_end" > "quote_start")))),
    CONSTRAINT "quote_required_for_speech" CHECK ((("kind" <> ALL (ARRAY['utterance'::"text", 'declared'::"text"])) OR ("redacted_at" IS NOT NULL) OR (("quote" IS NOT NULL) AND ("length"("quote") > 0)))),
    CONSTRAINT "situation_required_when_situated" CHECK ((("situated" = false) OR (("situation" IS NOT NULL) AND ("length"("situation") > 0)))),
    CONSTRAINT "standing_requires_promotion" CHECK ((("situated" = true) OR (("standing_promoted_by" IS NOT NULL) AND ("array_length"("standing_evidence_ids", 1) >= 2))))
);


ALTER TABLE "public"."evidence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evidence_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "label" "text" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "evidence_sources_kind_check" CHECK (("kind" = ANY (ARRAY['transcript'::"text", 'paste'::"text", 'artefact'::"text", 'upload'::"text"])))
);


ALTER TABLE "public"."evidence_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exec_intakes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "industry" "text",
    "strategic_objectives_2026" "text",
    "anticipated_bottlenecks" "jsonb" DEFAULT '[]'::"jsonb",
    "participants" "jsonb" DEFAULT '[]'::"jsonb",
    "preferred_dates" "jsonb" DEFAULT '[]'::"jsonb",
    "scheduling_notes" "text",
    "organizer_email" "text" NOT NULL,
    "organizer_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_2026" "text",
    "current_ai_initiatives" "text",
    "decision_type" "text",
    "workflow_bottlenecks" "text",
    "board_pack_url" "text",
    "strategic_context_complete" boolean DEFAULT false,
    CONSTRAINT "exec_intakes_decision_type_check" CHECK (("decision_type" = ANY (ARRAY['start_pilot'::"text", 'pick_vendor'::"text", 'kill_or_scale'::"text", 'board_prep'::"text"])))
);


ALTER TABLE "public"."exec_intakes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exec_pulses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "intake_id" "uuid",
    "participant_email" "text" NOT NULL,
    "participant_name" "text" NOT NULL,
    "participant_role" "text" NOT NULL,
    "awareness_score" integer,
    "application_score" integer,
    "trust_score" integer,
    "governance_score" integer,
    "pulse_responses" "jsonb" DEFAULT '{}'::"jsonb",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid"
);


ALTER TABLE "public"."exec_pulses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fact_extraction_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "raw_fact" "jsonb" NOT NULL,
    "reason_id" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "training_material_version" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fact_extraction_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."fact_extraction_log" IS 'Rejection log for every fact the guardrails drop before insertion. Drives the extraction_health view.';



CREATE OR REPLACE VIEW "public"."extraction_health" WITH ("security_invoker"='on') AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "day",
    "reason_id",
    "count"(*) AS "rejections",
    "training_material_version"
   FROM "public"."fact_extraction_log"
  GROUP BY ("date_trunc"('day'::"text", "created_at")), "reason_id", "training_material_version"
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC, ("count"(*)) DESC;


ALTER VIEW "public"."extraction_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "feedback_text" "text" NOT NULL,
    "page_context" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."feedback" IS 'Stores user feedback submitted via the feedback dialog';



CREATE TABLE IF NOT EXISTS "public"."follow_up_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" NOT NULL,
    "send_after" timestamp with time zone NOT NULL,
    "sent_at" timestamp with time zone,
    "attempts" smallint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "follow_up_queue_source_check" CHECK (("source" = ANY (ARRAY['brief'::"text", 'personal-read'::"text"])))
);


ALTER TABLE "public"."follow_up_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."follow_up_queue" IS 'Day-14 follow-up, one per lead. Rows are purged after send: see mindmake_purge_follow_ups.';



CREATE TABLE IF NOT EXISTS "public"."generated_artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "name" "text" NOT NULL,
    "body" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "generated_artifacts_kind_check" CHECK (("kind" = ANY (ARRAY['skill'::"text", 'draft'::"text", 'export'::"text", 'framework'::"text", 'briefing_custom'::"text", 'standard'::"text"])))
);


ALTER TABLE "public"."generated_artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "detail" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "horizon" "text" DEFAULT 'quarter'::"text" NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "progress" numeric(3,2),
    "target_date" "date",
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "source_ref" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "goals_horizon_check" CHECK (("horizon" = ANY (ARRAY['now'::"text", 'quarter'::"text", 'year'::"text", 'north_star'::"text"]))),
    CONSTRAINT "goals_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'business_context'::"text", 'memory'::"text", 'decision'::"text", 'mission'::"text", 'voice'::"text"]))),
    CONSTRAINT "goals_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'achieved'::"text", 'paused'::"text", 'dropped'::"text"])))
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."google_sheets_sync_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sync_type" "text" NOT NULL,
    "data_count" integer DEFAULT 0,
    "sync_data" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "sync_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lead_id" "uuid",
    "sheet_row_id" "text",
    "last_updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "google_sheets_sync_log_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'prepared'::"text", 'synced'::"text", 'failed'::"text", 'ready_for_http'::"text", 'needs_processing'::"text", 'http_sent'::"text", 'batch_failed'::"text"]))),
    CONSTRAINT "google_sheets_sync_log_sync_type_check" CHECK (("sync_type" = ANY (ARRAY['booking'::"text", 'analytics'::"text", 'lead_scores'::"text", 'full_sync'::"text"])))
);


ALTER TABLE "public"."google_sheets_sync_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."harness_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "surface" "text",
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "stage" "text" DEFAULT 'created'::"text" NOT NULL,
    "stage_detail" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "pass" integer DEFAULT 1 NOT NULL,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "harness_runs_kind_check" CHECK (("kind" = ANY (ARRAY['sort'::"text", 'compile'::"text", 'generate'::"text", 'critique'::"text", 'measure'::"text"]))),
    CONSTRAINT "harness_runs_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'done'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."harness_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."huddle_synthesis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "synthesis_text" "text" NOT NULL,
    "key_themes" "jsonb" DEFAULT '[]'::"jsonb",
    "priority_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."huddle_synthesis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."index_participant_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "industry" "text",
    "company_size" "text",
    "role_title" "text",
    "company_identifier_hash" "text",
    "readiness_score" integer,
    "tier" "text",
    "dimension_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "assessment_type" "text",
    "completed_at" timestamp with time zone NOT NULL,
    "consent_flags" "jsonb" DEFAULT '{"case_study": false, "sales_outreach": false, "index_publication": false, "product_improvements": true, "research_partnerships": false}'::"jsonb",
    "consent_updated_at" timestamp with time zone DEFAULT "now"(),
    "confidence_weight" numeric(3,2) DEFAULT 1.0,
    "effective_sample_contribution" numeric(3,2) GENERATED ALWAYS AS (
CASE
    WHEN (("consent_flags" ->> 'index_publication'::"text"))::boolean THEN "confidence_weight"
    ELSE (0)::numeric
END) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ai_learning_style" "text",
    "deep_profile_data" "jsonb",
    "time_waste_pct" integer,
    "delegation_tasks_count" integer,
    "stakeholder_count" integer,
    "urgency_level" "text",
    "primary_bottleneck" "text",
    CONSTRAINT "index_participant_data_assessment_type_check" CHECK (("assessment_type" = ANY (ARRAY['voice'::"text", 'quiz'::"text", 'ai_leadership_benchmark'::"text"]))),
    CONSTRAINT "index_participant_data_confidence_weight_check" CHECK ((("confidence_weight" >= (0)::numeric) AND ("confidence_weight" <= (1)::numeric))),
    CONSTRAINT "index_participant_data_readiness_score_check" CHECK ((("readiness_score" >= 0) AND ("readiness_score" <= 100))),
    CONSTRAINT "index_participant_data_tier_check" CHECK (("tier" = ANY (ARRAY['emerging'::"text", 'establishing'::"text", 'advancing'::"text", 'leading'::"text"]))),
    CONSTRAINT "index_participant_data_urgency_level_check" CHECK (("urgency_level" = ANY (ARRAY['immediate'::"text", 'this_quarter'::"text", 'exploring'::"text", 'future'::"text"])))
);


ALTER TABLE "public"."index_participant_data" OWNER TO "postgres";


COMMENT ON COLUMN "public"."index_participant_data"."ai_learning_style" IS 'AI Learning Style cohort: strategic_visionary, pragmatic_executor, collaborative_builder, analytical_optimizer, or adaptive_explorer';



COMMENT ON COLUMN "public"."index_participant_data"."deep_profile_data" IS 'Full deep profile questionnaire responses for cohort analysis';



CREATE TABLE IF NOT EXISTS "public"."index_publication_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version" "text" NOT NULL,
    "is_active" boolean DEFAULT false,
    "min_segment_size" integer DEFAULT 30,
    "min_effective_sample_size" integer DEFAULT 20,
    "confidence_level" numeric(3,2) DEFAULT 0.95,
    "bootstrap_iterations" integer DEFAULT 1000,
    "percentile_rounding" integer DEFAULT 5,
    "outlier_method" "text" DEFAULT 'winsorize'::"text",
    "outlier_threshold" numeric(3,2) DEFAULT 0.05,
    "methodology_url" "text",
    "changelog" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."index_publication_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."industry_beat_library" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "industry_key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "aliases" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "beats" "jsonb" NOT NULL,
    "entities" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."industry_beat_library" OWNER TO "postgres";


COMMENT ON TABLE "public"."industry_beat_library" IS 'Canonical beats + recommended entities per industry. Seeds the Briefing Interests flow for new users before they have declared anything.';



COMMENT ON COLUMN "public"."industry_beat_library"."aliases" IS 'Lowercase substrings matched against user-declared industry fact (fact_key=industry) to resolve to an industry_key.';



CREATE TABLE IF NOT EXISTS "public"."insight_dimensions" (
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "scale_type" "text" NOT NULL,
    "scale_labels" "jsonb",
    "applicable_tools" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."insight_dimensions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intake_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text",
    "client_slug" "text",
    "name" "text",
    "role" "text",
    "company" "text",
    "email" "text",
    "link" "text",
    "seat" "text",
    "confidence_now" integer,
    "business_oneliner" "text",
    "north_star" "text",
    "value_frame" "text",
    "wish" "text",
    "anything_else" "text",
    "responses" "jsonb",
    "meta" "jsonb"
);


ALTER TABLE "public"."intake_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kit_artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "redemption_id" "uuid" NOT NULL,
    "build_id" "uuid",
    "artifact_id" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "is_current" boolean DEFAULT true NOT NULL,
    "title" "text" NOT NULL,
    "content_type" "text" NOT NULL,
    "body" "text",
    "storage_path" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "zip_base64" "text",
    CONSTRAINT "kit_artifacts_content_type_check" CHECK (("content_type" = ANY (ARRAY['markdown'::"text", 'json'::"text", 'zip'::"text"])))
);


ALTER TABLE "public"."kit_artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kit_builds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "redemption_id" "uuid" NOT NULL,
    "class_slug" "text" NOT NULL,
    "preset_version" "text" NOT NULL,
    "kind" "text" DEFAULT 'initial'::"text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "intake" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "feedback" "text",
    "only_artifact_ids" "text"[],
    "artifact_statuses" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error" "text",
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kit_builds_kind_check" CHECK (("kind" = ANY (ARRAY['initial'::"text", 'regenerate'::"text", 'new_skill'::"text"]))),
    CONSTRAINT "kit_builds_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'running'::"text", 'partial'::"text", 'complete'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."kit_builds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kit_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "class_slug" "text" NOT NULL,
    "label" "text",
    "starts_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "max_redemptions" integer,
    "redemption_count" integer DEFAULT 0 NOT NULL,
    "pass_days" integer DEFAULT 30 NOT NULL,
    "skill_quota" integer DEFAULT 3 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kit_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kit_journey_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "redemption_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "day_index" integer,
    "item_id" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kit_journey_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['day_checked'::"text", 'day_unchecked'::"text", 'shipped'::"text"])))
);


ALTER TABLE "public"."kit_journey_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kit_nudges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "redemption_id" "uuid" NOT NULL,
    "nudge_type" "text" NOT NULL,
    "email" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kit_nudges_nudge_type_check" CHECK (("nudge_type" = ANY (ARRAY['pack'::"text", 'day_3'::"text", 'day_7'::"text"])))
);


ALTER TABLE "public"."kit_nudges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kit_redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "class_slug" "text" NOT NULL,
    "preset_version" "text" NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "skill_quota" integer DEFAULT 3 NOT NULL,
    "skills_used" integer DEFAULT 0 NOT NULL,
    "delivery_email" "text",
    "shipped_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kit_redemptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."kit_redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kit_waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "redemption_id" "uuid",
    "user_id" "uuid",
    "class_slug" "text",
    "source" "text" DEFAULT 'kit'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notified_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kit_waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_qualification_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "engagement_score" integer DEFAULT 0,
    "business_readiness_score" integer DEFAULT 0,
    "pain_point_severity" integer DEFAULT 0,
    "implementation_readiness" integer DEFAULT 0,
    "total_score" integer DEFAULT 0,
    "qualification_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lead_qualification_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_qualifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "qualification_type" "text" NOT NULL,
    "score" integer NOT NULL,
    "indicators" "jsonb" DEFAULT '{}'::"jsonb",
    "qualified_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lead_qualifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leader_id" "uuid" NOT NULL,
    "source" "text" NOT NULL,
    "benchmark_score" integer,
    "benchmark_tier" "text",
    "learning_style" "text",
    "has_deep_profile" boolean DEFAULT false,
    "has_full_diagnostic" boolean DEFAULT false,
    "session_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "generation_status" "jsonb" DEFAULT '{"error_log": [], "last_updated": null, "risks_computed": false, "prompts_generated": false, "tensions_computed": false, "insights_generated": false, "scenarios_generated": false, "first_moves_generated": false}'::"jsonb",
    "has_deep_context" boolean DEFAULT false,
    CONSTRAINT "leader_assessments_benchmark_score_check" CHECK ((("benchmark_score" >= 0) AND ("benchmark_score" <= 100))),
    CONSTRAINT "leader_assessments_benchmark_tier_check" CHECK (("benchmark_tier" = ANY (ARRAY['AI-Emerging'::"text", 'AI-Aware'::"text", 'AI-Confident'::"text", 'AI-Orchestrator'::"text"]))),
    CONSTRAINT "leader_assessments_source_check" CHECK (("source" = ANY (ARRAY['quiz'::"text", 'voice'::"text"])))
);


ALTER TABLE "public"."leader_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_check_ins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leader_id" "uuid" NOT NULL,
    "mission_id" "uuid",
    "check_in_text" "text" NOT NULL,
    "ai_reflection" "text",
    "ai_recommendation" "text",
    "ai_suggested_move" "text",
    "accepted_as_mission" boolean DEFAULT false,
    "voice_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leader_check_ins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_dimension_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "dimension_key" "text" NOT NULL,
    "score_numeric" integer,
    "dimension_tier" "text",
    "explanation" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leader_dimension_scores_dimension_key_check" CHECK (("dimension_key" = ANY (ARRAY['ai_fluency'::"text", 'decision_velocity'::"text", 'experimentation_cadence'::"text", 'delegation_augmentation'::"text", 'alignment_communication'::"text", 'risk_governance'::"text"]))),
    CONSTRAINT "leader_dimension_scores_dimension_tier_check" CHECK (("dimension_tier" = ANY (ARRAY['AI-Emerging'::"text", 'AI-Aware'::"text", 'AI-Confident'::"text", 'AI-Orchestrator'::"text"]))),
    CONSTRAINT "leader_dimension_scores_score_numeric_check" CHECK ((("score_numeric" >= 0) AND ("score_numeric" <= 100)))
);


ALTER TABLE "public"."leader_dimension_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_first_moves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "move_number" integer NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leader_first_moves_move_number_check" CHECK (("move_number" = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE "public"."leader_first_moves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_missions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leader_id" "uuid" NOT NULL,
    "assessment_id" "uuid",
    "first_move_id" "uuid",
    "mission_text" "text" NOT NULL,
    "check_in_date" "date" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "completion_notes" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "goal_id" "uuid",
    CONSTRAINT "leader_missions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'skipped'::"text", 'extended'::"text"])))
);


ALTER TABLE "public"."leader_missions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_notification_prefs" (
    "user_id" "uuid" NOT NULL,
    "email" "text",
    "weekly_checkin_enabled" boolean DEFAULT false NOT NULL,
    "preferred_day" "text",
    "timezone" "text",
    "daily_briefing_enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reactivation_nudge_sent_at" timestamp with time zone
);


ALTER TABLE "public"."leader_notification_prefs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."leader_notification_prefs"."reactivation_nudge_sent_at" IS 'When the last reactivation (first-decision / dormancy) nudge was sent. Dedup key for send-reactivation-nudge; NULL = never nudged.';



CREATE TABLE IF NOT EXISTS "public"."leader_org_scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "scenario_key" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "priority_rank" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leader_org_scenarios_scenario_key_check" CHECK (("scenario_key" = ANY (ARRAY['stagnation_loop'::"text", 'shadow_ai_instability'::"text", 'high_velocity_path'::"text", 'culture_capability_mismatch'::"text"])))
);


ALTER TABLE "public"."leader_org_scenarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_progress_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leader_id" "uuid" NOT NULL,
    "assessment_id" "uuid",
    "dimension_scores" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "comparison_to_baseline" "jsonb" DEFAULT '{}'::"jsonb",
    "benchmark_score" numeric,
    "benchmark_tier" "text",
    "snapshot_type" "text" DEFAULT 'assessment'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leader_progress_snapshots_snapshot_type_check" CHECK (("snapshot_type" = ANY (ARRAY['assessment'::"text", 'check_in'::"text", 'weekly'::"text"])))
);


ALTER TABLE "public"."leader_progress_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_prompt_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "category_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "what_its_for" "text",
    "when_to_use" "text",
    "how_to_use" "text",
    "prompts_json" "jsonb" DEFAULT '[]'::"jsonb",
    "priority_rank" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leader_prompt_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_risk_signals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "risk_key" "text" NOT NULL,
    "level" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priority_rank" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leader_risk_signals_level_check" CHECK (("level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "leader_risk_signals_risk_key_check" CHECK (("risk_key" = ANY (ARRAY['shadow_ai'::"text", 'skills_gap'::"text", 'roi_leakage'::"text", 'decision_friction'::"text"])))
);


ALTER TABLE "public"."leader_risk_signals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leader_tensions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "dimension_key" "text" NOT NULL,
    "summary_line" "text" NOT NULL,
    "priority_rank" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leader_tensions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "role" "text",
    "company" "text",
    "company_size_band" "text",
    "primary_focus" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "archived_at" timestamp with time zone,
    "title" "text",
    "industry" "text",
    "company_stage" "text",
    "strategic_problem" "text",
    "biggest_obstacle" "text",
    "biggest_fear" "text",
    "strategic_goal" "text",
    "quarterly_focus" "text",
    "profile_completeness" integer DEFAULT 0,
    "marketing_consent" boolean DEFAULT false NOT NULL,
    "marketing_consent_at" timestamp with time zone
);


ALTER TABLE "public"."leaders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "job_title" "text",
    "selected_program" "text",
    "commitment_level" "text",
    "audience_type" "text",
    "path_type" "text",
    "session_data" "jsonb" DEFAULT '{}'::"jsonb",
    "company_research" "jsonb",
    "engagement_score" integer,
    "email_sent" boolean DEFAULT false,
    "email_sent_at" timestamp with time zone,
    "calendly_opened" boolean DEFAULT false,
    "calendly_opened_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "week" "text" NOT NULL,
    "surface" "text" NOT NULL,
    "signal" "text" DEFAULT 'output'::"text" NOT NULL,
    "class" "text",
    "criterion_id" "uuid",
    "criterion_name" "text" NOT NULL,
    "verdict" "text" NOT NULL,
    "quote" "text",
    "disposition" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ledger_class_check" CHECK (("class" = ANY (ARRAY['omission'::"text", 'stance'::"text", 'sequence'::"text", 'boundary'::"text"]))),
    CONSTRAINT "ledger_disposition_check" CHECK (("disposition" = ANY (ARRAY['accepted'::"text", 'rejected'::"text", 'unknown'::"text"]))),
    CONSTRAINT "ledger_signal_check" CHECK (("signal" = ANY (ARRAY['output'::"text", 'method'::"text", 'trigger'::"text"]))),
    CONSTRAINT "ledger_verdict_check" CHECK (("verdict" = ANY (ARRAY['holds'::"text", 'borderline'::"text", 'breaks'::"text", 'uncovered'::"text", 'undertrigger'::"text", 'fired'::"text"]))),
    CONSTRAINT "method_rows_carry_class" CHECK ((("signal" <> 'method'::"text") OR ("class" IS NOT NULL)))
);


ALTER TABLE "public"."ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."live_headlines_cache" (
    "briefing_date" "date" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."live_headlines_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."llm_call_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "function_name" "text" NOT NULL,
    "model" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "prompt_tokens" integer,
    "completion_tokens" integer,
    "total_tokens" integer,
    "latency_ms" integer,
    "cached" boolean DEFAULT false NOT NULL,
    "error" "text",
    "user_id" "uuid",
    "estimated_cost_usd" numeric(10,6)
);


ALTER TABLE "public"."llm_call_log" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."llm_cost_dashboard" WITH ("security_invoker"='on') AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "day",
    "model",
    "provider",
    "count"(*) AS "call_count",
    "count"(*) FILTER (WHERE "cached") AS "cache_hits",
    "count"(*) FILTER (WHERE ("error" IS NOT NULL)) AS "errors",
    "sum"("total_tokens") AS "total_tokens",
    ("avg"("latency_ms"))::integer AS "avg_latency_ms",
    ("sum"("estimated_cost_usd"))::numeric(10,4) AS "total_cost_usd"
   FROM "public"."llm_call_log"
  GROUP BY ("date_trunc"('day'::"text", "created_at")), "model", "provider"
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC, (("sum"("estimated_cost_usd"))::numeric(10,4)) DESC;


ALTER VIEW "public"."llm_cost_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mcp_pulls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tool" "text" NOT NULL,
    "skill_name" "text",
    "artifact_id" "uuid",
    "called_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mcp_pulls" OWNER TO "postgres";


COMMENT ON TABLE "public"."mcp_pulls" IS 'One row per read call to the mcp-context MCP server. Replaces the single overwritten mcp_tokens.last_used_at so live-pull usage is observable per skill and per call.';



CREATE TABLE IF NOT EXISTS "public"."mcp_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "token_prefix" "text" NOT NULL,
    "label" "text",
    "scopes" "text"[] DEFAULT '{read}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."mcp_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_prep_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "company_context_id" "uuid",
    "meeting_title" "text" NOT NULL,
    "meeting_date" "date",
    "agenda_text" "text" NOT NULL,
    "prep_materials" "jsonb" DEFAULT '{}'::"jsonb",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."meeting_prep_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."meeting_prep_sessions" IS 'Stores generated meeting prep materials combining diagnostic results with meeting agendas';



CREATE TABLE IF NOT EXISTS "public"."memory_edges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "from_fact_id" "uuid" NOT NULL,
    "to_fact_id" "uuid" NOT NULL,
    "relation" "text" NOT NULL,
    "strength" real DEFAULT 0.5 NOT NULL,
    "rationale" "text",
    "source" "text" DEFAULT 'inferred'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "memory_edges_relation_check" CHECK (("relation" = ANY (ARRAY['depends_on'::"text", 'supports'::"text", 'tension'::"text", 'informs'::"text", 'relates'::"text"]))),
    CONSTRAINT "memory_edges_source_check" CHECK (("source" = ANY (ARRAY['inferred'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."memory_edges" OWNER TO "postgres";


COMMENT ON TABLE "public"."memory_edges" IS 'Honest fact-to-fact relationships in the Memory Web (depends_on/supports/tension/informs/relates). source=inferred (LLM-derived, replaceable) or user (affirmed, never auto-touched).';



CREATE TABLE IF NOT EXISTS "public"."memory_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "fact_id" "uuid",
    "kind" "text" NOT NULL,
    "strategy" "text",
    "related_fact_id" "uuid",
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "occurred_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."memory_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memory_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "from_type" "text" NOT NULL,
    "from_id" "uuid" NOT NULL,
    "to_type" "text" NOT NULL,
    "to_id" "uuid" NOT NULL,
    "edge_type" "text" NOT NULL,
    "weight" numeric DEFAULT 1.0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "memory_links_edge_type_check" CHECK (("edge_type" = ANY (ARRAY['caused_by'::"text", 'supported_by'::"text", 'contradicts'::"text", 'derived_from'::"text", 'resolved_by'::"text"])))
);


ALTER TABLE "public"."memory_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mindmake_personal_reads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "q1" "text",
    "q2" "text",
    "enrichment" "jsonb",
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "division" "text",
    "handoff_reason" "text",
    CONSTRAINT "mindmake_personal_reads_division_check" CHECK ((("division" IS NULL) OR ("division" = ANY (ARRAY['leadership'::"text", 'sales'::"text", 'marketing'::"text", 'product'::"text", 'engineering'::"text", 'operations'::"text", 'finance'::"text", 'people'::"text"])))),
    CONSTRAINT "mindmake_personal_reads_handoff_reason_check" CHECK ((("handoff_reason" IS NULL) OR ("handoff_reason" = ANY (ARRAY['read-refused'::"text", 'read-failed'::"text", 'read-rate-limited'::"text", 'send-failed'::"text", 'personal-email'::"text", 'code-not-sent'::"text", 'code-not-accepted'::"text", 'delivery-failed'::"text", 'ask-unmatched'::"text"])))),
    CONSTRAINT "mindmake_personal_reads_name_length_check" CHECK (((("first_name" IS NULL) OR ("char_length"("first_name") <= 80)) AND (("last_name" IS NULL) OR ("char_length"("last_name") <= 80)))),
    CONSTRAINT "mindmake_personal_reads_q1_check" CHECK (("q1" = ANY (ARRAY['writing'::"text", 'chasing'::"text", 'admin'::"text", 'deciding'::"text"]))),
    CONSTRAINT "mindmake_personal_reads_q2_check" CHECK (("q2" = ANY (ARRAY['network'::"text", 'pipeline'::"text", 'content'::"text", 'decisions'::"text"]))),
    CONSTRAINT "mindmake_personal_reads_shape_check" CHECK (((("handoff_reason" IS NOT NULL) AND ("q1" IS NULL) AND ("q2" IS NULL)) OR (("handoff_reason" IS NULL) AND ("q1" IS NOT NULL) AND ("q2" IS NOT NULL))))
);


ALTER TABLE "public"."mindmake_personal_reads" OWNER TO "postgres";


COMMENT ON COLUMN "public"."mindmake_personal_reads"."first_name" IS 'Given name, as typed. Used to resolve the person and to address the one email.';



COMMENT ON COLUMN "public"."mindmake_personal_reads"."last_name" IS 'Family name, as typed. Used with the email domain to resolve the person.';



COMMENT ON COLUMN "public"."mindmake_personal_reads"."division" IS 'Allowlisted part of the business. Points the read at the work, not the company.';



COMMENT ON COLUMN "public"."mindmake_personal_reads"."handoff_reason" IS 'Which dead end sent them here, from the edge function allowlist. Null on a delivered read.';



CREATE TABLE IF NOT EXISTS "public"."news_trends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "detected_on" "date" DEFAULT CURRENT_DATE NOT NULL,
    "category" "text" NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "implication" "text" NOT NULL,
    "evidence" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "day_span" integer DEFAULT 0 NOT NULL,
    "source_count" integer DEFAULT 0 NOT NULL,
    "momentum" real DEFAULT 0 NOT NULL,
    "is_current" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."news_trends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."north_star_daily" (
    "day" "date" NOT NULL,
    "flywheel_users" integer DEFAULT 0 NOT NULL,
    "brain_rich_users" integer DEFAULT 0 NOT NULL,
    "active_deciders" integer DEFAULT 0 NOT NULL,
    "weekly_active_users" integer DEFAULT 0 NOT NULL,
    "computed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."north_star_daily" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."north_star_flywheel" WITH ("security_invoker"='on') AS
 WITH "brain_rich" AS (
         SELECT "user_memory"."user_id"
           FROM "public"."user_memory"
          WHERE ("user_memory"."is_current" = true)
          GROUP BY "user_memory"."user_id"
         HAVING ("count"(*) >= "public"."ns_brain_min_facts"())
        ), "active_deciders" AS (
         SELECT DISTINCT "decision_cases"."user_id"
           FROM "public"."decision_cases"
          WHERE ("decision_cases"."created_at" >= ("now"() - '7 days'::interval))
        ), "weekly_active" AS (
         SELECT "decision_cases"."user_id"
           FROM "public"."decision_cases"
          WHERE ("decision_cases"."created_at" >= ("now"() - '7 days'::interval))
        UNION
         SELECT "user_memory"."user_id"
           FROM "public"."user_memory"
          WHERE ("user_memory"."updated_at" >= ("now"() - '7 days'::interval))
        )
 SELECT ( SELECT "count"(*) AS "count"
           FROM "brain_rich" "br"
          WHERE ("br"."user_id" IN ( SELECT "active_deciders"."user_id"
                   FROM "active_deciders"))) AS "flywheel_users",
    ( SELECT "count"(*) AS "count"
           FROM "brain_rich") AS "brain_rich_users",
    ( SELECT "count"(*) AS "count"
           FROM "active_deciders") AS "active_deciders",
    ( SELECT "count"(DISTINCT "weekly_active"."user_id") AS "count"
           FROM "weekly_active") AS "weekly_active_users";


ALTER VIEW "public"."north_star_flywheel" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_intakes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "firm_name" "text" NOT NULL,
    "pipeline_count" integer NOT NULL,
    "pipeline_names" "text" NOT NULL,
    "objectives_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "urgency_window" "text" NOT NULL,
    "consent" boolean DEFAULT false NOT NULL,
    "partner_type" "text",
    "role" "text",
    "region" "text",
    "sectors_json" "jsonb" DEFAULT '[]'::"jsonb",
    "engagement_model" "text",
    "resources_enablement_bandwidth" "text",
    CONSTRAINT "partner_intakes_pipeline_count_check" CHECK ((("pipeline_count" >= 1) AND ("pipeline_count" <= 10)))
);


ALTER TABLE "public"."partner_intakes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "intake_id" "uuid" NOT NULL,
    "share_slug" "text" NOT NULL,
    "firm_name" "text" NOT NULL,
    "objectives_json" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "urgency_window" "text" NOT NULL,
    "pipeline_count" integer NOT NULL,
    "total_companies" integer DEFAULT 0 NOT NULL,
    "exec_bootcamp_count" integer DEFAULT 0 NOT NULL,
    "literacy_sprint_count" integer DEFAULT 0 NOT NULL,
    "diagnostic_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."partner_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_portfolio_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "intake_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sector" "text",
    "stage" "text",
    "ai_posture" "text" NOT NULL,
    "data_posture" "text" NOT NULL,
    "value_pressure" "text" NOT NULL,
    "decision_cadence" "text" NOT NULL,
    "sponsor_strength" "text" NOT NULL,
    "willingness_60d" "text" NOT NULL,
    "fit_score" integer NOT NULL,
    "recommendation" "text" NOT NULL,
    "risk_flags_json" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."partner_portfolio_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_pool_cache" (
    "user_id" "uuid" NOT NULL,
    "briefing_date" "date" NOT NULL,
    "signature" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."personal_pool_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_charter" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "pilot_owner" "text" NOT NULL,
    "pilot_budget" numeric,
    "executive_sponsor" "text" NOT NULL,
    "milestone_d10" "text",
    "milestone_d30" "text",
    "milestone_d60" "text",
    "milestone_d90" "text",
    "kill_criteria" "text",
    "extend_criteria" "text",
    "scale_criteria" "text",
    "meeting_cadence" "text" NOT NULL,
    "calendar_events" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "owner_clarity_level" "text",
    "budget_agreement_level" "text",
    "kill_criteria_specificity" "text",
    "commitment_signals" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."pilot_charter" OWNER TO "postgres";


COMMENT ON COLUMN "public"."pilot_charter"."owner_clarity_level" IS 'clear, vague, contested - could they name a clear owner?';



COMMENT ON COLUMN "public"."pilot_charter"."budget_agreement_level" IS 'aligned, debated, unclear - budget discussion quality';



COMMENT ON COLUMN "public"."pilot_charter"."kill_criteria_specificity" IS 'specific, generic, missing - quality of kill criteria';



COMMENT ON COLUMN "public"."pilot_charter"."commitment_signals" IS 'Observable commitment: {named_owner: bool, named_sponsor: bool, specific_budget: bool, wrote_kill_criteria: bool}';



CREATE TABLE IF NOT EXISTS "public"."portfolio_handoff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" DEFAULT 'mymu'::"text" NOT NULL,
    "source_response_id" "uuid",
    "entry_variant" "text",
    "q2" "text",
    "q4" "text",
    "anxiety_lane" "text",
    "company_domain" "text",
    "archetype_title" "text",
    "destination" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consumed_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "idempotency_key" "text",
    "person_name" "text",
    "role_title" "text",
    "linkedin_url" "text",
    "company_name" "text",
    "company_summary" "text",
    "company_logo_url" "text",
    "company_signals" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "dossier_strength" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "dossier_confirmed_at" timestamp with time zone,
    CONSTRAINT "portfolio_handoff_company_signals_array" CHECK (("jsonb_typeof"("company_signals") = 'array'::"text"))
);


ALTER TABLE "public"."portfolio_handoff" OWNER TO "postgres";


COMMENT ON COLUMN "public"."portfolio_handoff"."company_signals" IS 'User-confirmed, source-linked company signals captured during onboarding; maximum three.';



CREATE TABLE IF NOT EXISTS "public"."post_session_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "participant_name" "text" NOT NULL,
    "participant_email" "text",
    "ai_leadership_confidence" integer NOT NULL,
    "session_enjoyment" integer NOT NULL,
    "optional_feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "post_session_reviews_ai_leadership_confidence_check" CHECK ((("ai_leadership_confidence" >= 1) AND ("ai_leadership_confidence" <= 10))),
    CONSTRAINT "post_session_reviews_session_enjoyment_check" CHECK ((("session_enjoyment" >= 1) AND ("session_enjoyment" <= 10)))
);


ALTER TABLE "public"."post_session_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pre_workshop_inputs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "intake_id" "uuid",
    "participant_email" "text" NOT NULL,
    "participant_name" "text" NOT NULL,
    "pre_work_responses" "jsonb" DEFAULT '{}'::"jsonb",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid"
);


ALTER TABLE "public"."pre_workshop_inputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_insights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "source_event_ids" "uuid"[],
    "dimension_key" "text" NOT NULL,
    "score" integer,
    "label" "text",
    "confidence" numeric DEFAULT 1.0,
    "llm_summary" "text",
    "evidence" "text"[],
    "contradiction_flag" boolean DEFAULT false,
    "surprise_factor" "text",
    "context_snapshot" "jsonb" DEFAULT '{}'::"jsonb",
    "tool_name" "text" NOT NULL,
    "flow_name" "text",
    "generated_by" "text" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profile_insights_score_check" CHECK ((("score" >= 0) AND ("score" <= 100)))
);


ALTER TABLE "public"."profile_insights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text" NOT NULL,
    "display_name" "text",
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "edge_delivery_email" "text",
    CONSTRAINT "username_format" CHECK (("username" ~ '^[a-zA-Z0-9_]+$'::"text")),
    CONSTRAINT "username_length" CHECK ((("char_length"("username") >= 3) AND ("char_length"("username") <= 20)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompt_library_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "executive_profile" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "communication_style" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "bottleneck_analysis" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "stakeholder_map" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "workflow_preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "trust_calibration" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "recommended_projects" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "prompt_templates" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "implementation_roadmap" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "generation_model" character varying(100),
    "generation_timestamp" timestamp with time zone DEFAULT "now"(),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "leader_id" "uuid",
    CONSTRAINT "user_or_leader_required" CHECK ((("user_id" IS NOT NULL) OR ("leader_id" IS NOT NULL)))
);


ALTER TABLE "public"."prompt_library_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "surface" "text" NOT NULL,
    "headline" "text" NOT NULL,
    "delta_text" "text",
    "if_wrong" "text" NOT NULL,
    "size_delta" integer,
    "evidence" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'awaiting'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "decided_at" timestamp with time zone,
    CONSTRAINT "drift_proposes_no_delta" CHECK ((("type" <> 'drift'::"text") OR ("delta_text" IS NULL))),
    CONSTRAINT "proposals_status_check" CHECK (("status" = ANY (ARRAY['awaiting'::"text", 'accepted'::"text", 'rejected'::"text"]))),
    CONSTRAINT "proposals_type_check" CHECK (("type" = ANY (ARRAY['uncovered'::"text", 'false_positive'::"text", 'drift'::"text"])))
);


ALTER TABLE "public"."proposals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provocation_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "report_data" "jsonb" NOT NULL,
    "ai_synthesis" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."provocation_reports" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_index_snapshots" WITH ("security_invoker"='true') AS
 SELECT "quarter",
    "methodology_version",
    "published_at",
    "total_assessments",
    "effective_sample_size",
    "consent_rate",
    "avg_readiness_score",
    "avg_readiness_score_ci_lower",
    "avg_readiness_score_ci_upper",
    "median_readiness_score",
    "tier_emerging_pct",
    "tier_establishing_pct",
    "tier_advancing_pct",
    "tier_leading_pct",
    "industry_benchmarks",
    "company_size_benchmarks",
    "role_benchmarks",
    "dimension_benchmarks",
    "qoq_change",
    "qoq_change_significant"
   FROM "public"."ai_leadership_index_snapshots"
  WHERE ("published_at" IS NOT NULL);


ALTER VIEW "public"."public_index_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text",
    "client_slug" "text",
    "name" "text",
    "role" "text",
    "company" "text",
    "link" "text",
    "email" "text",
    "permission" "text",
    "willing_reference" boolean DEFAULT false NOT NULL,
    "confidence_before" integer,
    "confidence_after" integer,
    "nps" integer,
    "rating" integer,
    "summary_line" "text",
    "responses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "testimonials_confidence_after_check" CHECK ((("confidence_after" >= 1) AND ("confidence_after" <= 10))),
    CONSTRAINT "testimonials_confidence_before_check" CHECK ((("confidence_before" >= 1) AND ("confidence_before" <= 10))),
    CONSTRAINT "testimonials_nps_check" CHECK ((("nps" >= 0) AND ("nps" <= 10))),
    CONSTRAINT "testimonials_permission_check" CHECK (("permission" = ANY (ARRAY['free'::"text", 'edits'::"text", 'private'::"text"]))),
    CONSTRAINT "testimonials_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."publishable_testimonials" WITH ("security_invoker"='on') AS
 SELECT "id",
    "created_at",
    "role",
    "company",
    "summary_line",
    "rating",
    "nps"
   FROM "public"."testimonials"
  WHERE (("permission" = 'free'::"text") AND ("summary_line" IS NOT NULL) AND ("length"("btrim"("summary_line")) >= 40));


ALTER VIEW "public"."publishable_testimonials" OWNER TO "postgres";


COMMENT ON VIEW "public"."publishable_testimonials" IS 'Consent-gated, PII-reduced read path for the site. Only permission = free rows with a substantive summary_line. Never exposes name, email, link or the raw responses payload.';



CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referring_company_hash" "text" NOT NULL,
    "referred_company_hash" "text" NOT NULL,
    "referred_at" timestamp with time zone DEFAULT "now"(),
    "referred_company_completed_assessment" boolean DEFAULT false,
    "referred_company_first_assessment_date" timestamp with time zone,
    "referral_source" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roi_actuals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "pilot_tracker_id" "uuid",
    "user_id" "uuid",
    "predicted_conservative_monthly" numeric(12,2),
    "predicted_likely_monthly" numeric(12,2),
    "actual_monthly_value" numeric(12,2),
    "currency_code" "text" DEFAULT 'USD'::"text",
    "unit_type" "public"."roi_unit_type" NOT NULL,
    "unit_value_monthly" numeric(12,2),
    "baseline_value_monthly" numeric(12,2),
    "window_days" integer DEFAULT 30,
    "provenance" "public"."roi_provenance" NOT NULL,
    "provenance_weight" numeric(3,2) DEFAULT 1.0,
    "confidence_level" "text",
    "confidence_weight" numeric(3,2) DEFAULT 1.0,
    "aggregate_weight" numeric(3,2) GENERATED ALWAYS AS (("provenance_weight" * "confidence_weight")) STORED,
    "fte_count" integer DEFAULT 1,
    "normalized_monthly_per_fte" numeric(12,2) GENERATED ALWAYS AS (
CASE
    WHEN ("fte_count" > 0) THEN ("actual_monthly_value" / ("fte_count")::numeric)
    ELSE NULL::numeric
END) STORED,
    "roi_variance_pct" numeric(6,2),
    "exceeded_prediction" boolean,
    "actual_metric_description" "text",
    "reported_at" timestamp with time zone DEFAULT "now"(),
    "reported_via" "text",
    "allow_index_aggregation" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "roi_actuals_confidence_level_check" CHECK (("confidence_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "roi_actuals_confidence_weight_check" CHECK ((("confidence_weight" >= (0)::numeric) AND ("confidence_weight" <= (1)::numeric))),
    CONSTRAINT "roi_actuals_provenance_weight_check" CHECK ((("provenance_weight" >= (0)::numeric) AND ("provenance_weight" <= (1)::numeric)))
);


ALTER TABLE "public"."roi_actuals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."security_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."segment_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid" NOT NULL,
    "segment_key" "text" NOT NULL,
    "headline" "text" NOT NULL,
    "key_points" "text"[] NOT NULL,
    "primary_metric" numeric,
    "primary_metric_label" "text",
    "segment_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "segment_summaries_headline_check" CHECK (("char_length"("headline") <= 80)),
    CONSTRAINT "segment_summaries_key_points_check" CHECK (("array_length"("key_points", 1) <= 5)),
    CONSTRAINT "segment_summaries_primary_metric_label_check" CHECK (("char_length"("primary_metric_label") <= 40)),
    CONSTRAINT "segment_summaries_segment_key_check" CHECK (("segment_key" = ANY (ARRAY['mirror'::"text", 'time_machine'::"text", 'crystal_ball'::"text", 'rewrite'::"text", 'huddle'::"text", 'draft'::"text", 'provocation'::"text"])))
);


ALTER TABLE "public"."segment_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."simulation_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "simulation_id" "text" NOT NULL,
    "simulation_name" "text" NOT NULL,
    "before_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "after_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "time_savings_pct" numeric,
    "cost_savings_usd" numeric,
    "quality_improvement_pct" numeric,
    "org_changes_checklist" "jsonb" DEFAULT '[]'::"jsonb",
    "vote_count" integer DEFAULT 0,
    "is_selected" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "people_involved_before" integer,
    "people_involved_after" integer,
    "error_rate_before_pct" numeric,
    "error_rate_after_pct" numeric,
    "satisfaction_before" numeric,
    "satisfaction_after" numeric,
    "qualitative_changes" "text",
    "risks_introduced" "text",
    "org_changes_required" "jsonb" DEFAULT '[]'::"jsonb",
    "prompts_used" "jsonb" DEFAULT '[]'::"jsonb",
    "ai_outputs" "jsonb" DEFAULT '[]'::"jsonb",
    "task_breakdown" "jsonb" DEFAULT '{}'::"jsonb",
    "guardrails" "jsonb" DEFAULT '{}'::"jsonb",
    "output_quality_ratings" "jsonb" DEFAULT '[]'::"jsonb",
    "scenario_context" "jsonb" DEFAULT '{}'::"jsonb",
    "selected_discussion_options" "jsonb" DEFAULT '{}'::"jsonb",
    "team_reactions" "jsonb" DEFAULT '{}'::"jsonb",
    "disagreement_points" "text"[] DEFAULT ARRAY[]::"text"[]
);


ALTER TABLE "public"."simulation_results" OWNER TO "postgres";


COMMENT ON COLUMN "public"."simulation_results"."people_involved_before" IS 'Number of people involved in the process before AI augmentation';



COMMENT ON COLUMN "public"."simulation_results"."people_involved_after" IS 'Number of people involved in the process after AI augmentation';



COMMENT ON COLUMN "public"."simulation_results"."error_rate_before_pct" IS 'Percentage of work requiring revisions/rework before AI';



COMMENT ON COLUMN "public"."simulation_results"."error_rate_after_pct" IS 'Percentage of work requiring revisions/rework after AI';



COMMENT ON COLUMN "public"."simulation_results"."satisfaction_before" IS 'Stakeholder satisfaction score (1-10) before AI';



COMMENT ON COLUMN "public"."simulation_results"."satisfaction_after" IS 'Stakeholder satisfaction score (1-10) after AI';



COMMENT ON COLUMN "public"."simulation_results"."qualitative_changes" IS 'Description of how the workflow transforms with AI';



COMMENT ON COLUMN "public"."simulation_results"."risks_introduced" IS 'Potential risks and safeguards needed when using AI';



COMMENT ON COLUMN "public"."simulation_results"."org_changes_required" IS 'Array of organizational changes needed (training, roles, tools, etc.)';



COMMENT ON COLUMN "public"."simulation_results"."selected_discussion_options" IS 'Stores user selections for AI-generated discussion prompts to persist across page navigation';



COMMENT ON COLUMN "public"."simulation_results"."team_reactions" IS 'Tracks who was impressed vs skeptical: {impressed: [names], skeptical: [names], neutral: [names], key_disagreements: []}';



COMMENT ON COLUMN "public"."simulation_results"."disagreement_points" IS 'Specific points of disagreement observed during simulation review';



CREATE TABLE IF NOT EXISTS "public"."skill_exports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "skill_name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "transcript" "text" NOT NULL,
    "triage_result" "text" DEFAULT 'skill'::"text" NOT NULL,
    "body_content" "text",
    "references_json" "jsonb" DEFAULT '[]'::"jsonb",
    "test_prompts" "text"[] DEFAULT '{}'::"text"[],
    "quality_gate" "jsonb" DEFAULT '{}'::"jsonb",
    "archetype" "text",
    "version" integer DEFAULT 1 NOT NULL,
    "zip_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."skill_exports" OWNER TO "postgres";


COMMENT ON TABLE "public"."skill_exports" IS 'Per-user log of Agent Skills generated by the generate-skill-export edge function. One row per generation attempt; includes failed-triage cases for analytics.';



CREATE TABLE IF NOT EXISTS "public"."skill_provenance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "artifact_id" "uuid" NOT NULL,
    "pass" integer DEFAULT 1 NOT NULL,
    "claim_hash" "text" NOT NULL,
    "claim_text" "text" NOT NULL,
    "section" "text" NOT NULL,
    "evidence_id" "uuid",
    "criterion_id" "uuid",
    "resolution" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "skill_provenance_resolution_check" CHECK (("resolution" = ANY (ARRAY['cited'::"text", 'unresolved'::"text", 'marked_awaiting'::"text", 'deleted'::"text"])))
);


ALTER TABLE "public"."skill_provenance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sort_grades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "verdict" "text" NOT NULL,
    "why" "text",
    "ms_to_grade" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sort_grades_verdict_check" CHECK (("verdict" = ANY (ARRAY['send'::"text", 'would_not_send'::"text", 'skip'::"text"])))
);


ALTER TABLE "public"."sort_grades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sort_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "surface" "text" NOT NULL,
    "body" "text" NOT NULL,
    "origin" "text" NOT NULL,
    "pair_id" "uuid",
    "pair_role" "text",
    "intended_dimension" "text",
    "derived_from_item_id" "uuid",
    "repeat_of" "uuid",
    "targets" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "held_out" boolean DEFAULT false NOT NULL,
    "manip_checked" boolean DEFAULT false NOT NULL,
    "manip_ok" boolean,
    "position" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_label" "text",
    "manip_answer" "text",
    CONSTRAINT "pair_role_needs_pair" CHECK (((("pair_id" IS NULL) AND ("pair_role" IS NULL)) OR (("pair_id" IS NOT NULL) AND ("pair_role" IS NOT NULL)))),
    CONSTRAINT "repeat_is_not_a_pair_half" CHECK ((("repeat_of" IS NULL) OR ("pair_id" IS NULL))),
    CONSTRAINT "sort_items_origin_check" CHECK (("origin" = ANY (ARRAY['own'::"text", 'synthesised'::"text", 'peer'::"text", 'rewrite'::"text"]))),
    CONSTRAINT "sort_items_pair_role_check" CHECK (("pair_role" = ANY (ARRAY['satisfies'::"text", 'violates'::"text"])))
);


ALTER TABLE "public"."sort_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sort_items"."source_label" IS 'Attribution for peer-origin items: who published it and where. Required for origin = peer (CH-11: public, attributed, never another customer''s work).';



COMMENT ON COLUMN "public"."sort_items"."manip_answer" IS 'The grader''s own words answering the open manipulation question. The diagnostic for why a pair did or did not isolate its dimension (CH-09).';



CREATE TABLE IF NOT EXISTS "public"."strategy_addendum" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "targets_at_risk" "text",
    "ai_leverage_points" "jsonb" DEFAULT '[]'::"jsonb",
    "org_process_changes" "jsonb" DEFAULT '[]'::"jsonb",
    "data_governance_changes" "text",
    "pilot_kpis" "text",
    "working_group_inputs" "jsonb" DEFAULT '{}'::"jsonb",
    "policy_risk_checklist" "jsonb" DEFAULT '[]'::"jsonb",
    "ceo_approved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "risk_alignment_level" "text",
    "governance_disagreements" "text"[] DEFAULT ARRAY[]::"text"[],
    "convergence_time_minutes" integer,
    "sticking_points" "text"[] DEFAULT ARRAY[]::"text"[]
);


ALTER TABLE "public"."strategy_addendum" OWNER TO "postgres";


COMMENT ON COLUMN "public"."strategy_addendum"."risk_alignment_level" IS 'low, medium, high - how aligned was the team on risk tolerance?';



COMMENT ON COLUMN "public"."strategy_addendum"."governance_disagreements" IS 'Specific disagreements about data governance approach';



COMMENT ON COLUMN "public"."strategy_addendum"."convergence_time_minutes" IS 'How long did it take to reach consensus?';



CREATE TABLE IF NOT EXISTS "public"."stripe_events_processed" (
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stripe_events_processed" OWNER TO "postgres";


COMMENT ON TABLE "public"."stripe_events_processed" IS 'Idempotency log for Stripe webhook events. Insert-on-conflict-do-nothing pattern: if the event_id already exists, the webhook has already been processed and the handler should short-circuit.';



CREATE TABLE IF NOT EXISTS "public"."suggested_briefing_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "text" "text" NOT NULL,
    "confidence" numeric NOT NULL,
    "reason" "text",
    "source" "text" DEFAULT 'inferred_suggested'::"text" NOT NULL,
    "accepted_at" timestamp with time zone,
    "dismissed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "suggested_briefing_interests_kind_check" CHECK (("kind" = ANY (ARRAY['beat'::"text", 'entity'::"text", 'exclude'::"text"])))
);


ALTER TABLE "public"."suggested_briefing_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_material" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scope" "text" NOT NULL,
    "user_id" "uuid",
    "cohort_key" "text",
    "body_raw" "text" NOT NULL,
    "body_parsed" "jsonb" NOT NULL,
    "version" integer NOT NULL,
    "is_active" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "training_material_scope_check" CHECK (("scope" = ANY (ARRAY['global'::"text", 'cohort'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."training_material" OWNER TO "postgres";


COMMENT ON TABLE "public"."training_material" IS 'Versioned store of the anchor YAML (voice, reject rules, export voice cards). Read by fact-guardrails, generate-briefing, memory-context-builder.';



CREATE TABLE IF NOT EXISTS "public"."tts_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" DEFAULT 'elevenlabs'::"text" NOT NULL,
    "model_id" "text" DEFAULT 'eleven_multilingual_v2'::"text" NOT NULL,
    "voice_id" "text" DEFAULT '7ApmIXLoWa0cKUtJqfHc'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tts_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tts_quality_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "provider_rankings" "jsonb" NOT NULL,
    "current_provider" "text" DEFAULT 'elevenlabs'::"text" NOT NULL,
    "current_elo" integer,
    "top_provider" "text",
    "top_elo" integer,
    "alert_triggered" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tts_quality_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unified_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "role" "text",
    "company" "text",
    "company_identifier_hash" "text",
    "source_tool" "text" DEFAULT 'teams'::"text" NOT NULL,
    "first_seen_at" timestamp with time zone DEFAULT "now"(),
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "total_interactions" integer DEFAULT 0,
    "latest_readiness_score" integer,
    "latest_assessment_tier" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."unified_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_briefing_directives" (
    "user_id" "uuid" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_briefing_directives" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_briefing_directives" IS 'Per-user free-form text injected under <user-directives> in the briefing system prompt.';



CREATE TABLE IF NOT EXISTS "public"."user_business_context" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "business_name" "text",
    "business_description" "text",
    "industry" "text",
    "company_size" "text",
    "website_url" "text",
    "primary_challenges" "text"[],
    "ai_readiness_score" integer DEFAULT 0,
    "context_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "communication_style" "jsonb",
    "thinking_process" "jsonb",
    "bottleneck_details" "jsonb",
    "stakeholder_audiences" "jsonb",
    "workflow_pattern" "jsonb",
    "ai_trust_levels" "jsonb"
);


ALTER TABLE "public"."user_business_context" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_decisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "decision_text" "text" NOT NULL,
    "rationale" "text",
    "context_snapshot" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "superseded_by" "uuid",
    "source" "text" DEFAULT 'manual'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_decisions_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'voice'::"text", 'check_in'::"text", 'mission'::"text", 'assessment'::"text"]))),
    CONSTRAINT "user_decisions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'superseded'::"text", 'reversed'::"text"])))
);


ALTER TABLE "public"."user_decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_memory_budget" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "hot_token_count" integer DEFAULT 0,
    "hot_max_tokens" integer DEFAULT 4000,
    "warm_token_count" integer DEFAULT 0,
    "warm_max_tokens" integer DEFAULT 8000,
    "total_facts" integer DEFAULT 0,
    "last_cleanup_at" timestamp with time zone DEFAULT "now"(),
    "last_audit_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_synthesized_at" timestamp with time zone
);


ALTER TABLE "public"."user_memory_budget" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pattern_type" "text" NOT NULL,
    "pattern_text" "text" NOT NULL,
    "evidence_count" integer DEFAULT 1,
    "first_observed_at" timestamp with time zone DEFAULT "now"(),
    "last_confirmed_at" timestamp with time zone DEFAULT "now"(),
    "confidence" numeric(3,2) DEFAULT 0.50,
    "status" "text" DEFAULT 'emerging'::"text",
    "source_facts" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "explanation" "text",
    "anchor_fingerprint" "text",
    "evidence_strength" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "confirmation_key" "text",
    CONSTRAINT "user_patterns_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "user_patterns_pattern_type_check" CHECK (("pattern_type" = ANY (ARRAY['preference'::"text", 'anti_preference'::"text", 'behavior'::"text", 'blindspot'::"text", 'strength'::"text"]))),
    CONSTRAINT "user_patterns_status_check" CHECK (("status" = ANY (ARRAY['emerging'::"text", 'confirmed'::"text", 'deprecated'::"text"])))
);


ALTER TABLE "public"."user_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_user_id" "uuid",
    "email" "text",
    "full_name" "text",
    "company_name" "text",
    "company_size" "text",
    "industry" "text",
    "role_title" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."velocity_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "contact_email" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "action_signal_level" "public"."action_signal_level" NOT NULL,
    "event_date" timestamp with time zone NOT NULL,
    "assessment_completed_at" timestamp with time zone NOT NULL,
    "initial_readiness_score" integer,
    "days_since_assessment" integer GENERATED ALWAYS AS ((EXTRACT(day FROM ("event_date" - "assessment_completed_at")))::integer) STORED,
    "event_description" "text",
    "event_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."velocity_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voice_instrumentation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "event_type" "text" NOT NULL,
    "module_name" "text",
    "dwell_time_seconds" integer,
    "metadata" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "voice_instrumentation_event_type_check" CHECK (("event_type" = ANY (ARRAY['module_start'::"text", 'module_complete'::"text", 'mic_error'::"text", 'clarifier_asked'::"text", 'abandon'::"text", 'ios_fallback'::"text", 'transcription_complete'::"text"]))),
    CONSTRAINT "voice_instrumentation_module_name_check" CHECK (("module_name" = ANY (ARRAY['compass'::"text", 'roi'::"text"])))
);


ALTER TABLE "public"."voice_instrumentation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voice_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "voice_enabled" boolean DEFAULT true,
    "compass_completed_at" timestamp without time zone,
    "roi_completed_at" timestamp without time zone,
    "audio_retention_consent" boolean DEFAULT false,
    "compass_scores" "jsonb",
    "compass_tier" "text",
    "compass_focus_areas" "text"[],
    "roi_transcript" "text",
    "roi_inputs" "jsonb",
    "roi_conservative_value" numeric,
    "roi_likely_value" numeric,
    "roi_assumptions" "text"[],
    "gated_unlocked_at" timestamp without time zone,
    "sprint_signup_source" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "voice_sessions_compass_tier_check" CHECK (("compass_tier" = ANY (ARRAY['Emerging'::"text", 'Establishing'::"text", 'Advancing'::"text", 'Leading'::"text"])))
);


ALTER TABLE "public"."voice_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voting_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "activity_session_id" "uuid",
    "participant_name" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "dots_allocated" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "voting_results_item_type_check" CHECK (("item_type" = ANY (ARRAY['effortless_map'::"text", 'simulation'::"text"])))
);

ALTER TABLE ONLY "public"."voting_results" REPLICA IDENTITY FULL;


ALTER TABLE "public"."voting_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."working_group_inputs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workshop_session_id" "uuid",
    "activity_session_id" "uuid",
    "table_number" integer NOT NULL,
    "participant_name" "text" NOT NULL,
    "input_text" "text" NOT NULL,
    "input_category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid",
    CONSTRAINT "working_group_inputs_input_category_check" CHECK (("input_category" = ANY (ARRAY['targets'::"text", 'leverage'::"text", 'changes'::"text", 'governance'::"text", 'pilot'::"text"]))),
    CONSTRAINT "working_group_inputs_table_number_check" CHECK (("table_number" = ANY (ARRAY[1, 2])))
);


ALTER TABLE "public"."working_group_inputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workshop_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "session_id" "uuid",
    "workshop_session_id" "uuid",
    "tool_name" "text" NOT NULL,
    "flow_name" "text",
    "question_id" "text" NOT NULL,
    "question_text" "text" NOT NULL,
    "dimension_key" "text",
    "raw_input" "text" NOT NULL,
    "structured_values" "jsonb" DEFAULT '{}'::"jsonb",
    "event_type" "text" NOT NULL,
    "response_duration_seconds" integer,
    "context_snapshot" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workshop_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workshop_questions" (
    "id" "text" NOT NULL,
    "tool_name" "text" NOT NULL,
    "flow_name" "text" NOT NULL,
    "dimension_key" "text",
    "question_text" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "options" "jsonb",
    "weight" numeric DEFAULT 1.0,
    "display_order" integer,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workshop_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workshop_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "intake_id" "uuid",
    "facilitator_name" "text" NOT NULL,
    "workshop_date" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "current_segment" integer DEFAULT 1,
    "segment_timers" "jsonb" DEFAULT '[]'::"jsonb",
    "participant_count" integer DEFAULT 0,
    "cognitive_baseline_data" "jsonb" DEFAULT '{}'::"jsonb",
    "workshop_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "facilitator_email" "text" DEFAULT ''::"text" NOT NULL,
    "bootcamp_plan_id" "uuid",
    "planned_duration_hours" numeric DEFAULT 4.0,
    "segments_completed" "text"[] DEFAULT ARRAY[]::"text"[],
    "alignment_score" integer DEFAULT 0,
    "tension_map" "jsonb" DEFAULT '{}'::"jsonb",
    "decision_framework_generated" boolean DEFAULT false,
    "key_concepts_delivered" "jsonb" DEFAULT '[]'::"jsonb",
    "tension_observations" "jsonb" DEFAULT '[]'::"jsonb",
    "alignment_signals" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "workshop_sessions_current_segment_check" CHECK ((("current_segment" >= 1) AND ("current_segment" <= 6))),
    CONSTRAINT "workshop_sessions_planned_duration_hours_check" CHECK (("planned_duration_hours" = ANY (ARRAY[1.0, 2.0, 3.0, 4.0]))),
    CONSTRAINT "workshop_sessions_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."workshop_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."workshop_sessions"."facilitator_email" IS 'Email of the facilitator who created this workshop. Used for access control.';



COMMENT ON COLUMN "public"."workshop_sessions"."bootcamp_plan_id" IS 'Links this workshop session to its bootcamp plan for data auto-population.';



COMMENT ON COLUMN "public"."workshop_sessions"."tension_observations" IS 'Array of observed tension moments: {segment, timestamp, type, description, participants_involved}';



COMMENT ON COLUMN "public"."workshop_sessions"."alignment_signals" IS 'Tracked alignment indicators: {convergence_time, disagreement_count, commitment_level}';



ALTER TABLE ONLY "private"."mindmake_personal_read_rate_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"private"."mindmake_personal_read_rate_events_id_seq"'::"regclass");



ALTER TABLE ONLY "ctrl_discovery"."records"
    ADD CONSTRAINT "records_pkey" PRIMARY KEY ("sequence_no");



ALTER TABLE ONLY "ctrl_discovery"."records"
    ADD CONSTRAINT "records_record_uuid_key" UNIQUE ("record_uuid");



ALTER TABLE ONLY "ctrl_discovery"."records"
    ADD CONSTRAINT "records_session_key_idempotency_key_key" UNIQUE ("session_key", "idempotency_key");



ALTER TABLE ONLY "ctrl_discovery"."records"
    ADD CONSTRAINT "records_session_key_record_key_version_key" UNIQUE ("session_key", "record_key", "version");



ALTER TABLE ONLY "ctrl_discovery"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_key");



ALTER TABLE ONLY "ctrl_discovery"."sessions"
    ADD CONSTRAINT "sessions_source_thread_ref_key" UNIQUE ("source_thread_ref");



ALTER TABLE ONLY "private"."mindmake_brief_rate_events"
    ADD CONSTRAINT "mindmake_brief_rate_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "private"."mindmake_brief_requests"
    ADD CONSTRAINT "mindmake_brief_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "private"."mindmake_brief_requests"
    ADD CONSTRAINT "mindmake_brief_requests_request_id_key" UNIQUE ("request_id");



ALTER TABLE ONLY "private"."mindmake_personal_read_rate_events"
    ADD CONSTRAINT "mindmake_personal_read_rate_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."aa_model_snapshots"
    ADD CONSTRAINT "aa_model_snapshots_pkey" PRIMARY KEY ("snapshot_date", "model_id");



ALTER TABLE ONLY "public"."activity_sessions"
    ADD CONSTRAINT "activity_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."adoption_momentum"
    ADD CONSTRAINT "adoption_momentum_company_identifier_hash_key" UNIQUE ("company_identifier_hash");



ALTER TABLE ONLY "public"."adoption_momentum"
    ADD CONSTRAINT "adoption_momentum_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_insights_generated"
    ADD CONSTRAINT "ai_insights_generated_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_leadership_index_snapshots"
    ADD CONSTRAINT "ai_leadership_index_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_leadership_index_snapshots"
    ADD CONSTRAINT "ai_leadership_index_snapshots_quarter_key" UNIQUE ("quarter");



ALTER TABLE ONLY "public"."ai_literacy_modules"
    ADD CONSTRAINT "ai_literacy_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_response_cache"
    ADD CONSTRAINT "ai_response_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_audit"
    ADD CONSTRAINT "ai_usage_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_behavioral_adjustments"
    ADD CONSTRAINT "assessment_behavioral_adjustments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_events"
    ADD CONSTRAINT "assessment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_questions"
    ADD CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_questions"
    ADD CONSTRAINT "assessment_questions_question_key_key" UNIQUE ("question_key");



ALTER TABLE ONLY "public"."assessment_referrals"
    ADD CONSTRAINT "assessment_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_referrals"
    ADD CONSTRAINT "assessment_referrals_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."audience_contacts"
    ADD CONSTRAINT "audience_contacts_email_source_key" UNIQUE ("email", "source");



ALTER TABLE ONLY "public"."audience_contacts"
    ADD CONSTRAINT "audience_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automator_usage"
    ADD CONSTRAINT "automator_usage_pkey" PRIMARY KEY ("user_id", "month");



ALTER TABLE ONLY "public"."be_episodes"
    ADD CONSTRAINT "be_episodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."be_guest_applications"
    ADD CONSTRAINT "be_guest_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."be_guests"
    ADD CONSTRAINT "be_guests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."be_testimonials"
    ADD CONSTRAINT "be_testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blind_spot_evidence_links"
    ADD CONSTRAINT "blind_spot_evidence_links_pattern_id_source_kind_source_id__key" UNIQUE ("pattern_id", "source_kind", "source_id", "role");



ALTER TABLE ONLY "public"."blind_spot_evidence_links"
    ADD CONSTRAINT "blind_spot_evidence_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blind_spot_experiments"
    ADD CONSTRAINT "blind_spot_experiments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blind_spot_rejections"
    ADD CONSTRAINT "blind_spot_rejections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blind_spot_rejections"
    ADD CONSTRAINT "blind_spot_rejections_user_id_anchor_fingerprint_key" UNIQUE ("user_id", "anchor_fingerprint");



ALTER TABLE ONLY "public"."booking_requests"
    ADD CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bootcamp_plans"
    ADD CONSTRAINT "bootcamp_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bottleneck_submissions"
    ADD CONSTRAINT "bottleneck_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_assertions"
    ADD CONSTRAINT "brain_assertions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_audience_grants"
    ADD CONSTRAINT "brain_audience_grants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_item_version_assertions"
    ADD CONSTRAINT "brain_item_version_assertions_pkey" PRIMARY KEY ("item_version_id", "assertion_id", "evidence_role");



ALTER TABLE ONLY "public"."brain_item_versions"
    ADD CONSTRAINT "brain_item_versions_brain_item_id_version_key" UNIQUE ("brain_item_id", "version");



ALTER TABLE ONLY "public"."brain_item_versions"
    ADD CONSTRAINT "brain_item_versions_id_workspace_id_key" UNIQUE ("id", "workspace_id");



ALTER TABLE ONLY "public"."brain_item_versions"
    ADD CONSTRAINT "brain_item_versions_id_workspace_id_subject_id_key" UNIQUE ("id", "workspace_id", "subject_id");



ALTER TABLE ONLY "public"."brain_item_versions"
    ADD CONSTRAINT "brain_item_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_items"
    ADD CONSTRAINT "brain_items_id_workspace_id_subject_id_key" UNIQUE ("id", "workspace_id", "subject_id");



ALTER TABLE ONLY "public"."brain_items"
    ADD CONSTRAINT "brain_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_items"
    ADD CONSTRAINT "brain_items_workspace_id_item_key_key" UNIQUE ("workspace_id", "item_key");



ALTER TABLE ONLY "public"."brain_relationship_version_assertions"
    ADD CONSTRAINT "brain_relationship_version_assertions_pkey" PRIMARY KEY ("relationship_version_id", "assertion_id");



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_id_workspace_id_key" UNIQUE ("id", "workspace_id");



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_id_workspace_id_subject_id_key" UNIQUE ("id", "workspace_id", "subject_id");



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_relationship_id_version_key" UNIQUE ("relationship_id", "version");



ALTER TABLE ONLY "public"."brain_relationships"
    ADD CONSTRAINT "brain_relationships_id_workspace_id_subject_id_key" UNIQUE ("id", "workspace_id", "subject_id");



ALTER TABLE ONLY "public"."brain_relationships"
    ADD CONSTRAINT "brain_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_relationships"
    ADD CONSTRAINT "brain_relationships_workspace_id_relationship_key_key" UNIQUE ("workspace_id", "relationship_key");



ALTER TABLE ONLY "public"."brain_sources"
    ADD CONSTRAINT "brain_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_workspace_roles"
    ADD CONSTRAINT "brain_workspace_roles_pkey" PRIMARY KEY ("workspace_id", "user_id", "role");



ALTER TABLE ONLY "public"."brain_workspaces"
    ADD CONSTRAINT "brain_workspaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brain_workspaces"
    ADD CONSTRAINT "brain_workspaces_tenant_key_key" UNIQUE ("tenant_key");



ALTER TABLE ONLY "public"."briefing_feedback"
    ADD CONSTRAINT "briefing_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."briefing_interests"
    ADD CONSTRAINT "briefing_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."briefing_lens_feedback"
    ADD CONSTRAINT "briefing_lens_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."briefing_lens_feedback"
    ADD CONSTRAINT "briefing_lens_feedback_user_id_lens_item_signature_source_key" UNIQUE ("user_id", "lens_item_signature", "source");



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_user_id_briefing_date_type_key" UNIQUE ("user_id", "briefing_date", "briefing_type");



ALTER TABLE ONLY "public"."cannes_responses"
    ADD CONSTRAINT "cannes_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_context"
    ADD CONSTRAINT "company_context_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_identifier_salt"
    ADD CONSTRAINT "company_identifier_salt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_research_cache"
    ADD CONSTRAINT "company_research_cache_domain_key" UNIQUE ("domain");



ALTER TABLE ONLY "public"."company_research_cache"
    ADD CONSTRAINT "company_research_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_audit"
    ADD CONSTRAINT "consent_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."constructs"
    ADD CONSTRAINT "constructs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contest_reports"
    ADD CONSTRAINT "contest_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversion_analytics"
    ADD CONSTRAINT "conversion_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."criteria"
    ADD CONSTRAINT "criteria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_audit_log"
    ADD CONSTRAINT "data_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_alerts"
    ADD CONSTRAINT "decision_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_cases"
    ADD CONSTRAINT "decision_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_check_items"
    ADD CONSTRAINT "decision_check_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_check_items"
    ADD CONSTRAINT "decision_check_items_user_id_decision_case_id_item_key_key" UNIQUE ("user_id", "decision_case_id", "item_key");



ALTER TABLE ONLY "public"."decision_claims"
    ADD CONSTRAINT "decision_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_eval_cases"
    ADD CONSTRAINT "decision_eval_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_events"
    ADD CONSTRAINT "decision_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_evidence"
    ADD CONSTRAINT "decision_evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_frameworks"
    ADD CONSTRAINT "decision_frameworks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_outcomes"
    ADD CONSTRAINT "decision_outcomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_tensions"
    ADD CONSTRAINT "decision_tensions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_user_calls"
    ADD CONSTRAINT "decision_user_calls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_subscriptions"
    ADD CONSTRAINT "delivery_subscriptions_channel_destination_hash_key" UNIQUE ("channel", "destination_hash");



ALTER TABLE ONLY "public"."delivery_subscriptions"
    ADD CONSTRAINT "delivery_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edge_actions"
    ADD CONSTRAINT "edge_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edge_feedback"
    ADD CONSTRAINT "edge_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edge_profiles"
    ADD CONSTRAINT "edge_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edge_profiles"
    ADD CONSTRAINT "edge_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."edge_subscriptions"
    ADD CONSTRAINT "edge_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edge_subscriptions"
    ADD CONSTRAINT "edge_subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."effortless_map_items"
    ADD CONSTRAINT "effortless_map_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engagement_analytics"
    ADD CONSTRAINT "engagement_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engagement_intelligence"
    ADD CONSTRAINT "engagement_intelligence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evidence_sources"
    ADD CONSTRAINT "evidence_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exec_intakes"
    ADD CONSTRAINT "exec_intakes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exec_pulses"
    ADD CONSTRAINT "exec_pulses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fact_extraction_log"
    ADD CONSTRAINT "fact_extraction_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follow_up_queue"
    ADD CONSTRAINT "follow_up_queue_email_source_key" UNIQUE ("email", "source");



ALTER TABLE ONLY "public"."follow_up_queue"
    ADD CONSTRAINT "follow_up_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."generated_artifacts"
    ADD CONSTRAINT "generated_artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."google_sheets_sync_log"
    ADD CONSTRAINT "google_sheets_sync_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."harness_runs"
    ADD CONSTRAINT "harness_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."huddle_synthesis"
    ADD CONSTRAINT "huddle_synthesis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."huddle_synthesis"
    ADD CONSTRAINT "huddle_synthesis_workshop_session_id_key" UNIQUE ("workshop_session_id");



ALTER TABLE ONLY "public"."index_participant_data"
    ADD CONSTRAINT "index_participant_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."index_participant_data"
    ADD CONSTRAINT "index_participant_data_user_id_completed_at_key" UNIQUE ("user_id", "completed_at");



ALTER TABLE ONLY "public"."index_publication_rules"
    ADD CONSTRAINT "index_publication_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."index_publication_rules"
    ADD CONSTRAINT "index_publication_rules_version_key" UNIQUE ("version");



ALTER TABLE ONLY "public"."industry_beat_library"
    ADD CONSTRAINT "industry_beat_library_industry_key_key" UNIQUE ("industry_key");



ALTER TABLE ONLY "public"."industry_beat_library"
    ADD CONSTRAINT "industry_beat_library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."insight_dimensions"
    ADD CONSTRAINT "insight_dimensions_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."intake_submissions"
    ADD CONSTRAINT "intake_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kit_artifacts"
    ADD CONSTRAINT "kit_artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kit_artifacts"
    ADD CONSTRAINT "kit_artifacts_version_key" UNIQUE ("redemption_id", "artifact_id", "version");



ALTER TABLE ONLY "public"."kit_builds"
    ADD CONSTRAINT "kit_builds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kit_codes"
    ADD CONSTRAINT "kit_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."kit_codes"
    ADD CONSTRAINT "kit_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kit_journey_events"
    ADD CONSTRAINT "kit_journey_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kit_nudges"
    ADD CONSTRAINT "kit_nudges_once_key" UNIQUE ("redemption_id", "nudge_type");



ALTER TABLE ONLY "public"."kit_nudges"
    ADD CONSTRAINT "kit_nudges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kit_redemptions"
    ADD CONSTRAINT "kit_redemptions_code_user_key" UNIQUE ("code_id", "user_id");



ALTER TABLE ONLY "public"."kit_redemptions"
    ADD CONSTRAINT "kit_redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kit_waitlist"
    ADD CONSTRAINT "kit_waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_qualification_scores"
    ADD CONSTRAINT "lead_qualification_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_qualifications"
    ADD CONSTRAINT "lead_qualifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_assessments"
    ADD CONSTRAINT "leader_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_check_ins"
    ADD CONSTRAINT "leader_check_ins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_dimension_scores"
    ADD CONSTRAINT "leader_dimension_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_first_moves"
    ADD CONSTRAINT "leader_first_moves_assessment_id_move_number_key" UNIQUE ("assessment_id", "move_number");



ALTER TABLE ONLY "public"."leader_first_moves"
    ADD CONSTRAINT "leader_first_moves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_missions"
    ADD CONSTRAINT "leader_missions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_notification_prefs"
    ADD CONSTRAINT "leader_notification_prefs_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."leader_org_scenarios"
    ADD CONSTRAINT "leader_org_scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_progress_snapshots"
    ADD CONSTRAINT "leader_progress_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_prompt_sets"
    ADD CONSTRAINT "leader_prompt_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_risk_signals"
    ADD CONSTRAINT "leader_risk_signals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leader_tensions"
    ADD CONSTRAINT "leader_tensions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaders"
    ADD CONSTRAINT "leaders_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."leaders"
    ADD CONSTRAINT "leaders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."live_headlines_cache"
    ADD CONSTRAINT "live_headlines_cache_pkey" PRIMARY KEY ("briefing_date");



ALTER TABLE ONLY "public"."llm_call_log"
    ADD CONSTRAINT "llm_call_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mcp_pulls"
    ADD CONSTRAINT "mcp_pulls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mcp_tokens"
    ADD CONSTRAINT "mcp_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mcp_tokens"
    ADD CONSTRAINT "mcp_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."meeting_prep_sessions"
    ADD CONSTRAINT "meeting_prep_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memory_edges"
    ADD CONSTRAINT "memory_edges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memory_events"
    ADD CONSTRAINT "memory_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memory_links"
    ADD CONSTRAINT "memory_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mindmake_personal_reads"
    ADD CONSTRAINT "mindmake_personal_reads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news_preferences"
    ADD CONSTRAINT "news_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."news_trends"
    ADD CONSTRAINT "news_trends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."north_star_daily"
    ADD CONSTRAINT "north_star_daily_pkey" PRIMARY KEY ("day");



ALTER TABLE ONLY "public"."sort_items"
    ADD CONSTRAINT "one_position_per_session" UNIQUE ("session_id", "position");



ALTER TABLE ONLY "public"."partner_intakes"
    ADD CONSTRAINT "partner_intakes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_plans"
    ADD CONSTRAINT "partner_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partner_plans"
    ADD CONSTRAINT "partner_plans_share_slug_key" UNIQUE ("share_slug");



ALTER TABLE ONLY "public"."partner_portfolio_items"
    ADD CONSTRAINT "partner_portfolio_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_pool_cache"
    ADD CONSTRAINT "personal_pool_cache_pkey" PRIMARY KEY ("user_id", "briefing_date");



ALTER TABLE ONLY "public"."pilot_charter"
    ADD CONSTRAINT "pilot_charter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_charter"
    ADD CONSTRAINT "pilot_charter_workshop_session_id_key" UNIQUE ("workshop_session_id");



ALTER TABLE ONLY "public"."portfolio_handoff"
    ADD CONSTRAINT "portfolio_handoff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_session_reviews"
    ADD CONSTRAINT "post_session_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pre_workshop_inputs"
    ADD CONSTRAINT "pre_workshop_inputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_insights"
    ADD CONSTRAINT "profile_insights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."prompt_library_profiles"
    ADD CONSTRAINT "prompt_library_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provocation_reports"
    ADD CONSTRAINT "provocation_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provocation_reports"
    ADD CONSTRAINT "provocation_reports_workshop_session_id_key" UNIQUE ("workshop_session_id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referring_company_hash_referred_company_hash_key" UNIQUE ("referring_company_hash", "referred_company_hash");



ALTER TABLE ONLY "public"."roi_actuals"
    ADD CONSTRAINT "roi_actuals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."segment_summaries"
    ADD CONSTRAINT "segment_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."segment_summaries"
    ADD CONSTRAINT "segment_summaries_workshop_session_id_segment_key_key" UNIQUE ("workshop_session_id", "segment_key");



ALTER TABLE ONLY "public"."simulation_results"
    ADD CONSTRAINT "simulation_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_exports"
    ADD CONSTRAINT "skill_exports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_provenance"
    ADD CONSTRAINT "skill_provenance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sort_grades"
    ADD CONSTRAINT "sort_grades_item_unique" UNIQUE ("item_id");



ALTER TABLE ONLY "public"."sort_grades"
    ADD CONSTRAINT "sort_grades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sort_items"
    ADD CONSTRAINT "sort_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."strategy_addendum"
    ADD CONSTRAINT "strategy_addendum_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."strategy_addendum"
    ADD CONSTRAINT "strategy_addendum_workshop_session_id_key" UNIQUE ("workshop_session_id");



ALTER TABLE ONLY "public"."stripe_events_processed"
    ADD CONSTRAINT "stripe_events_processed_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."suggested_briefing_interests"
    ADD CONSTRAINT "suggested_briefing_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_material"
    ADD CONSTRAINT "training_material_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tts_config"
    ADD CONSTRAINT "tts_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tts_quality_snapshots"
    ADD CONSTRAINT "tts_quality_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unified_profiles"
    ADD CONSTRAINT "unified_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."unified_profiles"
    ADD CONSTRAINT "unified_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_briefing_directives"
    ADD CONSTRAINT "user_briefing_directives_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_business_context"
    ADD CONSTRAINT "user_business_context_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_business_context"
    ADD CONSTRAINT "user_business_context_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_decisions"
    ADD CONSTRAINT "user_decisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_memory_budget"
    ADD CONSTRAINT "user_memory_budget_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_memory_budget"
    ADD CONSTRAINT "user_memory_budget_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_memory"
    ADD CONSTRAINT "user_memory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_memory_settings"
    ADD CONSTRAINT "user_memory_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_memory_settings"
    ADD CONSTRAINT "user_memory_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_patterns"
    ADD CONSTRAINT "user_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."velocity_events"
    ADD CONSTRAINT "velocity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voice_instrumentation"
    ADD CONSTRAINT "voice_instrumentation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voice_sessions"
    ADD CONSTRAINT "voice_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voting_results"
    ADD CONSTRAINT "voting_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."working_group_inputs"
    ADD CONSTRAINT "working_group_inputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_events"
    ADD CONSTRAINT "workshop_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_questions"
    ADD CONSTRAINT "workshop_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workshop_sessions"
    ADD CONSTRAINT "workshop_sessions_pkey" PRIMARY KEY ("id");



CREATE INDEX "records_previous_record_uuid_idx" ON "ctrl_discovery"."records" USING "btree" ("previous_record_uuid") WHERE ("previous_record_uuid" IS NOT NULL);



CREATE INDEX "records_session_state_idx" ON "ctrl_discovery"."records" USING "btree" ("session_key", "state", "record_type");



CREATE INDEX "records_session_type_key_idx" ON "ctrl_discovery"."records" USING "btree" ("session_key", "record_type", "record_key" COLLATE "C", "version" DESC);



CREATE INDEX "mindmake_brief_rate_events_email_idx" ON "private"."mindmake_brief_rate_events" USING "btree" ("email_identifier_hash", "created_at" DESC);



CREATE INDEX "mindmake_brief_rate_events_ip_idx" ON "private"."mindmake_brief_rate_events" USING "btree" ("ip_identifier_hash", "created_at" DESC);



CREATE INDEX "mindmake_brief_requests_created_idx" ON "private"."mindmake_brief_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "mindmake_brief_requests_publication_interest_idx" ON "private"."mindmake_brief_requests" USING "btree" ("created_at" DESC) WHERE "publication_requested";



CREATE INDEX "mindmake_brief_requests_unverified_expiry_idx" ON "private"."mindmake_brief_requests" USING "btree" ("verification_expires_at") WHERE ("verified_at" IS NULL);



CREATE INDEX "mindmake_personal_read_rate_email_idx" ON "private"."mindmake_personal_read_rate_events" USING "btree" ("email_identifier_hash", "created_at" DESC);



CREATE INDEX "mindmake_personal_read_rate_ip_idx" ON "private"."mindmake_personal_read_rate_events" USING "btree" ("ip_identifier_hash", "created_at" DESC);



CREATE INDEX "aa_model_snapshots_model_idx" ON "public"."aa_model_snapshots" USING "btree" ("model_id", "snapshot_date" DESC);



CREATE INDEX "audience_contacts_unsynced_idx" ON "public"."audience_contacts" USING "btree" ("created_at") WHERE ("synced_to_os_at" IS NULL);



CREATE INDEX "automator_usage_user_month_idx" ON "public"."automator_usage" USING "btree" ("user_id", "month" DESC);



CREATE INDEX "brain_assertions_created_by_idx" ON "public"."brain_assertions" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE INDEX "brain_assertions_source_idx" ON "public"."brain_assertions" USING "btree" ("source_id");



CREATE INDEX "brain_assertions_speaker_user_idx" ON "public"."brain_assertions" USING "btree" ("speaker_user_id") WHERE ("speaker_user_id" IS NOT NULL);



CREATE INDEX "brain_assertions_subject_idx" ON "public"."brain_assertions" USING "btree" ("subject_id");



CREATE INDEX "brain_assertions_workspace_audience_idx" ON "public"."brain_assertions" USING "btree" ("workspace_id", "audience", "recorded_at" DESC);



CREATE UNIQUE INDEX "brain_audience_grants_active_unique" ON "public"."brain_audience_grants" USING "btree" ("workspace_id", "grantee_user_id", "audience", "purpose") WHERE ("revoked_at" IS NULL);



CREATE INDEX "brain_audience_grants_granted_by_idx" ON "public"."brain_audience_grants" USING "btree" ("granted_by") WHERE ("granted_by" IS NOT NULL);



CREATE INDEX "brain_audience_grants_grantee_active_idx" ON "public"."brain_audience_grants" USING "btree" ("grantee_user_id", "workspace_id", "audience") WHERE ("revoked_at" IS NULL);



CREATE INDEX "brain_item_version_assertions_assertion_idx" ON "public"."brain_item_version_assertions" USING "btree" ("assertion_id");



CREATE INDEX "brain_item_version_assertions_linked_by_idx" ON "public"."brain_item_version_assertions" USING "btree" ("linked_by") WHERE ("linked_by" IS NOT NULL);



CREATE INDEX "brain_item_version_assertions_parent_fk_idx" ON "public"."brain_item_version_assertions" USING "btree" ("item_version_id", "workspace_id");



CREATE INDEX "brain_item_version_assertions_workspace_audience_idx" ON "public"."brain_item_version_assertions" USING "btree" ("workspace_id", "audience");



CREATE INDEX "brain_item_versions_created_by_idx" ON "public"."brain_item_versions" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE UNIQUE INDEX "brain_item_versions_one_current" ON "public"."brain_item_versions" USING "btree" ("brain_item_id") WHERE ("standing" = 'current'::"text");



CREATE INDEX "brain_item_versions_parent_fk_idx" ON "public"."brain_item_versions" USING "btree" ("brain_item_id", "workspace_id", "subject_id");



CREATE INDEX "brain_item_versions_predecessor_idx" ON "public"."brain_item_versions" USING "btree" ("predecessor_version_id") WHERE ("predecessor_version_id" IS NOT NULL);



CREATE INDEX "brain_item_versions_subject_idx" ON "public"."brain_item_versions" USING "btree" ("subject_id");



CREATE INDEX "brain_item_versions_superseded_by_idx" ON "public"."brain_item_versions" USING "btree" ("superseded_by_version_id") WHERE ("superseded_by_version_id" IS NOT NULL);



CREATE INDEX "brain_item_versions_workspace_audience_idx" ON "public"."brain_item_versions" USING "btree" ("workspace_id", "audience", "standing", "maturity");



CREATE INDEX "brain_items_created_by_idx" ON "public"."brain_items" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE INDEX "brain_items_subject_idx" ON "public"."brain_items" USING "btree" ("subject_id");



CREATE INDEX "brain_items_workspace_idx" ON "public"."brain_items" USING "btree" ("workspace_id");



CREATE INDEX "brain_relationship_version_assertions_assertion_idx" ON "public"."brain_relationship_version_assertions" USING "btree" ("assertion_id");



CREATE INDEX "brain_relationship_version_assertions_linked_by_idx" ON "public"."brain_relationship_version_assertions" USING "btree" ("linked_by") WHERE ("linked_by" IS NOT NULL);



CREATE INDEX "brain_relationship_version_assertions_parent_fk_idx" ON "public"."brain_relationship_version_assertions" USING "btree" ("relationship_version_id", "workspace_id");



CREATE INDEX "brain_relationship_version_assertions_workspace_audience_idx" ON "public"."brain_relationship_version_assertions" USING "btree" ("workspace_id", "audience");



CREATE INDEX "brain_relationship_versions_created_by_idx" ON "public"."brain_relationship_versions" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE INDEX "brain_relationship_versions_from_idx" ON "public"."brain_relationship_versions" USING "btree" ("from_item_version_id");



CREATE UNIQUE INDEX "brain_relationship_versions_one_current" ON "public"."brain_relationship_versions" USING "btree" ("relationship_id") WHERE ("standing" = 'current'::"text");



CREATE INDEX "brain_relationship_versions_parent_fk_idx" ON "public"."brain_relationship_versions" USING "btree" ("relationship_id", "workspace_id", "subject_id");



CREATE INDEX "brain_relationship_versions_predecessor_idx" ON "public"."brain_relationship_versions" USING "btree" ("predecessor_version_id") WHERE ("predecessor_version_id" IS NOT NULL);



CREATE INDEX "brain_relationship_versions_subject_idx" ON "public"."brain_relationship_versions" USING "btree" ("subject_id");



CREATE INDEX "brain_relationship_versions_superseded_by_idx" ON "public"."brain_relationship_versions" USING "btree" ("superseded_by_version_id") WHERE ("superseded_by_version_id" IS NOT NULL);



CREATE INDEX "brain_relationship_versions_to_idx" ON "public"."brain_relationship_versions" USING "btree" ("to_item_version_id");



CREATE INDEX "brain_relationship_versions_workspace_audience_idx" ON "public"."brain_relationship_versions" USING "btree" ("workspace_id", "audience", "standing", "maturity");



CREATE INDEX "brain_relationships_created_by_idx" ON "public"."brain_relationships" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE INDEX "brain_relationships_from_idx" ON "public"."brain_relationships" USING "btree" ("from_item_id");



CREATE INDEX "brain_relationships_subject_idx" ON "public"."brain_relationships" USING "btree" ("subject_id");



CREATE INDEX "brain_relationships_to_idx" ON "public"."brain_relationships" USING "btree" ("to_item_id");



CREATE INDEX "brain_relationships_workspace_idx" ON "public"."brain_relationships" USING "btree" ("workspace_id");



CREATE INDEX "brain_sources_actor_user_idx" ON "public"."brain_sources" USING "btree" ("actor_user_id") WHERE ("actor_user_id" IS NOT NULL);



CREATE INDEX "brain_sources_created_by_idx" ON "public"."brain_sources" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE INDEX "brain_sources_subject_idx" ON "public"."brain_sources" USING "btree" ("subject_id");



CREATE INDEX "brain_sources_workspace_audience_idx" ON "public"."brain_sources" USING "btree" ("workspace_id", "audience", "captured_at" DESC);



CREATE INDEX "brain_workspace_roles_granted_by_idx" ON "public"."brain_workspace_roles" USING "btree" ("granted_by") WHERE ("granted_by" IS NOT NULL);



CREATE INDEX "brain_workspace_roles_user_active_idx" ON "public"."brain_workspace_roles" USING "btree" ("user_id", "workspace_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "brain_workspaces_owner_idx" ON "public"."brain_workspaces" USING "btree" ("owner_id");



CREATE INDEX "brain_workspaces_subject_fk_idx" ON "public"."brain_workspaces" USING "btree" ("subject_id");



CREATE UNIQUE INDEX "briefing_interests_one_active_normalized" ON "public"."briefing_interests" USING "btree" ("user_id", "kind", "lower"("btrim"("text"))) WHERE ("is_active" = true);



CREATE INDEX "cannes_responses_created_at_idx" ON "public"."cannes_responses" USING "btree" ("created_at" DESC);



CREATE INDEX "cannes_responses_email_idx" ON "public"."cannes_responses" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE INDEX "cannes_responses_enrichment_status_idx" ON "public"."cannes_responses" USING "btree" ("enrichment_status") WHERE ("enrichment_status" IS NOT NULL);



CREATE INDEX "cannes_responses_entry_variant_idx" ON "public"."cannes_responses" USING "btree" ("entry_variant") WHERE ("entry_variant" IS NOT NULL);



CREATE INDEX "cannes_responses_resolved_linkedin_url_idx" ON "public"."cannes_responses" USING "btree" ("resolved_linkedin_url") WHERE ("resolved_linkedin_url" IS NOT NULL);



CREATE INDEX "cannes_responses_source_idx" ON "public"."cannes_responses" USING "btree" ("source");



CREATE INDEX "constructs_user_status_idx" ON "public"."constructs" USING "btree" ("user_id", "status");



CREATE UNIQUE INDEX "criteria_current_unique" ON "public"."criteria" USING "btree" ("user_id", "surface", "name") WHERE "is_current";



CREATE INDEX "criteria_resolve_idx" ON "public"."criteria" USING "btree" ("user_id", "surface") WHERE "is_current";



CREATE UNIQUE INDEX "decision_cases_one_pin" ON "public"."decision_cases" USING "btree" ("user_id") WHERE ("pinned_at" IS NOT NULL);



CREATE INDEX "delivery_subscriptions_due_idx" ON "public"."delivery_subscriptions" USING "btree" ("status", "channel", "last_sent_date");



CREATE UNIQUE INDEX "delivery_subscriptions_unsubscribe_idx" ON "public"."delivery_subscriptions" USING "btree" ("unsubscribe_token_hash");



CREATE INDEX "delivery_subscriptions_user_idx" ON "public"."delivery_subscriptions" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "engagement_intelligence_consent_idx" ON "public"."engagement_intelligence" USING "btree" ("retention_consented") WHERE "retention_consented";



CREATE INDEX "engagement_intelligence_offer_idx" ON "public"."engagement_intelligence" USING "btree" ("offer_id", "created_at" DESC);



CREATE INDEX "engagement_intelligence_sector_idx" ON "public"."engagement_intelligence" USING "btree" ("sector");



CREATE INDEX "evidence_retention_idx" ON "public"."evidence" USING "btree" ("retention_expires_at") WHERE (("retention_expires_at" IS NOT NULL) AND ("redacted_at" IS NULL));



CREATE INDEX "evidence_sources_user_idx" ON "public"."evidence_sources" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "evidence_user_kind_idx" ON "public"."evidence" USING "btree" ("user_id", "kind");



CREATE INDEX "follow_up_queue_due_idx" ON "public"."follow_up_queue" USING "btree" ("send_after") WHERE ("sent_at" IS NULL);



CREATE INDEX "harness_runs_user_idx" ON "public"."harness_runs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_activity_sessions_workshop" ON "public"."activity_sessions" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_adoption_latest_date" ON "public"."adoption_momentum" USING "btree" ("latest_assessment_date" DESC);



CREATE INDEX "idx_adoption_momentum_score" ON "public"."adoption_momentum" USING "btree" ("momentum_score" DESC);



CREATE INDEX "idx_ai_conversations_session_id" ON "public"."ai_conversations" USING "btree" ("session_id");



CREATE INDEX "idx_ai_conversations_user_id" ON "public"."ai_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_insights_generated_user_id" ON "public"."ai_insights_generated" USING "btree" ("user_id");



CREATE INDEX "idx_ai_insights_session_id" ON "public"."ai_insights_generated" USING "btree" ("session_id");



CREATE INDEX "idx_ai_leadership_index_snapshots_methodology_version" ON "public"."ai_leadership_index_snapshots" USING "btree" ("methodology_version");



CREATE INDEX "idx_ai_response_cache_expires_at" ON "public"."ai_response_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_ai_response_cache_lookup" ON "public"."ai_response_cache" USING "btree" ("prompt_hash", "model", "expires_at" DESC);



CREATE INDEX "idx_ai_usage_audit_function" ON "public"."ai_usage_audit" USING "btree" ("function_name", "created_at" DESC);



CREATE INDEX "idx_ai_usage_audit_user" ON "public"."ai_usage_audit" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_ai_usage_audit_user_day" ON "public"."ai_usage_audit" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_analytics_sheets_sync" ON "public"."conversion_analytics" USING "btree" ("created_at", "conversion_type");



CREATE INDEX "idx_assessment_events_session_id" ON "public"."assessment_events" USING "btree" ("session_id");



CREATE INDEX "idx_assessment_referrals_referee" ON "public"."assessment_referrals" USING "btree" ("referee_assessment_id");



CREATE INDEX "idx_assessment_referrals_referrer" ON "public"."assessment_referrals" USING "btree" ("referrer_assessment_id");



CREATE INDEX "idx_audience_contacts_created_at" ON "public"."audience_contacts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audience_contacts_email_lower" ON "public"."audience_contacts" USING "btree" ("lower"("email"));



CREATE INDEX "idx_audience_contacts_source" ON "public"."audience_contacts" USING "btree" ("source");



CREATE INDEX "idx_be_episodes_published_at" ON "public"."be_episodes" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_be_guest_applications_created_at" ON "public"."be_guest_applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_be_guests_approved" ON "public"."be_guests" USING "btree" ("approved");



CREATE INDEX "idx_be_guests_episode_id" ON "public"."be_guests" USING "btree" ("episode_id");



CREATE INDEX "idx_be_testimonials_featured" ON "public"."be_testimonials" USING "btree" ("featured");



CREATE INDEX "idx_behavioral_assessment" ON "public"."assessment_behavioral_adjustments" USING "btree" ("assessment_id");



CREATE INDEX "idx_blind_spot_evidence_pattern" ON "public"."blind_spot_evidence_links" USING "btree" ("pattern_id");



CREATE INDEX "idx_blind_spot_evidence_user" ON "public"."blind_spot_evidence_links" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_blind_spot_experiments_due" ON "public"."blind_spot_experiments" USING "btree" ("user_id", "due_at") WHERE ("status" = 'active'::"text");



CREATE UNIQUE INDEX "idx_blind_spot_one_active_experiment" ON "public"."blind_spot_experiments" USING "btree" ("pattern_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_blind_spot_rejections_user" ON "public"."blind_spot_rejections" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_booking_requests_lead_score" ON "public"."booking_requests" USING "btree" ("lead_score");



CREATE INDEX "idx_booking_requests_session_id" ON "public"."booking_requests" USING "btree" ("session_id");



CREATE INDEX "idx_booking_requests_sheets_sync" ON "public"."booking_requests" USING "btree" ("created_at", "status", "priority");



CREATE INDEX "idx_booking_requests_status" ON "public"."booking_requests" USING "btree" ("status");



CREATE INDEX "idx_booking_requests_user_id" ON "public"."booking_requests" USING "btree" ("user_id");



CREATE INDEX "idx_bootcamp_plans_intake_id" ON "public"."bootcamp_plans" USING "btree" ("intake_id");



CREATE INDEX "idx_bottleneck_submissions_activity_session_id" ON "public"."bottleneck_submissions" USING "btree" ("activity_session_id");



CREATE INDEX "idx_bottleneck_submissions_profile_id" ON "public"."bottleneck_submissions" USING "btree" ("profile_id");



CREATE INDEX "idx_bottleneck_submissions_workshop" ON "public"."bottleneck_submissions" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_briefing_feedback_briefing" ON "public"."briefing_feedback" USING "btree" ("briefing_id");



CREATE INDEX "idx_briefing_feedback_briefing_created" ON "public"."briefing_feedback" USING "btree" ("briefing_id", "created_at" DESC);



CREATE INDEX "idx_briefing_feedback_lens_item" ON "public"."briefing_feedback" USING "btree" ("lens_item_id") WHERE ("lens_item_id" IS NOT NULL);



CREATE INDEX "idx_briefing_interests_user_active" ON "public"."briefing_interests" USING "btree" ("user_id") WHERE "is_active";



CREATE INDEX "idx_briefing_interests_user_kind" ON "public"."briefing_interests" USING "btree" ("user_id", "kind") WHERE "is_active";



CREATE INDEX "idx_briefing_lens_feedback_signature" ON "public"."briefing_lens_feedback" USING "btree" ("user_id", "lens_item_signature") WHERE "is_active";



CREATE INDEX "idx_briefing_lens_feedback_user_active" ON "public"."briefing_lens_feedback" USING "btree" ("user_id") WHERE "is_active";



CREATE INDEX "idx_briefings_schema_version" ON "public"."briefings" USING "btree" ("schema_version");



CREATE INDEX "idx_briefings_user_date" ON "public"."briefings" USING "btree" ("user_id", "briefing_date" DESC);



CREATE INDEX "idx_chat_assessment" ON "public"."chat_messages" USING "btree" ("assessment_id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at");



CREATE INDEX "idx_chat_messages_session_id" ON "public"."chat_messages" USING "btree" ("session_id");



CREATE INDEX "idx_chat_messages_user_id" ON "public"."chat_messages" USING "btree" ("user_id");



CREATE INDEX "idx_company_context_assessment_id" ON "public"."company_context" USING "btree" ("assessment_id");



CREATE INDEX "idx_company_context_leader_id" ON "public"."company_context" USING "btree" ("leader_id");



CREATE INDEX "idx_company_research_cache_expires_at" ON "public"."company_research_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_consent_audit_changed_at" ON "public"."consent_audit" USING "btree" ("changed_at");



CREATE INDEX "idx_consent_audit_participant" ON "public"."consent_audit" USING "btree" ("participant_id");



CREATE INDEX "idx_contest_reports_open" ON "public"."contest_reports" USING "btree" ("status") WHERE ("status" = 'open'::"text");



CREATE INDEX "idx_contest_reports_user" ON "public"."contest_reports" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_conversation_sessions_user_id" ON "public"."conversation_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_conversion_analytics_conversion_type" ON "public"."conversion_analytics" USING "btree" ("conversion_type");



CREATE INDEX "idx_conversion_analytics_session_id" ON "public"."conversion_analytics" USING "btree" ("session_id");



CREATE INDEX "idx_conversion_analytics_user_id" ON "public"."conversion_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_data_audit_log_created" ON "public"."data_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_data_audit_log_table" ON "public"."data_audit_log" USING "btree" ("table_name", "created_at" DESC);



CREATE INDEX "idx_data_audit_log_user_id" ON "public"."data_audit_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_decision_alerts_case" ON "public"."decision_alerts" USING "btree" ("decision_case_id");



CREATE INDEX "idx_decision_alerts_claim_id" ON "public"."decision_alerts" USING "btree" ("claim_id");



CREATE INDEX "idx_decision_alerts_user_open" ON "public"."decision_alerts" USING "btree" ("user_id", "status");



CREATE INDEX "idx_decision_cases_status" ON "public"."decision_cases" USING "btree" ("user_id", "status");



CREATE INDEX "idx_decision_cases_user" ON "public"."decision_cases" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_decision_check_items_case" ON "public"."decision_check_items" USING "btree" ("decision_case_id", "user_id");



CREATE INDEX "idx_decision_claims_case" ON "public"."decision_claims" USING "btree" ("decision_case_id");



CREATE INDEX "idx_decision_claims_user" ON "public"."decision_claims" USING "btree" ("user_id");



CREATE INDEX "idx_decision_events_case" ON "public"."decision_events" USING "btree" ("decision_case_id", "occurred_at" DESC);



CREATE INDEX "idx_decision_events_user_id" ON "public"."decision_events" USING "btree" ("user_id");



CREATE INDEX "idx_decision_evidence_claim" ON "public"."decision_evidence" USING "btree" ("claim_id");



CREATE INDEX "idx_decision_evidence_user" ON "public"."decision_evidence" USING "btree" ("user_id");



CREATE INDEX "idx_decision_frameworks_workshop_session_id" ON "public"."decision_frameworks" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_decision_outcomes_case" ON "public"."decision_outcomes" USING "btree" ("user_id", "decision_case_id");



CREATE INDEX "idx_decision_outcomes_decision_case_id" ON "public"."decision_outcomes" USING "btree" ("decision_case_id");



CREATE INDEX "idx_decision_outcomes_unapplied" ON "public"."decision_outcomes" USING "btree" ("applied_to_brain") WHERE ("applied_to_brain" = false);



CREATE INDEX "idx_decision_tensions_case" ON "public"."decision_tensions" USING "btree" ("decision_case_id");



CREATE INDEX "idx_decision_tensions_user" ON "public"."decision_tensions" USING "btree" ("user_id");



CREATE INDEX "idx_decision_user_calls_case" ON "public"."decision_user_calls" USING "btree" ("decision_case_id");



CREATE INDEX "idx_decision_user_calls_claim_id" ON "public"."decision_user_calls" USING "btree" ("claim_id");



CREATE INDEX "idx_decision_user_calls_user" ON "public"."decision_user_calls" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_edge_actions_user_id" ON "public"."edge_actions" USING "btree" ("user_id");



CREATE INDEX "idx_edge_actions_user_type" ON "public"."edge_actions" USING "btree" ("user_id", "action_type");



CREATE INDEX "idx_edge_feedback_user_id" ON "public"."edge_feedback" USING "btree" ("user_id");



CREATE INDEX "idx_edge_subscriptions_stripe" ON "public"."edge_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_effortless_map_items_activity_session_id" ON "public"."effortless_map_items" USING "btree" ("activity_session_id");



CREATE INDEX "idx_effortless_map_items_profile_id" ON "public"."effortless_map_items" USING "btree" ("profile_id");



CREATE INDEX "idx_effortless_map_workshop" ON "public"."effortless_map_items" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_engagement_analytics_session_id" ON "public"."engagement_analytics" USING "btree" ("session_id");



CREATE INDEX "idx_engagement_analytics_user_id" ON "public"."engagement_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_events_assessment" ON "public"."assessment_events" USING "btree" ("assessment_id");



CREATE INDEX "idx_events_dimension" ON "public"."assessment_events" USING "btree" ("dimension_key");



CREATE INDEX "idx_events_profile" ON "public"."assessment_events" USING "btree" ("profile_id");



CREATE INDEX "idx_events_tool" ON "public"."assessment_events" USING "btree" ("tool_name");



CREATE INDEX "idx_exec_pulses_intake_id" ON "public"."exec_pulses" USING "btree" ("intake_id");



CREATE INDEX "idx_exec_pulses_profile_id" ON "public"."exec_pulses" USING "btree" ("profile_id");



CREATE INDEX "idx_fact_extraction_log_reason" ON "public"."fact_extraction_log" USING "btree" ("reason_id", "created_at" DESC);



CREATE INDEX "idx_fact_extraction_log_user" ON "public"."fact_extraction_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_feedback_created_at" ON "public"."feedback" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_feedback_user_id" ON "public"."feedback" USING "btree" ("user_id");



CREATE INDEX "idx_generated_artifacts_user_created" ON "public"."generated_artifacts" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_generated_artifacts_user_kind" ON "public"."generated_artifacts" USING "btree" ("user_id", "kind");



CREATE INDEX "idx_generated_artifacts_user_kind_created" ON "public"."generated_artifacts" USING "btree" ("user_id", "kind", "created_at" DESC);



CREATE INDEX "idx_goals_user_horizon" ON "public"."goals" USING "btree" ("user_id", "horizon");



CREATE INDEX "idx_goals_user_status" ON "public"."goals" USING "btree" ("user_id", "status");



CREATE INDEX "idx_google_sheets_sync_lead_id" ON "public"."google_sheets_sync_log" USING "btree" ("lead_id");



CREATE INDEX "idx_google_sheets_sync_log_created_at" ON "public"."google_sheets_sync_log" USING "btree" ("created_at");



CREATE INDEX "idx_google_sheets_sync_log_status" ON "public"."google_sheets_sync_log" USING "btree" ("status");



CREATE INDEX "idx_google_sheets_sync_log_type" ON "public"."google_sheets_sync_log" USING "btree" ("sync_type");



CREATE INDEX "idx_index_participant_data_session_id" ON "public"."index_participant_data" USING "btree" ("session_id");



CREATE INDEX "idx_industry_beat_library_active" ON "public"."industry_beat_library" USING "btree" ("industry_key") WHERE "is_active";



CREATE INDEX "idx_kit_artifacts_build_id" ON "public"."kit_artifacts" USING "btree" ("build_id");



CREATE UNIQUE INDEX "idx_kit_artifacts_current" ON "public"."kit_artifacts" USING "btree" ("redemption_id", "artifact_id") WHERE "is_current";



CREATE INDEX "idx_kit_artifacts_user" ON "public"."kit_artifacts" USING "btree" ("user_id");



CREATE INDEX "idx_kit_builds_redemption" ON "public"."kit_builds" USING "btree" ("redemption_id", "created_at" DESC);



CREATE INDEX "idx_kit_builds_user" ON "public"."kit_builds" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_kit_journey_events_user_id" ON "public"."kit_journey_events" USING "btree" ("user_id");



CREATE INDEX "idx_kit_journey_redemption" ON "public"."kit_journey_events" USING "btree" ("redemption_id", "created_at" DESC);



CREATE INDEX "idx_kit_nudges_user_id" ON "public"."kit_nudges" USING "btree" ("user_id");



CREATE INDEX "idx_kit_redemptions_nudge" ON "public"."kit_redemptions" USING "btree" ("redeemed_at") WHERE ("delivery_email" IS NOT NULL);



CREATE INDEX "idx_kit_redemptions_user" ON "public"."kit_redemptions" USING "btree" ("user_id");



CREATE INDEX "idx_kit_waitlist_redemption_id" ON "public"."kit_waitlist" USING "btree" ("redemption_id");



CREATE INDEX "idx_lead_qualification_scores_session_id" ON "public"."lead_qualification_scores" USING "btree" ("session_id");



CREATE INDEX "idx_lead_qualification_user_id" ON "public"."lead_qualification_scores" USING "btree" ("user_id");



CREATE INDEX "idx_lead_qualifications_session_id" ON "public"."lead_qualifications" USING "btree" ("session_id");



CREATE INDEX "idx_lead_qualifications_user_id" ON "public"."lead_qualifications" USING "btree" ("user_id");



CREATE INDEX "idx_lead_scores_sheets_sync" ON "public"."lead_qualification_scores" USING "btree" ("created_at", "total_score");



CREATE INDEX "idx_leader_assessments_leader_id" ON "public"."leader_assessments" USING "btree" ("leader_id");



CREATE INDEX "idx_leader_assessments_session_id" ON "public"."leader_assessments" USING "btree" ("session_id");



CREATE INDEX "idx_leader_check_ins_created_at" ON "public"."leader_check_ins" USING "btree" ("created_at");



CREATE INDEX "idx_leader_check_ins_leader_id" ON "public"."leader_check_ins" USING "btree" ("leader_id");



CREATE INDEX "idx_leader_check_ins_mission_id" ON "public"."leader_check_ins" USING "btree" ("mission_id");



CREATE INDEX "idx_leader_dimension_scores_assessment_id" ON "public"."leader_dimension_scores" USING "btree" ("assessment_id");



CREATE INDEX "idx_leader_first_moves_assessment_id" ON "public"."leader_first_moves" USING "btree" ("assessment_id");



CREATE INDEX "idx_leader_missions_assessment_id" ON "public"."leader_missions" USING "btree" ("assessment_id");



CREATE INDEX "idx_leader_missions_check_in_date" ON "public"."leader_missions" USING "btree" ("check_in_date");



CREATE INDEX "idx_leader_missions_first_move_id" ON "public"."leader_missions" USING "btree" ("first_move_id");



CREATE INDEX "idx_leader_missions_leader_id" ON "public"."leader_missions" USING "btree" ("leader_id");



CREATE INDEX "idx_leader_missions_status" ON "public"."leader_missions" USING "btree" ("status");



CREATE INDEX "idx_leader_org_scenarios_assessment_id" ON "public"."leader_org_scenarios" USING "btree" ("assessment_id");



CREATE INDEX "idx_leader_progress_snapshots_assessment_id" ON "public"."leader_progress_snapshots" USING "btree" ("assessment_id");



CREATE INDEX "idx_leader_progress_snapshots_created_at" ON "public"."leader_progress_snapshots" USING "btree" ("created_at");



CREATE INDEX "idx_leader_progress_snapshots_leader_id" ON "public"."leader_progress_snapshots" USING "btree" ("leader_id");



CREATE INDEX "idx_leader_prompt_sets_assessment_id" ON "public"."leader_prompt_sets" USING "btree" ("assessment_id");



CREATE INDEX "idx_leader_risk_signals_assessment_id" ON "public"."leader_risk_signals" USING "btree" ("assessment_id");



CREATE INDEX "idx_leader_tensions_assessment_id" ON "public"."leader_tensions" USING "btree" ("assessment_id");



CREATE INDEX "idx_leaders_archived_at" ON "public"."leaders" USING "btree" ("archived_at") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_leaders_user_id" ON "public"."leaders" USING "btree" ("user_id");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_email" ON "public"."leads" USING "btree" ("email");



CREATE INDEX "idx_leads_email_sent" ON "public"."leads" USING "btree" ("email_sent");



CREATE INDEX "idx_leads_selected_program" ON "public"."leads" USING "btree" ("selected_program");



CREATE INDEX "idx_learning_style" ON "public"."index_participant_data" USING "btree" ("ai_learning_style");



CREATE INDEX "idx_llm_call_log_created_model" ON "public"."llm_call_log" USING "btree" ("created_at" DESC, "model");



CREATE INDEX "idx_llm_call_log_errors" ON "public"."llm_call_log" USING "btree" ("created_at" DESC) WHERE ("error" IS NOT NULL);



CREATE INDEX "idx_llm_call_log_user" ON "public"."llm_call_log" USING "btree" ("user_id", "created_at" DESC) WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_mcp_pulls_user_called" ON "public"."mcp_pulls" USING "btree" ("user_id", "called_at" DESC);



CREATE INDEX "idx_mcp_pulls_user_skill" ON "public"."mcp_pulls" USING "btree" ("user_id", "skill_name");



CREATE INDEX "idx_mcp_tokens_hash" ON "public"."mcp_tokens" USING "btree" ("token_hash") WHERE ("revoked_at" IS NULL);



CREATE INDEX "idx_mcp_tokens_user" ON "public"."mcp_tokens" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_meeting_prep_sessions_assessment_id" ON "public"."meeting_prep_sessions" USING "btree" ("assessment_id");



CREATE INDEX "idx_meeting_prep_sessions_company_context_id" ON "public"."meeting_prep_sessions" USING "btree" ("company_context_id");



CREATE INDEX "idx_meeting_prep_sessions_meeting_date" ON "public"."meeting_prep_sessions" USING "btree" ("meeting_date");



CREATE INDEX "idx_memory_edges_from_fact_id" ON "public"."memory_edges" USING "btree" ("from_fact_id");



CREATE INDEX "idx_memory_edges_to_fact_id" ON "public"."memory_edges" USING "btree" ("to_fact_id");



CREATE INDEX "idx_memory_edges_user_id" ON "public"."memory_edges" USING "btree" ("user_id");



CREATE INDEX "idx_memory_events_fact" ON "public"."memory_events" USING "btree" ("fact_id");



CREATE INDEX "idx_memory_events_related_fact_id" ON "public"."memory_events" USING "btree" ("related_fact_id");



CREATE INDEX "idx_memory_events_user" ON "public"."memory_events" USING "btree" ("user_id", "occurred_at" DESC);



CREATE INDEX "idx_memory_events_user_kind" ON "public"."memory_events" USING "btree" ("user_id", "kind", "occurred_at" DESC);



CREATE INDEX "idx_memory_links_from" ON "public"."memory_links" USING "btree" ("user_id", "from_type", "from_id");



CREATE INDEX "idx_memory_links_to" ON "public"."memory_links" USING "btree" ("user_id", "to_type", "to_id");



CREATE INDEX "idx_participant_company_hash" ON "public"."index_participant_data" USING "btree" ("company_identifier_hash");



CREATE INDEX "idx_participant_company_size" ON "public"."index_participant_data" USING "btree" ("company_size") WHERE ((("consent_flags" ->> 'index_publication'::"text"))::boolean = true);



CREATE INDEX "idx_participant_completed" ON "public"."index_participant_data" USING "btree" ("completed_at") WHERE ((("consent_flags" ->> 'index_publication'::"text"))::boolean = true);



CREATE INDEX "idx_participant_industry" ON "public"."index_participant_data" USING "btree" ("industry") WHERE ((("consent_flags" ->> 'index_publication'::"text"))::boolean = true);



CREATE INDEX "idx_plans_intake" ON "public"."partner_plans" USING "btree" ("intake_id");



CREATE INDEX "idx_portfolio_items_intake" ON "public"."partner_portfolio_items" USING "btree" ("intake_id");



CREATE INDEX "idx_post_session_reviews_workshop" ON "public"."post_session_reviews" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_pre_workshop_inputs_profile_id" ON "public"."pre_workshop_inputs" USING "btree" ("profile_id");



CREATE INDEX "idx_pre_workshop_intake" ON "public"."pre_workshop_inputs" USING "btree" ("intake_id");



CREATE INDEX "idx_profile_insights_dimension" ON "public"."profile_insights" USING "btree" ("dimension_key");



CREATE INDEX "idx_profile_insights_profile" ON "public"."profile_insights" USING "btree" ("profile_id");



CREATE INDEX "idx_profile_insights_source_events" ON "public"."profile_insights" USING "gin" ("source_event_ids");



CREATE INDEX "idx_prompt_library_profiles_leader_id" ON "public"."prompt_library_profiles" USING "btree" ("leader_id");



CREATE INDEX "idx_prompt_profiles_session" ON "public"."prompt_library_profiles" USING "btree" ("session_id");



CREATE INDEX "idx_prompt_profiles_user" ON "public"."prompt_library_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_questions_active" ON "public"."assessment_questions" USING "btree" ("active") WHERE ("active" = true);



CREATE INDEX "idx_questions_dimension" ON "public"."assessment_questions" USING "btree" ("dimension_key");



CREATE INDEX "idx_questions_tool" ON "public"."assessment_questions" USING "btree" ("tool_name");



CREATE INDEX "idx_referrals_completed" ON "public"."referrals" USING "btree" ("referred_company_completed_assessment");



CREATE INDEX "idx_referrals_referring" ON "public"."referrals" USING "btree" ("referring_company_hash");



CREATE INDEX "idx_roi_aggregation" ON "public"."roi_actuals" USING "btree" ("allow_index_aggregation") WHERE ("allow_index_aggregation" = true);



CREATE INDEX "idx_roi_provenance" ON "public"."roi_actuals" USING "btree" ("provenance");



CREATE INDEX "idx_roi_session" ON "public"."roi_actuals" USING "btree" ("session_id");



CREATE INDEX "idx_security_audit_log_created_at" ON "public"."security_audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_security_audit_log_user_id" ON "public"."security_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_segment_summaries_workshop" ON "public"."segment_summaries" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_simulation_results_workshop" ON "public"."simulation_results" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_skill_exports_created_at" ON "public"."skill_exports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_skill_exports_user_id" ON "public"."skill_exports" USING "btree" ("user_id");



CREATE INDEX "idx_suggested_briefing_interests_user_open" ON "public"."suggested_briefing_interests" USING "btree" ("user_id") WHERE (("accepted_at" IS NULL) AND ("dismissed_at" IS NULL));



CREATE UNIQUE INDEX "idx_training_material_active_global" ON "public"."training_material" USING "btree" ("scope") WHERE (("scope" = 'global'::"text") AND ("is_active" = true));



CREATE UNIQUE INDEX "idx_training_material_active_user" ON "public"."training_material" USING "btree" ("scope", "user_id") WHERE (("scope" = 'user'::"text") AND ("is_active" = true));



CREATE INDEX "idx_training_material_user_id" ON "public"."training_material" USING "btree" ("user_id");



CREATE INDEX "idx_training_material_version" ON "public"."training_material" USING "btree" ("scope", "version" DESC);



CREATE INDEX "idx_tts_snapshots_date" ON "public"."tts_quality_snapshots" USING "btree" ("snapshot_date" DESC);



CREATE INDEX "idx_unified_profiles_company_hash" ON "public"."unified_profiles" USING "btree" ("company_identifier_hash");



CREATE INDEX "idx_user_decisions_created" ON "public"."user_decisions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_user_decisions_superseded_by" ON "public"."user_decisions" USING "btree" ("superseded_by");



CREATE INDEX "idx_user_decisions_user_status" ON "public"."user_decisions" USING "btree" ("user_id", "status");



CREATE INDEX "idx_user_memory_active_by_user" ON "public"."user_memory" USING "btree" ("user_id") WHERE (("is_current" = true) AND ("archived_at" IS NULL));



CREATE INDEX "idx_user_memory_archived" ON "public"."user_memory" USING "btree" ("user_id", "archived_at") WHERE ("archived_at" IS NOT NULL);



CREATE INDEX "idx_user_memory_category" ON "public"."user_memory" USING "btree" ("fact_category");



CREATE INDEX "idx_user_memory_current" ON "public"."user_memory" USING "btree" ("user_id", "is_current") WHERE ("is_current" = true);



CREATE INDEX "idx_user_memory_embedding" ON "public"."user_memory" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_user_memory_high_stakes" ON "public"."user_memory" USING "btree" ("user_id", "is_high_stakes") WHERE (("is_high_stakes" = true) AND ("verification_status" = 'inferred'::"public"."verification_status"));



CREATE INDEX "idx_user_memory_last_referenced" ON "public"."user_memory" USING "btree" ("user_id", "last_referenced_at");



CREATE INDEX "idx_user_memory_superseded_by" ON "public"."user_memory" USING "btree" ("superseded_by");



CREATE INDEX "idx_user_memory_supersedes" ON "public"."user_memory" USING "btree" ("supersedes");



CREATE INDEX "idx_user_memory_temperature" ON "public"."user_memory" USING "btree" ("user_id", "temperature") WHERE (("archived_at" IS NULL) AND ("is_current" = true));



CREATE INDEX "idx_user_memory_user_id" ON "public"."user_memory" USING "btree" ("user_id");



CREATE INDEX "idx_user_memory_valid_until" ON "public"."user_memory" USING "btree" ("user_id", "valid_until") WHERE ("is_current" = true);



CREATE INDEX "idx_user_memory_verification" ON "public"."user_memory" USING "btree" ("verification_status");



CREATE UNIQUE INDEX "idx_user_patterns_blindspot_fingerprint" ON "public"."user_patterns" USING "btree" ("user_id", "anchor_fingerprint") WHERE (("pattern_type" = 'blindspot'::"text") AND ("anchor_fingerprint" IS NOT NULL));



CREATE INDEX "idx_user_patterns_confidence" ON "public"."user_patterns" USING "btree" ("user_id", "confidence" DESC);



CREATE UNIQUE INDEX "idx_user_patterns_confirmation_key" ON "public"."user_patterns" USING "btree" ("user_id", "confirmation_key") WHERE ("confirmation_key" IS NOT NULL);



CREATE INDEX "idx_user_patterns_user_status" ON "public"."user_patterns" USING "btree" ("user_id", "status");



CREATE INDEX "idx_user_patterns_user_type" ON "public"."user_patterns" USING "btree" ("user_id", "pattern_type");



CREATE INDEX "idx_users_profile_id" ON "public"."users" USING "btree" ("profile_id");



CREATE INDEX "idx_velocity_days" ON "public"."velocity_events" USING "btree" ("days_since_assessment");



CREATE INDEX "idx_velocity_session" ON "public"."velocity_events" USING "btree" ("session_id");



CREATE INDEX "idx_velocity_signal" ON "public"."velocity_events" USING "btree" ("action_signal_level");



CREATE INDEX "idx_voice_instrumentation_event_type" ON "public"."voice_instrumentation" USING "btree" ("event_type");



CREATE INDEX "idx_voice_instrumentation_session" ON "public"."voice_instrumentation" USING "btree" ("session_id");



CREATE INDEX "idx_voice_sessions_session_id" ON "public"."voice_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_voting_results_activity_session_id" ON "public"."voting_results" USING "btree" ("activity_session_id");



CREATE INDEX "idx_voting_results_workshop" ON "public"."voting_results" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_working_group_inputs_activity_session_id" ON "public"."working_group_inputs" USING "btree" ("activity_session_id");



CREATE INDEX "idx_working_group_inputs_profile_id" ON "public"."working_group_inputs" USING "btree" ("profile_id");



CREATE INDEX "idx_working_group_workshop" ON "public"."working_group_inputs" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_workshop_events_dimension" ON "public"."workshop_events" USING "btree" ("dimension_key");



CREATE INDEX "idx_workshop_events_flow" ON "public"."workshop_events" USING "btree" ("flow_name");



CREATE INDEX "idx_workshop_events_profile" ON "public"."workshop_events" USING "btree" ("profile_id");



CREATE INDEX "idx_workshop_events_question" ON "public"."workshop_events" USING "btree" ("question_id");



CREATE INDEX "idx_workshop_events_session" ON "public"."workshop_events" USING "btree" ("session_id");



CREATE INDEX "idx_workshop_events_workshop_session_id" ON "public"."workshop_events" USING "btree" ("workshop_session_id");



CREATE INDEX "idx_workshop_sessions_bootcamp_plan_id" ON "public"."workshop_sessions" USING "btree" ("bootcamp_plan_id");



CREATE INDEX "idx_workshop_sessions_facilitator_email" ON "public"."workshop_sessions" USING "btree" ("facilitator_email");



CREATE INDEX "idx_workshop_sessions_intake" ON "public"."workshop_sessions" USING "btree" ("intake_id");



CREATE INDEX "intake_submissions_client_slug_idx" ON "public"."intake_submissions" USING "btree" ("client_slug");



CREATE INDEX "intake_submissions_created_at_idx" ON "public"."intake_submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "kit_waitlist_created_at_idx" ON "public"."kit_waitlist" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "kit_waitlist_email_key" ON "public"."kit_waitlist" USING "btree" ("lower"("email"));



CREATE INDEX "ledger_user_week_idx" ON "public"."ledger" USING "btree" ("user_id", "week");



CREATE INDEX "mindmake_personal_reads_handoff_idx" ON "public"."mindmake_personal_reads" USING "btree" ("email", "created_at" DESC) WHERE ("handoff_reason" IS NOT NULL);



CREATE INDEX "news_trends_current_idx" ON "public"."news_trends" USING "btree" ("is_current", "momentum" DESC);



CREATE INDEX "portfolio_handoff_created_idx" ON "public"."portfolio_handoff" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "portfolio_handoff_idempotency_idx" ON "public"."portfolio_handoff" USING "btree" ("idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "proposals_user_status_idx" ON "public"."proposals" USING "btree" ("user_id", "status");



CREATE INDEX "skill_provenance_artifact_idx" ON "public"."skill_provenance" USING "btree" ("artifact_id", "pass");



CREATE INDEX "sort_items_session_idx" ON "public"."sort_items" USING "btree" ("session_id", "position");



CREATE INDEX "stripe_events_processed_processed_at_idx" ON "public"."stripe_events_processed" USING "btree" ("processed_at");



CREATE INDEX "testimonials_client_slug_idx" ON "public"."testimonials" USING "btree" ("client_slug");



CREATE INDEX "testimonials_created_at_idx" ON "public"."testimonials" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "uniq_suggested_briefing_interests_kind_text" ON "public"."suggested_briefing_interests" USING "btree" ("user_id", "kind", "lower"("text"));



CREATE UNIQUE INDEX "uq_goals_source" ON "public"."goals" USING "btree" ("user_id", "source", "source_ref") WHERE ("source_ref" IS NOT NULL);



CREATE UNIQUE INDEX "uq_memory_links_edge" ON "public"."memory_links" USING "btree" ("user_id", "from_type", "from_id", "to_type", "to_id", "edge_type");



CREATE INDEX "user_memory_retention_expires_idx" ON "public"."user_memory" USING "btree" ("retention_expires_at") WHERE ("retention_expires_at" IS NOT NULL);



CREATE OR REPLACE TRIGGER "prepare_record_append" BEFORE INSERT ON "ctrl_discovery"."records" FOR EACH ROW EXECUTE FUNCTION "ctrl_discovery"."prepare_record_append"();



CREATE OR REPLACE TRIGGER "records_no_truncate" BEFORE TRUNCATE ON "ctrl_discovery"."records" FOR EACH STATEMENT EXECUTE FUNCTION "ctrl_discovery"."reject_history_mutation"();



CREATE OR REPLACE TRIGGER "records_no_update_or_delete" BEFORE DELETE OR UPDATE ON "ctrl_discovery"."records" FOR EACH STATEMENT EXECUTE FUNCTION "ctrl_discovery"."reject_history_mutation"();



CREATE OR REPLACE TRIGGER "sessions_no_truncate" BEFORE TRUNCATE ON "ctrl_discovery"."sessions" FOR EACH STATEMENT EXECUTE FUNCTION "ctrl_discovery"."reject_history_mutation"();



CREATE OR REPLACE TRIGGER "sessions_no_update_or_delete" BEFORE DELETE OR UPDATE ON "ctrl_discovery"."sessions" FOR EACH STATEMENT EXECUTE FUNCTION "ctrl_discovery"."reject_history_mutation"();



CREATE OR REPLACE TRIGGER "analytics_sheets_sync_trigger" AFTER INSERT ON "public"."conversion_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_analytics_sheets_sync"();



CREATE OR REPLACE TRIGGER "booking_http_sync_trigger" AFTER INSERT ON "public"."booking_requests" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_booking_http_sync"();



CREATE OR REPLACE TRIGGER "booking_request_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."booking_requests" FOR EACH ROW EXECUTE FUNCTION "public"."log_booking_request"();



CREATE OR REPLACE TRIGGER "booking_request_sync_trigger" AFTER INSERT ON "public"."booking_requests" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_booking_sync"();



CREATE OR REPLACE TRIGGER "brain_assertion_scope_guard" BEFORE INSERT OR UPDATE ON "public"."brain_assertions" FOR EACH ROW EXECUTE FUNCTION "private"."brain_assertion_scope_guard"();



CREATE CONSTRAINT TRIGGER "brain_item_evidence_preserves_support" AFTER INSERT OR DELETE OR UPDATE ON "public"."brain_item_version_assertions" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "private"."brain_require_item_support"();



CREATE OR REPLACE TRIGGER "brain_item_evidence_scope_guard" BEFORE INSERT OR UPDATE ON "public"."brain_item_version_assertions" FOR EACH ROW EXECUTE FUNCTION "private"."brain_item_evidence_scope_guard"();



CREATE OR REPLACE TRIGGER "brain_item_version_scope_guard" BEFORE INSERT OR UPDATE ON "public"."brain_item_versions" FOR EACH ROW EXECUTE FUNCTION "private"."brain_item_version_scope_guard"();



CREATE CONSTRAINT TRIGGER "brain_item_versions_require_support" AFTER INSERT OR UPDATE ON "public"."brain_item_versions" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "private"."brain_require_item_support"();



CREATE CONSTRAINT TRIGGER "brain_relationship_evidence_preserves_support" AFTER INSERT OR DELETE OR UPDATE ON "public"."brain_relationship_version_assertions" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "private"."brain_require_relationship_evidence"();



CREATE OR REPLACE TRIGGER "brain_relationship_evidence_scope_guard" BEFORE INSERT OR UPDATE ON "public"."brain_relationship_version_assertions" FOR EACH ROW EXECUTE FUNCTION "private"."brain_relationship_evidence_scope_guard"();



CREATE OR REPLACE TRIGGER "brain_relationship_version_scope_guard" BEFORE INSERT OR UPDATE ON "public"."brain_relationship_versions" FOR EACH ROW EXECUTE FUNCTION "private"."brain_relationship_version_scope_guard"();



CREATE CONSTRAINT TRIGGER "brain_relationship_versions_require_evidence" AFTER INSERT OR UPDATE ON "public"."brain_relationship_versions" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "private"."brain_require_relationship_evidence"();



CREATE OR REPLACE TRIGGER "bump_content_changed_at_trigger" BEFORE INSERT OR UPDATE ON "public"."user_memory" FOR EACH ROW EXECUTE FUNCTION "public"."bump_content_changed_at"();



CREATE OR REPLACE TRIGGER "business_context_sync_trigger" AFTER UPDATE ON "public"."user_business_context" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_business_context_sync"();



CREATE OR REPLACE TRIGGER "calculate_momentum_trigger" BEFORE INSERT OR UPDATE ON "public"."adoption_momentum" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_momentum_components"();



CREATE OR REPLACE TRIGGER "consent_audit_trigger" BEFORE UPDATE ON "public"."index_participant_data" FOR EACH ROW EXECUTE FUNCTION "public"."log_consent_change"();



CREATE OR REPLACE TRIGGER "lead_score_sheets_sync_trigger" AFTER INSERT OR UPDATE ON "public"."lead_qualification_scores" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_lead_score_sheets_sync"();



CREATE OR REPLACE TRIGGER "on_insight_created" AFTER INSERT ON "public"."profile_insights" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_from_insights"();



CREATE OR REPLACE TRIGGER "set_memory_retention_trigger" BEFORE INSERT ON "public"."user_memory" FOR EACH ROW EXECUTE FUNCTION "public"."set_memory_retention_expiration"();



CREATE OR REPLACE TRIGGER "trg_audience_contacts_updated_at" BEFORE UPDATE ON "public"."audience_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."be_audience_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_close_validity_on_retire" BEFORE UPDATE ON "public"."user_memory" FOR EACH ROW EXECUTE FUNCTION "public"."close_validity_on_retire"();



CREATE OR REPLACE TRIGGER "trigger_anonymous_lead_scores" AFTER INSERT ON "public"."lead_qualification_scores" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_anonymous_lead_sync"();



CREATE OR REPLACE TRIGGER "trigger_booking_requests_sync" AFTER INSERT ON "public"."booking_requests" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_booking_requests_sync"();



CREATE OR REPLACE TRIGGER "update_ai_conversations_updated_at" BEFORE UPDATE ON "public"."ai_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_literacy_modules_updated_at" BEFORE UPDATE ON "public"."ai_literacy_modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_booking_requests_updated_at" BEFORE UPDATE ON "public"."booking_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_company_context_updated_at_trigger" BEFORE UPDATE ON "public"."company_context" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_context_updated_at"();



CREATE OR REPLACE TRIGGER "update_decision_frameworks_updated_at" BEFORE UPDATE ON "public"."decision_frameworks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_exec_intakes_updated_at" BEFORE UPDATE ON "public"."exec_intakes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_huddle_synthesis_updated_at" BEFORE UPDATE ON "public"."huddle_synthesis" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_intakes_timestamp" BEFORE UPDATE ON "public"."partner_intakes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_lead_qualification_scores_updated_at" BEFORE UPDATE ON "public"."lead_qualification_scores" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_leader_assessments_updated_at_trigger" BEFORE UPDATE ON "public"."leader_assessments" FOR EACH ROW EXECUTE FUNCTION "public"."update_leader_assessments_updated_at"();



CREATE OR REPLACE TRIGGER "update_leaders_updated_at_trigger" BEFORE UPDATE ON "public"."leaders" FOR EACH ROW EXECUTE FUNCTION "public"."update_leaders_updated_at"();



CREATE OR REPLACE TRIGGER "update_meeting_prep_sessions_updated_at_trigger" BEFORE UPDATE ON "public"."meeting_prep_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_meeting_prep_sessions_updated_at"();



CREATE OR REPLACE TRIGGER "update_memory_edges_updated_at_trigger" BEFORE UPDATE ON "public"."memory_edges" FOR EACH ROW EXECUTE FUNCTION "public"."update_memory_edges_updated_at"();



CREATE OR REPLACE TRIGGER "update_memory_retention_on_settings_change" AFTER UPDATE ON "public"."user_memory_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_memory_retention"();



CREATE OR REPLACE TRIGGER "update_pilot_charter_updated_at" BEFORE UPDATE ON "public"."pilot_charter" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_plans_timestamp" BEFORE UPDATE ON "public"."partner_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_portfolio_timestamp" BEFORE UPDATE ON "public"."partner_portfolio_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_provocation_reports_updated_at" BEFORE UPDATE ON "public"."provocation_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_strategy_addendum_updated_at" BEFORE UPDATE ON "public"."strategy_addendum" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_business_context_updated_at" BEFORE UPDATE ON "public"."user_business_context" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_memory_settings_updated_at_trigger" BEFORE UPDATE ON "public"."user_memory_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_memory_settings_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_memory_updated_at_trigger" BEFORE UPDATE ON "public"."user_memory" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_memory_updated_at"();



CREATE OR REPLACE TRIGGER "update_workshop_sessions_updated_at" BEFORE UPDATE ON "public"."workshop_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "ctrl_discovery"."records"
    ADD CONSTRAINT "records_previous_record_uuid_fkey" FOREIGN KEY ("previous_record_uuid") REFERENCES "ctrl_discovery"."records"("record_uuid") ON DELETE RESTRICT;



ALTER TABLE ONLY "ctrl_discovery"."records"
    ADD CONSTRAINT "records_session_key_fkey" FOREIGN KEY ("session_key") REFERENCES "ctrl_discovery"."sessions"("session_key") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."activity_sessions"
    ADD CONSTRAINT "activity_sessions_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_insights_generated"
    ADD CONSTRAINT "ai_insights_generated_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_insights_generated"
    ADD CONSTRAINT "ai_insights_generated_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_leadership_index_snapshots"
    ADD CONSTRAINT "ai_leadership_index_snapshots_methodology_version_fkey" FOREIGN KEY ("methodology_version") REFERENCES "public"."index_publication_rules"("version");



ALTER TABLE ONLY "public"."assessment_behavioral_adjustments"
    ADD CONSTRAINT "assessment_behavioral_adjustments_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_events"
    ADD CONSTRAINT "assessment_events_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_events"
    ADD CONSTRAINT "assessment_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."leaders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_events"
    ADD CONSTRAINT "assessment_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessment_referrals"
    ADD CONSTRAINT "assessment_referrals_referee_assessment_id_fkey" FOREIGN KEY ("referee_assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessment_referrals"
    ADD CONSTRAINT "assessment_referrals_referrer_assessment_id_fkey" FOREIGN KEY ("referrer_assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automator_usage"
    ADD CONSTRAINT "automator_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."be_guests"
    ADD CONSTRAINT "be_guests_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "public"."be_episodes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blind_spot_evidence_links"
    ADD CONSTRAINT "blind_spot_evidence_links_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "public"."user_patterns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blind_spot_evidence_links"
    ADD CONSTRAINT "blind_spot_evidence_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blind_spot_experiments"
    ADD CONSTRAINT "blind_spot_experiments_pattern_id_fkey" FOREIGN KEY ("pattern_id") REFERENCES "public"."user_patterns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blind_spot_experiments"
    ADD CONSTRAINT "blind_spot_experiments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blind_spot_rejections"
    ADD CONSTRAINT "blind_spot_rejections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_requests"
    ADD CONSTRAINT "booking_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_requests"
    ADD CONSTRAINT "booking_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bootcamp_plans"
    ADD CONSTRAINT "bootcamp_plans_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "public"."exec_intakes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bottleneck_submissions"
    ADD CONSTRAINT "bottleneck_submissions_activity_session_id_fkey" FOREIGN KEY ("activity_session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bottleneck_submissions"
    ADD CONSTRAINT "bottleneck_submissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."unified_profiles"("id");



ALTER TABLE ONLY "public"."bottleneck_submissions"
    ADD CONSTRAINT "bottleneck_submissions_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_assertions"
    ADD CONSTRAINT "brain_assertions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_assertions"
    ADD CONSTRAINT "brain_assertions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."brain_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_assertions"
    ADD CONSTRAINT "brain_assertions_speaker_user_id_fkey" FOREIGN KEY ("speaker_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_assertions"
    ADD CONSTRAINT "brain_assertions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_assertions"
    ADD CONSTRAINT "brain_assertions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."brain_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_audience_grants"
    ADD CONSTRAINT "brain_audience_grants_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_audience_grants"
    ADD CONSTRAINT "brain_audience_grants_grantee_user_id_fkey" FOREIGN KEY ("grantee_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_audience_grants"
    ADD CONSTRAINT "brain_audience_grants_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."brain_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_item_version_assertions"
    ADD CONSTRAINT "brain_item_version_assertions_assertion_id_fkey" FOREIGN KEY ("assertion_id") REFERENCES "public"."brain_assertions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_item_version_assertions"
    ADD CONSTRAINT "brain_item_version_assertions_item_version_id_workspace_id_fkey" FOREIGN KEY ("item_version_id", "workspace_id") REFERENCES "public"."brain_item_versions"("id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_item_version_assertions"
    ADD CONSTRAINT "brain_item_version_assertions_linked_by_fkey" FOREIGN KEY ("linked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_item_versions"
    ADD CONSTRAINT "brain_item_versions_brain_item_id_workspace_id_subject_id_fkey" FOREIGN KEY ("brain_item_id", "workspace_id", "subject_id") REFERENCES "public"."brain_items"("id", "workspace_id", "subject_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_item_versions"
    ADD CONSTRAINT "brain_item_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_item_versions"
    ADD CONSTRAINT "brain_item_versions_predecessor_version_id_fkey" FOREIGN KEY ("predecessor_version_id") REFERENCES "public"."brain_item_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_item_versions"
    ADD CONSTRAINT "brain_item_versions_superseded_by_version_id_fkey" FOREIGN KEY ("superseded_by_version_id") REFERENCES "public"."brain_item_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_items"
    ADD CONSTRAINT "brain_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_items"
    ADD CONSTRAINT "brain_items_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_items"
    ADD CONSTRAINT "brain_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."brain_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationship_version_assertions"
    ADD CONSTRAINT "brain_relationship_version_as_relationship_version_id_work_fkey" FOREIGN KEY ("relationship_version_id", "workspace_id") REFERENCES "public"."brain_relationship_versions"("id", "workspace_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationship_version_assertions"
    ADD CONSTRAINT "brain_relationship_version_assertions_assertion_id_fkey" FOREIGN KEY ("assertion_id") REFERENCES "public"."brain_assertions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationship_version_assertions"
    ADD CONSTRAINT "brain_relationship_version_assertions_linked_by_fkey" FOREIGN KEY ("linked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_from_item_version_id_fkey" FOREIGN KEY ("from_item_version_id") REFERENCES "public"."brain_item_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_predecessor_version_id_fkey" FOREIGN KEY ("predecessor_version_id") REFERENCES "public"."brain_relationship_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_relationship_id_workspace_id_s_fkey" FOREIGN KEY ("relationship_id", "workspace_id", "subject_id") REFERENCES "public"."brain_relationships"("id", "workspace_id", "subject_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_superseded_by_version_id_fkey" FOREIGN KEY ("superseded_by_version_id") REFERENCES "public"."brain_relationship_versions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_relationship_versions"
    ADD CONSTRAINT "brain_relationship_versions_to_item_version_id_fkey" FOREIGN KEY ("to_item_version_id") REFERENCES "public"."brain_item_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationships"
    ADD CONSTRAINT "brain_relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_relationships"
    ADD CONSTRAINT "brain_relationships_from_item_id_fkey" FOREIGN KEY ("from_item_id") REFERENCES "public"."brain_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationships"
    ADD CONSTRAINT "brain_relationships_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationships"
    ADD CONSTRAINT "brain_relationships_to_item_id_fkey" FOREIGN KEY ("to_item_id") REFERENCES "public"."brain_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_relationships"
    ADD CONSTRAINT "brain_relationships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."brain_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_sources"
    ADD CONSTRAINT "brain_sources_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_sources"
    ADD CONSTRAINT "brain_sources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_sources"
    ADD CONSTRAINT "brain_sources_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_sources"
    ADD CONSTRAINT "brain_sources_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."brain_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_workspace_roles"
    ADD CONSTRAINT "brain_workspace_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."brain_workspace_roles"
    ADD CONSTRAINT "brain_workspace_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_workspace_roles"
    ADD CONSTRAINT "brain_workspace_roles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."brain_workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_workspaces"
    ADD CONSTRAINT "brain_workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."brain_workspaces"
    ADD CONSTRAINT "brain_workspaces_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."briefing_feedback"
    ADD CONSTRAINT "briefing_feedback_briefing_id_fkey" FOREIGN KEY ("briefing_id") REFERENCES "public"."briefings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."briefing_interests"
    ADD CONSTRAINT "briefing_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."briefing_lens_feedback"
    ADD CONSTRAINT "briefing_lens_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."briefings"
    ADD CONSTRAINT "briefings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_context"
    ADD CONSTRAINT "company_context_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_context"
    ADD CONSTRAINT "company_context_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."leaders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_audit"
    ADD CONSTRAINT "consent_audit_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."index_participant_data"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."constructs"
    ADD CONSTRAINT "constructs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contest_reports"
    ADD CONSTRAINT "contest_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_sessions"
    ADD CONSTRAINT "conversation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversion_analytics"
    ADD CONSTRAINT "conversion_analytics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversion_analytics"
    ADD CONSTRAINT "conversion_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."criteria"
    ADD CONSTRAINT "criteria_construct_id_fkey" FOREIGN KEY ("construct_id") REFERENCES "public"."constructs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."criteria"
    ADD CONSTRAINT "criteria_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_alerts"
    ADD CONSTRAINT "decision_alerts_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."decision_claims"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_alerts"
    ADD CONSTRAINT "decision_alerts_decision_case_id_fkey" FOREIGN KEY ("decision_case_id") REFERENCES "public"."decision_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_alerts"
    ADD CONSTRAINT "decision_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_cases"
    ADD CONSTRAINT "decision_cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_check_items"
    ADD CONSTRAINT "decision_check_items_decision_case_id_fkey" FOREIGN KEY ("decision_case_id") REFERENCES "public"."decision_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_check_items"
    ADD CONSTRAINT "decision_check_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_claims"
    ADD CONSTRAINT "decision_claims_decision_case_id_fkey" FOREIGN KEY ("decision_case_id") REFERENCES "public"."decision_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_claims"
    ADD CONSTRAINT "decision_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_events"
    ADD CONSTRAINT "decision_events_decision_case_id_fkey" FOREIGN KEY ("decision_case_id") REFERENCES "public"."decision_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_events"
    ADD CONSTRAINT "decision_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_evidence"
    ADD CONSTRAINT "decision_evidence_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."decision_claims"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_evidence"
    ADD CONSTRAINT "decision_evidence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_frameworks"
    ADD CONSTRAINT "decision_frameworks_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_outcomes"
    ADD CONSTRAINT "decision_outcomes_decision_case_id_fkey" FOREIGN KEY ("decision_case_id") REFERENCES "public"."decision_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_outcomes"
    ADD CONSTRAINT "decision_outcomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_tensions"
    ADD CONSTRAINT "decision_tensions_decision_case_id_fkey" FOREIGN KEY ("decision_case_id") REFERENCES "public"."decision_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_tensions"
    ADD CONSTRAINT "decision_tensions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_user_calls"
    ADD CONSTRAINT "decision_user_calls_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."decision_claims"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_user_calls"
    ADD CONSTRAINT "decision_user_calls_decision_case_id_fkey" FOREIGN KEY ("decision_case_id") REFERENCES "public"."decision_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decision_user_calls"
    ADD CONSTRAINT "decision_user_calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_subscriptions"
    ADD CONSTRAINT "delivery_subscriptions_onboarding_response_id_fkey" FOREIGN KEY ("onboarding_response_id") REFERENCES "public"."cannes_responses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."delivery_subscriptions"
    ADD CONSTRAINT "delivery_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."edge_actions"
    ADD CONSTRAINT "edge_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."edge_feedback"
    ADD CONSTRAINT "edge_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."edge_profiles"
    ADD CONSTRAINT "edge_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."edge_subscriptions"
    ADD CONSTRAINT "edge_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."effortless_map_items"
    ADD CONSTRAINT "effortless_map_items_activity_session_id_fkey" FOREIGN KEY ("activity_session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."effortless_map_items"
    ADD CONSTRAINT "effortless_map_items_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."unified_profiles"("id");



ALTER TABLE ONLY "public"."effortless_map_items"
    ADD CONSTRAINT "effortless_map_items_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."engagement_analytics"
    ADD CONSTRAINT "engagement_analytics_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."engagement_analytics"
    ADD CONSTRAINT "engagement_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_memory_fact_id_fkey" FOREIGN KEY ("memory_fact_id") REFERENCES "public"."user_memory"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."evidence_sources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."evidence_sources"
    ADD CONSTRAINT "evidence_sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_standing_promoted_by_fkey" FOREIGN KEY ("standing_promoted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exec_pulses"
    ADD CONSTRAINT "exec_pulses_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "public"."exec_intakes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exec_pulses"
    ADD CONSTRAINT "exec_pulses_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."unified_profiles"("id");



ALTER TABLE ONLY "public"."fact_extraction_log"
    ADD CONSTRAINT "fact_extraction_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."generated_artifacts"
    ADD CONSTRAINT "generated_artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."harness_runs"
    ADD CONSTRAINT "harness_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."huddle_synthesis"
    ADD CONSTRAINT "huddle_synthesis_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id");



ALTER TABLE ONLY "public"."index_participant_data"
    ADD CONSTRAINT "index_participant_data_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_artifacts"
    ADD CONSTRAINT "kit_artifacts_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "public"."kit_builds"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."kit_artifacts"
    ADD CONSTRAINT "kit_artifacts_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."kit_redemptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_artifacts"
    ADD CONSTRAINT "kit_artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_builds"
    ADD CONSTRAINT "kit_builds_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."kit_redemptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_builds"
    ADD CONSTRAINT "kit_builds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_journey_events"
    ADD CONSTRAINT "kit_journey_events_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."kit_redemptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_journey_events"
    ADD CONSTRAINT "kit_journey_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_nudges"
    ADD CONSTRAINT "kit_nudges_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."kit_redemptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_nudges"
    ADD CONSTRAINT "kit_nudges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_redemptions"
    ADD CONSTRAINT "kit_redemptions_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "public"."kit_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_redemptions"
    ADD CONSTRAINT "kit_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_waitlist"
    ADD CONSTRAINT "kit_waitlist_redemption_id_fkey" FOREIGN KEY ("redemption_id") REFERENCES "public"."kit_redemptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_qualification_scores"
    ADD CONSTRAINT "lead_qualification_scores_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_qualification_scores"
    ADD CONSTRAINT "lead_qualification_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_qualifications"
    ADD CONSTRAINT "lead_qualifications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_qualifications"
    ADD CONSTRAINT "lead_qualifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_assessments"
    ADD CONSTRAINT "leader_assessments_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."leaders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_check_ins"
    ADD CONSTRAINT "leader_check_ins_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."leaders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_check_ins"
    ADD CONSTRAINT "leader_check_ins_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "public"."leader_missions"("id");



ALTER TABLE ONLY "public"."leader_dimension_scores"
    ADD CONSTRAINT "leader_dimension_scores_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_first_moves"
    ADD CONSTRAINT "leader_first_moves_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_missions"
    ADD CONSTRAINT "leader_missions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id");



ALTER TABLE ONLY "public"."leader_missions"
    ADD CONSTRAINT "leader_missions_first_move_id_fkey" FOREIGN KEY ("first_move_id") REFERENCES "public"."leader_first_moves"("id");



ALTER TABLE ONLY "public"."leader_missions"
    ADD CONSTRAINT "leader_missions_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."leaders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_notification_prefs"
    ADD CONSTRAINT "leader_notification_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_org_scenarios"
    ADD CONSTRAINT "leader_org_scenarios_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_progress_snapshots"
    ADD CONSTRAINT "leader_progress_snapshots_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id");



ALTER TABLE ONLY "public"."leader_progress_snapshots"
    ADD CONSTRAINT "leader_progress_snapshots_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."leaders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_prompt_sets"
    ADD CONSTRAINT "leader_prompt_sets_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_risk_signals"
    ADD CONSTRAINT "leader_risk_signals_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leader_tensions"
    ADD CONSTRAINT "leader_tensions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaders"
    ADD CONSTRAINT "leaders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."llm_call_log"
    ADD CONSTRAINT "llm_call_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mcp_pulls"
    ADD CONSTRAINT "mcp_pulls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mcp_tokens"
    ADD CONSTRAINT "mcp_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_prep_sessions"
    ADD CONSTRAINT "meeting_prep_sessions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."leader_assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_prep_sessions"
    ADD CONSTRAINT "meeting_prep_sessions_company_context_id_fkey" FOREIGN KEY ("company_context_id") REFERENCES "public"."company_context"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memory_edges"
    ADD CONSTRAINT "memory_edges_from_fact_id_fkey" FOREIGN KEY ("from_fact_id") REFERENCES "public"."user_memory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memory_edges"
    ADD CONSTRAINT "memory_edges_to_fact_id_fkey" FOREIGN KEY ("to_fact_id") REFERENCES "public"."user_memory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memory_events"
    ADD CONSTRAINT "memory_events_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "public"."user_memory"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memory_events"
    ADD CONSTRAINT "memory_events_related_fact_id_fkey" FOREIGN KEY ("related_fact_id") REFERENCES "public"."user_memory"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memory_events"
    ADD CONSTRAINT "memory_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memory_links"
    ADD CONSTRAINT "memory_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news_preferences"
    ADD CONSTRAINT "news_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_plans"
    ADD CONSTRAINT "partner_plans_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "public"."partner_intakes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_portfolio_items"
    ADD CONSTRAINT "partner_portfolio_items_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "public"."partner_intakes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_pool_cache"
    ADD CONSTRAINT "personal_pool_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pilot_charter"
    ADD CONSTRAINT "pilot_charter_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_session_reviews"
    ADD CONSTRAINT "post_session_reviews_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pre_workshop_inputs"
    ADD CONSTRAINT "pre_workshop_inputs_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "public"."exec_intakes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pre_workshop_inputs"
    ADD CONSTRAINT "pre_workshop_inputs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."unified_profiles"("id");



ALTER TABLE ONLY "public"."profile_insights"
    ADD CONSTRAINT "profile_insights_dimension_key_fkey" FOREIGN KEY ("dimension_key") REFERENCES "public"."insight_dimensions"("key");



ALTER TABLE ONLY "public"."profile_insights"
    ADD CONSTRAINT "profile_insights_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."unified_profiles"("id");



ALTER TABLE ONLY "public"."prompt_library_profiles"
    ADD CONSTRAINT "prompt_library_profiles_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."leaders"("id");



ALTER TABLE ONLY "public"."prompt_library_profiles"
    ADD CONSTRAINT "prompt_library_profiles_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id");



ALTER TABLE ONLY "public"."prompt_library_profiles"
    ADD CONSTRAINT "prompt_library_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provocation_reports"
    ADD CONSTRAINT "provocation_reports_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id");



ALTER TABLE ONLY "public"."roi_actuals"
    ADD CONSTRAINT "roi_actuals_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."segment_summaries"
    ADD CONSTRAINT "segment_summaries_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."simulation_results"
    ADD CONSTRAINT "simulation_results_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_exports"
    ADD CONSTRAINT "skill_exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_provenance"
    ADD CONSTRAINT "skill_provenance_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "public"."generated_artifacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_provenance"
    ADD CONSTRAINT "skill_provenance_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "public"."criteria"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."skill_provenance"
    ADD CONSTRAINT "skill_provenance_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."skill_provenance"
    ADD CONSTRAINT "skill_provenance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sort_grades"
    ADD CONSTRAINT "sort_grades_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."sort_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sort_grades"
    ADD CONSTRAINT "sort_grades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sort_items"
    ADD CONSTRAINT "sort_items_derived_from_item_id_fkey" FOREIGN KEY ("derived_from_item_id") REFERENCES "public"."sort_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sort_items"
    ADD CONSTRAINT "sort_items_repeat_of_fkey" FOREIGN KEY ("repeat_of") REFERENCES "public"."sort_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sort_items"
    ADD CONSTRAINT "sort_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."harness_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sort_items"
    ADD CONSTRAINT "sort_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."strategy_addendum"
    ADD CONSTRAINT "strategy_addendum_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suggested_briefing_interests"
    ADD CONSTRAINT "suggested_briefing_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_material"
    ADD CONSTRAINT "training_material_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_briefing_directives"
    ADD CONSTRAINT "user_briefing_directives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_business_context"
    ADD CONSTRAINT "user_business_context_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_decisions"
    ADD CONSTRAINT "user_decisions_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."user_decisions"("id");



ALTER TABLE ONLY "public"."user_decisions"
    ADD CONSTRAINT "user_decisions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_memory_budget"
    ADD CONSTRAINT "user_memory_budget_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_memory_settings"
    ADD CONSTRAINT "user_memory_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_memory"
    ADD CONSTRAINT "user_memory_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."user_memory"("id");



ALTER TABLE ONLY "public"."user_memory"
    ADD CONSTRAINT "user_memory_supersedes_fkey" FOREIGN KEY ("supersedes") REFERENCES "public"."user_memory"("id");



ALTER TABLE ONLY "public"."user_memory"
    ADD CONSTRAINT "user_memory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_patterns"
    ADD CONSTRAINT "user_patterns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."velocity_events"
    ADD CONSTRAINT "velocity_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."voice_instrumentation"
    ADD CONSTRAINT "voice_instrumentation_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."voice_sessions"
    ADD CONSTRAINT "voice_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."conversation_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."voting_results"
    ADD CONSTRAINT "voting_results_activity_session_id_fkey" FOREIGN KEY ("activity_session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."voting_results"
    ADD CONSTRAINT "voting_results_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."working_group_inputs"
    ADD CONSTRAINT "working_group_inputs_activity_session_id_fkey" FOREIGN KEY ("activity_session_id") REFERENCES "public"."activity_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."working_group_inputs"
    ADD CONSTRAINT "working_group_inputs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."unified_profiles"("id");



ALTER TABLE ONLY "public"."working_group_inputs"
    ADD CONSTRAINT "working_group_inputs_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workshop_events"
    ADD CONSTRAINT "workshop_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."unified_profiles"("id");



ALTER TABLE ONLY "public"."workshop_events"
    ADD CONSTRAINT "workshop_events_workshop_session_id_fkey" FOREIGN KEY ("workshop_session_id") REFERENCES "public"."workshop_sessions"("id");



ALTER TABLE ONLY "public"."workshop_sessions"
    ADD CONSTRAINT "workshop_sessions_bootcamp_plan_id_fkey" FOREIGN KEY ("bootcamp_plan_id") REFERENCES "public"."bootcamp_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workshop_sessions"
    ADD CONSTRAINT "workshop_sessions_intake_id_fkey" FOREIGN KEY ("intake_id") REFERENCES "public"."exec_intakes"("id") ON DELETE SET NULL;



ALTER TABLE "ctrl_discovery"."records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "ctrl_discovery"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "private"."mindmake_brief_rate_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "private"."mindmake_brief_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "private"."mindmake_personal_read_rate_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admin can manage sync logs" ON "public"."google_sheets_sync_log" USING (true);



CREATE POLICY "Anyone can create activity sessions" ON "public"."activity_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create anonymous insights" ON "public"."ai_insights_generated" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create anonymous sessions" ON "public"."conversation_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create bootcamp plans" ON "public"."bootcamp_plans" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create intake" ON "public"."exec_intakes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create pulses" ON "public"."exec_pulses" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create workshop sessions" ON "public"."workshop_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can delete intakes" ON "public"."exec_intakes" FOR DELETE USING (true);



CREATE POLICY "Anyone can delete workshop sessions" ON "public"."workshop_sessions" FOR DELETE USING (true);



CREATE POLICY "Anyone can insert feedback" ON "public"."feedback" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert pre-workshop inputs" ON "public"."pre_workshop_inputs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can submit post-session reviews" ON "public"."post_session_reviews" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can update activity sessions" ON "public"."activity_sessions" FOR UPDATE USING (true);



CREATE POLICY "Anyone can update bootcamp plans" ON "public"."bootcamp_plans" FOR UPDATE USING (true);



CREATE POLICY "Anyone can view active methodology" ON "public"."index_publication_rules" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active questions" ON "public"."assessment_questions" FOR SELECT USING (("active" = true));



CREATE POLICY "Anyone can view activity sessions" ON "public"."activity_sessions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view bootcamp plans" ON "public"."bootcamp_plans" FOR SELECT USING (true);



CREATE POLICY "Anyone can view insight dimensions" ON "public"."insight_dimensions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view insights" ON "public"."ai_insights_generated" FOR SELECT USING (true);



CREATE POLICY "Anyone can view post-session reviews" ON "public"."post_session_reviews" FOR SELECT USING (true);



CREATE POLICY "Anyone can view published index snapshots" ON "public"."ai_leadership_index_snapshots" FOR SELECT USING (true);



CREATE POLICY "Anyone can view pulses" ON "public"."exec_pulses" FOR SELECT USING (true);



CREATE POLICY "Anyone insert workshop_events" ON "public"."workshop_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated users can create booking requests" ON "public"."booking_requests" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Facilitators can delete pre-workshop inputs" ON "public"."pre_workshop_inputs" FOR DELETE USING ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'facilitator'::"public"."app_role"));



CREATE POLICY "Facilitators can update pre-workshop inputs" ON "public"."pre_workshop_inputs" FOR UPDATE USING ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'facilitator'::"public"."app_role"));



CREATE POLICY "Facilitators can update their own workshops" ON "public"."workshop_sessions" FOR UPDATE USING (true);



CREATE POLICY "Facilitators can view pre-workshop inputs" ON "public"."pre_workshop_inputs" FOR SELECT USING ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'facilitator'::"public"."app_role"));



CREATE POLICY "Facilitators can view their own workshops" ON "public"."workshop_sessions" FOR SELECT USING (true);



CREATE POLICY "Modules are viewable by everyone" ON "public"."ai_literacy_modules" FOR SELECT USING (true);



CREATE POLICY "Organizers can update their own intakes" ON "public"."exec_intakes" FOR UPDATE USING (true);



CREATE POLICY "Organizers can view their own intakes" ON "public"."exec_intakes" FOR SELECT USING (true);



CREATE POLICY "Participants can update their own pulses" ON "public"."exec_pulses" FOR UPDATE USING (true);



CREATE POLICY "Public read workshop_events" ON "public"."workshop_events" FOR SELECT USING (true);



CREATE POLICY "Public read workshop_questions" ON "public"."workshop_questions" FOR SELECT USING (true);



CREATE POLICY "Service can insert assessment events" ON "public"."assessment_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert behavioral adjustments" ON "public"."assessment_behavioral_adjustments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert company context" ON "public"."company_context" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert dimension scores" ON "public"."leader_dimension_scores" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert first moves" ON "public"."leader_first_moves" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert meeting prep sessions" ON "public"."meeting_prep_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert org scenarios" ON "public"."leader_org_scenarios" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert prompt sets" ON "public"."leader_prompt_sets" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert risk signals" ON "public"."leader_risk_signals" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert tensions" ON "public"."leader_tensions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can manage questions" ON "public"."assessment_questions" USING (true) WITH CHECK (true);



CREATE POLICY "Service can manage referrals" ON "public"."assessment_referrals" USING (true) WITH CHECK (true);



CREATE POLICY "Service can update company context" ON "public"."company_context" FOR UPDATE USING (true);



CREATE POLICY "Service role can insert instrumentation" ON "public"."voice_instrumentation" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can insert leads" ON "public"."leads" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can manage adoption momentum" ON "public"."adoption_momentum" USING (false) WITH CHECK (false);



CREATE POLICY "Service role can manage all memory" ON "public"."user_memory" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role can manage all memory edges" ON "public"."memory_edges" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage cache" ON "public"."company_research_cache" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage edge actions" ON "public"."edge_actions" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role can manage edge feedback" ON "public"."edge_feedback" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role can manage edge profiles" ON "public"."edge_profiles" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role can manage edge subscriptions" ON "public"."edge_subscriptions" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role can select leads" ON "public"."leads" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can update leads" ON "public"."leads" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access on budget" ON "public"."user_memory_budget" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role full access on decisions" ON "public"."user_decisions" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role full access on llm_call_log" ON "public"."llm_call_log" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role full access on patterns" ON "public"."user_patterns" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role has full access" ON "public"."feedback" USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role inserts briefings" ON "public"."briefings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role manages extraction log" ON "public"."fact_extraction_log" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role manages training material" ON "public"."training_material" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role manages tts_config" ON "public"."tts_config" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role manages tts_quality_snapshots" ON "public"."tts_quality_snapshots" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role only for adoption momentum" ON "public"."adoption_momentum" FOR SELECT USING (false);



CREATE POLICY "Service role only for backup sessions" ON "public"."backup_workshop_sessions" USING (false) WITH CHECK (false);



CREATE POLICY "Service role only for referrals" ON "public"."referrals" USING (false) WITH CHECK (false);



CREATE POLICY "Service role only for salt" ON "public"."company_identifier_salt" USING (false);



CREATE POLICY "Service role reads directives" ON "public"."user_briefing_directives" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "Service role updates briefings" ON "public"."briefings" FOR UPDATE USING (true);



CREATE POLICY "Session owners can create business context" ON "public"."user_business_context" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("user_id" IS NULL) AND (( SELECT "auth"."uid"() AS "uid") IS NULL))));



CREATE POLICY "Session owners can view business context" ON "public"."user_business_context" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (("user_id" IS NULL) AND (( SELECT "auth"."uid"() AS "uid") IS NULL))));



CREATE POLICY "System can create conversion analytics" ON "public"."conversion_analytics" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create engagement analytics" ON "public"."engagement_analytics" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage lead qualification scores" ON "public"."lead_qualification_scores" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create messages in their sessions" ON "public"."chat_messages" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can create their own business context" ON "public"."user_business_context" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can create their own lead qualifications" ON "public"."lead_qualifications" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own skill exports" ON "public"."skill_exports" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own briefing feedback" ON "public"."briefing_feedback" FOR DELETE TO "authenticated" USING (("briefing_id" IN ( SELECT "briefings"."id"
   FROM "public"."briefings"
  WHERE ("briefings"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can delete their own memory edges" ON "public"."memory_edges" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own settings" ON "public"."user_memory_settings" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own budget" ON "public"."user_memory_budget" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own participant data" ON "public"."index_participant_data" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can insert own roi actuals" ON "public"."roi_actuals" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can insert own skill exports" ON "public"."skill_exports" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own velocity events" ON "public"."velocity_events" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can insert their own assessments" ON "public"."leader_assessments" FOR INSERT WITH CHECK (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can insert their own check-ins" ON "public"."leader_check_ins" FOR INSERT WITH CHECK (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert their own company context" ON "public"."company_context" FOR INSERT WITH CHECK (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can insert their own leader profile" ON "public"."leaders" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "id") OR ("email" = ( SELECT "auth"."email"() AS "email"))));



CREATE POLICY "Users can insert their own meeting prep sessions" ON "public"."meeting_prep_sessions" FOR INSERT WITH CHECK (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can insert their own memory" ON "public"."user_memory" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own memory edges" ON "public"."memory_edges" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own missions" ON "public"."leader_missions" FOR INSERT WITH CHECK (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert their own profile" ON "public"."users" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can insert their own progress snapshots" ON "public"."leader_progress_snapshots" FOR INSERT WITH CHECK (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can insert their own settings" ON "public"."user_memory_settings" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can log their own kit journey events" ON "public"."kit_journey_events" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own decisions" ON "public"."user_decisions" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage own patterns" ON "public"."user_patterns" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own business context" ON "public"."user_business_context" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own conversations" ON "public"."ai_conversations" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own voice sessions" ON "public"."voice_sessions" USING (("session_id" IN ( SELECT "conversation_sessions"."id"
   FROM "public"."conversation_sessions"
  WHERE (("conversation_sessions"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("conversation_sessions"."user_id" IS NULL)))));



CREATE POLICY "Users can manage workshop bottlenecks" ON "public"."bottleneck_submissions" USING (("workshop_session_id" IN ( SELECT "workshop_sessions"."id"
   FROM "public"."workshop_sessions"
  WHERE true)));



CREATE POLICY "Users can manage workshop huddle synthesis" ON "public"."huddle_synthesis" USING (("workshop_session_id" IN ( SELECT "workshop_sessions"."id"
   FROM "public"."workshop_sessions"
  WHERE true)));



CREATE POLICY "Users can manage workshop pilot charter" ON "public"."pilot_charter" USING (("workshop_session_id" IN ( SELECT "workshop_sessions"."id"
   FROM "public"."workshop_sessions"
  WHERE true)));



CREATE POLICY "Users can manage workshop provocation reports" ON "public"."provocation_reports" USING (("workshop_session_id" IN ( SELECT "workshop_sessions"."id"
   FROM "public"."workshop_sessions"
  WHERE true)));



CREATE POLICY "Users can manage workshop segment summaries" ON "public"."segment_summaries" USING (("workshop_session_id" IN ( SELECT "workshop_sessions"."id"
   FROM "public"."workshop_sessions"
  WHERE true)));



CREATE POLICY "Users can manage workshop simulations" ON "public"."simulation_results" USING (("workshop_session_id" IN ( SELECT "workshop_sessions"."id"
   FROM "public"."workshop_sessions"
  WHERE true)));



CREATE POLICY "Users can manage workshop strategy" ON "public"."strategy_addendum" USING (("workshop_session_id" IN ( SELECT "workshop_sessions"."id"
   FROM "public"."workshop_sessions"
  WHERE true)));



CREATE POLICY "Users can manage workshop voting" ON "public"."voting_results" USING (("workshop_session_id" IN ( SELECT "workshop_sessions"."id"
   FROM "public"."workshop_sessions"
  WHERE true)));



CREATE POLICY "Users can rate own edge actions" ON "public"."edge_actions" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read own skill exports" ON "public"."skill_exports" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own kit artifacts" ON "public"."kit_artifacts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own kit builds" ON "public"."kit_builds" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own kit journey events" ON "public"."kit_journey_events" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read their own kit redemptions" ON "public"."kit_redemptions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can submit edge feedback" ON "public"."edge_feedback" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own budget" ON "public"."user_memory_budget" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own consent" ON "public"."index_participant_data" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can update own roi actuals" ON "public"."roi_actuals" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can update own skill exports" ON "public"."skill_exports" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own assessments" ON "public"."leader_assessments" FOR UPDATE USING (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can update their own booking requests" ON "public"."booking_requests" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can update their own business context" ON "public"."user_business_context" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own check-ins" ON "public"."leader_check_ins" FOR UPDATE USING (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update their own company context" ON "public"."company_context" FOR UPDATE USING (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE (("leaders"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text") OR (("leaders"."id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text")))));



CREATE POLICY "Users can update their own lead qualifications" ON "public"."lead_qualifications" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own leader profile" ON "public"."leaders" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ("email" = ( SELECT "auth"."email"() AS "email"))));



CREATE POLICY "Users can update their own meeting prep sessions" ON "public"."meeting_prep_sessions" FOR UPDATE USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE (("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text") OR (("l"."id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text")))));



CREATE POLICY "Users can update their own memory" ON "public"."user_memory" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own memory edges" ON "public"."memory_edges" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own missions" ON "public"."leader_missions" FOR UPDATE USING (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can update their own sessions" ON "public"."conversation_sessions" FOR UPDATE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can update their own settings" ON "public"."user_memory_settings" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own assessment events" ON "public"."assessment_events" FOR SELECT USING (("profile_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view own behavioral adjustments" ON "public"."assessment_behavioral_adjustments" FOR SELECT USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view own blind spot evidence" ON "public"."blind_spot_evidence_links" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own blind spot experiments" ON "public"."blind_spot_experiments" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own blind spot rejections" ON "public"."blind_spot_rejections" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own budget" ON "public"."user_memory_budget" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own consent audit" ON "public"."consent_audit" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own edge actions" ON "public"."edge_actions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own edge feedback" ON "public"."edge_feedback" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own edge profile" ON "public"."edge_profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own edge subscription" ON "public"."edge_subscriptions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own feedback" ON "public"."feedback" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own participant data" ON "public"."index_participant_data" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view own roi actuals" ON "public"."roi_actuals" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view own velocity events" ON "public"."velocity_events" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view their own assessments" ON "public"."leader_assessments" FOR SELECT USING ((("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))) OR ("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE (("leaders"."id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text")))));



CREATE POLICY "Users can view their own audit logs" ON "public"."security_audit_log" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own booking requests" ON "public"."booking_requests" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("session_id" IN ( SELECT "conversation_sessions"."id"
   FROM "public"."conversation_sessions"
  WHERE (("conversation_sessions"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("conversation_sessions"."user_id" IS NULL) AND ("conversation_sessions"."id" = "booking_requests"."session_id")))))));



CREATE POLICY "Users can view their own business context" ON "public"."user_business_context" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own check-ins" ON "public"."leader_check_ins" FOR SELECT USING (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view their own company context" ON "public"."company_context" FOR SELECT USING (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE (("leaders"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text") OR (("leaders"."id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text")))));



CREATE POLICY "Users can view their own conversion analytics" ON "public"."conversion_analytics" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own dimension scores" ON "public"."leader_dimension_scores" FOR SELECT USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view their own engagement analytics" ON "public"."engagement_analytics" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own extraction log" ON "public"."fact_extraction_log" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own first moves" ON "public"."leader_first_moves" FOR SELECT USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view their own instrumentation" ON "public"."voice_instrumentation" FOR SELECT USING (("session_id" IN ( SELECT "conversation_sessions"."id"
   FROM "public"."conversation_sessions"
  WHERE (("conversation_sessions"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("conversation_sessions"."user_id" IS NULL)))));



CREATE POLICY "Users can view their own lead qualifications" ON "public"."lead_qualifications" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own leader profile" ON "public"."leaders" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "id") OR ("email" = ( SELECT "auth"."email"() AS "email"))));



CREATE POLICY "Users can view their own meeting prep sessions" ON "public"."meeting_prep_sessions" FOR SELECT USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE (("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text") OR (("l"."id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text")))));



CREATE POLICY "Users can view their own memory" ON "public"."user_memory" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own memory edges" ON "public"."memory_edges" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own missions" ON "public"."leader_missions" FOR SELECT USING (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view their own org scenarios" ON "public"."leader_org_scenarios" FOR SELECT USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "auth_user_id"));



CREATE POLICY "Users can view their own progress snapshots" ON "public"."leader_progress_snapshots" FOR SELECT USING (("leader_id" IN ( SELECT "leaders"."id"
   FROM "public"."leaders"
  WHERE ("leaders"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users can view their own prompt profiles" ON "public"."prompt_library_profiles" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view their own prompt sets" ON "public"."leader_prompt_sets" FOR SELECT USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view their own referrals" ON "public"."assessment_referrals" FOR SELECT USING (("referrer_assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view their own risk signals" ON "public"."leader_risk_signals" FOR SELECT USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own sessions" ON "public"."conversation_sessions" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view their own settings" ON "public"."user_memory_settings" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own tensions" ON "public"."leader_tensions" FOR SELECT USING (("assessment_id" IN ( SELECT "la"."id"
   FROM ("public"."leader_assessments" "la"
     JOIN "public"."leaders" "l" ON (("la"."leader_id" = "l"."id")))
  WHERE ("l"."email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = ( SELECT "auth"."uid"() AS "uid"))))::"text"))));



CREATE POLICY "Users can view their session messages" ON "public"."chat_messages" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR ("session_id" IN ( SELECT "conversation_sessions"."id"
   FROM "public"."conversation_sessions"
  WHERE (("conversation_sessions"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("conversation_sessions"."user_id" IS NULL) AND ("conversation_sessions"."id" = "chat_messages"."session_id")))))));



CREATE POLICY "Users insert own feedback" ON "public"."briefing_feedback" FOR INSERT WITH CHECK (("briefing_id" IN ( SELECT "briefings"."id"
   FROM "public"."briefings"
  WHERE ("briefings"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users manage their own directives" ON "public"."user_briefing_directives" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users read global training material" ON "public"."training_material" FOR SELECT USING ((("scope" = 'global'::"text") AND ("is_active" = true)));



CREATE POLICY "Users read own briefings" ON "public"."briefings" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users read own feedback" ON "public"."briefing_feedback" FOR SELECT USING (("briefing_id" IN ( SELECT "briefings"."id"
   FROM "public"."briefings"
  WHERE ("briefings"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Users read their own training material" ON "public"."training_material" FOR SELECT USING ((("scope" = 'user'::"text") AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."aa_model_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."adoption_momentum" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_insights_generated" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_leadership_index_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_literacy_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_response_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_audit" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow anonymous insert" ON "public"."cannes_responses" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon insert audience_contacts" ON "public"."audience_contacts" FOR INSERT WITH CHECK (true);



CREATE POLICY "anon insert be_guest_applications" ON "public"."be_guest_applications" FOR INSERT WITH CHECK (true);



CREATE POLICY "anon reads consented testimonials" ON "public"."testimonials" FOR SELECT TO "authenticated", "anon" USING ((("permission" = 'free'::"text") AND ("summary_line" IS NOT NULL) AND ("length"("btrim"("summary_line")) >= 40)));



ALTER TABLE "public"."assessment_behavioral_adjustments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audience_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."automator_usage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automator_usage_owner_modify" ON "public"."automator_usage" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "automator_usage_owner_select" ON "public"."automator_usage" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."backup_workshop_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."be_episodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."be_guest_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."be_guests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."be_testimonials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blind_spot_evidence_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blind_spot_experiments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blind_spot_rejections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bootcamp_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bottleneck_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brain_assertions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_assertions_audience_select" ON "public"."brain_assertions" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_workspace_roles" "role_row"
  WHERE (("role_row"."workspace_id" = "brain_assertions"."workspace_id") AND ("role_row"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role_row"."revoked_at" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."brain_audience_grants" "grant_row"
  WHERE (("grant_row"."workspace_id" = "brain_assertions"."workspace_id") AND ("grant_row"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("grant_row"."audience" = "brain_assertions"."audience") AND ("grant_row"."revoked_at" IS NULL) AND (("grant_row"."expires_at" IS NULL) OR ("grant_row"."expires_at" > "now"())))))));



ALTER TABLE "public"."brain_audience_grants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_audience_grants_self_select" ON "public"."brain_audience_grants" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND ("grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("revoked_at" IS NULL) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



ALTER TABLE "public"."brain_item_version_assertions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_item_version_assertions_audience_select" ON "public"."brain_item_version_assertions" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_workspace_roles" "role_row"
  WHERE (("role_row"."workspace_id" = "brain_item_version_assertions"."workspace_id") AND ("role_row"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role_row"."revoked_at" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."brain_audience_grants" "grant_row"
  WHERE (("grant_row"."workspace_id" = "brain_item_version_assertions"."workspace_id") AND ("grant_row"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("grant_row"."audience" = "brain_item_version_assertions"."audience") AND ("grant_row"."revoked_at" IS NULL) AND (("grant_row"."expires_at" IS NULL) OR ("grant_row"."expires_at" > "now"())))))));



ALTER TABLE "public"."brain_item_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_item_versions_audience_select" ON "public"."brain_item_versions" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_workspace_roles" "role_row"
  WHERE (("role_row"."workspace_id" = "brain_item_versions"."workspace_id") AND ("role_row"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role_row"."revoked_at" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."brain_audience_grants" "grant_row"
  WHERE (("grant_row"."workspace_id" = "brain_item_versions"."workspace_id") AND ("grant_row"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("grant_row"."audience" = "brain_item_versions"."audience") AND ("grant_row"."revoked_at" IS NULL) AND (("grant_row"."expires_at" IS NULL) OR ("grant_row"."expires_at" > "now"())))))));



ALTER TABLE "public"."brain_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_items_visible_version_select" ON "public"."brain_items" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_item_versions" "version_row"
  WHERE ("version_row"."brain_item_id" = "brain_items"."id")))));



ALTER TABLE "public"."brain_relationship_version_assertions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_relationship_version_assertions_audience_select" ON "public"."brain_relationship_version_assertions" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_workspace_roles" "role_row"
  WHERE (("role_row"."workspace_id" = "brain_relationship_version_assertions"."workspace_id") AND ("role_row"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role_row"."revoked_at" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."brain_audience_grants" "grant_row"
  WHERE (("grant_row"."workspace_id" = "brain_relationship_version_assertions"."workspace_id") AND ("grant_row"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("grant_row"."audience" = "brain_relationship_version_assertions"."audience") AND ("grant_row"."revoked_at" IS NULL) AND (("grant_row"."expires_at" IS NULL) OR ("grant_row"."expires_at" > "now"())))))));



ALTER TABLE "public"."brain_relationship_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_relationship_versions_audience_select" ON "public"."brain_relationship_versions" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_workspace_roles" "role_row"
  WHERE (("role_row"."workspace_id" = "brain_relationship_versions"."workspace_id") AND ("role_row"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role_row"."revoked_at" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."brain_audience_grants" "grant_row"
  WHERE (("grant_row"."workspace_id" = "brain_relationship_versions"."workspace_id") AND ("grant_row"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("grant_row"."audience" = "brain_relationship_versions"."audience") AND ("grant_row"."revoked_at" IS NULL) AND (("grant_row"."expires_at" IS NULL) OR ("grant_row"."expires_at" > "now"())))))));



ALTER TABLE "public"."brain_relationships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_relationships_visible_version_select" ON "public"."brain_relationships" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_relationship_versions" "version_row"
  WHERE ("version_row"."relationship_id" = "brain_relationships"."id")))));



ALTER TABLE "public"."brain_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_sources_audience_select" ON "public"."brain_sources" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_workspace_roles" "role_row"
  WHERE (("role_row"."workspace_id" = "brain_sources"."workspace_id") AND ("role_row"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role_row"."revoked_at" IS NULL)))) AND (EXISTS ( SELECT 1
   FROM "public"."brain_audience_grants" "grant_row"
  WHERE (("grant_row"."workspace_id" = "brain_sources"."workspace_id") AND ("grant_row"."grantee_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("grant_row"."audience" = "brain_sources"."audience") AND ("grant_row"."revoked_at" IS NULL) AND (("grant_row"."expires_at" IS NULL) OR ("grant_row"."expires_at" > "now"())))))));



ALTER TABLE "public"."brain_workspace_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_workspace_roles_self_select" ON "public"."brain_workspace_roles" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND ("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("revoked_at" IS NULL)));



ALTER TABLE "public"."brain_workspaces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brain_workspaces_member_select" ON "public"."brain_workspaces" FOR SELECT TO "authenticated" USING (((((( SELECT "auth"."jwt"() AS "jwt") ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE) AND (EXISTS ( SELECT 1
   FROM "public"."brain_workspace_roles" "role_row"
  WHERE (("role_row"."workspace_id" = "brain_workspaces"."id") AND ("role_row"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role_row"."revoked_at" IS NULL))))));



ALTER TABLE "public"."briefing_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."briefing_interests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "briefing_interests_self_delete" ON "public"."briefing_interests" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "briefing_interests_self_insert" ON "public"."briefing_interests" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "briefing_interests_self_select" ON "public"."briefing_interests" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "briefing_interests_self_update" ON "public"."briefing_interests" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."briefing_lens_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "briefing_lens_feedback_self_select" ON "public"."briefing_lens_feedback" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."briefings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cannes_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_context" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_identifier_salt" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_research_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consent_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."constructs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contest_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contest_reports_owner_ins" ON "public"."contest_reports" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "contest_reports_owner_sel" ON "public"."contest_reports" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."conversation_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversion_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."criteria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decision_alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_alerts_owner" ON "public"."decision_alerts" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."decision_cases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_cases_owner" ON "public"."decision_cases" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."decision_check_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_check_items_owner" ON "public"."decision_check_items" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."decision_claims" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_claims_owner" ON "public"."decision_claims" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."decision_eval_cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decision_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_events_owner" ON "public"."decision_events" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."decision_evidence" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_evidence_owner" ON "public"."decision_evidence" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."decision_frameworks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decision_outcomes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_outcomes_select_own" ON "public"."decision_outcomes" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."decision_tensions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_tensions_owner" ON "public"."decision_tensions" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."decision_user_calls" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "decision_user_calls_owner" ON "public"."decision_user_calls" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."delivery_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edge_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edge_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edge_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edge_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."effortless_map_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."engagement_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."engagement_intelligence" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evidence" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evidence_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exec_intakes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exec_pulses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fact_extraction_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follow_up_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."generated_artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "goals_owner" ON "public"."goals" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."google_sheets_sync_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."harness_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."huddle_synthesis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."index_participant_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."index_publication_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."industry_beat_library" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "industry_beat_library_read" ON "public"."industry_beat_library" FOR SELECT TO "authenticated" USING ("is_active");



ALTER TABLE "public"."insight_dimensions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intake_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kit_artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kit_builds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kit_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kit_journey_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kit_nudges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kit_redemptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kit_waitlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_qualification_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_qualifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_check_ins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_dimension_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_first_moves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_missions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_notification_prefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_org_scenarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_progress_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_prompt_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_risk_signals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leader_tensions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."live_headlines_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llm_call_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mcp_pulls" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mcp_pulls_owner_sel" ON "public"."mcp_pulls" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."mcp_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mcp_tokens_owner_sel" ON "public"."mcp_tokens" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."meeting_prep_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memory_edges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memory_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "memory_events_insert_own" ON "public"."memory_events" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "memory_events_select_own" ON "public"."memory_events" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."memory_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "memory_links_select_own" ON "public"."memory_links" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."mindmake_personal_reads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "news_preferences_insert_own" ON "public"."news_preferences" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "news_preferences_select_own" ON "public"."news_preferences" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "news_preferences_update_own" ON "public"."news_preferences" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."news_trends" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."north_star_daily" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "own notification prefs insert" ON "public"."leader_notification_prefs" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "own notification prefs select" ON "public"."leader_notification_prefs" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "own notification prefs update" ON "public"."leader_notification_prefs" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "own_ai_usage_select" ON "public"."ai_usage_audit" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "own_data_audit_select" ON "public"."data_audit_log" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "own_profile_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "own_profile_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "own_profile_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner_delete_constructs" ON "public"."constructs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_criteria" ON "public"."criteria" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_evidence" ON "public"."evidence" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_evidence_sources" ON "public"."evidence_sources" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_harness_runs" ON "public"."harness_runs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_ledger" ON "public"."ledger" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_proposals" ON "public"."proposals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_skill_provenance" ON "public"."skill_provenance" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_sort_grades" ON "public"."sort_grades" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_delete_sort_items" ON "public"."sort_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_constructs" ON "public"."constructs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_criteria" ON "public"."criteria" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_evidence" ON "public"."evidence" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_evidence_sources" ON "public"."evidence_sources" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_harness_runs" ON "public"."harness_runs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_ledger" ON "public"."ledger" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_proposals" ON "public"."proposals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_skill_provenance" ON "public"."skill_provenance" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_sort_grades" ON "public"."sort_grades" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_insert_sort_items" ON "public"."sort_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_constructs" ON "public"."constructs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_criteria" ON "public"."criteria" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_evidence" ON "public"."evidence" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_evidence_sources" ON "public"."evidence_sources" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_harness_runs" ON "public"."harness_runs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_ledger" ON "public"."ledger" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_proposals" ON "public"."proposals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_skill_provenance" ON "public"."skill_provenance" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_sort_grades" ON "public"."sort_grades" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_select_sort_items" ON "public"."sort_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_constructs" ON "public"."constructs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_criteria" ON "public"."criteria" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_evidence" ON "public"."evidence" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_evidence_sources" ON "public"."evidence_sources" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_harness_runs" ON "public"."harness_runs" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_ledger" ON "public"."ledger" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_proposals" ON "public"."proposals" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_skill_provenance" ON "public"."skill_provenance" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_sort_grades" ON "public"."sort_grades" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner_update_sort_items" ON "public"."sort_items" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."partner_intakes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_portfolio_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_pool_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "personal_pool_cache_select_own" ON "public"."personal_pool_cache" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."pilot_charter" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portfolio_handoff" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_session_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pre_workshop_inputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_insights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_library_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provocation_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read be_episodes" ON "public"."be_episodes" FOR SELECT USING (("is_published" = true));



CREATE POLICY "public read be_guests" ON "public"."be_guests" FOR SELECT USING (("approved" = true));



CREATE POLICY "public read be_testimonials" ON "public"."be_testimonials" FOR SELECT USING (("featured" = true));



CREATE POLICY "public_insert_intakes" ON "public"."partner_intakes" FOR INSERT WITH CHECK (true);



CREATE POLICY "public_insert_plans" ON "public"."partner_plans" FOR INSERT WITH CHECK (true);



CREATE POLICY "public_insert_portfolio" ON "public"."partner_portfolio_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "public_read_intakes" ON "public"."partner_intakes" FOR SELECT USING (true);



CREATE POLICY "public_read_plans" ON "public"."partner_plans" FOR SELECT USING (true);



CREATE POLICY "public_read_portfolio" ON "public"."partner_portfolio_items" FOR SELECT USING (true);



ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roi_actuals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."segment_summaries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_only_ai_response_cache" ON "public"."ai_response_cache" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_only_stripe_events_processed" ON "public"."stripe_events_processed" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."simulation_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skill_exports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skill_provenance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sort_grades" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sort_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."strategy_addendum" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_events_processed" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suggested_briefing_interests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suggested_briefing_interests_self_select" ON "public"."suggested_briefing_interests" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "suggested_briefing_interests_self_update" ON "public"."suggested_briefing_interests" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."training_material" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tts_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tts_quality_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unified_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_briefing_directives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_business_context" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_decisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_memory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_memory_budget" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_memory_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users delete own artifacts" ON "public"."generated_artifacts" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users insert own artifacts" ON "public"."generated_artifacts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "users read own artifacts" ON "public"."generated_artifacts" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."velocity_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voice_instrumentation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voice_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voting_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."working_group_inputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workshop_sessions" ENABLE ROW LEVEL SECURITY;


REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public", "private", "ctrl_discovery" FROM "anon", "authenticated", "service_role";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public", "private", "ctrl_discovery" FROM "anon", "authenticated", "service_role";
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "public", "private", "ctrl_discovery" FROM "anon", "authenticated", "service_role";
REVOKE ALL PRIVILEGES ON SEQUENCE "private"."mindmake_personal_read_rate_events_id_seq" FROM "postgres";
GRANT USAGE ON SEQUENCE "private"."mindmake_personal_read_rate_events_id_seq" TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "private" TO "service_role";



REVOKE ALL ON FUNCTION "ctrl_discovery"."prepare_record_append"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "ctrl_discovery"."reject_history_mutation"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."brain_assertion_scope_guard"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."brain_item_evidence_scope_guard"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."brain_item_version_scope_guard"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."brain_relationship_evidence_scope_guard"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."brain_relationship_version_scope_guard"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."brain_require_item_support"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."brain_require_relationship_evidence"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."mindmake_brief_rpc"("p_operation" "text", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."mindmake_brief_rpc"("p_operation" "text", "p_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "private"."mindmake_consume_brief_rate"("p_ip_hash" "text", "p_email_hash" "text", "p_now" timestamp with time zone) FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."mindmake_consume_personal_read_rate"("p_ip_hash" "text", "p_email_hash" "text", "p_now" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."mindmake_consume_personal_read_rate"("p_ip_hash" "text", "p_email_hash" "text", "p_now" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "private"."mindmake_purge_brief_data"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."mindmake_purge_follow_ups"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."mindmake_purge_follow_ups"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_outcome_to_brain"("p_outcome_id" "uuid") FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."be_audience_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."be_audience_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."be_audience_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bump_content_changed_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."bump_content_changed_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."bump_content_changed_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."burn_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."burn_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_bootstrap_ci"("sample_values" numeric[], "confidence_level" numeric, "iterations" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_bootstrap_ci"("sample_values" numeric[], "confidence_level" numeric, "iterations" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_bootstrap_ci"("sample_values" numeric[], "confidence_level" numeric, "iterations" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics"("session_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics"("session_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics"("session_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_momentum_components"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_momentum_components"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_momentum_components"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_expired_memories"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_expired_memories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_research_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_research_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_research_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_llm_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_llm_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_llm_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."close_validity_on_retire"() TO "anon";
GRANT ALL ON FUNCTION "public"."close_validity_on_retire"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."close_validity_on_retire"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."confirm_blind_spot_candidate_v2"("p_user_id" "uuid", "p_pattern_text" "text", "p_explanation" "text", "p_anchor_fingerprint" "text", "p_evidence_strength" "jsonb", "p_anchors" "jsonb", "p_experiment" "jsonb", "p_idempotency_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_blind_spot_candidate_v2"("p_user_id" "uuid", "p_pattern_text" "text", "p_explanation" "text", "p_anchor_fingerprint" "text", "p_evidence_strength" "jsonb", "p_anchors" "jsonb", "p_experiment" "jsonb", "p_idempotency_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."confirm_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_text" "text", "p_evidence_count" integer, "p_confidence" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_blind_spot_pattern"("p_user_id" "uuid", "p_pattern_text" "text", "p_evidence_count" integer, "p_confidence" numeric) TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_kit_skill"("p_redemption_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_kit_skill"("p_redemption_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."export_user_memory"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."export_user_memory"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fix_memory_fact"("p_fact_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fix_memory_fact"("p_fact_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fix_memory_fact"("p_fact_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_referral_code"("p_assessment_id" "uuid", "p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"("p_assessment_id" "uuid", "p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"("p_assessment_id" "uuid", "p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_intake_for_registration"("intake_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_intake_for_registration"("intake_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_intake_for_registration"("intake_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."user_memory" TO "anon";
GRANT ALL ON TABLE "public"."user_memory" TO "authenticated";
GRANT ALL ON TABLE "public"."user_memory" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_memory_by_temperature"("p_user_id" "uuid", "p_temperature" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_memory_by_temperature"("p_user_id" "uuid", "p_temperature" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_memory_sweep_batch"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_memory_sweep_batch"("p_limit" integer) TO "service_role";



GRANT ALL ON TABLE "public"."user_memory_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_memory_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_memory_settings" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_or_create_memory_settings"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_or_create_memory_settings"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_profile"("p_email" "text", "p_name" "text", "p_role" "text", "p_company" "text", "p_source_tool" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_profile"("p_email" "text", "p_name" "text", "p_role" "text", "p_company" "text", "p_source_tool" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_profile"("p_email" "text", "p_name" "text", "p_role" "text", "p_company" "text", "p_source_tool" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_verifications"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_verifications"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_verifications"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_share_card"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_share_card"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_share_card"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_track_record"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_track_record"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_track_record"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_memory_context"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_memory_context"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."hash_company_identifier"("email_domain" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hash_company_identifier"("email_domain" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hash_company_identifier"("email_domain" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."increment_automator_usage"("p_user_id" "uuid", "p_month" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."increment_automator_usage"("p_user_id" "uuid", "p_month" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_automator_usage"("p_user_id" "uuid", "p_month" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_automator_usage"("p_user_id" "uuid", "p_month" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lineage_of"("p_root_id" "uuid", "p_max_depth" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."lineage_of"("p_root_id" "uuid", "p_max_depth" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lineage_of"("p_root_id" "uuid", "p_max_depth" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_mcp_tokens"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_mcp_tokens"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_mcp_tokens"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_booking_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_booking_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_booking_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_consent_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_consent_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_consent_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."match_user_memory"("query_embedding" "public"."vector", "match_count" integer, "user_uuid" "uuid", "min_similarity" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."match_user_memory"("query_embedding" "public"."vector", "match_count" integer, "user_uuid" "uuid", "min_similarity" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_user_memory"("query_embedding" "public"."vector", "match_count" integer, "user_uuid" "uuid", "min_similarity" double precision) TO "service_role";



REVOKE ALL ON FUNCTION "public"."mindmake_brief_rpc"("p_operation" "text", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mindmake_brief_rpc"("p_operation" "text", "p_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mindmake_consume_personal_read_rate"("p_ip_hash" "text", "p_email_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mindmake_consume_personal_read_rate"("p_ip_hash" "text", "p_email_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mindmake_purge_follow_ups"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mindmake_purge_follow_ups"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."mint_mcp_token"("p_label" "text", "p_include_briefing" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mint_mcp_token"("p_label" "text", "p_include_briefing" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mint_mcp_token"("p_label" "text", "p_include_briefing" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."ns_brain_min_facts"() TO "anon";
GRANT ALL ON FUNCTION "public"."ns_brain_min_facts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ns_brain_min_facts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pin_decision"("p_case_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."pin_decision"("p_case_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pin_decision"("p_case_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_pending_sync_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_pending_sync_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_pending_sync_logs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_blind_spot_experiment_outcome"("p_user_id" "uuid", "p_experiment_id" "uuid", "p_outcome" "text", "p_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_blind_spot_experiment_outcome"("p_user_id" "uuid", "p_experiment_id" "uuid", "p_outcome" "text", "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_decision_outcome"("p_decision_case_id" "uuid", "p_resolution" "text", "p_played_out" "text", "p_process_quality" smallint, "p_note" "text", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_decision_outcome"("p_decision_case_id" "uuid", "p_resolution" "text", "p_played_out" "text", "p_process_quality" smallint, "p_note" "text", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_decision_outcome"("p_decision_case_id" "uuid", "p_resolution" "text", "p_played_out" "text", "p_process_quality" smallint, "p_note" "text", "p_source" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."redeem_kit_code"("p_code" "text", "p_user_id" "uuid", "p_preset_version" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."redeem_kit_code"("p_code" "text", "p_user_id" "uuid", "p_preset_version" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_decision"("p_decision_case_id" "uuid", "p_played_out" "text", "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_decision"("p_decision_case_id" "uuid", "p_played_out" "text", "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_decision"("p_decision_case_id" "uuid", "p_played_out" "text", "p_note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."revoke_mcp_token"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revoke_mcp_token"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_mcp_token"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."round_percentile"("raw_percentile" numeric, "rounding" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."round_percentile"("raw_percentile" numeric, "rounding" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."round_percentile"("raw_percentile" numeric, "rounding" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."run_brain_adapt"("p_limit" integer) FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."schedule_sync_processing"() TO "anon";
GRANT ALL ON FUNCTION "public"."schedule_sync_processing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."schedule_sync_processing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_memory_retention_expiration"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_memory_retention_expiration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_memory_retention_expiration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."snapshot_north_star"() TO "anon";
GRANT ALL ON FUNCTION "public"."snapshot_north_star"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."snapshot_north_star"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sp_aggregate_briefing_feedback"("window_days" integer, "promote_threshold" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sp_aggregate_briefing_feedback"("window_days" integer, "promote_threshold" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sp_aggregate_briefing_feedback"("window_days" integer, "promote_threshold" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sp_aggregate_briefing_feedback"("window_days" integer, "promote_threshold" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strengthen_memory_fact"("p_fact_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."strengthen_memory_fact"("p_fact_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strengthen_memory_fact"("p_fact_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_contest"("p_kind" "text", "p_target_type" "text", "p_target_id" "uuid", "p_surface" "text", "p_element" "text", "p_note" "text", "p_context" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_contest"("p_kind" "text", "p_target_type" "text", "p_target_id" "uuid", "p_surface" "text", "p_element" "text", "p_note" "text", "p_context" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_contest"("p_kind" "text", "p_target_type" "text", "p_target_id" "uuid", "p_surface" "text", "p_element" "text", "p_note" "text", "p_context" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_decision_lineage"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."sync_lead_to_sheets"("lead_user_id" "uuid", "lead_session_id" "uuid", "sync_type_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_lead_to_sheets"("lead_user_id" "uuid", "lead_session_id" "uuid", "sync_type_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_lead_to_sheets"("lead_user_id" "uuid", "lead_session_id" "uuid", "sync_type_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_memory_fact"("p_fact_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."touch_memory_fact"("p_fact_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_memory_fact"("p_fact_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_memory_facts"("p_fact_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."touch_memory_facts"("p_fact_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_memory_facts"("p_fact_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."track_referral_conversion"("p_referral_code" "text", "p_referee_assessment_id" "uuid", "p_referee_email" "text", "p_referee_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_referral_conversion"("p_referral_code" "text", "p_referee_assessment_id" "uuid", "p_referee_email" "text", "p_referee_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_referral_conversion"("p_referral_code" "text", "p_referee_assessment_id" "uuid", "p_referee_email" "text", "p_referee_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_analytics_sheets_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_analytics_sheets_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_analytics_sheets_sync"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_anonymous_booking_sync"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."trigger_anonymous_lead_sync"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."trigger_booking_http_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_booking_http_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_booking_http_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_booking_requests_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_booking_requests_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_booking_requests_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_booking_sheets_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_booking_sheets_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_booking_sheets_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_booking_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_booking_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_booking_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_business_context_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_business_context_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_business_context_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_contact_collection_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_contact_collection_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_contact_collection_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_google_sheets_edge_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_google_sheets_edge_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_google_sheets_edge_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_google_sheets_sync"("sync_type_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_google_sheets_sync"("sync_type_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_google_sheets_sync"("sync_type_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_lead_score_sheets_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_lead_score_sheets_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_lead_score_sheets_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_context_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_context_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_context_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leader_assessments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_leader_assessments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leader_assessments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leaders_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_leaders_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leaders_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_meeting_prep_sessions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_meeting_prep_sessions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_meeting_prep_sessions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_memory_edges_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_memory_edges_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_memory_edges_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_from_insights"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_from_insights"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_from_insights"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_memory_retention"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_memory_retention"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_memory_retention"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_memory_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_memory_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_memory_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_memory_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_memory_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_memory_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_memory_fact"("p_fact_id" "uuid", "p_new_value" "text", "p_is_correct" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."verify_memory_fact"("p_fact_id" "uuid", "p_new_value" "text", "p_is_correct" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_memory_fact"("p_fact_id" "uuid", "p_new_value" "text", "p_is_correct" boolean) TO "service_role";



GRANT ALL ON TABLE "public"."aa_model_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."activity_sessions" TO "anon";
GRANT ALL ON TABLE "public"."activity_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."adoption_momentum" TO "anon";
GRANT ALL ON TABLE "public"."adoption_momentum" TO "authenticated";
GRANT ALL ON TABLE "public"."adoption_momentum" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_insights_generated" TO "service_role";



GRANT ALL ON TABLE "public"."ai_leadership_index_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."ai_leadership_index_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_leadership_index_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."ai_literacy_modules" TO "anon";
GRANT ALL ON TABLE "public"."ai_literacy_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_literacy_modules" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."ai_usage_audit" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."ai_usage_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_audit" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_behavioral_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."assessment_behavioral_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_behavioral_adjustments" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_events" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_questions" TO "anon";
GRANT ALL ON TABLE "public"."assessment_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_questions" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_referrals" TO "anon";
GRANT ALL ON TABLE "public"."assessment_referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_referrals" TO "service_role";



GRANT ALL ON TABLE "public"."audience_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."automator_usage" TO "anon";
GRANT ALL ON TABLE "public"."automator_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."automator_usage" TO "service_role";



GRANT ALL ON TABLE "public"."backup_workshop_sessions" TO "anon";
GRANT ALL ON TABLE "public"."backup_workshop_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_workshop_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."be_episodes" TO "anon";
GRANT ALL ON TABLE "public"."be_episodes" TO "authenticated";
GRANT ALL ON TABLE "public"."be_episodes" TO "service_role";



GRANT ALL ON TABLE "public"."be_guest_applications" TO "anon";
GRANT ALL ON TABLE "public"."be_guest_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."be_guest_applications" TO "service_role";



GRANT ALL ON TABLE "public"."be_guests" TO "anon";
GRANT ALL ON TABLE "public"."be_guests" TO "authenticated";
GRANT ALL ON TABLE "public"."be_guests" TO "service_role";



GRANT ALL ON TABLE "public"."be_testimonials" TO "anon";
GRANT ALL ON TABLE "public"."be_testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."be_testimonials" TO "service_role";



GRANT ALL ON TABLE "public"."blind_spot_evidence_links" TO "service_role";
GRANT SELECT ON TABLE "public"."blind_spot_evidence_links" TO "authenticated";



GRANT ALL ON TABLE "public"."blind_spot_experiments" TO "service_role";
GRANT SELECT ON TABLE "public"."blind_spot_experiments" TO "authenticated";



GRANT ALL ON TABLE "public"."blind_spot_rejections" TO "service_role";
GRANT SELECT ON TABLE "public"."blind_spot_rejections" TO "authenticated";



GRANT ALL ON TABLE "public"."booking_requests" TO "service_role";



GRANT ALL ON TABLE "public"."bootcamp_plans" TO "anon";
GRANT ALL ON TABLE "public"."bootcamp_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."bootcamp_plans" TO "service_role";



GRANT ALL ON TABLE "public"."bottleneck_submissions" TO "anon";
GRANT ALL ON TABLE "public"."bottleneck_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."bottleneck_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."brain_assertions" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_assertions" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_audience_grants" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_audience_grants" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_item_version_assertions" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_item_version_assertions" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_item_versions" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_item_versions" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_items" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_items" TO "authenticated";



GRANT ALL ON TABLE "public"."briefing_interests" TO "anon";
GRANT ALL ON TABLE "public"."briefing_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."briefing_interests" TO "service_role";



GRANT ALL ON TABLE "public"."news_preferences" TO "anon";
GRANT ALL ON TABLE "public"."news_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."news_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."brain_profile_inputs" TO "anon";
GRANT ALL ON TABLE "public"."brain_profile_inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."brain_profile_inputs" TO "service_role";



GRANT ALL ON TABLE "public"."brain_relationship_version_assertions" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_relationship_version_assertions" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_relationship_versions" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_relationship_versions" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_relationships" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_relationships" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_sources" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_sources" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_workspace_roles" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_workspace_roles" TO "authenticated";



GRANT ALL ON TABLE "public"."brain_workspaces" TO "service_role";
GRANT SELECT ON TABLE "public"."brain_workspaces" TO "authenticated";



GRANT ALL ON TABLE "public"."briefing_feedback" TO "anon";
GRANT ALL ON TABLE "public"."briefing_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."briefing_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."briefing_lens_feedback" TO "anon";
GRANT ALL ON TABLE "public"."briefing_lens_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."briefing_lens_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."briefings" TO "anon";
GRANT ALL ON TABLE "public"."briefings" TO "authenticated";
GRANT ALL ON TABLE "public"."briefings" TO "service_role";



GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."cannes_responses" TO "anon";
GRANT ALL ON TABLE "public"."cannes_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."cannes_responses" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."company_context" TO "anon";
GRANT ALL ON TABLE "public"."company_context" TO "authenticated";
GRANT ALL ON TABLE "public"."company_context" TO "service_role";



GRANT ALL ON TABLE "public"."company_identifier_salt" TO "anon";
GRANT ALL ON TABLE "public"."company_identifier_salt" TO "authenticated";
GRANT ALL ON TABLE "public"."company_identifier_salt" TO "service_role";



GRANT ALL ON TABLE "public"."company_research_cache" TO "anon";
GRANT ALL ON TABLE "public"."company_research_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."company_research_cache" TO "service_role";



GRANT ALL ON TABLE "public"."consent_audit" TO "anon";
GRANT ALL ON TABLE "public"."consent_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_audit" TO "service_role";



GRANT ALL ON TABLE "public"."constructs" TO "anon";
GRANT ALL ON TABLE "public"."constructs" TO "authenticated";
GRANT ALL ON TABLE "public"."constructs" TO "service_role";



GRANT ALL ON TABLE "public"."contest_reports" TO "anon";
GRANT ALL ON TABLE "public"."contest_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."contest_reports" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."conversion_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."criteria" TO "anon";
GRANT ALL ON TABLE "public"."criteria" TO "authenticated";
GRANT ALL ON TABLE "public"."criteria" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."data_audit_log" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."data_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."data_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."decision_alerts" TO "anon";
GRANT ALL ON TABLE "public"."decision_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."decision_cases" TO "anon";
GRANT ALL ON TABLE "public"."decision_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_cases" TO "service_role";



GRANT ALL ON TABLE "public"."decision_check_items" TO "anon";
GRANT ALL ON TABLE "public"."decision_check_items" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_check_items" TO "service_role";



GRANT ALL ON TABLE "public"."decision_claims" TO "anon";
GRANT ALL ON TABLE "public"."decision_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_claims" TO "service_role";



GRANT ALL ON TABLE "public"."decision_eval_cases" TO "anon";
GRANT ALL ON TABLE "public"."decision_eval_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_eval_cases" TO "service_role";



GRANT ALL ON TABLE "public"."decision_events" TO "anon";
GRANT ALL ON TABLE "public"."decision_events" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_events" TO "service_role";



GRANT ALL ON TABLE "public"."decision_evidence" TO "anon";
GRANT ALL ON TABLE "public"."decision_evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_evidence" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."decision_frameworks" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."decision_frameworks" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_frameworks" TO "service_role";



GRANT ALL ON TABLE "public"."decision_outcomes" TO "anon";
GRANT ALL ON TABLE "public"."decision_outcomes" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_outcomes" TO "service_role";



GRANT ALL ON TABLE "public"."decision_tensions" TO "anon";
GRANT ALL ON TABLE "public"."decision_tensions" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_tensions" TO "service_role";



GRANT ALL ON TABLE "public"."decision_user_calls" TO "anon";
GRANT ALL ON TABLE "public"."decision_user_calls" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_user_calls" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."edge_actions" TO "anon";
GRANT ALL ON TABLE "public"."edge_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."edge_actions" TO "service_role";



GRANT ALL ON TABLE "public"."edge_feedback" TO "anon";
GRANT ALL ON TABLE "public"."edge_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."edge_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."edge_profiles" TO "anon";
GRANT ALL ON TABLE "public"."edge_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."edge_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."edge_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."edge_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."edge_subscriptions" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."effortless_map_items" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."effortless_map_items" TO "authenticated";
GRANT ALL ON TABLE "public"."effortless_map_items" TO "service_role";



GRANT ALL ON TABLE "public"."engagement_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."engagement_intelligence" TO "anon";
GRANT ALL ON TABLE "public"."engagement_intelligence" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_intelligence" TO "service_role";



GRANT ALL ON TABLE "public"."evidence" TO "anon";
GRANT ALL ON TABLE "public"."evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."evidence" TO "service_role";



GRANT ALL ON TABLE "public"."evidence_sources" TO "anon";
GRANT ALL ON TABLE "public"."evidence_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."evidence_sources" TO "service_role";



GRANT ALL ON TABLE "public"."exec_intakes" TO "anon";
GRANT ALL ON TABLE "public"."exec_intakes" TO "authenticated";
GRANT ALL ON TABLE "public"."exec_intakes" TO "service_role";



GRANT ALL ON TABLE "public"."exec_pulses" TO "anon";
GRANT ALL ON TABLE "public"."exec_pulses" TO "authenticated";
GRANT ALL ON TABLE "public"."exec_pulses" TO "service_role";



GRANT ALL ON TABLE "public"."fact_extraction_log" TO "anon";
GRANT ALL ON TABLE "public"."fact_extraction_log" TO "authenticated";
GRANT ALL ON TABLE "public"."fact_extraction_log" TO "service_role";



GRANT ALL ON TABLE "public"."extraction_health" TO "anon";
GRANT ALL ON TABLE "public"."extraction_health" TO "authenticated";
GRANT ALL ON TABLE "public"."extraction_health" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."follow_up_queue" TO "service_role";



GRANT ALL ON TABLE "public"."generated_artifacts" TO "anon";
GRANT ALL ON TABLE "public"."generated_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."generated_artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."google_sheets_sync_log" TO "anon";
GRANT ALL ON TABLE "public"."google_sheets_sync_log" TO "authenticated";
GRANT ALL ON TABLE "public"."google_sheets_sync_log" TO "service_role";



GRANT ALL ON TABLE "public"."harness_runs" TO "anon";
GRANT ALL ON TABLE "public"."harness_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."harness_runs" TO "service_role";



GRANT ALL ON TABLE "public"."huddle_synthesis" TO "anon";
GRANT ALL ON TABLE "public"."huddle_synthesis" TO "authenticated";
GRANT ALL ON TABLE "public"."huddle_synthesis" TO "service_role";



GRANT ALL ON TABLE "public"."index_participant_data" TO "service_role";



GRANT ALL ON TABLE "public"."index_publication_rules" TO "anon";
GRANT ALL ON TABLE "public"."index_publication_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."index_publication_rules" TO "service_role";



GRANT ALL ON TABLE "public"."industry_beat_library" TO "anon";
GRANT ALL ON TABLE "public"."industry_beat_library" TO "authenticated";
GRANT ALL ON TABLE "public"."industry_beat_library" TO "service_role";



GRANT ALL ON TABLE "public"."insight_dimensions" TO "anon";
GRANT ALL ON TABLE "public"."insight_dimensions" TO "authenticated";
GRANT ALL ON TABLE "public"."insight_dimensions" TO "service_role";



GRANT ALL ON TABLE "public"."intake_submissions" TO "anon";
GRANT ALL ON TABLE "public"."intake_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."intake_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."kit_artifacts" TO "anon";
GRANT ALL ON TABLE "public"."kit_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."kit_artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."kit_builds" TO "anon";
GRANT ALL ON TABLE "public"."kit_builds" TO "authenticated";
GRANT ALL ON TABLE "public"."kit_builds" TO "service_role";



GRANT ALL ON TABLE "public"."kit_codes" TO "anon";
GRANT ALL ON TABLE "public"."kit_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."kit_codes" TO "service_role";



GRANT ALL ON TABLE "public"."kit_journey_events" TO "anon";
GRANT ALL ON TABLE "public"."kit_journey_events" TO "authenticated";
GRANT ALL ON TABLE "public"."kit_journey_events" TO "service_role";



GRANT ALL ON TABLE "public"."kit_nudges" TO "anon";
GRANT ALL ON TABLE "public"."kit_nudges" TO "authenticated";
GRANT ALL ON TABLE "public"."kit_nudges" TO "service_role";



GRANT ALL ON TABLE "public"."kit_redemptions" TO "anon";
GRANT ALL ON TABLE "public"."kit_redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."kit_redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."kit_waitlist" TO "anon";
GRANT ALL ON TABLE "public"."kit_waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."kit_waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."lead_qualification_scores" TO "service_role";



GRANT ALL ON TABLE "public"."lead_qualifications" TO "service_role";



GRANT ALL ON TABLE "public"."leader_assessments" TO "anon";
GRANT ALL ON TABLE "public"."leader_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."leader_check_ins" TO "anon";
GRANT ALL ON TABLE "public"."leader_check_ins" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_check_ins" TO "service_role";



GRANT ALL ON TABLE "public"."leader_dimension_scores" TO "anon";
GRANT ALL ON TABLE "public"."leader_dimension_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_dimension_scores" TO "service_role";



GRANT ALL ON TABLE "public"."leader_first_moves" TO "anon";
GRANT ALL ON TABLE "public"."leader_first_moves" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_first_moves" TO "service_role";



GRANT ALL ON TABLE "public"."leader_missions" TO "anon";
GRANT ALL ON TABLE "public"."leader_missions" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_missions" TO "service_role";



GRANT ALL ON TABLE "public"."leader_notification_prefs" TO "anon";
GRANT ALL ON TABLE "public"."leader_notification_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_notification_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."leader_org_scenarios" TO "anon";
GRANT ALL ON TABLE "public"."leader_org_scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_org_scenarios" TO "service_role";



GRANT ALL ON TABLE "public"."leader_progress_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."leader_progress_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_progress_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."leader_prompt_sets" TO "anon";
GRANT ALL ON TABLE "public"."leader_prompt_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_prompt_sets" TO "service_role";



GRANT ALL ON TABLE "public"."leader_risk_signals" TO "anon";
GRANT ALL ON TABLE "public"."leader_risk_signals" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_risk_signals" TO "service_role";



GRANT ALL ON TABLE "public"."leader_tensions" TO "anon";
GRANT ALL ON TABLE "public"."leader_tensions" TO "authenticated";
GRANT ALL ON TABLE "public"."leader_tensions" TO "service_role";



GRANT ALL ON TABLE "public"."leaders" TO "anon";
GRANT ALL ON TABLE "public"."leaders" TO "authenticated";
GRANT ALL ON TABLE "public"."leaders" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."ledger" TO "anon";
GRANT ALL ON TABLE "public"."ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."ledger" TO "service_role";



GRANT ALL ON TABLE "public"."live_headlines_cache" TO "anon";
GRANT ALL ON TABLE "public"."live_headlines_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."live_headlines_cache" TO "service_role";



GRANT ALL ON TABLE "public"."llm_call_log" TO "anon";
GRANT ALL ON TABLE "public"."llm_call_log" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_call_log" TO "service_role";



GRANT ALL ON TABLE "public"."llm_cost_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."llm_cost_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_cost_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."mcp_pulls" TO "anon";
GRANT ALL ON TABLE "public"."mcp_pulls" TO "authenticated";
GRANT ALL ON TABLE "public"."mcp_pulls" TO "service_role";



GRANT ALL ON TABLE "public"."mcp_tokens" TO "anon";
GRANT ALL ON TABLE "public"."mcp_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."mcp_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_prep_sessions" TO "anon";
GRANT ALL ON TABLE "public"."meeting_prep_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_prep_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."memory_edges" TO "anon";
GRANT ALL ON TABLE "public"."memory_edges" TO "authenticated";
GRANT ALL ON TABLE "public"."memory_edges" TO "service_role";



GRANT ALL ON TABLE "public"."memory_events" TO "anon";
GRANT ALL ON TABLE "public"."memory_events" TO "authenticated";
GRANT ALL ON TABLE "public"."memory_events" TO "service_role";



GRANT ALL ON TABLE "public"."memory_links" TO "anon";
GRANT ALL ON TABLE "public"."memory_links" TO "authenticated";
GRANT ALL ON TABLE "public"."memory_links" TO "service_role";



GRANT ALL ON TABLE "public"."mindmake_personal_reads" TO "service_role";



GRANT ALL ON TABLE "public"."news_trends" TO "anon";
GRANT ALL ON TABLE "public"."news_trends" TO "authenticated";
GRANT ALL ON TABLE "public"."news_trends" TO "service_role";



GRANT ALL ON TABLE "public"."north_star_daily" TO "anon";
GRANT ALL ON TABLE "public"."north_star_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."north_star_daily" TO "service_role";



GRANT ALL ON TABLE "public"."north_star_flywheel" TO "anon";
GRANT ALL ON TABLE "public"."north_star_flywheel" TO "authenticated";
GRANT ALL ON TABLE "public"."north_star_flywheel" TO "service_role";



GRANT ALL ON TABLE "public"."partner_intakes" TO "anon";
GRANT ALL ON TABLE "public"."partner_intakes" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_intakes" TO "service_role";



GRANT ALL ON TABLE "public"."partner_plans" TO "anon";
GRANT ALL ON TABLE "public"."partner_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_plans" TO "service_role";



GRANT ALL ON TABLE "public"."partner_portfolio_items" TO "anon";
GRANT ALL ON TABLE "public"."partner_portfolio_items" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_portfolio_items" TO "service_role";



GRANT ALL ON TABLE "public"."personal_pool_cache" TO "anon";
GRANT ALL ON TABLE "public"."personal_pool_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_pool_cache" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_charter" TO "anon";
GRANT ALL ON TABLE "public"."pilot_charter" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_charter" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_handoff" TO "service_role";



GRANT ALL ON TABLE "public"."post_session_reviews" TO "anon";
GRANT ALL ON TABLE "public"."post_session_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."post_session_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."pre_workshop_inputs" TO "anon";
GRANT ALL ON TABLE "public"."pre_workshop_inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."pre_workshop_inputs" TO "service_role";



GRANT ALL ON TABLE "public"."profile_insights" TO "anon";
GRANT ALL ON TABLE "public"."profile_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_insights" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_library_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."proposals" TO "anon";
GRANT ALL ON TABLE "public"."proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."proposals" TO "service_role";



GRANT ALL ON TABLE "public"."provocation_reports" TO "anon";
GRANT ALL ON TABLE "public"."provocation_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."provocation_reports" TO "service_role";



GRANT ALL ON TABLE "public"."public_index_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."public_index_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."public_index_snapshots" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."testimonials" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT("id") ON TABLE "public"."testimonials" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT("created_at") ON TABLE "public"."testimonials" TO "authenticated";



GRANT SELECT("role") ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT("role") ON TABLE "public"."testimonials" TO "authenticated";



GRANT SELECT("company") ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT("company") ON TABLE "public"."testimonials" TO "authenticated";



GRANT SELECT("permission") ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT("permission") ON TABLE "public"."testimonials" TO "authenticated";



GRANT SELECT("nps") ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT("nps") ON TABLE "public"."testimonials" TO "authenticated";



GRANT SELECT("rating") ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT("rating") ON TABLE "public"."testimonials" TO "authenticated";



GRANT SELECT("summary_line") ON TABLE "public"."testimonials" TO "anon";
GRANT SELECT("summary_line") ON TABLE "public"."testimonials" TO "authenticated";



GRANT ALL ON TABLE "public"."publishable_testimonials" TO "anon";
GRANT ALL ON TABLE "public"."publishable_testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."publishable_testimonials" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."roi_actuals" TO "service_role";



GRANT ALL ON TABLE "public"."security_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."security_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."security_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."segment_summaries" TO "anon";
GRANT ALL ON TABLE "public"."segment_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."segment_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."simulation_results" TO "anon";
GRANT ALL ON TABLE "public"."simulation_results" TO "authenticated";
GRANT ALL ON TABLE "public"."simulation_results" TO "service_role";



GRANT ALL ON TABLE "public"."skill_exports" TO "anon";
GRANT ALL ON TABLE "public"."skill_exports" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_exports" TO "service_role";



GRANT ALL ON TABLE "public"."skill_provenance" TO "anon";
GRANT ALL ON TABLE "public"."skill_provenance" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_provenance" TO "service_role";



GRANT ALL ON TABLE "public"."sort_grades" TO "anon";
GRANT ALL ON TABLE "public"."sort_grades" TO "authenticated";
GRANT ALL ON TABLE "public"."sort_grades" TO "service_role";



GRANT ALL ON TABLE "public"."sort_items" TO "anon";
GRANT ALL ON TABLE "public"."sort_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sort_items" TO "service_role";



GRANT ALL ON TABLE "public"."strategy_addendum" TO "anon";
GRANT ALL ON TABLE "public"."strategy_addendum" TO "authenticated";
GRANT ALL ON TABLE "public"."strategy_addendum" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_events_processed" TO "anon";
GRANT ALL ON TABLE "public"."stripe_events_processed" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_events_processed" TO "service_role";



GRANT ALL ON TABLE "public"."suggested_briefing_interests" TO "anon";
GRANT ALL ON TABLE "public"."suggested_briefing_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."suggested_briefing_interests" TO "service_role";



GRANT ALL ON TABLE "public"."training_material" TO "anon";
GRANT ALL ON TABLE "public"."training_material" TO "authenticated";
GRANT ALL ON TABLE "public"."training_material" TO "service_role";



GRANT ALL ON TABLE "public"."tts_config" TO "anon";
GRANT ALL ON TABLE "public"."tts_config" TO "authenticated";
GRANT ALL ON TABLE "public"."tts_config" TO "service_role";



GRANT ALL ON TABLE "public"."tts_quality_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."unified_profiles" TO "anon";
GRANT ALL ON TABLE "public"."unified_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_briefing_directives" TO "anon";
GRANT ALL ON TABLE "public"."user_briefing_directives" TO "authenticated";
GRANT ALL ON TABLE "public"."user_briefing_directives" TO "service_role";



GRANT ALL ON TABLE "public"."user_business_context" TO "service_role";



GRANT ALL ON TABLE "public"."user_decisions" TO "anon";
GRANT ALL ON TABLE "public"."user_decisions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_decisions" TO "service_role";



GRANT ALL ON TABLE "public"."user_memory_budget" TO "anon";
GRANT ALL ON TABLE "public"."user_memory_budget" TO "authenticated";
GRANT ALL ON TABLE "public"."user_memory_budget" TO "service_role";



GRANT ALL ON TABLE "public"."user_patterns" TO "anon";
GRANT ALL ON TABLE "public"."user_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."user_patterns" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."velocity_events" TO "service_role";



GRANT ALL ON TABLE "public"."voice_instrumentation" TO "service_role";



GRANT ALL ON TABLE "public"."voice_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."voting_results" TO "anon";
GRANT ALL ON TABLE "public"."voting_results" TO "authenticated";
GRANT ALL ON TABLE "public"."voting_results" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."working_group_inputs" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."working_group_inputs" TO "authenticated";
GRANT ALL ON TABLE "public"."working_group_inputs" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_events" TO "anon";
GRANT ALL ON TABLE "public"."workshop_events" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_events" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_questions" TO "anon";
GRANT ALL ON TABLE "public"."workshop_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_questions" TO "service_role";



GRANT ALL ON TABLE "public"."workshop_sessions" TO "anon";
GRANT ALL ON TABLE "public"."workshop_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."workshop_sessions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




