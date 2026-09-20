param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'
$isolatedProjectRef = 'cgkcplcamsijghalintq'
$productionProjectRef = 'bkyuxvschuwngtcdhsyg'
$migrationVersions = @(
  '20260918203434', '20260918205907', '20260918210105', '20260918224000', '20260918225000',
  '20260918232000', '20260918232500', '20260918233000', '20260918233500', '20260918234000',
  '20260918234500', '20260919090000', '20260919100000'
)
$migrationFiles = @(
  '20260918203434_standard_change_candidate_pipeline.sql',
  '20260918205907_standard_change_source_manifest_fix.sql',
  '20260918210105_standard_change_source_identity_fix.sql',
  '20260918224000_standard_change_nonretryable_stale_source.sql',
  '20260918225000_standard_change_trigger_acl.sql',
  '20260918232000_standard_change_stage_exclusivity.sql',
  '20260918232500_standard_change_frozen_source_binding.sql',
  '20260918233000_standard_change_holdout_exclusion_receipt.sql',
  '20260918233500_standard_change_binding_alias_fix.sql',
  '20260918234000_standard_change_binding_loop_fix.sql',
  '20260918234500_standard_change_binding_cast_fix.sql',
  '20260919090000_standard_change_proposal_type_binding_fix.sql',
  '20260919100000_standard_change_opportunity_packet_fix.sql'
)

if ($ProjectRef -ne $isolatedProjectRef -or $ProjectRef -eq $productionProjectRef) {
  throw 'R115 restore is pinned to the isolated Legibility project only.'
}

foreach ($migrationFile in $migrationFiles) {
  $migrationPath = Join-Path (Join-Path $PSScriptRoot '..\supabase\migrations') $migrationFile
  if (-not (Test-Path -LiteralPath $migrationPath -PathType Leaf)) { throw "Missing migration $migrationFile." }
  & npx supabase db query --linked --project-ref $ProjectRef --file $migrationPath --output-format json | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to apply migration $migrationFile." }
}

& npx supabase migration repair @migrationVersions --status applied --linked --project-ref $ProjectRef --yes --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to record R115 migration history.' }

$capabilityBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($capabilityBytes) } finally { $rng.Dispose() }
$capability = -join ($capabilityBytes | ForEach-Object { $_.ToString('x2') })
try {
  & npx supabase secrets set "STANDARD_CHANGE_PIPELINE_RPC_SECRET=$capability" --project-ref $ProjectRef --output-format json | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Failed to restore the Edge capability secret.' }
  $vaultSql = "select vault.create_secret('$capability','standard_change_pipeline_rpc_secret','R115 stage RPC capability') as secret_id;"
  & npx supabase db query --linked --project-ref $ProjectRef --output-format json $vaultSql | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Failed to restore the Vault capability secret.' }
} finally {
  $capability = $null
  [Array]::Clear($capabilityBytes, 0, $capabilityBytes.Length)
}

foreach ($functionName in @('compile-standard-change', 'build-standard-change', 'check-standard-change')) {
  & npx supabase functions deploy $functionName --project-ref $ProjectRef --use-api --yes | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to deploy Edge function $functionName." }
}

$identityScript = Join-Path $PSScriptRoot 'verify-ctrl-g25-standard-change-r115-deployment.mjs'
$identityRaw = & node $identityScript
if ($LASTEXITCODE -ne 0) { throw 'Restored Edge bundles do not match the frozen reviewed source manifest.' }
$deploymentIdentity = $identityRaw | ConvertFrom-Json
if (-not $deploymentIdentity.inventory_stable_during_download -or
    @($deploymentIdentity.functions).Count -ne 3 -or
    @($deploymentIdentity.downloaded_sources | Where-Object {
      -not $_.exact_downloaded_source_match -or -not $_.exact_local_source_match -or $_.exact_file_count -ne 5
    }).Count -ne 0) {
  throw 'Restored Edge bundle identity readback is incomplete.'
}

$readbackSql = "select (select count(*) from information_schema.tables where table_schema='public' and table_name like 'standard_change_%')::int as candidate_tables, (select count(*) from pg_proc join pg_namespace on pg_namespace.oid=pg_proc.pronamespace where pg_namespace.nspname='public' and pg_proc.proname in ('reserve_standard_change_compile','finalize_standard_change_compile','reserve_standard_change_build','finalize_standard_change_build','reserve_standard_change_check','finalize_standard_change_check','fail_standard_change_stage'))::int as stage_rpcs, (select count(*) from vault.secrets where name='standard_change_pipeline_rpc_secret')::int as vault_capability_secrets, (select count(*) from supabase_migrations.schema_migrations where version = any(array['20260918203434','20260918205907','20260918210105','20260918224000','20260918225000','20260918232000','20260918232500','20260918233000','20260918233500','20260918234000','20260918234500','20260919090000','20260919100000']))::int as migration_history_rows;"
$databaseRaw = & npx supabase db query --linked --project-ref $ProjectRef --output-format json $readbackSql
if ($LASTEXITCODE -ne 0) { throw 'Failed to read back restored database state.' }
$database = ($databaseRaw | ConvertFrom-Json).rows[0]
$functions = (npx supabase functions list --project-ref $ProjectRef --output-format json | ConvertFrom-Json).functions
$active = @($functions | Where-Object { $_.slug -in @('compile-standard-change','build-standard-change','check-standard-change') -and $_.status -eq 'ACTIVE' }).Count

if ($database.candidate_tables -ne 5 -or $database.stage_rpcs -ne 7 -or
    $database.vault_capability_secrets -ne 1 -or $database.migration_history_rows -ne $migrationVersions.Count -or
    $active -ne 3) {
  throw 'Restore readback is incomplete.'
}

[ordered]@{
  status = 'restored'
  project_ref = $ProjectRef
  database = $database
  active_edge_functions = $active
  deployment_identity = $deploymentIdentity
  edge_capability_secret_present = $true
  secret_value_printed_or_persisted = $false
} | ConvertTo-Json -Depth 5
