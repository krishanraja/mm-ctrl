import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Mail, CheckCircle, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface EmailVerificationPromptProps {
  email: string;
  onBack: () => void;
  onResendSuccess?: () => void;
}

/**
 * Email Verification Prompt
 * 
 * Shown after sign-up when email verification is required.
 * Handles:
 * - Displaying "check your email" message
 * - Resend verification email
 * - Email change (if user made typo)
 */
export const EmailVerificationPrompt: React.FC<EmailVerificationPromptProps> = ({
  email,
  onBack,
  onResendSuccess,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [resendError, setResendError] = useState<string | null>(null);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState(email);

  const handleResend = async () => {
    setIsResending(true);
    setResendError(null);
    setResendStatus('idle');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setResendError(error.message);
        setResendStatus('error');
      } else {
        setResendStatus('sent');
        onResendSuccess?.();
      }
    } catch (err) {
      setResendError('Failed to resend verification email');
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-[var(--mobile-vh)] overflow-hidden bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-full overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Verify Your Email
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            We've sent a verification link to:
          </p>
          <p className="font-medium text-foreground mt-1">
            {email}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Check your inbox</p>
                <p className="text-xs text-muted-foreground">
                  Click the link in the email to verify your account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Check your spam folder</p>
                <p className="text-xs text-muted-foreground">
                  Sometimes verification emails end up there
                </p>
              </div>
            </div>
          </div>

          {/* Resend status */}
          {resendStatus === 'sent' && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 rounded-lg p-3">
              <CheckCircle className="h-4 w-4" />
              Verification email resent successfully!
            </div>
          )}

          {resendStatus === 'error' && resendError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              <AlertCircle className="h-4 w-4" />
              {resendError}
            </div>
          )}

          {/* Resend button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleResend}
            disabled={isResending || resendStatus === 'sent'}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendStatus === 'sent' ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Email Sent
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>

          {/* Back button */}
          <Button 
            variant="ghost"
            className="w-full"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>

          {/* Wrong email? */}
          <p className="text-xs text-center text-muted-foreground">
            Wrong email address?{' '}
            <button
              type="button"
              onClick={onBack}
              className="text-primary hover:underline"
            >
              Start over
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPrompt;


