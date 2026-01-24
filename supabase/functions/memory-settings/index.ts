/**
 * Memory Settings Edge Function
 * 
 * Handles user privacy and retention settings for memory.
 * Routes:
 * - GET / - Get user's memory settings
 * - PUT / - Update memory settings
 * - POST /clear-cache - Clear client-side cache instruction
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemorySettings {
  id: string;
  user_id: string;
  store_memory_enabled: boolean;
  store_voice_transcripts: boolean;
  auto_summarize_enabled: boolean;
  retention_days: number | null;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').filter(Boolean)[0] || '';

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth client to get user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
      auth: { persistSession: false },
    });

    const { data: userData, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Handle clear-cache action
    if (action === 'clear-cache') {
      if (req.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return instruction for client to clear local storage
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'clear_local_storage',
          keys_to_clear: [
            'mindmaker-memory-draft',
            'mindmaker-memory-cache',
            'mindmaker-offline-memories',
          ],
          message: 'Clear the specified localStorage keys to remove cached memory data'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET - Retrieve settings
    if (req.method === 'GET') {
      // Get or create settings
      const { data: settings, error: getError } = await supabase
        .rpc('get_or_create_memory_settings', { p_user_id: userId });

      if (getError) {
        console.error('Get settings error:', getError);
        
        // Fallback: try direct query
        const { data: directSettings, error: directError } = await supabase
          .from('user_memory_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (directError && directError.code !== 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Failed to get settings' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create default settings if not found
        if (!directSettings) {
          const { data: newSettings, error: createError } = await supabase
            .from('user_memory_settings')
            .insert({ user_id: userId })
            .select()
            .single();

          if (createError) {
            return new Response(
              JSON.stringify({ error: 'Failed to create settings' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, settings: newSettings }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, settings: directSettings }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, settings }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update settings
    if (req.method === 'PUT') {
      const body = await req.json();
      const { 
        store_memory_enabled, 
        store_voice_transcripts, 
        auto_summarize_enabled, 
        retention_days 
      } = body;

      // Validate retention_days
      if (retention_days !== undefined && retention_days !== null && ![30, 90].includes(retention_days)) {
        return new Response(
          JSON.stringify({ error: 'retention_days must be null, 30, or 90' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: Partial<MemorySettings> = {};
      if (store_memory_enabled !== undefined) updates.store_memory_enabled = store_memory_enabled;
      if (store_voice_transcripts !== undefined) updates.store_voice_transcripts = store_voice_transcripts;
      if (auto_summarize_enabled !== undefined) updates.auto_summarize_enabled = auto_summarize_enabled;
      if (retention_days !== undefined) updates.retention_days = retention_days;

      // Upsert settings
      const { data: existing } = await supabase
        .from('user_memory_settings')
        .select('id')
        .eq('user_id', userId)
        .single();

      let result;
      if (existing) {
        result = await supabase
          .from('user_memory_settings')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('user_memory_settings')
          .insert({ user_id: userId, ...updates })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Update settings error:', result.error);
        return new Response(
          JSON.stringify({ error: 'Failed to update settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log settings change (not sensitive data)
      console.log(`Memory settings updated for user ${userId}: retention_days=${retention_days}`);

      return new Response(
        JSON.stringify({ success: true, settings: result.data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
