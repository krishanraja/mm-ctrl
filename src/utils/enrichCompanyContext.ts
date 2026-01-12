import { supabase } from '@/integrations/supabase/client';

export interface EnrichCompanyContextParams {
  company_name: string;
  leader_id: string;
  assessment_id?: string;
  website_url?: string;
  board_deck_urls?: string[];
}

export interface EnrichCompanyContextResult {
  success: boolean;
  context_id?: string;
  company_name: string;
  apollo_data?: any;
  website_summary?: string;
  board_deck_count?: number;
  enrichment_status?: 'pending' | 'partial' | 'complete';
  error?: string;
}

/**
 * Enrich company context using Apollo.io API and optional user-provided context
 * This function is called passively in the background after assessment completion
 */
export async function enrichCompanyContext(
  params: EnrichCompanyContextParams
): Promise<EnrichCompanyContextResult> {
  try {
    const { data, error } = await supabase.functions.invoke('enrich-company-context', {
      body: params,
    });

    if (error) {
      console.error('❌ Error enriching company context:', error);
      return {
        success: false,
        company_name: params.company_name,
        error: error.message || 'Failed to enrich company context',
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error: any) {
    console.error('❌ Error calling enrich-company-context:', error);
    return {
      success: false,
      company_name: params.company_name,
      error: error.message || 'Failed to enrich company context',
    };
  }
}

/**
 * Get existing company context for a leader
 */
export async function getCompanyContext(leaderId: string) {
  try {
    const { data, error } = await supabase
      .from('company_context')
      .select('*')
      .eq('leader_id', leaderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching company context:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error fetching company context:', error);
    return null;
  }
}
