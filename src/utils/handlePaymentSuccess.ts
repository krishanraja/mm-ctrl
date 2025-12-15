import { supabase } from '@/integrations/supabase/client';

/**
 * Handle successful payment callback from Stripe
 * Called when user returns from successful checkout
 */
export async function handlePaymentSuccess(assessmentId: string, sessionId: string): Promise<boolean> {
  try {
    console.log('💰 Handling payment success for assessment:', assessmentId);

    // Verify payment via edge function
    const { data, error } = await supabase.functions.invoke('verify-diagnostic-payment', {
      body: {
        assessment_id: assessmentId,
        session_id: sessionId,
      },
    });

    if (error) {
      console.error('❌ Payment verification error:', error);
      return false;
    }

    if (data?.paid) {
      console.log('✅ Payment verified and diagnostic unlocked');
      
      // Clear the stored assessment ID since we're refreshing
      sessionStorage.setItem('payment_verified', 'true');
      
      return true;
    }

    console.log('⚠️ Payment not yet confirmed');
    return false;
  } catch (error) {
    console.error('❌ Payment success handling error:', error);
    return false;
  }
}

/**
 * Check URL parameters for payment callback
 */
export function checkPaymentCallback(): { success: boolean; assessmentId?: string; sessionId?: string } {
  const params = new URLSearchParams(window.location.search);
  
  const paymentStatus = params.get('payment');
  const assessmentId = params.get('assessment_id');
  const sessionId = params.get('session_id');

  if (paymentStatus === 'success' && assessmentId) {
    return {
      success: true,
      assessmentId,
      sessionId: sessionId || undefined,
    };
  }

  return { success: false };
}
