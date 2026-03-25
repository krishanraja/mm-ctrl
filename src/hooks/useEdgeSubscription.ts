import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from './use-toast';
import type { EdgeSubscription, SubscriptionStatus } from '@/types/edge';

export function useEdgeSubscription() {
  const [subscription, setSubscription] = useState<EdgeSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('edge_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSubscription(data as unknown as EdgeSubscription | null);
    } catch {
      // No subscription found - that's fine
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Check for subscription success in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());

      toast({
        title: 'Edge Pro Activated!',
        description: 'You now have full access to all Edge capabilities.',
      });

      // Refresh subscription status
      setTimeout(refresh, 1000);
    }
  }, [refresh, toast]);

  // Create a subscription checkout session
  const subscribe = useCallback(async (): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-edge-subscription');

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');

      return data.url;
    } catch (err) {
      console.error('Failed to create subscription:', err);
      toast({
        title: 'Subscription Error',
        description: 'Unable to start checkout. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // Derived state
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';
  const hasAccess = isActive || isPastDue; // Allow past_due a grace period

  return {
    subscription,
    isActive,
    isPastDue,
    hasAccess,
    isLoading,
    isProcessing,
    subscribe,
    refresh,
  };
}
