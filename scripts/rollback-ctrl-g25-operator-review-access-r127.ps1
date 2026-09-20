param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'
$isolatedProjectRef = 'cgkcplcamsijghalintq'
$productionProjectRef = 'bkyuxvschuwngtcdhsyg'
$migrationVersion = '20260920170000'
$rollbackPath = Join-Path $PSScriptRoot 'rollback-ctrl-g25-operator-review-access-r127.sql'
$readbackPath = Join-Path (Join-Path $PSScriptRoot '..\supabase\tests\database') 'g25_operator_review_access_r127_rollback_readback.sql'

if ($ProjectRef -ne $isolatedProjectRef -or $ProjectRef -eq $productionProjectRef) {
  throw 'R127 rollback is pinned to the isolated Legibility project only.'
}
if (-not (Test-Path -LiteralPath $rollbackPath -PathType Leaf)) {
  throw 'R127 rollback SQL is missing.'
}
if (-not (Test-Path -LiteralPath $readbackPath -PathType Leaf)) {
  throw 'R127 rollback readback SQL is missing.'
}

& npx supabase db query --linked --project-ref $ProjectRef --file $rollbackPath --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to roll back the R127 database objects.' }

& npx supabase migration repair $migrationVersion --status reverted --linked --project-ref $ProjectRef --yes --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to revert R127 migration history.' }

$readbackRaw = & npx supabase db query --linked --project-ref $ProjectRef --file $readbackPath --output-format json
if ($LASTEXITCODE -ne 0) { throw 'Failed to read back R127 rollback state.' }
$readback = ($readbackRaw | ConvertFrom-Json).rows[0].result

if ($readback.operator_tables -ne 0 -or $readback.review_projection_columns -ne 0 -or
    $readback.access_receipt_table -or $readback.operator_rpc -or
    $readback.migration_history_rows -ne 0 -or -not $readback.owner_queue_v4 -or
    $readback.r115_tables -ne 5) {
  throw 'R127 rollback left residue.'
}

[ordered]@{
  status = 'rolled_back'
  project_ref = $ProjectRef
  readback = $readback
  r115_preserved = $true
  r123_owner_queue_preserved = $true
  production_writes = 0
} | ConvertTo-Json -Depth 5
