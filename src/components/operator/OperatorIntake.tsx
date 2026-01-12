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
import { DualPercentageSlider } from './DualPercentageSlider';
import { VoiceFirstInput } from './VoiceFirstInput';
import { ToolCheckboxGrid } from './ToolCheckboxGrid';
import { haptic } from '@/utils/haptic';

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
  const [newBusinessLine, setNewBusinessLine] = useState({ name: '', revenuePercentage: 50, timePercentage: 50, painPoints: [] as string[] });
  const [voiceInputForTools, setVoiceInputForTools] = useState('');
  const [voiceInputForDecisions, setVoiceInputForDecisions] = useState('');

  const commonBusinessTypes = [
    'Life Coaching',
    'Brand Partnerships',
    'Consulting',
    'Online Courses',
    'Group Coaching',
    'Agency Services',
    'E-commerce',
    'SaaS',
    'Affiliate Marketing',
    'Digital Products'
  ];

  const handleNext = async () => {
    haptic.double();
    if (currentStep >= totalSteps) {
      await handleSubmit();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    haptic.light();
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
    if (newBusinessLine.name.trim() && newBusinessLine.revenuePercentage + newBusinessLine.timePercentage === 100) {
      haptic.double();
      setIntakeData(prev => ({
        ...prev,
        businessLines: [...prev.businessLines, { ...newBusinessLine }]
      }));
      setNewBusinessLine({ name: '', revenuePercentage: 50, timePercentage: 50, painPoints: [] });
    }
  };

  const removeBusinessLine = (index: number) => {
    haptic.light();
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
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Learning about your business</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              What are your revenue streams?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              List all the ways you make money. Each answer helps me understand your unique business mix so I can give you the right decision each week.
            </p>

            {/* Existing business lines */}
            {intakeData.businessLines.length > 0 && (
              <div className="space-y-3 mb-6">
                {intakeData.businessLines.map((line, index) => (
                  <Card key={index} className="p-4">
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
                        className="h-10 w-10 p-0 min-h-[44px] min-w-[44px]"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add new business line */}
            <Card className="p-4 sm:p-6 border-dashed">
              <div className="space-y-6">
                {/* Business Line Name - Voice First */}
                <div>
                  <VoiceFirstInput
                    value={newBusinessLine.name}
                    onValueChange={(value) => setNewBusinessLine(prev => ({ ...prev, name: value }))}
                    placeholder="Say your business line name"
                    label="Business line name"
                    showTextFallback={true}
                  />
                  
                  {/* Quick-select chips */}
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Or choose a common type:</p>
                    <div className="flex flex-wrap gap-2">
                      {commonBusinessTypes.map(type => (
                        <Button
                          key={type}
                          type="button"
                          variant={newBusinessLine.name === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            haptic.light();
                            setNewBusinessLine(prev => ({ ...prev, name: type }));
                          }}
                          className="h-10 min-h-[44px] text-xs"
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue & Time Percentages - Dual Slider */}
                {newBusinessLine.name && (
                  <div>
                    <DualPercentageSlider
                      revenuePercentage={newBusinessLine.revenuePercentage}
                      timePercentage={newBusinessLine.timePercentage}
                      onRevenueChange={(value) => setNewBusinessLine(prev => ({ ...prev, revenuePercentage: value }))}
                      onTimeChange={(value) => setNewBusinessLine(prev => ({ ...prev, timePercentage: value }))}
                    />
                  </div>
                )}

                {/* Add Button */}
                <Button
                  variant="cta"
                  size="lg"
                  onClick={addBusinessLine}
                  disabled={!newBusinessLine.name.trim() || newBusinessLine.revenuePercentage + newBusinessLine.timePercentage !== 100}
                  className="w-full min-h-[56px] rounded-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
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
                    onValueChange={(value) => {
                      haptic.medium();
                      setIntakeData(prev => ({ ...prev, inboxCount: value[0] }));
                    }}
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
                    onValueChange={(value) => {
                      haptic.medium();
                      setIntakeData(prev => ({ ...prev, technicalComfort: value[0] }));
                    }}
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
                      onClick={() => {
                        haptic.light();
                        setIntakeData(prev => ({ ...prev, monthlyBudget: budget }));
                      }}
                      className="w-full min-h-[44px]"
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
                  className="w-full justify-start h-auto py-3 min-h-[44px]"
                  onClick={() => {
                    haptic.light();
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
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              What AI tools have you tried?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Select the tools you've experimented with (optional)
            </p>

            {/* Checkbox Grid */}
            <ToolCheckboxGrid
              selectedTools={intakeData.toolsTried}
              onToolsChange={(tools) => setIntakeData(prev => ({ ...prev, toolsTried: tools }))}
              className="mb-6"
            />

            {/* Voice Input for Other Tools */}
            <div>
              <VoiceFirstInput
                value={voiceInputForTools}
                onValueChange={(transcript) => {
                  setVoiceInputForTools(transcript);
                }}
                placeholder="Or say other tools you've tried"
                label="Other tools"
                showTextFallback={true}
              />
              {voiceInputForTools && (
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      haptic.double();
                      // Parse transcript to extract tool names
                      const toolNames = voiceInputForTools
                        .split(/[,\n]/)
                        .map(t => t.trim())
                        .filter(t => t.length > 0);
                      
                      if (toolNames.length > 0) {
                        setIntakeData(prev => ({
                          ...prev,
                          toolsTried: [...new Set([...prev.toolsTried, ...toolNames])]
                        }));
                        setVoiceInputForTools(''); // Clear after adding
                      }
                    }}
                    className="min-h-[44px]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tools
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      haptic.light();
                      setVoiceInputForTools('');
                    }}
                    className="min-h-[44px]"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Tools Display */}
            {intakeData.toolsTried.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Selected ({intakeData.toolsTried.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {intakeData.toolsTried.map(tool => (
                    <Badge
                      key={tool}
                      variant="secondary"
                      className="px-3 py-1.5 text-sm"
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        const exampleQuestions = [
          "Should I get ChatGPT Pro or Business account?",
          "Should I use Zapier or Make?",
          "Should I build my own tool or use existing SaaS?",
          "Should I focus on automation or content creation?"
        ];

        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              What decisions are you stuck on?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tell us about any "should I do X or Y" questions you're facing (optional)
            </p>
            
            {/* Smart Suggestions */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-3">Quick examples:</p>
              <div className="space-y-2">
                {exampleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 min-h-[44px]"
                    onClick={() => {
                      haptic.light();
                      setIntakeData(prev => ({
                        ...prev,
                        decisionsStuckOn: [...prev.decisionsStuckOn, question]
                      }));
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {question}
                  </Button>
                ))}
              </div>
            </div>

            {/* Voice Input for Decisions */}
            <div>
              <VoiceFirstInput
                value={voiceInputForDecisions}
                onValueChange={(transcript) => {
                  setVoiceInputForDecisions(transcript);
                }}
                placeholder="Say your decision questions"
                label="Your decision questions"
                showTextFallback={true}
              />
              {voiceInputForDecisions && (
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      haptic.double();
                      // Split by newlines or periods to get multiple questions
                      const questions = voiceInputForDecisions
                        .split(/[.\n]/)
                        .map(q => q.trim())
                        .filter(q => q.length > 0 && q.length > 10); // Filter out very short fragments
                      
                      if (questions.length > 0) {
                        setIntakeData(prev => ({
                          ...prev,
                          decisionsStuckOn: [...prev.decisionsStuckOn, ...questions]
                        }));
                        setVoiceInputForDecisions(''); // Clear after adding
                      } else {
                        // If no questions parsed, add the whole transcript as one question
                        setIntakeData(prev => ({
                          ...prev,
                          decisionsStuckOn: [...prev.decisionsStuckOn, voiceInputForDecisions]
                        }));
                        setVoiceInputForDecisions('');
                      }
                    }}
                    className="min-h-[44px]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      haptic.light();
                      setVoiceInputForDecisions('');
                    }}
                    className="min-h-[44px]"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Display Selected Questions */}
            {intakeData.decisionsStuckOn.length > 0 && (
              <div className="mt-6 space-y-2">
                <Label className="text-sm font-medium">Your questions:</Label>
                <div className="space-y-2">
                  {intakeData.decisionsStuckOn.map((question, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-foreground flex-1">{question}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            haptic.light();
                            setIntakeData(prev => ({
                              ...prev,
                              decisionsStuckOn: prev.decisionsStuckOn.filter((_, i) => i !== index)
                            }));
                          }}
                          className="h-8 w-8 p-0 min-h-[44px] min-w-[44px] flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Lead Magnets */}
            <div className="mt-8 pt-6 border-t">
              <Label className="text-sm font-medium mb-2 block">Failed lead magnets/workflows</Label>
              <p className="text-xs text-muted-foreground mb-4">
                Any free workflows or templates you downloaded that didn't work? (optional)
              </p>
              <VoiceFirstInput
                value={intakeData.failedLeadMagnets.join('\n')}
                onValueChange={(transcript) => {
                  const items = transcript
                    .split(/[,\n]/)
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
                  
                  setIntakeData(prev => ({
                    ...prev,
                    failedLeadMagnets: items.length > 0 ? items : []
                  }));
                }}
                placeholder="Say what didn't work"
                showTextFallback={true}
              />
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
                  className="rounded-xl text-xs sm:text-sm min-h-[44px] min-w-[44px]"
                  size="sm"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Back
                </Button>
                <Button
                  variant="cta"
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex-1 rounded-xl text-xs sm:text-sm min-h-[44px] group"
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
