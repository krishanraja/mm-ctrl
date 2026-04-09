/**
 * Centralized transcription error sanitization.
 *
 * Ensures raw API error details (JSON payloads, quota messages, etc.)
 * never reach the user. Every consumer of transcription errors should
 * pass the message through this function before displaying it.
 */

const FRIENDLY_PATTERNS: Array<[RegExp, string]> = [
  // Microphone / permission errors - already user-friendly, pass through
  [/microphone|permission|denied/i, ''],
  // Timeout
  [/timed?\s*out|timeout/i, 'Transcription took too long. Try a shorter recording.'],
  // Quota / billing
  [/quota|exceeded|insufficient|billing/i, 'Voice transcription is temporarily unavailable.'],
  // Rate limit
  [/rate.?limit|too many requests|429/i, 'Too many requests. Please wait a moment and try again.'],
  // Service unavailable
  [/unavailable|API key|503/i, 'Voice transcription is temporarily unavailable.'],
  // All providers failed
  [/all transcription providers/i, 'Could not transcribe audio. Please try again.'],
  // JSON-like or raw API errors that slipped through
  [/^\s*\{|"error"|"message"/i, 'Voice transcription is temporarily unavailable.'],
]

export function sanitizeTranscriptionError(msg: string | undefined | null): string {
  const raw = (msg ?? '').trim()
  if (!raw) return 'Something went wrong with transcription. Please try again.'

  for (const [pattern, friendly] of FRIENDLY_PATTERNS) {
    if (pattern.test(raw)) {
      // Empty string means the original message is already user-friendly
      return friendly || raw
    }
  }

  // If the message is reasonably short and doesn't look technical, use it
  if (raw.length < 120 && !/https?:|[{}\[\]]|status|HTTP|error.*code/i.test(raw)) {
    return raw
  }

  return 'Something went wrong with transcription. Please try again.'
}
