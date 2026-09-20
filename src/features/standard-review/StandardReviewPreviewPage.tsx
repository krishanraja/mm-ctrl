import { useEffect, useMemo } from 'react'
import { StandardReviewExperience } from './StandardReviewExperience'
import { standardReviewPreparedFixture } from './fixture'
import { StandardReviewGateway, type StandardReviewFunctionInvoker } from './gateway'

const UUID = '11111111-1111-4111-8111-111111111111'
const SHA = 'a'.repeat(64)

type PreviewState = 'ready' | 'long' | 'error' | 'incomplete' | 'stale'

function previewState(): PreviewState {
  const requested = new URLSearchParams(window.location.search).get('state')
  return requested === 'long' || requested === 'error' || requested === 'incomplete' || requested === 'stale'
    ? requested
    : 'ready'
}

function preparedFixture(state: PreviewState) {
  const fixture = structuredClone(standardReviewPreparedFixture)
  if (state === 'long') {
    fixture.result.packet.presentation.proposed_rule = 'Review proposals above £250,000, changes to the company promise and work supported by only one unverified source. The team can send the rest when the customer result, evidence source, accountable owner and stop condition are named.'
  }
  if (state === 'incomplete') fixture.result.packet.presentation.evidence[0].statement = ''
  return fixture
}

function previewInvoker(state: PreviewState): StandardReviewFunctionInvoker {
  return {
    async invoke(_functionName, options) {
      await new Promise((resolve) => window.setTimeout(resolve, 120))
      if (options.body.action === 'prepare') {
        if (state === 'error') return { data: null, error: { message: 'offline' } }
        return { data: preparedFixture(state), error: null }
      }
      if (state === 'stale') return { data: null, error: { message: 'state_conflict', code: 'state_conflict' } }
      if (options.body.action === 'decide') {
        if (options.body.decision === 'rejected') {
          return {
            data: {
              action: 'decide',
              result: {
                decision: 'rejected',
                application_id: null,
                active_standard_mutated: false,
                deploy_authorized: false,
                release_authorized: false,
              },
            },
            error: null,
          }
        }
        return {
          data: {
            action: 'decide',
            result: {
              decision: 'approved',
              application_id: UUID,
              application_hash: SHA,
              active_standard_sha256: SHA,
              reversible_while_current_head: true,
              deploy_authorized: false,
              release_authorized: false,
            },
          },
          error: null,
        }
      }
      return {
        data: {
          action: 'reverse',
          result: {
            restored: true,
            reversal_id: UUID,
            reversal_hash: SHA,
            active_standard_sha256: SHA,
            deploy_authorized: false,
            release_authorized: false,
          },
        },
        error: null,
      }
    },
  }
}

export default function StandardReviewPreviewPage() {
  const state = previewState()
  const gateway = useMemo(() => new StandardReviewGateway(previewInvoker(state)), [state])

  useEffect(() => {
    const previousTitle = document.title
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const robots = existingRobots ?? document.createElement('meta')
    const previousRobots = existingRobots?.content
    if (!existingRobots) {
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    document.title = 'Standard review · synthetic product proof'
    robots.content = 'noindex,nofollow,noarchive'
    return () => {
      document.title = previousTitle
      if (existingRobots && previousRobots !== undefined) robots.content = previousRobots
      else robots.remove()
    }
  }, [])

  return (
    <StandardReviewExperience
      gateway={gateway}
      checkId={UUID}
      expectedResultSha256={SHA}
      subjectName="Maya Chen"
      organisation="Aperture House · synthetic"
      proofLabel="Synthetic preview. No data is saved."
      createRequestId={(action) => `r118_${action}_request_0001`}
    />
  )
}
