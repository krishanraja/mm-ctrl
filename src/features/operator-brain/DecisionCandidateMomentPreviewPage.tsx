import { useEffect } from 'react'
import { DecisionCandidateMoment } from './DecisionCandidateMoment'
import type { DecisionCandidateProjection } from './decisionCandidateProjectionGateway'

const candidateId = '14700000-0000-4000-8000-000000000001'

const minimalProjection: DecisionCandidateProjection = {
  candidate: {
    id: candidateId,
    standing: 'proposed',
    claim: 'The plan assumes customers will change more slowly than the category.',
    proposedAt: '2026-09-25T06:00:00.000Z',
  },
  question: { id: '14700000-0000-4000-8000-000000000002' },
  basis: null,
}

const fullProjection: DecisionCandidateProjection = {
  ...minimalProjection,
  basis: {
    sourceType: 'external_research',
    capturedAt: '2026-09-24T16:40:00.000Z',
    epistemicBasis: 'external_claim',
    sourceText: 'Three major customers adopted AI-led category research within one quarter, while the current plan assumes an eighteen-month shift.',
  },
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export default function DecisionCandidateMomentPreviewPage() {
  useEffect(() => {
    const previousTitle = document.title
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const robots = existingRobots ?? document.createElement('meta')
    const previousRobots = existingRobots?.content
    if (!existingRobots) {
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    document.title = 'Candidate confirmation · synthetic CTRL proof'
    robots.content = 'noindex,nofollow,noarchive'
    return () => {
      document.title = previousTitle
      if (existingRobots && previousRobots !== undefined) robots.content = previousRobots
      else robots.remove()
    }
  }, [])

  return (
    <main className="dcm-preview">
      <DecisionCandidateMoment
        candidateId={candidateId}
        load={async (_id, includeBasis) => {
          await wait(40)
          return includeBasis ? fullProjection : minimalProjection
        }}
        review={async () => {
          await wait(80)
          return { saved: true }
        }}
        makeRequestId={() => `r147-preview-${crypto.randomUUID()}`}
      />
      <div className="dcm-preview-proof">Synthetic proof · no data is saved</div>
    </main>
  )
}
