param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'
$isolatedProjectRef = 'cgkcplcamsijghalintq'
$productionProjectRef = 'bkyuxvschuwngtcdhsyg'
$migrationVersion = '20260920190000'
$rollbackPath = Join-Path $PSScriptRoot 'rollback-ctrl-g25-owner-operator-projection-binding-r130.sql'
$readbackPath = Join-Path (Join-Path $PSScriptRoot '..\supabase\tests\database') 'g25_owner_operator_projection_binding_r130_rollback_readback.sql'

if ($ProjectRef -ne $isolatedProjectRef -or $ProjectRef -eq $productionProjectRef) {
  throw 'R130 rollback is pinned to the isolated Legibility project only.'
}
if (-not (Test-Path -LiteralPath $rollbackPath -PathType Leaf)) {
  throw 'R130 rollback SQL is missing.'
}
if (-not (Test-Path -LiteralPath $readbackPath -PathType Leaf)) {
  throw 'R130 rollback readback SQL is missing.'
}

& npx supabase db query --linked --project-ref $ProjectRef --file $rollbackPath --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to roll back the R130 database objects.' }

& npx supabase migration repair $migrationVersion --status reverted --linked --project-ref $ProjectRef --yes --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to revert R130 migration history.' }

$readbackRaw = & npx supabase db query --linked --project-ref $ProjectRef --file $readbackPath --output-format json
if ($LASTEXITCODE -ne 0) { throw 'Failed to read back R130 rollback state.' }
$readback = ($readbackRaw | ConvertFrom-Json).rows[0].result

if ($readback.binding_columns -ne 0 -or $readback.binding_rpc -or
    -not $readback.four_field_scope_constraint -or
    $readback.r127_operator_tables -ne 2 -or $readback.r127_projection_columns -ne 4 -or
    -not $readback.r127_receipt_table -or -not $readback.r127_operator_rpc -or
    -not $readback.r123_owner_queue -or $readback.r115_tables -ne 5 -or
    $readback.migration_history_rows -ne 0) {
  throw 'R130 rollback left residue or damaged a predecessor.'
}

[ordered]@{
  status = 'rolled_back'
  project_ref = $ProjectRef
  readback = $readback
  r115_preserved = $true
  r123_owner_queue_preserved = $true
  r127_operator_membrane_preserved = $true
  production_writes = 0
} | ConvertTo-Json -Depth 5
