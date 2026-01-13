// src/lib/api.ts
import { supabase } from '@/integrations/supabase/client'

// Generic edge function invoker with error handling
export async function invokeEdgeFunction<T>(
  functionName: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  })
  
  if (error) {
    console.error(`Edge function ${functionName} error:`, error)
    throw new Error(error.message || `Failed to call ${functionName}`)
  }
  
  return data as T
}

// Specific API calls
export const api = {
  // AI Assessment
  async submitAssessment(answers: Record<string, string>) {
    return invokeEdgeFunction<{ baseline: unknown }>('ai-assessment', { answers })
  },
  
  // Weekly Action
  async getWeeklyAction(userId: string) {
    return invokeEdgeFunction<{ action: unknown }>('get-weekly-action', { userId })
  },
  
  async generateWeeklyAction(userId: string, context?: string) {
    return invokeEdgeFunction<{ action: unknown }>('generate-weekly-action', { 
      userId, 
      context 
    })
  },
  
  // Daily Provocation
  async getDailyProvocation(userId: string) {
    return invokeEdgeFunction<{ provocation: unknown }>('get-daily-provocation', { 
      userId 
    })
  },
  
  // Voice to Insight
  async generateInsight(transcript: string, userId?: string) {
    return invokeEdgeFunction<{
      insight: string
      action: string
      why: string
      tags: string[]
    }>('voice-to-insight', { transcript, userId })
  },
  
  // Strategic Pulse
  async getStrategicPulse(userId: string) {
    return invokeEdgeFunction<{
      baseline: unknown
      tensions: unknown[]
      risks: unknown[]
    }>('get-strategic-pulse', { userId })
  },
  
  // Submit Check-in
  async submitCheckin(userId: string, transcript: string, audioUrl?: string) {
    return invokeEdgeFunction<{ checkin: unknown }>('submit-weekly-checkin', {
      userId,
      transcript,
      audioUrl,
    })
  },
  
  // Voice Transcription (with enhanced features)
  async transcribeAudio(audioBlob: Blob, sessionId?: string) {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.webm')
    if (sessionId) {
      formData.append('sessionId', sessionId)
    }
    
    // Use Supabase functions directly for FormData
    const { data, error } = await supabase.functions.invoke('voice-transcribe', {
      body: formData,
    })
    
    if (error) {
      throw new Error(error.message || 'Transcription failed')
    }
    
    return data as { transcript: string; confidence?: number; duration_seconds?: number }
  },
  
  // Enhanced Insight Generation with context
  async generateEnhancedInsight(transcript: string, userId: string, context?: {
    baseline?: any
    previousInsights?: string[]
    companyContext?: any
  }) {
    return invokeEdgeFunction<{
      insight: string
      action: string
      why: string
      tags: string[]
      confidence?: number
    }>('submit-weekly-checkin', {
      transcript,
      userId,
      baseline_context: context?.baseline,
      previous_insights: context?.previousInsights,
      company_context: context?.companyContext,
    })
  },
}
