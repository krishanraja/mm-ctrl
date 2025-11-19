import { supabase } from "@/integrations/supabase/client";

export const testGeminiRAG = async () => {
  console.group('🧪 VERTEX AI + RAG INTEGRATION TEST');
  console.log('Testing both edge functions with Vertex AI...');
  
  const startTime = Date.now();
  
  // Test 1: Prompt Library Generation
  console.log('\n📚 Test 1: Prompt Library Generation...');
  const { data: libraryData, error: libraryError } = await supabase.functions.invoke(
    'generate-prompt-library',
    {
      body: {
        assessmentId: 'test-vertex-rag-' + Date.now(),
        assessmentData: {
          strategic: 75,
          operational: 60,
          aiReadiness: 80
        },
        contactData: {
          fullName: 'Test Executive',
          roleTitle: 'VP of Engineering',
          companyName: 'TechCorp',
          companySize: '500',
          industry: 'Software',
          primaryFocus: 'AI adoption for engineering teams'
        },
        profileData: null
      }
    }
  );
  
  const libraryDuration = Date.now() - startTime;
  
  if (libraryError) {
    console.error('❌ Prompt library test failed:', libraryError);
  } else {
    console.log(`✅ Prompt library generated in ${libraryDuration}ms`);
    console.log('Generation model:', libraryData?.generationModel);
    console.log('Prompt count:', libraryData?.promptLibrary?.masterCommandPrompts?.length || 0);
  }
  
  // Test 2: Personalized Insights Generation
  console.log('\n💡 Test 2: Personalized Insights Generation...');
  const insightsStartTime = Date.now();
  
  const { data: insightsData, error: insightsError } = await supabase.functions.invoke(
    'generate-personalized-insights',
    {
      body: {
        assessmentData: { aiToolFluency: 85, strategicVision: 70 },
        contactData: {
          fullName: 'Test CTO',
          roleTitle: 'CTO',
          industry: 'FinTech',
          companySize: '200'
        },
        deepProfileData: null
      }
    }
  );
  
  const insightsDuration = Date.now() - insightsStartTime;
  
  if (insightsError) {
    console.error('❌ Insights test failed:', insightsError);
  } else {
    console.log(`✅ Insights generated in ${insightsDuration}ms`);
    console.log('Generation source:', insightsData?.generationSource);
  }
  
  console.log('\n📊 Summary:');
  console.log('- Prompt library:', libraryError ? '❌ FAILED' : '✅ SUCCESS');
  console.log('- Insights:', insightsError ? '❌ FAILED' : '✅ SUCCESS');
  console.log('- Total duration:', Date.now() - startTime, 'ms');
  console.log('\n🔍 Next: Check edge function logs for "✅ Vertex AI + RAG succeeded" and grounding metadata');
  
  console.groupEnd();
  
  return {
    library: { data: libraryData, error: libraryError, duration: libraryDuration },
    insights: { data: insightsData, error: insightsError, duration: insightsDuration }
  };
};
