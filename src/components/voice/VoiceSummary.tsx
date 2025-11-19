import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompassResults } from './CompassResults';
import { RoiEstimate } from '@/types/voice';
import { Award, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { orchestrateAssessmentV2 } from '@/utils/orchestrateAssessmentV2';
import { mapVoiceToAssessment, createMinimalDeepProfile } from '@/utils/mapVoiceToAssessment';
import { supabase } from '@/integrations/supabase/client';

interface VoiceSummaryProps {
  compassResults: any;
  roiEstimate: RoiEstimate | null;
  onUnlock: () => void;
  sessionId: string;
}

export const VoiceSummary: React.FC<VoiceSummaryProps> = ({
  compassResults,
  roiEstimate,
  onUnlock,
  sessionId
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showContactForm, setShowContactForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Contact form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');

  const handleUnlockV2Diagnostic = async () => {
    if (!email || !fullName || !companyName || !companySize) {
      toast({
        title: 'Please complete all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    console.log('🔓 Starting v2 diagnostic unlock for voice user...');

    try {
      // Map voice data to assessment format
      const assessmentData = mapVoiceToAssessment(compassResults, roiEstimate);
      console.log('📊 Mapped voice data to assessment format:', assessmentData);

      // Create minimal deep profile
      const deepProfile = createMinimalDeepProfile(compassResults, email);

      // Call v2 orchestration
      const result = await orchestrateAssessmentV2(
        {
          fullName,
          companyName,
          email,
          department: 'Executive',
          companySize,
          primaryFocus: 'AI Leadership',
          timeline: 'Now',
          consentToInsights: true
        },
        assessmentData.responses,
        deepProfile,
        sessionId,
        'voice'
      );

      console.log('✅ V2 orchestration complete:', result);

      // Link voice session to assessment
      await supabase.from('voice_sessions').update({
        gated_unlocked_at: new Date().toISOString(),
        sprint_signup_source: 'voice_v2_unlock'
      }).eq('session_id', sessionId);

      // Store v2 assessment ID for results page
      sessionStorage.setItem('v2_assessment_id', result.assessmentId);
      sessionStorage.setItem('contact_email', email);

      toast({
        title: 'Full Diagnostic Unlocked!',
        description: 'Generating your advanced insights...'
      });

      // Navigate to v2 results
      navigate('/?view=results');
      
    } catch (error: any) {
      console.error('❌ Error unlocking v2 diagnostic:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlock diagnostic. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Your AI Leadership Assessment
        </h1>
        <p className="text-muted-foreground">
          Completed in under 2 minutes
        </p>
      </div>

      {/* Leadership Profile */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Your AI Leadership Profile</h2>
        </div>
        <CompassResults results={compassResults} />
      </section>

      {/* Business Case */}
      {roiEstimate && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Business Case Snapshot</h2>
          </div>
          
          <Card className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">
                ${roiEstimate.conservativeValue.monthly.toLocaleString()} - ${roiEstimate.likelyValue.monthly.toLocaleString()}/month
              </p>
              <p className="text-muted-foreground mt-1">
                Conservative to likely potential value
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">90-Day Forecast</h4>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: '30 days', value: roiEstimate.forecast.day30 },
                  { label: '60 days', value: roiEstimate.forecast.day60 },
                  { label: '90 days', value: roiEstimate.forecast.day90 }
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-semibold">${item.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Next Steps */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Next Steps</h2>
        </div>
        
        <Card className="p-6">
          <ol className="space-y-3">
            {compassResults.quickWins.map((win: string, index: number) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground">{win}</p>
              </li>
            ))}
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                {compassResults.quickWins.length + 1}
              </span>
              <p className="text-sm text-foreground">
                This quarter: Pilot one AI workflow automation
              </p>
            </li>
          </ol>
        </Card>
      </section>

      {/* Unlock CTA */}
      <Card className="p-8 space-y-6 bg-gradient-to-br from-primary/5 to-primary/10">
        {!showContactForm ? (
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Unlock Full AI Leadership Diagnostic</h3>
            <p className="text-muted-foreground">
              Access advanced insights including risk signals, organizational tensions, and personalized AI prompt library
            </p>
            <Button 
              onClick={() => setShowContactForm(true)} 
              size="lg" 
              className="w-full sm:w-auto"
            >
              Get Full Diagnostic →
            </Button>
            <p className="text-sm text-muted-foreground">
              Takes 30 seconds • Unlocks 15+ additional insights
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
              <p className="text-sm text-muted-foreground">
                This unlocks your full AI Leadership Diagnostic with advanced insights
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size *</Label>
                <Select value={companySize} onValueChange={setCompanySize} disabled={isProcessing}>
                  <SelectTrigger id="companySize">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                    <SelectItem value="1001+">1,000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowContactForm(false)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleUnlockV2Diagnostic}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Unlock Full Diagnostic'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
