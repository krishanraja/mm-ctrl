import { UnifiedAssessment } from '@/components/UnifiedAssessment';
import { HeroSection } from '@/components/HeroSection';
import { VoiceOrchestrator } from '@/components/voice/VoiceOrchestrator';
import { AssessmentHistory } from '@/components/AssessmentHistory';
import { SingleScrollResults } from '@/components/SingleScrollResults';
import AuthScreen from '@/components/auth/AuthScreen';
import { AssessmentProvider, useAssessment } from '@/contexts/AssessmentContext';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { persistAssessmentId } from '@/utils/assessmentPersistence';
import type { User } from '@supabase/supabase-js';

type AssessmentMode = 'hero' | 'voice' | 'quiz' | 'signin' | 'view-results';

const IndexContent = () => {
  const [mode, setMode] = useState<AssessmentMode>('hero');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [user, setUser] = useState<User | null>(null);
  const { contactData, setContactData } = useAssessment();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleViewAssessment = useCallback(async (assessmentId: string) => {
    // Persist the assessment ID for the results view
    persistAssessmentId(assessmentId);
    
    // Fetch contact data for this assessment if needed
    try {
      const { data: assessment } = await supabase
        .from('leader_assessments')
        .select('leader_id')
        .eq('id', assessmentId)
        .single();
      
      if (assessment?.leader_id) {
        const { data: leader } = await supabase
          .from('leaders')
          .select('full_name, email, company_name, role_title, industry, company_size')
          .eq('id', assessment.leader_id)
          .single();
        
        if (leader) {
          setContactData({
            fullName: leader.full_name || 'User',
            email: leader.email || '',
            companyName: leader.company_name || '',
            department: leader.role_title || '',
            companySize: leader.company_size || '',
            primaryFocus: '',
            timeline: '',
            consentToInsights: true,
            role: leader.role_title
          });
        }
      }
    } catch (error) {
      console.warn('Could not fetch leader data for assessment:', error);
      // Set minimal contact data to allow viewing
      setContactData({
        fullName: user?.email?.split('@')[0] || 'User',
        email: user?.email || '',
        companyName: '',
        department: '',
        companySize: '',
        primaryFocus: '',
        timeline: '',
        consentToInsights: true
      });
    }
    
    setMode('view-results');
  }, [user, setContactData]);

  return (
    <>
      {mode === 'voice' ? (
        <VoiceOrchestrator 
          sessionId={sessionId}
          onBack={() => setMode('hero')}
        />
      ) : mode === 'quiz' ? (
        <UnifiedAssessment 
          onBack={() => setMode('hero')}
        />
      ) : mode === 'signin' ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <AuthScreen onAuthSuccess={() => setMode('hero')} />
          </div>
        </div>
      ) : mode === 'view-results' && contactData ? (
        <SingleScrollResults
          assessmentData={{}}
          promptLibrary={null}
          contactData={contactData}
          deepProfileData={null}
          sessionId={sessionId}
          onBack={() => setMode('hero')}
        />
      ) : (
        <div className="min-h-screen">
          <HeroSection 
            onStartVoice={() => setMode('voice')} 
            onStartQuiz={() => setMode('quiz')}
            onSignIn={() => setMode('signin')}
            user={user}
            onSignOut={handleSignOut}
          />
          
          {/* Assessment History Section */}
          {user && (
            <div id="assessment-history" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <AssessmentHistory 
                userEmail={user.email || ''}
                onViewAssessment={handleViewAssessment}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

const Index = () => {
  return (
    <AssessmentProvider>
      <IndexContent />
    </AssessmentProvider>
  );
};

export default Index;
