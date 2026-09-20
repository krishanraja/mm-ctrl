param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'
$isolatedProjectRef = 'cgkcplcamsijghalintq'
$productionProjectRef = 'bkyuxvschuwngtcdhsyg'
$migrationVersion = '20260919110000'
$migrationPath = Join-Path (Join-Path $PSScriptRoot '..\supabase\migrations') '20260919110000_standard_change_owner_apply_reversal.sql'
$functionName = 'review-standard-change'

if ($ProjectRef -ne $isolatedProjectRef -or $ProjectRef -eq $productionProjectRef) {
  throw 'R116 restore is pinned to the isolated Legibility project only.'
}
if (-not (Test-Path -LiteralPath $migrationPath -PathType Leaf)) {
  throw 'R116 migration is missing.'
}

& npx supabase db query --linked --project-ref $ProjectRef --file $migrationPath --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to apply the R116 migration.' }
& npx supabase migration repair $migrationVersion --status applied --linked --project-ref $ProjectRef --yes --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to record R116 migration history.' }

& npx supabase functions deploy $functionName --project-ref $ProjectRef --use-api --yes | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to deploy the R116 Edge function.' }

$readbackSql = "select (select count(*) from information_schema.tables where table_schema='public' and table_name in ('standard_change_review_packets','standard_change_owner_decisions','standard_change_applications','standard_change_reversals','standard_versions'))::int as r116_tables, (select count(*) from pg_proc join pg_namespace on pg_namespace.oid=pg_proc.pronamespace where pg_namespace.nspname='public' and pg_proc.proname in ('prepare_standard_change_review','decide_standard_change_review','reverse_standard_change_application'))::int as owner_rpcs, (select count(*) from information_schema.tables where table_schema='public' and table_name in ('standard_change_requests','standard_change_stage_runs','standard_change_compilations','standard_change_builds','standard_change_checks'))::int as r115_tables, (select count(*) from supabase_migrations.schema_migrations where version='$migrationVersion')::int as migration_history_rows;"
$databaseRaw = & npx supabase db query --linked --project-ref $ProjectRef --output-format json $readbackSql
if ($LASTEXITCODE -ne 0) { throw 'Failed to read back the R116 restore state.' }
$database = ($databaseRaw | ConvertFrom-Json).rows[0]
$functions = (npx supabase functions list --project-ref $ProjectRef --output-format json | ConvertFrom-Json).functions
$r116Edge = @($functions | Where-Object { $_.slug -eq $functionName -and $_.status -eq 'ACTIVE' -and $_.verify_jwt -eq $true }).Count
$r115Edge = @($functions | Where-Object { $_.slug -in @('compile-standard-change','build-standard-change','check-standard-change') -and $_.status -eq 'ACTIVE' }).Count

if ($database.r116_tables -ne 5 -or $database.owner_rpcs -ne 3 -or
    $database.r115_tables -ne 5 -or $database.migration_history_rows -ne 1 -or
    $r116Edge -ne 1 -or $r115Edge -ne 3) {
  throw 'R116 restore readback is incomplete or R115 was damaged.'
}

[ordered]@{
  status = 'restored'
  project_ref = $ProjectRef
  database = $database
  r116_active_edge_functions = $r116Edge
  r115_active_edge_functions = $r115Edge
  r115_preserved = $true
} | ConvertTo-Json -Depth 5
