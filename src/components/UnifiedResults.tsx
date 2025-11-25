import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, TrendingUp, Brain, Sparkles, Users } from 'lucide-react';
import { LeadershipBenchmarkV2 } from './LeadershipBenchmarkV2';
import { PromptLibraryV2 } from './PromptLibraryV2';
import { TensionsView } from './TensionsView';
import { BenchmarkComparison } from './BenchmarkComparison';
import { ConsentManager } from './ConsentManager';
import { ContactData } from './ContactCollectionForm';
import { DeepProfileData } from './DeepProfileQuestionnaire';
import { aggregateLeaderResults } from '@/utils/aggregateLeaderResults';

interface UnifiedResultsProps {
  assessmentData: any;
  promptLibrary: any;
  contactData: ContactData;
  deepProfileData: DeepProfileData | null;
  sessionId: string | null;
  onBack?: () => void;
}

export const UnifiedResults: React.FC<UnifiedResultsProps> = ({
  assessmentData,
  promptLibrary,
  contactData,
  deepProfileData,
  sessionId,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [aggregatedData, setAggregatedData] = useState<any>(null);

  // UUID validation helper
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Restore assessment ID from persistence
  useEffect(() => {
    const checkForAssessmentId = async () => {
      const { getPersistedAssessmentId } = await import('@/utils/assessmentPersistence');
      const { assessmentId: storedId, source } = getPersistedAssessmentId();
      
      if (storedId && isValidUUID(storedId) && storedId !== assessmentId) {
        console.log('📊 Assessment ID restored from:', source, storedId);
        setAssessmentId(storedId);
        return true;
      } else if (storedId && !isValidUUID(storedId)) {
        console.error('❌ Invalid assessment ID format:', storedId);
      }
      return false;
    };
    
    checkForAssessmentId();
  }, []);

  // Fetch aggregated data for Compare tab
  useEffect(() => {
    const fetchAggregatedData = async () => {
      if (!assessmentId) return;
      try {
        const data = await aggregateLeaderResults(assessmentId, false);
        setAggregatedData(data);
      } catch (error) {
        console.error('❌ Failed to fetch aggregated data:', error);
      }
    };
    fetchAggregatedData();
  }, [assessmentId]);

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 mb-12 bg-secondary/50 p-1 rounded-lg">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center justify-center gap-2"
            >
              <Brain className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tensions" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center justify-center gap-2"
            >
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Tensions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="compare" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            {assessmentId ? (
              <LeadershipBenchmarkV2 
                assessmentId={assessmentId}
                contactData={contactData}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading diagnostic data...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tensions" className="mt-0">
            {assessmentId ? (
              <TensionsView 
                assessmentId={assessmentId}
                contactData={contactData}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading diagnostic data...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="mt-0">
            {assessmentId && aggregatedData?.leadershipComparison ? (
              <BenchmarkComparison 
                userScore={aggregatedData.benchmarkScore}
                userTier={aggregatedData.benchmarkTier}
                industry={contactData.companyName}
                companySize={contactData.companyName}
                role={contactData.role || 'Leader'}
                leadershipComparison={aggregatedData.leadershipComparison}
                showCohortToggle={true}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading peer comparison data...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tools" className="mt-0">
            {assessmentId ? (
              <PromptLibraryV2 
                assessmentId={assessmentId}
                contactData={contactData}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading thinking tools...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="privacy" className="mt-0">
            <div className="max-w-3xl mx-auto">
              <ConsentManager
                userId={sessionId || undefined}
                onUpdate={(consent) => console.log('Consent updated:', consent)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
