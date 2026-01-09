import { UnifiedAssessment } from '@/components/UnifiedAssessment';
import { HeroSection } from '@/components/HeroSection';
import { VoiceOrchestrator } from '@/components/voice/VoiceOrchestrator';
import { AssessmentHistory } from '@/components/AssessmentHistory';
import { SingleScrollResults } from '@/components/SingleScrollResults';
import AuthScreen from '@/components/auth/AuthScreen';
import { QuickVoiceEntry } from '@/components/QuickVoiceEntry';
import { AssessmentProvider, useAssessment } from '@/contexts/AssessmentContext';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { persistAssessmentId, getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import type { User } from '@supabase/supabase-js';

// Simplified: email-capture mode removed since QuickVoiceEntry handles it inline
type AssessmentMode = 'hero' | 'quick-entry' | 'voice' | 'quiz' | 'signin' | 'view-results';

const IndexContent = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AssessmentMode>('hero');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const { contactData, setContactData } = useAssessment();

  // Smart redirect: If user has completed diagnostic AND is logged in, go to Dashboard
  useEffect(() => {
    const checkRedirect = async () => {
      const { assessmentId } = getPersistedAssessmentId();
      
      if (assessmentId) {
        // User has completed diagnostic
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && !session.user.is_anonymous) {
          // Logged in with real account - redirect to dashboard
          console.log('✅ Returning user with diagnostic - redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }
      }
      
      setIsCheckingRedirect(false);
    };
    
    checkRedirect();
  }, [navigate]);

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

  // QuickVoiceEntry handles email/password inline, then guides to assessment or dashboard
  const handleQuickEntryComplete = useCallback((result: unknown, shouldStartAssessment?: boolean) => {
    if (shouldStartAssessment) {
      // Start the full 2-min assessment
      setMode('quiz');
    } else {
      // Skip to dashboard
      navigate('/dashboard');
    }
  }, [navigate]);

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

  // Show loading while checking redirect
  if (isCheckingRedirect) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {mode === 'quick-entry' ? (
        <QuickVoiceEntry
          onComplete={handleQuickEntryComplete}
          onSkipToQuiz={() => setMode('quiz')}
        />
      ) : mode === 'voice' ? (
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
        <>
          <HeroSection 
            onStartVoice={() => setMode('quick-entry')} 
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
        </>
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
