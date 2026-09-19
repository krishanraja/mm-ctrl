param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef,
  [switch]$Execute
)

$ErrorActionPreference = 'Stop'
$isolatedProjectRef = 'cgkcplcamsijghalintq'
$productionProjectRef = 'bkyuxvschuwngtcdhsyg'
$migrationVersion = '20260919110000'
$functionName = 'review-standard-change'
$rollbackPath = Join-Path $PSScriptRoot 'rollback-ctrl-g25-standard-change-r116.sql'

if ($ProjectRef -ne $isolatedProjectRef -or $ProjectRef -eq $productionProjectRef) {
  throw 'R116 rollback is pinned to the isolated Legibility project only.'
}
if (-not (Test-Path -LiteralPath $rollbackPath -PathType Leaf)) {
  throw 'R116 rollback SQL is missing.'
}

if (-not $Execute) {
  [ordered]@{
    status = 'plan_only'
    project_ref = $ProjectRef
    delete_function = $functionName
    apply_database_rollback = $rollbackPath
    revert_migration_history = $migrationVersion
    preserves_r115 = $true
    unknown_later_head_policy = 'fail_closed'
  } | ConvertTo-Json -Depth 4
  exit 0
}

& npx supabase db query --linked --project-ref $ProjectRef --file $rollbackPath --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to apply the R116 database rollback.' }

& npx supabase migration repair $migrationVersion --status reverted --linked --project-ref $ProjectRef --yes --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to revert R116 migration history.' }

# Delete the route only after the transactional database preflight and rollback
# have succeeded. A later-head refusal must leave the live route untouched.
$deployedRaw = & npx supabase functions list --project-ref $ProjectRef --output-format json
if ($LASTEXITCODE -ne 0) { throw 'Failed to inventory Edge functions before R116 route removal.' }
$deployed = ($deployedRaw | ConvertFrom-Json).functions
if (@($deployed | Where-Object { $_.slug -eq $functionName }).Count -gt 0) {
  & npx supabase functions delete $functionName --project-ref $ProjectRef --yes --output-format json | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Failed to delete the R116 Edge function.' }
}

$readbackSql = "select (select count(*) from information_schema.tables where table_schema='public' and table_name in ('standard_change_review_packets','standard_change_owner_decisions','standard_change_applications','standard_change_reversals','standard_versions'))::int as r116_tables, (select count(*) from pg_proc join pg_namespace on pg_namespace.oid=pg_proc.pronamespace where pg_namespace.nspname='public' and pg_proc.proname in ('prepare_standard_change_review','decide_standard_change_review','reverse_standard_change_application','standard_change_json_sha256','standard_change_text_sha256','current_standard_criteria_snapshot','render_governed_standard_body'))::int as r116_functions, (select count(*) from information_schema.tables where table_schema='public' and table_name in ('standard_change_requests','standard_change_stage_runs','standard_change_compilations','standard_change_builds','standard_change_checks'))::int as r115_tables, (select count(*) from supabase_migrations.schema_migrations where version='$migrationVersion')::int as migration_history_rows;"
$databaseRaw = & npx supabase db query --linked --project-ref $ProjectRef --output-format json $readbackSql
if ($LASTEXITCODE -ne 0) { throw 'Failed to read back the R116 rollback state.' }
$database = ($databaseRaw | ConvertFrom-Json).rows[0]
$functionsRaw = & npx supabase functions list --project-ref $ProjectRef --output-format json
if ($LASTEXITCODE -ne 0) { throw 'Failed to read back Edge functions after R116 rollback.' }
$functions = ($functionsRaw | ConvertFrom-Json).functions
$r116Edge = @($functions | Where-Object { $_.slug -eq $functionName }).Count
$r115Edge = @($functions | Where-Object { $_.slug -in @('compile-standard-change','build-standard-change','check-standard-change') -and $_.status -eq 'ACTIVE' }).Count

if ($database.r116_tables -ne 0 -or $database.r116_functions -ne 0 -or
    $database.r115_tables -ne 5 -or $database.migration_history_rows -ne 0 -or
    $r116Edge -ne 0 -or $r115Edge -ne 3) {
  throw 'R116 rollback readback is incomplete or R115 was damaged.'
}

[ordered]@{
  status = 'rolled_back'
  project_ref = $ProjectRef
  database = $database
  r116_edge_functions_remaining = $r116Edge
  r115_active_edge_functions = $r115Edge
  r115_preserved = $true
} | ConvertTo-Json -Depth 5
