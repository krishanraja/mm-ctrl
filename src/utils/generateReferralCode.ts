/**
 * PHASE 4: Referral Code Generation
 * Generate unique, trackable referral links for team momentum
 */

import { supabase } from '@/integrations/supabase/client';

export interface ReferralData {
  code: string;
  url: string;
  assessmentId: string;
  email: string;
  name?: string;
}

/**
 * Generate unique referral code for an assessment
 */
export async function generateReferralCode(
  assessmentId: string,
  email: string,
  name?: string
): Promise<ReferralData | null> {
  try {
    // Call DB function to generate unique code
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_referral_code', {
        p_assessment_id: assessmentId,
        p_email: email
      });

    if (codeError || !codeData) {
      console.error('❌ Failed to generate referral code:', codeError);
      return null;
    }

    const referralCode = codeData as string;

    // Insert referral record
    const { error: insertError } = await supabase
      .from('assessment_referrals')
      .insert({
        referrer_assessment_id: assessmentId,
        referrer_email: email,
        referrer_name: name,
        referral_code: referralCode,
        referred_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Failed to insert referral record:', insertError);
      return null;
    }

    // Generate shareable URL
    const baseUrl = window.location.origin;
    const referralUrl = `${baseUrl}/?ref=${referralCode}`;

    console.log('✅ Referral code generated:', { code: referralCode, url: referralUrl });

    return {
      code: referralCode,
      url: referralUrl,
      assessmentId,
      email,
      name
    };
  } catch (error) {
    console.error('❌ Error generating referral code:', error);
    return null;
  }
}

/**
 * Track referral conversion when new user completes assessment
 */
export async function trackReferralConversion(
  referralCode: string,
  refereeAssessmentId: string,
  refereeEmail: string,
  refereeName?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('track_referral_conversion', {
        p_referral_code: referralCode,
        p_referee_assessment_id: refereeAssessmentId,
        p_referee_email: refereeEmail,
        p_referee_name: refereeName
      });

    if (error) {
      console.error('❌ Failed to track referral conversion:', error);
      return false;
    }

    console.log('✅ Referral conversion tracked:', { referralCode, refereeEmail });
    return data === true;
  } catch (error) {
    console.error('❌ Error tracking referral conversion:', error);
    return false;
  }
}

/**
 * Get referral code from URL
 */
export function getReferralCodeFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('ref');
  
  if (code) {
    // Store in sessionStorage for later attribution
    sessionStorage.setItem('referral_code', code);
    console.log('📎 Referral code detected:', code);
  }
  
  return code;
}

/**
 * Get stored referral code for attribution
 */
export function getStoredReferralCode(): string | null {
  return sessionStorage.getItem('referral_code');
}

/**
 * Clear stored referral code after successful attribution
 */
export function clearStoredReferralCode(): void {
  sessionStorage.removeItem('referral_code');
  console.log('✅ Referral code cleared');
}

/**
 * Get referral stats for a user's assessments
 */
export async function getReferralStats(assessmentId: string) {
  try {
    const { data, error } = await supabase
      .from('assessment_referrals')
      .select('*')
      .eq('referrer_assessment_id', assessmentId);

    if (error) {
      console.error('❌ Failed to fetch referral stats:', error);
      return { total: 0, converted: 0, pending: 0 };
    }

    const total = data?.length || 0;
    const converted = data?.filter(r => r.converted).length || 0;
    const pending = total - converted;

    return { total, converted, pending, referrals: data };
  } catch (error) {
    console.error('❌ Error fetching referral stats:', error);
    return { total: 0, converted: 0, pending: 0 };
  }
}
