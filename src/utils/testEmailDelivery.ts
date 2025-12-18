/**
 * Test utility to verify email delivery to krish@themindmaker.ai
 * 
 * Usage: Import and call testEmailDelivery() from the browser console
 * or call it from a test button in the app.
 */

import { supabase } from '@/integrations/supabase/client';

export async function testEmailDelivery(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  console.log('📧 Testing email delivery to krish@themindmaker.ai...');
  
  try {
    const { data, error } = await supabase.functions.invoke('send-diagnostic-email', {
      body: {
        data: {
          firstName: 'Test',
          lastName: 'Lead',
          email: 'test@example.com',
          company: 'Test Company',
          title: 'Test Executive',
          primaryFocus: 'Strategy & Vision',
          
          // Test assessment responses
          industry_impact: '4 - Agree',
          business_acceleration: '3 - Neutral',
          team_alignment: '4 - Agree',
          external_positioning: '3 - Neutral',
          kpi_connection: '4 - Agree',
          coaching_champions: '3 - Neutral',
          
          hasDeepProfile: false,
          benchmarkScore: 21,
          benchmarkTier: 'AI-Confident',
        },
        scores: { total: 21 },
        contactType: 'email_test',
        sessionId: `test_${Date.now()}`
      }
    });

    if (error) {
      console.error('❌ Email test failed:', error);
      return {
        success: false,
        message: `Email test failed: ${error.message}`,
        details: error
      };
    }

    console.log('✅ Email test successful:', data);
    return {
      success: true,
      message: 'Email sent successfully! Check krish@themindmaker.ai inbox.',
      details: data
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Email test exception:', err);
    return {
      success: false,
      message: `Email test exception: ${errorMessage}`,
      details: err
    };
  }
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).testEmailDelivery = testEmailDelivery;
}
