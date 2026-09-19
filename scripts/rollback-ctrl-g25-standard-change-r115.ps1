param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef,
  [switch]$Execute
)

$ErrorActionPreference = 'Stop'
$isolatedProjectRef = 'cgkcplcamsijghalintq'
$productionProjectRef = 'bkyuxvschuwngtcdhsyg'
$functionNames = @('compile-standard-change', 'build-standard-change', 'check-standard-change')
$migrationVersions = @(
  '20260918203434', '20260918205907', '20260918210105', '20260918224000', '20260918225000',
  '20260918232000', '20260918232500', '20260918233000', '20260918233500', '20260918234000',
  '20260918234500', '20260919090000', '20260919100000'
)
$rollbackPath = Join-Path $PSScriptRoot 'rollback-ctrl-g25-standard-change-r115.sql'

if ($ProjectRef -ne $isolatedProjectRef -or $ProjectRef -eq $productionProjectRef) {
  throw "R115 rollback is pinned to the isolated Legibility project only."
}
if (-not (Test-Path -LiteralPath $rollbackPath -PathType Leaf)) {
  throw "R115 rollback SQL is missing."
}

if (-not $Execute) {
  [ordered]@{
    status = 'plan_only'
    project_ref = $ProjectRef
    delete_functions = $functionNames
    unset_edge_secret = 'STANDARD_CHANGE_PIPELINE_RPC_SECRET'
    apply_database_rollback = $rollbackPath
    revert_migration_history = $migrationVersions
    source_config_requires_git_revert = $true
  } | ConvertTo-Json -Depth 4
  exit 0
}

$deployedRaw = & npx supabase functions list --project-ref $ProjectRef --output-format json
if ($LASTEXITCODE -ne 0) { throw 'Failed to inventory Edge functions before rollback.' }
$deployed = ($deployedRaw | ConvertFrom-Json).functions
foreach ($functionName in $functionNames) {
  if (@($deployed | Where-Object { $_.slug -eq $functionName }).Count -gt 0) {
    & npx supabase functions delete $functionName --project-ref $ProjectRef --yes --output-format json | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Failed to delete Edge function $functionName." }
  }
}

$secretsRaw = & npx supabase secrets list --project-ref $ProjectRef --output-format json
if ($LASTEXITCODE -ne 0) { throw 'Failed to inventory Edge secrets before rollback.' }
$secrets = ($secretsRaw | ConvertFrom-Json).secrets
if (@($secrets | Where-Object { $_.name -eq 'STANDARD_CHANGE_PIPELINE_RPC_SECRET' }).Count -gt 0) {
  & npx supabase secrets unset STANDARD_CHANGE_PIPELINE_RPC_SECRET --project-ref $ProjectRef --yes --output-format json | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Failed to remove the Edge capability secret.' }
}

& npx supabase db query --linked --project-ref $ProjectRef --file $rollbackPath --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to apply the database rollback.' }

& npx supabase migration repair @migrationVersions --status reverted --linked --project-ref $ProjectRef --yes --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to revert R115 migration history.' }

$migrationVersionSql = ($migrationVersions | ForEach-Object { "'$_'" }) -join ','
$readbackSql = "select (select count(*) from information_schema.tables where table_schema='public' and table_name like 'standard_change_%')::int as candidate_tables, (select count(*) from pg_proc join pg_namespace on pg_namespace.oid=pg_proc.pronamespace where pg_namespace.nspname='public' and pg_proc.proname like '%standard_change%')::int as candidate_functions, (select count(*) from vault.secrets where name='standard_change_pipeline_rpc_secret')::int as vault_capability_secrets, (select count(*) from supabase_migrations.schema_migrations where version = any(array[$migrationVersionSql]))::int as migration_history_rows;"
$databaseReadbackRaw = & npx supabase db query --linked --project-ref $ProjectRef --output-format json $readbackSql
if ($LASTEXITCODE -ne 0) { throw 'Failed to read back database rollback state.' }
$databaseReadback = ($databaseReadbackRaw | ConvertFrom-Json).rows[0]

$functionsRaw = & npx supabase functions list --project-ref $ProjectRef --output-format json
if ($LASTEXITCODE -ne 0) { throw 'Failed to read back Edge functions.' }
$functions = ($functionsRaw | ConvertFrom-Json).functions
$remainingFunctions = @($functions | Where-Object { $_.slug -in $functionNames }).Count

if ($databaseReadback.candidate_tables -ne 0 -or
    $databaseReadback.candidate_functions -ne 0 -or
    $databaseReadback.vault_capability_secrets -ne 0 -or
    $databaseReadback.migration_history_rows -ne 0 -or
    $remainingFunctions -ne 0) {
  throw 'Rollback readback is not clean.'
}

[ordered]@{
  status = 'rolled_back'
  project_ref = $ProjectRef
  edge_functions_remaining = $remainingFunctions
    database = $databaseReadback
    migration_versions_reverted = $migrationVersions.Count
  edge_secret_unset = $true
  source_config_requires_git_revert = $true
} | ConvertTo-Json -Depth 6
