param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'
$isolatedProjectRef = 'cgkcplcamsijghalintq'
$productionProjectRef = 'bkyuxvschuwngtcdhsyg'
$migrationVersion = '20260920190000'
$migrationPath = Join-Path (Join-Path $PSScriptRoot '..\supabase\migrations') '20260920190000_owner_operator_projection_binding.sql'
$probePath = Join-Path $PSScriptRoot 'probe-ctrl-g25-owner-operator-projection-migration-r130.mjs'

if ($ProjectRef -ne $isolatedProjectRef -or $ProjectRef -eq $productionProjectRef) {
  throw 'R130 restore is pinned to the isolated Legibility project only.'
}
if (-not (Test-Path -LiteralPath $migrationPath -PathType Leaf)) {
  throw 'R130 migration is missing.'
}
if (-not (Test-Path -LiteralPath $probePath -PathType Leaf)) {
  throw 'R130 readback probe is missing.'
}

& npx supabase db query --linked --project-ref $ProjectRef --file $migrationPath --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to apply the R130 migration.' }

& npx supabase migration repair $migrationVersion --status applied --linked --project-ref $ProjectRef --yes --output-format json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to record R130 migration history.' }

$probeRaw = & node $probePath
if ($LASTEXITCODE -ne 0) { throw 'R130 restored catalogue readback failed.' }
$probe = $probeRaw | ConvertFrom-Json
if ($probe.status -ne 'passed' -or $probe.project_ref -ne $ProjectRef -or
    $probe.database.migration_history_rows -ne 1 -or
    $probe.hosted_fixture_residue -ne 0) {
  throw 'R130 restored state is incomplete.'
}

[ordered]@{
  status = 'restored'
  project_ref = $ProjectRef
  catalogue_sha256 = $probe.catalogue_sha256
  database = $probe.database
  production_writes = 0
} | ConvertTo-Json -Depth 6
