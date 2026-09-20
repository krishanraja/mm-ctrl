import { useMemo } from 'react'
import { StandardReviewExperience } from './StandardReviewExperience'
import { createAddressedStandardReviewGateway } from './addressGateway'
import type { StandardReviewFunctionInvoker } from './gateway'

const SENTINEL_SHA = '0'.repeat(64)

interface StandardReviewAddressExperienceProps {
  invoker: StandardReviewFunctionInvoker
  reviewPacketId: string
  subjectName?: string
  organisation?: string
  proofLabel?: string
}

export function StandardReviewAddressExperience({
  invoker,
  reviewPacketId,
  subjectName = 'Your Brain',
  organisation = 'Private standard review',
  proofLabel,
}: StandardReviewAddressExperienceProps) {
  const gateway = useMemo(
    () => createAddressedStandardReviewGateway(invoker, reviewPacketId),
    [invoker, reviewPacketId],
  )

  return (
    <StandardReviewExperience
      gateway={gateway}
      checkId={reviewPacketId}
      expectedResultSha256={SENTINEL_SHA}
      subjectName={subjectName}
      organisation={organisation}
      proofLabel={proofLabel}
    />
  )
}
