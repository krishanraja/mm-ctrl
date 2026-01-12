import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { VoiceInput } from '@/components/ui/voice-input';
import { ArrowRight, ArrowLeft, Check, Mic, Plus, X, Briefcase, Sparkles, Zap, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessLine {
  name: string;
  revenuePercentage: number;
  timePercentage: number;
  painPoints: string[];
}

export interface OperatorIntakeData {
  businessLines: BusinessLine[];
  inboxCount: number;
  technicalComfort: number;
  monthlyBudget: string;
  topPainPoints: string[];
  toolsTried: string[];
  decisionsStuckOn: string[];
  failedLeadMagnets: string[];
}

interface OperatorIntakeProps {
  onComplete: () => void;
  onBack?: () => void;
}

export const OperatorIntake: React.FC<OperatorIntakeProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const [intakeData, setIntakeData] = useState<OperatorIntakeData>({
    businessLines: [],
    inboxCount: 1,
    technicalComfort: 3,
    monthlyBudget: '$0',
    topPainPoints: [],
    toolsTried: [],
    decisionsStuckOn: [],
    failedLeadMagnets: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBusinessLine, setNewBusinessLine] = useState({ name: '', revenuePercentage: 0, timePercentage: 0, painPoints: [] as string[] });

  const handleNext = async () => {
    if (currentStep >= totalSteps) {
      await handleSubmit();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Create anonymous session if needed
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
          if (anonError) throw anonError;
          if (!anonData.user) throw new Error('Failed to create anonymous session');
        }
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No user session');

      // Create operator profile
      const { data: profile, error: profileError } = await supabase
        .from('operator_profiles')
        .insert({
          user_id: currentUser.id,
          business_lines: intakeData.businessLines,
          inbox_count: intakeData.inboxCount,
          technical_comfort: intakeData.technicalComfort,
          monthly_budget: intakeData.monthlyBudget,
          top_pain_points: intakeData.topPainPoints,
          decision_stuck_on: intakeData.decisionsStuckOn
        })
        .select()
        .single();

      if (profileError) throw profileError;

      onComplete();
    } catch (error) {
      console.error('Error creating operator profile:', error);
      alert('Failed to save your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addBusinessLine = () => {
    if (newBusinessLine.name.trim()) {
      setIntakeData(prev => ({
        ...prev,
        businessLines: [...prev.businessLines, { ...newBusinessLine }]
      }));
      setNewBusinessLine({ name: '', revenuePercentage: 0, timePercentage: 0, painPoints: [] });
    }
  };

  const removeBusinessLine = (index: number) => {
    setIntakeData(prev => ({
      ...prev,
      businessLines: prev.businessLines.filter((_, i) => i !== index)
    }));
  };

  const commonPainPoints = [
    'Email overwhelm',
    'Lead qualification',
    'Appointment booking',
    'Content creation',
    'Client onboarding',
    'Social media management',
    'Invoice/payment tracking',
    'Customer support'
  ];

  const renderQuestion = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Learning about your business</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              What are your revenue streams?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              List all the ways you make money. Each answer helps me understand your unique business mix so I can give you the right decision each week.
            </p>

            {/* Existing business lines */}
            {intakeData.businessLines.length > 0 && (
              <div className="space-y-3 mb-4">
                {intakeData.businessLines.map((line, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground mb-1">{line.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {line.revenuePercentage}% revenue • {line.timePercentage}% time
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBusinessLine(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add new business line */}
            <Card className="p-4 border-dashed">
              <div className="space-y-3">
                <div>
                  <Label>Business line name</Label>
                  <Input
                    value={newBusinessLine.name}
                    onChange={(e) => setNewBusinessLine(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Brand partnerships, Life coaching"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Revenue %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newBusinessLine.revenuePercentage}
                      onChange={(e) => setNewBusinessLine(prev => ({ ...prev, revenuePercentage: parseInt(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Time %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newBusinessLine.timePercentage}
                      onChange={(e) => setNewBusinessLine(prev => ({ ...prev, timePercentage: parseInt(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBusinessLine}
                  disabled={!newBusinessLine.name.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add business line
                </Button>
              </div>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Personalizing your experience</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Tell us about your setup
            </h3>
            
            <div className="space-y-6">
              <div>
                <Label>How many email inboxes do you manage?</Label>
                <div className="mt-2">
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[intakeData.inboxCount]}
                    onValueChange={(value) => setIntakeData(prev => ({ ...prev, inboxCount: value[0] }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span className="font-medium text-foreground">{intakeData.inboxCount} inboxes</span>
                    <span>10+</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Technical comfort level</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  How comfortable are you connecting tools and building automations?
                </p>
                <div className="mt-2">
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[intakeData.technicalComfort]}
                    onValueChange={(value) => setIntakeData(prev => ({ ...prev, technicalComfort: value[0] }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Not technical</span>
                    <span className="font-medium text-foreground">
                      {intakeData.technicalComfort === 1 ? 'Not technical' :
                       intakeData.technicalComfort === 2 ? 'A little' :
                       intakeData.technicalComfort === 3 ? 'Moderate' :
                       intakeData.technicalComfort === 4 ? 'Comfortable' :
                       'Very technical'}
                    </span>
                    <span>Very technical</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Monthly budget for AI tools</Label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['$0', '$50', '$100', '$200+'].map(budget => (
                    <Button
                      key={budget}
                      variant={intakeData.monthlyBudget === budget ? 'default' : 'outline'}
                      onClick={() => setIntakeData(prev => ({ ...prev, monthlyBudget: budget }))}
                      className="w-full"
                    >
                      {budget}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Identifying your priorities</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                Select top 3
              </Badge>
              <span className="text-xs text-muted-foreground">
                {intakeData.topPainPoints.length}/3 selected
              </span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              What are your biggest bottlenecks?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select your top 3 pain points. I'll use this to prioritize which decisions matter most for your business each week.
            </p>
            <div className="space-y-2">
              {commonPainPoints.map(point => (
                <Button
                  key={point}
                  variant={intakeData.topPainPoints.includes(point) ? 'default' : 'outline'}
                  className="w-full justify-start h-auto py-3"
                  onClick={() => {
                    if (intakeData.topPainPoints.includes(point)) {
                      setIntakeData(prev => ({
                        ...prev,
                        topPainPoints: prev.topPainPoints.filter(p => p !== point)
                      }));
                    } else if (intakeData.topPainPoints.length < 3) {
                      setIntakeData(prev => ({
                        ...prev,
                        topPainPoints: [...prev.topPainPoints, point]
                      }));
                    }
                  }}
                  disabled={!intakeData.topPainPoints.includes(point) && intakeData.topPainPoints.length >= 3}
                >
                  {intakeData.topPainPoints.includes(point) && (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {point}
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              What AI tools have you tried?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              List any AI tools you've experimented with (optional)
            </p>
            <Textarea
              value={intakeData.toolsTried.join('\n')}
              onChange={(e) => setIntakeData(prev => ({
                ...prev,
                toolsTried: e.target.value.split('\n').filter(t => t.trim())
              }))}
              placeholder="ChatGPT, Claude, Notion AI, etc. (one per line)"
              className="min-h-[100px]"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              What decisions are you stuck on?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tell us about any "should I do X or Y" questions you're facing (optional)
            </p>
            
            <div className="space-y-3">
              <div>
                <Label>Example questions</Label>
                <Textarea
                  value={intakeData.decisionsStuckOn.join('\n')}
                  onChange={(e) => setIntakeData(prev => ({
                    ...prev,
                    decisionsStuckOn: e.target.value.split('\n').filter(d => d.trim())
                  }))}
                  placeholder="Should I get ChatGPT Pro or Business account?&#10;Should I use Zapier or Make?&#10;(one per line)"
                  className="min-h-[120px] mt-1"
                />
              </div>

              <div>
                <Label>Failed lead magnets/workflows</Label>
                <Textarea
                  value={intakeData.failedLeadMagnets.join('\n')}
                  onChange={(e) => setIntakeData(prev => ({
                    ...prev,
                    failedLeadMagnets: e.target.value.split('\n').filter(f => f.trim())
                  }))}
                  placeholder="Any free workflows or templates you downloaded that didn't work? (optional)"
                  className="min-h-[100px] mt-1"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return intakeData.businessLines.length > 0;
      case 2: return true; // Always allow
      case 3: return intakeData.topPainPoints.length === 3;
      case 4: return true; // Optional
      case 5: return true; // Optional
      default: return true;
    }
  };

  return (
    <div className="bg-background h-[var(--mobile-vh)] overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col px-3 sm:px-4 lg:px-6 pt-safe-top pb-safe-bottom overflow-hidden">
        {/* Brand Header + Progress */}
        <div className="max-w-2xl mx-auto w-full shrink-0 py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Operator Setup</span>
                {currentStep > 1 && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 ml-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Learning
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Step {currentStep}/{totalSteps}</span>
            </div>
          
          <Card className="shadow-sm border rounded-xl">
            <CardContent className="p-2 sm:p-2.5">
              <Progress value={(currentStep / totalSteps) * 100} className="h-1.5" />
            </CardContent>
          </Card>
        </div>

        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <Card className="shadow-sm border rounded-xl flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardContent className="p-3 sm:p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {renderQuestion()}
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2 border-t shrink-0 mt-2 bg-card">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="rounded-xl text-xs sm:text-sm min-h-[42px]"
                  size="sm"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
                <Button
                  variant="cta"
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex-1 rounded-xl text-xs sm:text-sm min-h-[42px] group"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                      Preparing your dashboard...
                    </>
                  ) : currentStep === totalSteps ? (
                    <>
                      Complete Setup
                      <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
