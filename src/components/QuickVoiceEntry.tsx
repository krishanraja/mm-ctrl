import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Mic, Lightbulb, Target, Mail, Check, RotateCcw, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/utils/edgeFunctionClient';
import { validateEmail } from '@/utils/formValidation';
import { useAuth } from '@/hooks/useAuth';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import mindmakerIcon from '@/assets/mindmaker-icon.png';

interface QuickVoiceEntryProps {
  onComplete: (result: QuickEntryResult, shouldStartAssessment?: boolean) => void;
  onSkipToQuiz: () => void;
}

export interface QuickEntryResult {
  transcript: string;
  insight: string;
  action: string;
  why: string;
}

const QUICK_PROMPT = "What's your biggest AI uncertainty right now?";

// Circular Mic Button Component
interface CircularMicButtonProps {
  onTranscript: (transcript: string) => void;
  maxDuration?: number;
  hideTimer?: boolean; // New prop to hide timer when text input is active
  onStopRecording?: () => void; // Callback to stop recording
}

const CircularMicButton = forwardRef<{ stopRecording: () => void }, CircularMicButtonProps>(({
  onTranscript,
  maxDuration = 30,
  hideTimer = false,
  onStopRecording
}, ref) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const {
    startRecording: startCapture,
    stopRecording: stopCapture,
    isRecording,
    duration: elapsedTime,
    error,
    clearError,
  } = useAudioCapture({ maxDuration });

  const stopRecording = useCallback(() => {
    stopCapture();
    if (onStopRecording) {
      onStopRecording();
    }
  }, [stopCapture, onStopRecording]);

  // Expose stopRecording method via ref
  useImperativeHandle(ref, () => ({
    stopRecording
  }), [stopRecording]);

  const startRecording = async () => {
    try {
      clearError();
      await startCapture(async (audioBlob) => {
        setIsTranscribing(true);
        await transcribeAudio(audioBlob);
      });
    } catch {
      // error state is set by the hook; override with component-specific message
      // (the hook already sets a generic message, but we want a more specific one)
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('sessionId', `quick-entry-${Date.now()}`);
      formData.append('moduleType', 'quick_entry');

      const { data, error } = await supabase.functions.invoke('voice-transcribe', {
        body: formData
      });

      if (error) throw error;

      if (data?.transcript) {
        onTranscript(data.transcript);
      }
      setIsTranscribing(false);
    } catch (err) {
      console.error('Error transcribing:', err);
      setError('Failed to transcribe. Try typing instead.');
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing}
        className={`
          w-20 h-20 rounded-full
          flex items-center justify-center
          transition-all duration-300
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
            : 'bg-primary hover:bg-primary/90'
          }
          ${isTranscribing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          shadow-lg hover:shadow-xl
        `}
      >
        {isTranscribing ? (
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        ) : (
          <Mic className={`h-8 w-8 text-white ${isRecording ? 'animate-pulse' : ''}`} />
        )}
      </button>
      {error && (
        <span className="text-xs text-destructive text-center">{error}</span>
      )}
      {isRecording && !hideTimer && (
        <span className="text-xs text-muted-foreground">
          {elapsedTime}s / {maxDuration}s
        </span>
      )}
    </div>
  );
});

CircularMicButton.displayName = 'CircularMicButton';

