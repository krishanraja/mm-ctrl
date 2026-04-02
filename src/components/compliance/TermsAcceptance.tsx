import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TermsAcceptanceProps {
  userId: string;
  onAccepted: () => void;
}

/**
 * Terms acceptance component shown after signup/first login
 * when the user hasn't yet accepted the privacy policy and terms.
 *
 * Saves acceptance timestamp to the leaders table.
 */
export function TermsAcceptance({ userId, onAccepted }: TermsAcceptanceProps) {
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!checked) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('leaders')
        .update({
          terms_accepted_at: new Date().toISOString(),
          privacy_policy_version: '1.0',
        } as any)
        .eq('user_id', userId);

      if (error) throw error;

      // Log to consent audit (non-blocking)
      supabase.from('consent_audit').insert({
        user_id: userId,
        changed_at: new Date().toISOString(),
        previous_value: { terms_accepted: false },
        new_value: { terms_accepted: true, version: '1.0' },
        ip_address: 'client',
        user_agent: navigator.userAgent,
      } as any).catch(() => {});

      onAccepted();
    } catch (error) {
      console.error('Failed to save terms acceptance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your acceptance. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/10">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold">Welcome to MindMaker</h2>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Before you get started, please review and accept our terms:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">-</span>
              Your data is encrypted at rest and in transit
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">-</span>
              You can export or delete your data at any time
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">-</span>
              AI processing uses your data only to serve you
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">-</span>
              We do not sell your personal information
            </li>
          </ul>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="terms-accept"
            checked={checked}
            onCheckedChange={(val) => setChecked(val === true)}
          />
          <Label htmlFor="terms-accept" className="text-sm">
            I agree to the Privacy Policy and Terms of Service
          </Label>
        </div>

        <Button
          className="w-full"
          onClick={handleAccept}
          disabled={!checked || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
