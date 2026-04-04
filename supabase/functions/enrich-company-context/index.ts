import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimit, RATE_LIMITS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    const jinaApiKey = Deno.env.get('JINA_API_KEY');
    const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');

    if (!apolloApiKey) {
      console.warn('⚠️ APOLLO_API_KEY not configured, skipping Apollo.io enrichment');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Create auth client for user verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      },
      auth: { persistSession: false }
    });

    // Get authenticated user
    const { data: userData } = await supabaseAuth.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    const {
      company_name,
      leader_id,
      assessment_id,
      website_url,
      board_deck_urls = [],
    } = requestBody;

    if (!company_name || !leader_id) {
      return new Response(
        JSON.stringify({ error: 'company_name and leader_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Enriching company context for: ${company_name}`);

    let apolloData: any = {};
    let websiteContent: string | null = null;
    let boardDeckContent: any[] = [];

    // Step 1: Apollo.io API lookup
    if (apolloApiKey && company_name) {
      try {
        const apolloResponse = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Api-Key': apolloApiKey,
          },
          body: JSON.stringify({
            q_organization_name: company_name,
            per_page: 1,
          }),
        });

        if (apolloResponse.ok) {
          const apolloResult = await apolloResponse.json();
          if (apolloResult.organizations && apolloResult.organizations.length > 0) {
            apolloData = apolloResult.organizations[0];
            console.log('✅ Apollo.io data retrieved:', {
              name: apolloData.name,
              industry: apolloData.industry,
              employees: apolloData.num_employees,
            });
          } else {
            console.log('⚠️ No Apollo.io results found for:', company_name);
          }
        } else {
          console.warn('⚠️ Apollo.io API error:', apolloResponse.status, await apolloResponse.text());
        }
      } catch (error) {
        console.error('❌ Apollo.io API error:', error);
        // Continue without Apollo data
      }
    }

    // Step 2: Website content extraction (Jina Reader primary, regex fallback)
    if (website_url) {
      // Try Jina Reader first for clean markdown extraction
      if (jinaApiKey) {
        try {
          const jinaResponse = await fetch(`https://r.jina.ai/${website_url}`, {
            headers: {
              'Authorization': `Bearer ${jinaApiKey}`,
              'Accept': 'application/json',
              'X-Return-Format': 'markdown',
            },
          });

          if (jinaResponse.ok) {
            const jinaData = await jinaResponse.json();
            if (jinaData.data?.content) {
              websiteContent = jinaData.data.content.substring(0, 10000);
              console.log('✅ Jina Reader content extracted:', websiteContent.length, 'chars');
            }
          } else {
            console.warn('⚠️ Jina Reader failed:', jinaResponse.status);
          }
        } catch (error) {
          console.error('❌ Jina Reader error:', error);
        }
      }

      // Fallback: basic HTML text extraction
      if (!websiteContent) {
        try {
          const websiteResponse = await fetch(website_url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; MindmakerBot/1.0)',
            },
          });

          if (websiteResponse.ok) {
            const html = await websiteResponse.text();
            const textContent = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 10000);

            websiteContent = textContent;
            console.log('✅ Website content extracted (fallback):', websiteContent.length, 'chars');
          } else {
            console.warn('⚠️ Website fetch failed:', websiteResponse.status);
          }
        } catch (error) {
          console.error('❌ Website scraping error:', error);
        }
      }
    }

    // Step 2.5: Recent company news via Tavily
    let recentNews: Array<{ title: string; url: string; snippet: string; published_date: string | null }> = [];
    if (tavilyApiKey && company_name) {
      try {
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: `${company_name} company news`,
            search_depth: 'basic',
            topic: 'news',
            days: 30,
            max_results: 5,
            include_answer: false,
          }),
        });

        if (tavilyResponse.ok) {
          const tavilyData = await tavilyResponse.json();
          if (tavilyData.results) {
            recentNews = tavilyData.results.map((r: any) => ({
              title: r.title || '',
              url: r.url || '',
              snippet: (r.content || '').substring(0, 300),
              published_date: r.published_date || null,
            }));
            console.log('✅ Tavily company news:', recentNews.length, 'articles');
          }
        } else {
          console.warn('⚠️ Tavily API error:', tavilyResponse.status);
        }
      } catch (error) {
        console.error('❌ Tavily news search error:', error);
      }
    }

    // Step 3: Board deck PDF extraction (placeholder - would need PDF parsing library)
    // For now, we'll store URLs and extract text later if needed
    if (board_deck_urls.length > 0) {
      boardDeckContent = board_deck_urls.map((url: string) => ({
        url,
        extracted: false,
        note: 'PDF extraction pending - text will be extracted on first access',
      }));
      console.log('📄 Board deck URLs stored:', board_deck_urls.length);
    }

    // Determine enrichment status
    let enrichmentStatus: 'pending' | 'partial' | 'complete' = 'pending';
    const hasApollo = apolloData && Object.keys(apolloData).length > 0;
    const hasContent = websiteContent || boardDeckContent.length > 0 || recentNews.length > 0;
    if (hasApollo) {
      enrichmentStatus = hasContent ? 'complete' : 'partial';
    } else if (hasContent) {
      enrichmentStatus = 'partial';
    }

    // Step 4: Store or update company_context
    const contextData = {
      leader_id,
      assessment_id: assessment_id || null,
      company_name,
      apollo_data: apolloData,
      website_url: website_url || null,
      website_content: websiteContent,
      board_deck_urls: board_deck_urls.length > 0 ? board_deck_urls : [],
      board_deck_content: boardDeckContent,
      recent_news: recentNews.length > 0 ? recentNews : [],
      enrichment_status: enrichmentStatus,
      updated_at: new Date().toISOString(),
    };

    // Check if context already exists
    const { data: existingContext } = await supabase
      .from('company_context')
      .select('id')
      .eq('leader_id', leader_id)
      .eq('company_name', company_name)
      .maybeSingle();

    let contextId: string;

    if (existingContext) {
      // Update existing context
      const { data, error } = await supabase
        .from('company_context')
        .update(contextData)
        .eq('id', existingContext.id)
        .select('id')
        .single();

      if (error) throw error;
      contextId = data.id;
      console.log('✅ Updated existing company context:', contextId);
    } else {
      // Create new context
      const { data, error } = await supabase
        .from('company_context')
        .insert(contextData)
        .select('id')
        .single();

      if (error) throw error;
      contextId = data.id;
      console.log('✅ Created new company context:', contextId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        context_id: contextId,
        company_name,
        apollo_data: apolloData,
        website_summary: websiteContent ? websiteContent.substring(0, 500) + '...' : null,
        board_deck_count: board_deck_urls.length,
        recent_news_count: recentNews.length,
        enrichment_status: enrichmentStatus,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error enriching company context:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to enrich company context',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
