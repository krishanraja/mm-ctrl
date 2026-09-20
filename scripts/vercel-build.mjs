import { spawnSync } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const script = process.env.VERCEL_ENV === 'preview' ? 'build:vercel-preview' : 'build'

console.log(`[vercel-build] environment=${process.env.VERCEL_ENV ?? 'unknown'} script=${script}`)

const result = spawnSync(npm, ['run', script], {
  env: process.env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
