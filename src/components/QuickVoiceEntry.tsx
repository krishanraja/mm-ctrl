import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInput } from '@/components/ui/voice-input';
import { ArrowRight, Sparkles, Mic, Lightbulb, Target, Mail, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/utils/edgeFunctionClient';
import { validateEmail } from '@/utils/formValidation';
import mindmakerLogo from '@/assets/mindmaker-logo.png';

interface QuickVoiceEntryProps {
  onComplete: (result: QuickEntryResult) => void;
  onSkipToQuiz: () => void;
}

export interface QuickEntryResult {
  transcript: string;
  insight: string;
  action: string;
  why: string;
}

const QUICK_PROMPT = "What's your biggest AI uncertainty right now?";

export const QuickVoiceEntry: React.FC<QuickVoiceEntryProps> = ({
  onComplete,
  onSkipToQuiz
}) => {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<QuickEntryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Email capture state (inline, not navigation)
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);

  const handleTranscript = useCallback((text: string) => {
    setTranscript(prev => (prev ? `${prev} ${text}` : text));
  }, []);

  const handleClearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    setError(null);

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuickVoiceEntry.tsx:handleSubmit:start',message:'Starting quick entry submission',data:{transcriptLength:transcript.trim().length,transcriptPreview:transcript.trim().slice(0,100)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H5'})}).catch(()=>{});
    // #endregion

    try {
      // Ensure user is authenticated (anonymous sign-in if needed)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log('🔐 No session found, signing in anonymously...');
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          console.warn('Anonymous sign-in failed:', signInError);
          // Continue anyway - some edge functions may work without auth
        }
      }

      // Use the same AI endpoint as weekly check-in for consistency
      const { data, error: fnError } = await supabase.functions.invoke('submit-weekly-checkin', {
        body: {
          transcript: transcript.trim(),
          asked_prompt_key: 'quick_entry',
          baseline_context: null,
        },
      });

      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuickVoiceEntry.tsx:handleSubmit:response',message:'Edge function response received',data:{hasData:!!data,hasError:!!fnError,fnError:fnError?.message||null,dataKeys:data?Object.keys(data):[],insight:data?.insight?.slice(0,50),action_text:data?.action_text?.slice(0,50),errorField:data?.error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3-H5'})}).catch(()=>{});
      // #endregion

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const entryResult: QuickEntryResult = {
        transcript: transcript.trim(),
        insight: data?.insight || "I heard what you said - there's a specific tension there I want to unpack.",
        action: data?.action_text || "Try again in a moment so I can give you advice specific to your situation.",
        why: data?.why_text || "Generic advice is useless. You deserve something tailored to what you actually said.",
      };

      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuickVoiceEntry.tsx:handleSubmit:success',message:'Entry result created',data:{usedDefaultInsight:!data?.insight,usedDefaultAction:!data?.action_text,insightPreview:entryResult.insight.slice(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion

      setResult(entryResult);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'QuickVoiceEntry.tsx:handleSubmit:catch',message:'Quick entry failed - entering catch block',data:{errorMessage:err instanceof Error?err.message:String(err),errorName:err instanceof Error?err.name:'unknown'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2-H4'})}).catch(()=>{});
      // #endregion
      console.error('Quick entry failed:', err);
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

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setIsSubmittingEmail(true);
    setEmailError(null);

    try {
      // Create anonymous session if not logged in
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        const { error: signUpError } = await supabase.auth.signInAnonymously();
        if (signUpError) {
          console.warn('Anonymous sign-in failed, continuing anyway:', signUpError);
        }
      }

      // Send lead capture email
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
          contactType: 'quick_entry_email_capture',
          sessionId: `quick_${Date.now()}`
        }, { logPrefix: '📧' });
        console.log('✅ Quick entry lead email sent');
      } catch (emailErr) {
        console.error('❌ Quick entry email failed (non-blocking):', emailErr);
      }

      // Store email preference for weekly reminders
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

      // Success - stay on page with confirmation
      setEmailCaptured(true);
      setShowEmailForm(false);

    } catch (err) {
      console.error('Email capture error:', err);
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingEmail(false);
    }
  }, [email, result]);

  // Show result screen
  if (result) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 py-6">
        <Card className="w-full max-w-lg shadow-lg border rounded-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 sm:p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                Here's what AI sees
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Based on 30 seconds of your thinking
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
                // Success state - stay on page
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mx-auto">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">You're in</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your first weekly insight is on its way.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={() => onComplete(result!)}
                    >
                      Continue to your dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                      disabled={isSubmittingEmail}
                    />
                    {emailError && (
                      <p className="text-destructive text-xs">{emailError}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="cta"
                    className="w-full rounded-xl py-5"
                    disabled={isSubmittingEmail}
                  >
                    {isSubmittingEmail ? 'Setting up...' : 'Send me weekly insights'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
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
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <img src={mindmakerLogo} alt="MindMaker" className="h-8 sm:h-10" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <Card className="w-full max-w-lg shadow-lg border rounded-xl">
          <CardContent className="p-5 sm:p-8">
            {/* Prompt */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <Mic className="h-7 w-7 text-primary" />
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
                <VoiceInput
                  onTranscript={handleTranscript}
                  placeholder="Tap to speak"
                  maxDuration={30}
                  className="scale-110"
                />
              </div>

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
                    <span className="animate-pulse">Thinking...</span>
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

