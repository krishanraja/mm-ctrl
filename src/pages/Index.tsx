import { UnifiedAssessment } from '@/components/UnifiedAssessment';
import { HeroSection } from '@/components/HeroSection';
import { VoiceOrchestrator } from '@/components/voice/VoiceOrchestrator';
import { AssessmentHistory } from '@/components/AssessmentHistory';
import AuthScreen from '@/components/auth/AuthScreen';
import { AssessmentProvider } from '@/contexts/AssessmentContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type AssessmentMode = 'hero' | 'voice' | 'quiz' | 'signin' | 'history';

const Index = () => {
  const [mode, setMode] = useState<AssessmentMode>('hero');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [user, setUser] = useState<User | null>(null);
  const [viewingAssessmentId, setViewingAssessmentId] = useState<string | null>(null);

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

  return (
    <AssessmentProvider>
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
                onViewAssessment={(assessmentId) => {
                  setViewingAssessmentId(assessmentId);
                  // TODO: Navigate to results view with this assessment ID
                  console.log('View assessment:', assessmentId);
                }}
              />
            </div>
          )}
        </div>
      )}
    </AssessmentProvider>
  );
};

export default Index;
