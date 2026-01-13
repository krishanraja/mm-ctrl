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

// API client with all available integrations
export const api = {
  // ============================================
  // AI Assessment
  // ============================================
  async submitAssessment(answers: Record<string, string>, sessionId?: string) {
    return invokeEdgeFunction<{ success: boolean; assessmentId: string; leaderId: string }>('create-leader-assessment', { 
      assessmentData: answers,
      sessionId: sessionId || crypto.randomUUID(),
      source: 'quiz'
    })
  },

  // ============================================
  // Weekly Action (GPT-4o powered)
  // ============================================
  async getWeeklyAction(userId: string) {
    return invokeEdgeFunction<{ action: any }>('get-or-generate-weekly-action', { userId })
  },
  
  async generateWeeklyAction(userId: string, context?: string) {
    return invokeEdgeFunction<{ action: any }>('get-or-generate-weekly-action', { 
      userId, 
      context 
    })
  },

  // ============================================
  // Daily Provocation (AI-generated questions)
  // ============================================
  async getDailyProvocation(userId: string) {
    return invokeEdgeFunction<{ provocation: any }>('get-daily-prompt', { 
      userId 
    })
  },

  // ============================================
  // Voice to Insight (Whisper + GPT-4o)
  // ============================================
  async generateInsight(transcript: string, userId?: string) {
    return invokeEdgeFunction<{
      success: boolean
      checkin?: any
      insight?: string
      action?: string
    }>('submit-weekly-checkin', { transcript, userId })
  },

  // ============================================
  // Strategic Pulse (fetched from database directly)
  // ============================================
  async getStrategicPulse(userId: string) {
    // This data is fetched directly from the database in the component
    // No edge function needed
    return { baseline: null, tensions: [], risks: [] }
  },

  // ============================================
  // Check-in Submission
  // ============================================
  async submitCheckin(userId: string, transcript: string, audioUrl?: string) {
    return invokeEdgeFunction<{ checkin: any }>('submit-weekly-checkin', {
      userId,
      transcript,
      audioUrl,
    })
  },

  // ============================================
  // Voice Transcription (OpenAI Whisper)
  // ============================================
  async transcribeAudio(audioBlob: Blob, sessionId?: string) {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    // Generate a session ID if not provided
    const sid = sessionId || crypto.randomUUID()
    formData.append('sessionId', sid)
    
    const { data, error } = await supabase.functions.invoke('voice-transcribe', {
      body: formData,
    })
    
    if (error) {
      throw new Error(error.message || 'Transcription failed')
    }
    
    return data as { 
      transcript: string
      confidence?: number
      duration_seconds?: number 
    }
  },

  // ============================================
  // Enhanced Insight with Context (Technical Moat)
  // ============================================
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

  // ============================================
  // Company Context Enrichment (Apollo API)
  // ============================================
  async enrichCompanyContext(companyName: string, domain?: string) {
    return invokeEdgeFunction<{
      company: any
      industry: string
      size: string
      insights: string[]
    }>('enrich-company-context', { companyName, domain })
  },

  // ============================================
  // Pattern Detection (AI Analysis)
  // ============================================
  async detectPatterns(userId: string) {
    return invokeEdgeFunction<{
      patterns: Array<{
        type: string
        description: string
        frequency: number
        recommendation: string
      }>
    }>('detect-patterns', { userId })
  },

  // ============================================
  // Meeting Prep Generation
  // ============================================
  async generateMeetingPrep(userId: string, meetingContext: {
    attendees?: string[]
    topic?: string
    objectives?: string[]
  }) {
    return invokeEdgeFunction<{
      prep: {
        keyPoints: string[]
        questions: string[]
        risks: string[]
        opportunities: string[]
      }
    }>('generate-meeting-prep', { userId, ...meetingContext })
  },

  // ============================================
  // Weekly Prescription (Personalized Actions)
  // ============================================
  async getWeeklyPrescription(userId: string) {
    return invokeEdgeFunction<{
      prescription: {
        focus: string
        actions: Array<{
          title: string
          description: string
          priority: 'high' | 'medium' | 'low'
        }>
        reflection: string
      }
    }>('generate-weekly-prescription', { userId })
  },

  // ============================================
  // Feedback Submission
  // ============================================
  async submitFeedback(userId: string, feedback: {
    type: 'bug' | 'feature' | 'general'
    message: string
    rating?: number
  }) {
    return invokeEdgeFunction<{ success: boolean }>('send-feedback', {
      userId,
      ...feedback,
    })
  },

  // ============================================
  // Compass Analysis (Decision Support)
  // ============================================
  async analyzeDecision(userId: string, decision: {
    context: string
    options: string[]
    constraints?: string[]
  }) {
    return invokeEdgeFunction<{
      analysis: {
        recommendation: string
        reasoning: string
        risks: string[]
        nextSteps: string[]
      }
    }>('compass-analyze', { userId, ...decision })
  },
}