export const QuickVoiceEntry: React.FC<QuickVoiceEntryProps> = ({
  onComplete,
  onSkipToQuiz
}) => {
  const { signUp, signIn, isAuthenticated, hasSession } = useAuth();
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<QuickEntryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const micButtonRef = useRef<{ stopRecording: () => void } | null>(null);
  
  // Email & password capture state (inline, not navigation)
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);

  const handleTranscript = useCallback((text: string) => {
    setTranscript(prev => (prev ? `${prev} ${text}` : text));
    setIsRecordingActive(false);
  }, []);

  const handleClearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Ensure user is authenticated (anonymous sign-in if needed)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log('🔐 No session found, signing in anonymously...');
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          console.warn('Anonymous sign-in failed:', signInError);
          // Continue anyway - some edge functions may work without auth
          // Show user-friendly message if anonymous sign-in is disabled
          if (signInError.message?.includes('disabled')) {
            setError('Anonymous access is currently unavailable. Please sign in to continue.');
            setIsProcessing(false);
            return;
          }
        }
      }

      // Use the same AI endpoint as weekly check-in for consistency
      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 30000); // 30 second timeout
      });

      const functionPromise = supabase.functions.invoke('submit-weekly-checkin', {
        body: {
          transcript: transcript.trim(),
          asked_prompt_key: 'quick_entry',
          baseline_context: null,
        },
      });

      const { data, error: fnError } = await Promise.race([functionPromise, timeoutPromise]) as any;

      if (fnError) {
        // Provide user-friendly error messages
        if (fnError.message?.includes('timeout') || fnError.message?.includes('timed out')) {
          throw new Error('The request took too long. Please check your connection and try again.');
        } else if (fnError.message?.includes('network') || fnError.message?.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else {
          throw new Error(fnError.message || 'Something went wrong. Please try again.');
        }
      }
      if (data?.error) throw new Error(data.error);

      const entryResult: QuickEntryResult = {
        transcript: transcript.trim(),
        insight: data?.insight || "I heard what you said - there's a specific tension there I want to unpack.",
        action: data?.action_text || "Try again in a moment so I can give you advice specific to your situation.",
        why: data?.why_text || "Generic advice is useless. You deserve something tailored to what you actually said.",
      };

      setResult(entryResult);
    } catch (err) {
      console.error('Quick entry failed:', err);
      
      // Show user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      
      // Provide fallback that acknowledges we couldn't process their specific input
      const fallbackResult: QuickEntryResult = {
        transcript: transcript.trim(),
        insight: "I wasn't able to fully process what you shared - but there's clearly something worth exploring there.",
        action: "Please try again in a moment. I want to give you something specific to your situation, not generic advice.",
        why: "Your time is valuable. If I can't be specific to what you said, I'd rather ask you to try again.",
      };
      setResult(fallbackResult);
    } finally {
      setIsProcessing(false);
    }
  }, [transcript]);

  const handleContinue = useCallback(() => {
    // Instead of navigating away, show inline email form
    setShowEmailForm(true);
  }, []);

  const handleEmailSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    // Email is valid - show password form
    setEmailError(null);
    setShowPasswordForm(true);
  }, [email]);

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsCreatingAccount(true);
    setPasswordError(null);

    try {
      // Use auth machine for signup
      const signUpResult = await signUp(email, password, {
        quick_entry_transcript: result?.transcript,
        quick_entry_insight: result?.insight,
      });

      if (!signUpResult.success) {
        // Check if user already exists
        if (signUpResult.error?.includes('already registered')) {
          // Try to sign in instead
          const signInResult = await signIn(email, password);
          if (!signInResult.success) {
            setPasswordError('This email is already registered. Please use the correct password or sign in.');
            setIsCreatingAccount(false);
            return;
          }
        } else {
          setPasswordError(signUpResult.error || 'Sign up failed');
          setIsCreatingAccount(false);
          return;
        }
      }

      console.log('✅ Account created successfully');

      // Send lead capture email (non-blocking)
      try {
        await invokeEdgeFunction('send-diagnostic-email', {
          data: {
            firstName: 'Quick Entry',
            lastName: 'Lead',
            email: email,
            company: '',
            title: '',
            primaryFocus: '',
            quickEntryTranscript: result?.transcript,
            quickEntryInsight: result?.insight,
            quickEntryAction: result?.action,
            hasDeepProfile: false,
            benchmarkScore: 0,
            benchmarkTier: 'Quick Entry',
          },
          scores: { total: 0 },
          contactType: 'quick_entry_account_created',
          sessionId: `quick_${Date.now()}`
        }, { logPrefix: '📧' });
      } catch (emailErr) {
        console.error('❌ Quick entry email failed (non-blocking):', emailErr);
      }

      // Store email preference for weekly reminders (non-blocking)
      try {
        await supabase.functions.invoke('upsert-notification-prefs', {
          body: { 
            weekly_checkin_enabled: true,
            email: email
          },
        });
      } catch (prefError) {
        console.warn('Notification prefs failed (non-blocking):', prefError);
      }

      // Success - mark as captured and trigger assessment flow
      setEmailCaptured(true);
      setShowEmailForm(false);
      setShowPasswordForm(false);

    } catch (err) {
      console.error('Account creation error:', err);
      setPasswordError('Something went wrong. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  }, [email, password, result, signUp, signIn]);

  // Show result screen
  if (result) {
    return (
      <div className="h-[var(--mobile-vh)] overflow-hidden bg-background flex items-center justify-center px-4 py-6">
        <Card className="w-full max-w-lg shadow-lg border rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <img src={mindmakerIcon} alt="MindMaker" className="h-7 w-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                Here's what I learned
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                From 30 seconds of your thinking, personalized to your context
              </p>
            </div>

            {/* Result Content */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Insight */}
              <div className="flex gap-3">
                <div className="shrink-0 p-2 bg-amber-500/10 rounded-lg h-fit">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    The tension
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.insight}
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-3">
                <div className="shrink-0 p-2 bg-emerald-500/10 rounded-lg h-fit">
                  <Target className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    This week
                  </div>
                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {result.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {result.why}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA / Email Form / Success */}
            <div className="p-5 sm:p-6 border-t bg-secondary/30">
              {emailCaptured ? (
                // Success state - guide to full assessment
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mx-auto">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Account created!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Now let's get your full AI readiness score.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="cta"
                      className="w-full rounded-xl py-5"
                      onClick={() => onComplete(result!, true)}
                    >
                      Take the 2-min assessment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onComplete(result!, false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip for now →
                  </button>
                </div>
              ) : showPasswordForm ? (
                // Password creation form
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-foreground">Create your account</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save your insights and track your progress
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                      <Mail className="h-3.5 w-3.5" />
                      {email}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quick-password" className="text-foreground font-medium text-sm flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      Create Password
                    </Label>
                    <Input
                      id="quick-password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      className="rounded-lg"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      autoFocus
                      disabled={isCreatingAccount}
                    />
                    {passwordError && (
                      <p className="text-destructive text-xs">{passwordError}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="cta"
                    className="w-full rounded-xl py-5"
                    disabled={isCreatingAccount}
                  >
                    {isCreatingAccount ? 'Creating account...' : 'Create account & continue'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to email
                  </button>
                </form>
              ) : showEmailForm ? (
                // Inline email form
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-foreground">Get this every week</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      One insight. One action. 30 seconds to read.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quick-email" className="text-foreground font-medium text-sm flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      Work Email
                    </Label>
                    <Input
                      id="quick-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      className="rounded-lg"
                      placeholder="you@company.com"
                      autoComplete="email"
                      autoFocus
                    />
                    {emailError && (
                      <p className="text-destructive text-xs">{emailError}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="cta"
                    className="w-full rounded-xl py-5"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => onComplete(result!, false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
                  >
                    Skip for now →
                  </button>
                </form>
              ) : (
                // Initial CTA
                <>
                  <Button
                    variant="cta"
                    className="w-full rounded-xl py-5"
                    onClick={handleContinue}
                  >
                    Get weekly insights like this
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Just your email. 30 seconds/week. No course.
                  </p>
                  <button
                    type="button"
                    onClick={() => onComplete(result!, false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
                  >
                    Skip for now →
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Entry screen
  return (
    <div className="h-[var(--mobile-vh)] overflow-hidden bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <Card className="w-full max-w-lg shadow-lg border rounded-xl">
          <CardContent className="p-5 sm:p-8">
            {/* Prompt */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <img src="/mindmaker-og-image.png" alt="Mindmaker" className="h-10 w-10 rounded-full object-cover" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                {QUICK_PROMPT}
              </h1>
              <p className="text-sm text-muted-foreground">
                30 seconds. Get one insight + one thing to do this week.
              </p>
            </div>

            {/* Voice Input Area */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <CircularMicButton
                  ref={micButtonRef}
                  onTranscript={handleTranscript}
                  maxDuration={30}
                  hideTimer={showTextInput}
                  onStopRecording={() => {
                    setIsRecordingActive(false);
                  }}
                />
              </div>
              {/* Text Input Fallback */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    // Stop recording if active
                    if (micButtonRef.current) {
                      micButtonRef.current.stopRecording();
                    }
                    setShowTextInput(true);
                    setIsRecordingActive(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Or type your answer instead
                </button>
              </div>
              {showTextInput && (
                <div className="space-y-2">
                  <Label htmlFor="text-input" className="text-sm font-medium">
                    Type your AI uncertainty
                  </Label>
                  <Input
                    id="text-input"
                    type="text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="What's your biggest AI uncertainty right now?"
                    className="rounded-lg"
                    autoFocus
                  />
                  <Button
                    variant="cta"
                    onClick={handleSubmit}
                    disabled={!transcript.trim() || isProcessing}
                    className="w-full rounded-xl"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing... (usually 5-10 seconds)
                      </>
                    ) : (
                      <>
                        Get insight
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Transcript Preview */}
              {transcript && (
                <div className="rounded-lg bg-secondary/30 p-3 text-sm text-foreground animate-fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">What I heard:</p>
                    <button
                      type="button"
                      onClick={handleClearTranscript}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isProcessing}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear & try again
                    </button>
                  </div>
                  {transcript}
                </div>
              )}

              {/* Submit Button */}
              <Button
                variant="cta"
                className="w-full rounded-xl py-5"
                disabled={!transcript.trim() || isProcessing}
                onClick={handleSubmit}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Thinking... (usually 5-10 seconds)</span>
                  </>
                ) : (
                  <>
                    See what AI sees
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>

            {/* Alternative */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onSkipToQuiz}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Prefer a structured assessment? Take the 2-min quiz →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="w-full px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          For senior leaders who need AI literacy fast, not depth.
        </p>
      </footer>
    </div>
  );
};






