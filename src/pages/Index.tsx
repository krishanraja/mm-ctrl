import { UnifiedAssessment } from '@/components/UnifiedAssessment';
import { HeroSection } from '@/components/HeroSection';
import { VoiceOrchestrator } from '@/components/voice/VoiceOrchestrator';
import { SingleScrollResults } from '@/components/SingleScrollResults';
import AuthScreen from '@/components/auth/AuthScreen';
import { QuickVoiceEntry } from '@/components/QuickVoiceEntry';
import { ModeSelector } from '@/components/operator/ModeSelector';
import { OperatorIntake } from '@/components/operator/OperatorIntake';
import { SplashScreen } from '@/components/ui/splash-screen';
import { AssessmentProvider, useAssessment } from '@/contexts/AssessmentContext';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { persistAssessmentId, getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import type { User } from '@supabase/supabase-js';

// Simplified: email-capture mode removed since QuickVoiceEntry handles it inline
type AssessmentMode = 'hero' | 'mode-select' | 'operator-intake' | 'quick-entry' | 'voice' | 'quiz' | 'signin' | 'view-results';

const IndexContent = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AssessmentMode>('hero');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const [userMode, setUserMode] = useState<'leader' | 'operator' | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const { contactData, setContactData } = useAssessment();

  // Combined: Load user state and check redirect in single effect to avoid race conditions
  useEffect(() => {
    let isMounted = true;

    const initializeAuthAndRedirect = async () => {
      // Get initial session and user state
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      
      if (isMounted) {
        setUser(currentUser);
      }

      // Check for redirect: Handle users with profiles/assessments
      const { assessmentId } = getPersistedAssessmentId();
      
      if (currentUser && !currentUser.is_anonymous) {
        // Check if user has operator profile
        const { data: operatorProfile } = await supabase
          .from('operator_profiles')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        // Check for leader assessment
        const hasLeaderAssessment = !!assessmentId;
        
        // Decision logic for authenticated users
        if (operatorProfile && hasLeaderAssessment) {
          // User has both - check preferred mode or let them choose
          const preferredMode = sessionStorage.getItem('mindmaker_user_mode');
          if (preferredMode === 'operator') {
            // Redirect to operator dashboard
            if (isMounted) {
              navigate('/dashboard', { replace: true });
              return;
            }
          } else if (preferredMode === 'leader') {
            // Redirect to leader dashboard
            if (isMounted) {
              navigate('/dashboard', { replace: true });
              return;
            }
          } else {
            // No preference set - show mode selector to let them choose
            if (isMounted) {
              setMode('mode-select');
              setIsCheckingRedirect(false);
              return;
            }
          }
        } else if (operatorProfile) {
          // Only operator profile - redirect to operator dashboard
          if (isMounted) {
            // Set mode preference
            sessionStorage.setItem('mindmaker_user_mode', 'operator');
            navigate('/dashboard', { replace: true });
            return;
          }
        } else if (hasLeaderAssessment) {
          // Only leader assessment - redirect to leader dashboard
          if (isMounted) {
            // Set mode preference
            sessionStorage.setItem('mindmaker_user_mode', 'leader');
            navigate('/dashboard', { replace: true });
            return;
          }
        } else {
          // Neither profile nor assessment - show mode selector for new users
          if (isMounted) {
            setMode('mode-select');
          }
        }
      }

      // All other cases: stay on homepage
      // - Authenticated user without baseline → show diagnostic button
      // - Anonymous user with baseline → show "Sign in to continue"
      // - Anonymous user without baseline → show diagnostic button
      // - No user with baseline → show "Sign in to continue"
      // - No user without baseline → show diagnostic button
      
      if (isMounted) {
        setIsCheckingRedirect(false);
      }
    };

    initializeAuthAndRedirect();

    // Listen for auth changes and link baseline if user signs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        // Link baseline to user account when they sign in/up
        if (event === 'SIGNED_IN' && newUser && !newUser.is_anonymous) {
          const { assessmentId } = getPersistedAssessmentId();
          if (assessmentId && newUser.id) {
            try {
              const { linkAssessmentToUser } = await import('@/utils/assessmentPersistence');
              await linkAssessmentToUser(assessmentId, newUser.id);
              console.log('✅ Linked baseline to user account');
            } catch (error) {
              console.warn('⚠️ Failed to link baseline to user:', error);
            }
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    // Clear baseline on sign out to prevent data confusion with different accounts
    const { clearPersistedAssessmentId } = await import('@/utils/assessmentPersistence');
    clearPersistedAssessmentId();
    await supabase.auth.signOut();
    setUser(null);
  };

  // QuickVoiceEntry handles email/password inline, then guides to assessment or dashboard
  const handleQuickEntryComplete = useCallback((result: unknown, shouldStartAssessment?: boolean) => {
    // CRITICAL: Operators should never see the quiz/assessment
    if (userMode === 'operator') {
      navigate('/dashboard');
      return;
    }
    
    if (shouldStartAssessment) {
      // Start the full 2-min assessment (leaders only)
      setMode('quiz');
    } else {
      // Skip to dashboard
      navigate('/dashboard');
    }
  }, [navigate, userMode]);

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

  const handleModeSelect = useCallback((selectedMode: 'leader' | 'operator') => {
    setUserMode(selectedMode);
    // Persist mode to sessionStorage for consistency
    sessionStorage.setItem('mindmaker_user_mode', selectedMode);
    
    // Check if user already has profile for selected mode
    if (user && !user.is_anonymous) {
      if (selectedMode === 'operator') {
        // Check if operator profile exists
        supabase
          .from('operator_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data: operatorProfile }) => {
            if (operatorProfile) {
              // Profile exists - go to dashboard
              navigate('/dashboard');
            } else {
              // No profile - go to intake
              setMode('operator-intake');
            }
          });
      } else {
        // Leader mode
        const { assessmentId } = getPersistedAssessmentId();
        if (assessmentId) {
          // Assessment exists - go to dashboard
          navigate('/dashboard');
        } else {
          // No assessment - show hero section
          setMode('hero');
        }
      }
    } else {
      // Not authenticated - go to appropriate flow
      if (selectedMode === 'operator') {
        setMode('operator-intake');
      } else {
        setMode('hero');
      }
    }
  }, [user, navigate]);

  // Restore user mode from sessionStorage on mount
  useEffect(() => {
    const storedMode = sessionStorage.getItem('mindmaker_user_mode') as 'leader' | 'operator' | null;
    if (storedMode && (storedMode === 'leader' || storedMode === 'operator')) {
      setUserMode(storedMode);
    }
  }, []);

  const handleOperatorIntakeComplete = useCallback(() => {
    // After intake, redirect to dashboard
    navigate('/dashboard');
  }, [navigate]);

  // Show splash screen first, then loading/redirect check
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show loading while checking redirect
  if (isCheckingRedirect) {
    return (
      <div className="h-[var(--mobile-vh)] overflow-hidden bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {mode === 'mode-select' ? (
        <div className="h-[var(--mobile-vh)] overflow-hidden bg-background flex items-center justify-center p-4">
          <div className="w-full h-full flex items-center justify-center">
            <ModeSelector
              onSelectLeader={() => handleModeSelect('leader')}
              onSelectOperator={() => handleModeSelect('operator')}
            />
          </div>
        </div>
      ) : mode === 'operator-intake' ? (
        <OperatorIntake
          onComplete={handleOperatorIntakeComplete}
          onBack={() => setMode('mode-select')}
        />
      ) : mode === 'quick-entry' ? (
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
          userMode={userMode}
        />
      ) : mode === 'signin' ? (
        <div className="h-[var(--mobile-vh)] overflow-hidden flex items-center justify-center p-4">
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
            onStartVoice={() => {
              // Operators should not access voice entry (it leads to assessment)
              if (userMode === 'operator') {
                setMode('operator-intake');
                return;
              }
              setMode('quick-entry');
            }} 
            onStartQuiz={() => {
              // CRITICAL: Operators should never access quiz
              if (userMode === 'operator') {
                console.warn('Operators cannot access leader diagnostic');
                return;
              }
              setMode('quiz');
            }}
            onSignIn={() => setMode('signin')}
            user={user}
            onSignOut={handleSignOut}
            onSelectMode={() => setMode('mode-select')}
            userMode={userMode}
            onStartOperatorIntake={() => setMode('operator-intake')}
          />
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
