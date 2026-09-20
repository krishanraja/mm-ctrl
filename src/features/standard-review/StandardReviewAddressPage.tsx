import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { StandardReviewAddressExperience } from './StandardReviewAddressExperience'
import { createSupabaseStandardReviewInvoker } from './supabaseInvoker'

export default function StandardReviewAddressPage() {
  const { reviewId = '' } = useParams()
  const invoker = useMemo(() => createSupabaseStandardReviewInvoker(supabase), [])

  useEffect(() => {
    const previousTitle = document.title
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const robots = existingRobots ?? document.createElement('meta')
    const previousRobots = existingRobots?.content
    if (!existingRobots) {
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    document.title = 'Private standard review'
    robots.content = 'noindex,nofollow,noarchive'
    return () => {
      document.title = previousTitle
      if (existingRobots && previousRobots !== undefined) robots.content = previousRobots
      else robots.remove()
    }
  }, [])

  return (
    <StandardReviewAddressExperience
      invoker={invoker}
      reviewPacketId={reviewId}
    />
  )
}
