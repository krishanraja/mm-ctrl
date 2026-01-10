import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building2, Briefcase, Calendar, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AssessmentHistory } from '@/components/AssessmentHistory';
import { persistAssessmentId } from '@/utils/assessmentPersistence';
import { useAssessment } from '@/contexts/AssessmentContext';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { format } from 'date-fns';

interface LeaderProfile {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  company: string | null;
  company_size_band: string | null;
  primary_focus: string | null;
  created_at: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { setContactData } = useAssessment();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<LeaderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentCount, setAssessmentCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        // Load leader profile
        const { data: leaderData, error: leaderError } = await supabase
          .from('leaders')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (leaderError && leaderError.code !== 'PGRST116') {
          console.error('Error loading profile:', leaderError);
        }

        if (leaderData) {
          setProfile(leaderData as LeaderProfile);
        } else {
          // Create minimal profile from auth user
          setProfile({
            id: user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.first_name || null,
            email: user.email || '',
            role: user.user_metadata?.role_title || null,
            company: user.user_metadata?.company_name || null,
            company_size_band: user.user_metadata?.company_size || null,
            primary_focus: null,
            created_at: user.created_at,
          });
        }

        // Count assessments
        const { count } = await supabase
          .from('leader_assessments')
          .select('*', { count: 'exact', head: true })
          .eq('owner_user_id', user.id);

        setAssessmentCount(count || 0);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleViewAssessment = async (assessmentId: string) => {
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
          .select('name, email, company, role')
          .eq('id', assessment.leader_id)
          .single();
        
        if (leader) {
          setContactData({
            fullName: leader.name || 'User',
            email: leader.email || '',
            companyName: leader.company || '',
            department: leader.role || '',
            companySize: '',
            primaryFocus: '',
            timeline: '',
            consentToInsights: true,
            role: leader.role || undefined
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
    
    navigate('/baseline');
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary/30 rounded w-48" />
            <div className="h-64 bg-secondary/30 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Please sign in to view your profile.</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-24">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">Your account information and assessment history</p>
        </div>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{profile?.email || user.email}</div>
              </div>
            </div>

            {profile?.name && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{profile.name}</div>
                </div>
              </div>
            )}

            {profile?.role && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Role</div>
                  <div className="font-medium">{profile.role}</div>
                </div>
              </div>
            )}

            {profile?.company && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Company</div>
                  <div className="font-medium">{profile.company}</div>
                </div>
              </div>
            )}

            {profile?.company_size_band && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Company Size</div>
                  <div className="font-medium">{profile.company_size_band}</div>
                </div>
              </div>
            )}

            {user.created_at && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Member Since</div>
                  <div className="font-medium">
                    {format(new Date(user.created_at), 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {assessmentCount} {assessmentCount === 1 ? 'Assessment' : 'Assessments'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Assessment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Assessment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.email && (
              <AssessmentHistory
                userEmail={user.email}
                onViewAssessment={handleViewAssessment}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
