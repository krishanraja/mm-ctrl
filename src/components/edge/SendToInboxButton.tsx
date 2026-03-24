import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Loader2,
  Check,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendToInboxButtonProps {
  actionId: string;
  className?: string;
}

type SendState = 'idle' | 'checking' | 'needs_email' | 'sending' | 'sent';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SendToInboxButton({ actionId, className }: SendToInboxButtonProps) {
  const { userId } = useAuth();
  const { toast } = useToast();

  const [sendState, setSendState] = useState<SendState>('idle');
  const [emailInput, setEmailInput] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Check for existing delivery email
  // -----------------------------------------------------------------------

  const checkEmail = useCallback(async () => {
    if (!userId) return;
    setSendState('checking');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('edge_delivery_email')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const email = data?.edge_delivery_email;
      if (email) {
        setSavedEmail(email);
        await sendToInbox(email);
      } else {
        setSendState('needs_email');
      }
    } catch (err) {
      console.error('Failed to check delivery email:', err);
      setSendState('needs_email');
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Save email and send
  // -----------------------------------------------------------------------

  const handleSaveAndSend = useCallback(async () => {
    const email = emailInput.trim();
    if (!email || !userId) return;

    try {
      // Save email to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ edge_delivery_email: email })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSavedEmail(email);
      await sendToInbox(email);
    } catch (err) {
      console.error('Failed to save email:', err);
      toast({ title: 'Failed to save email', variant: 'destructive' });
      setSendState('needs_email');
    }
  }, [emailInput, userId, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Deliver artifact
  // -----------------------------------------------------------------------

  const sendToInbox = useCallback(async (email: string) => {
    setSendState('sending');

    try {
      const { error } = await supabase.functions.invoke('deliver-edge-artifact', {
        body: { actionId, email },
      });

      if (error) throw error;

      setSendState('sent');
      toast({ title: 'Sent to your inbox' });

      // Reset after a delay
      setTimeout(() => setSendState('idle'), 3000);
    } catch (err) {
      console.error('Failed to deliver artifact:', err);
      toast({ title: 'Delivery failed. Please try again.', variant: 'destructive' });
      setSendState('idle');
    }
  }, [actionId, toast]);

  // -----------------------------------------------------------------------
  // Handle button click
  // -----------------------------------------------------------------------

  const handleClick = useCallback(() => {
    if (savedEmail) {
      sendToInbox(savedEmail);
    } else {
      checkEmail();
    }
  }, [savedEmail, sendToInbox, checkEmail]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  // Inline email input
  if (sendState === 'needs_email') {
    return (
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: 'auto' }}
        className={cn('flex items-center gap-1.5', className)}
      >
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="you@email.com"
          autoFocus
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm',
            'bg-foreground/5 border border-foreground/10',
            'text-foreground placeholder:text-foreground/30',
            'focus:outline-none focus:ring-2 focus:ring-accent/30',
            'w-48',
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveAndSend();
            if (e.key === 'Escape') setSendState('idle');
          }}
        />
        <Button
          onClick={handleSaveAndSend}
          disabled={!emailInput.trim()}
          size="sm"
          className="gap-1"
        >
          <Send className="h-3 w-3" />
          Send
        </Button>
      </motion.div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      disabled={sendState === 'checking' || sendState === 'sending' || sendState === 'sent'}
      className={cn('gap-1.5', className)}
    >
      <AnimatePresence mode="wait">
        {sendState === 'sent' ? (
          <motion.span
            key="sent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            Sent
          </motion.span>
        ) : sendState === 'checking' || sendState === 'sending' ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {sendState === 'checking' ? 'Checking...' : 'Sending...'}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            <Mail className="h-3.5 w-3.5" />
            Send to Inbox
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
