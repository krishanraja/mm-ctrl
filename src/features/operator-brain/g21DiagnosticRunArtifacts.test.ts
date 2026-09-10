import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  adjudicateSealedCouncil,
  validateSealedCouncil,
  type JudgeRuling,
} from './rangeCouncilContract'
import {
  validateG21DiagnosticRun,
  type G21BlindDiagnosticInput,
  type G21DiagnosticRunOutput,
} from './g21DiagnosticCanary'

const RUNS_ROOT = join(
  process.cwd(),
  'project-documentation',
  'ctrl-evolution',
  'runs',
)

function bytes(path: string): Buffer {
  return readFileSync(path)
}

function json<T>(path: string): T {
  return JSON.parse(bytes(path).toString('utf8')) as T
}

function sha256(path: string): string {
  return createHash('sha256').update(bytes(path)).digest('hex')
}

function runPath(run: string, ...parts: string[]): string {
  return join(RUNS_ROOT, run, ...parts)
}

function rulings(run: string): JudgeRuling[] {
  const directory = runPath(run, 'judges')
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => json<JudgeRuling>(join(directory, file)))
}

describe('G21 diagnostic run artifacts', () => {
  it('preserves run 001 as a schema-valid diagnostic that the council blocked', () => {
    const run = 'g21-public-row-run-001'
    const input = json<G21BlindDiagnosticInput[]>(runPath(run, 'input.json'))
    const output = json<G21DiagnosticRunOutput>(runPath(run, 'output.json'))
    const sealed = rulings(run)

    expect(sha256(runPath(run, 'input.json'))).toBe(
      'f1b5ce1038df1a6d786a6ccd011e4f965027a5b1999c242753712045991af50a',
    )
    expect(sha256(runPath(run, 'output.json'))).toBe(
      '70497310ec7a27865115f0ac5eba79a092ff1695c04aa04757dfc807bb4d461f',
    )
    expect(validateG21DiagnosticRun(input, output)).toEqual([])
    expect(validateSealedCouncil(sealed)).toEqual([])
    expect(adjudicateSealedCouncil(sealed)).toEqual({
      status: 'blocked',
      vetoes: [
        {
          ruleId: 'COMPREHENSION-G21-01',
          failure:
            'The main decision questions for RANGE-PUBLIC-02 and RANGE-PUBLIC-03 are not intelligible to the stated non-technical audience without specialist interpretation.',
          resolvingTest:
            'Rewrite each main frame and question in plain language, then verify that a bright 12-year-old can state what is known, what matters and what single answer is requested without help defining business or finance terms.',
        },
      ],
    })
    expect(
      json<{ finding: string }>(runPath(run, 'standards-prosecutor.json')).finding,
    ).toBe('confirmed_block')
    expect(json<{ additive: boolean }>(runPath(run, 'founder-calibration.json')).additive).toBe(
      true,
    )
  })

  it('requires run 002 to resolve the veto without losing another council truth', () => {
    const run = 'g21-public-row-run-002'
    const input = json<G21BlindDiagnosticInput[]>(runPath(run, 'input.json'))
    const outputPath = runPath(run, 'output.json')
    const output = json<G21DiagnosticRunOutput>(outputPath)
    const sealed = rulings(run)
    const outputHash = sha256(outputPath)

    expect(sha256(runPath(run, 'input.json'))).toBe(
      '7740f054205cc6284fadadf406d4735e98dfae04ba29e4bef4201af709e5242b',
    )
    expect(outputHash).toBe('86e254ae88f56e7da05a43fb6cc251fa38b2b36cd9423269b849f65f48924d52')
    expect(validateG21DiagnosticRun(input, output)).toEqual([])
    expect(validateSealedCouncil(sealed)).toEqual([])

    for (const ruling of sealed) {
      expect(ruling.artifactHash.toLowerCase()).toBe(`sha256:${outputHash}`)
      expect(ruling.theoryPackHash.toLowerCase()).toBe(
        `sha256:${sha256(runPath(run, 'judge-packs', `${ruling.judge}.json`))}`,
      )
    }

    expect(adjudicateSealedCouncil(sealed)).toEqual({ status: 'passed' })
    expect(
      json<{ finding: string }>(runPath(run, 'standards-prosecutor.json')).finding,
    ).toBe('confirmed_pass')
  })
})
