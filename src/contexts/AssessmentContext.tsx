import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ContactData } from '@/components/ContactCollectionForm';
import { DeepProfileData } from '@/components/DeepProfileQuestionnaire';

// Assessment insights summary for cross-feature intelligence
export interface AssessmentInsights {
  benchmarkScore: number;
  benchmarkTier: string;
  topTension: string | null;
  topGap: string | null;
  learningStyle: string | null;
  primaryBottleneck: string | null;
  suggestedPromptCategories: string[];
}

interface AssessmentContextValue {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  
  contactData: ContactData | null;
  setContactData: (data: ContactData | null) => void;
  
  deepProfileData: DeepProfileData | null;
  setDeepProfileData: (data: DeepProfileData | null) => void;
  
  promptLibrary: any;
  setPromptLibrary: (library: any) => void;
  
  companyHash: string | null;
  setCompanyHash: (hash: string | null) => void;
  
  // Phase 3: Connected Intelligence
  assessmentInsights: AssessmentInsights | null;
  setAssessmentInsights: (insights: AssessmentInsights | null) => void;
  
  assessmentId: string | null;
  setAssessmentId: (id: string | null) => void;
}

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [deepProfileData, setDeepProfileData] = useState<DeepProfileData | null>(null);
  const [promptLibrary, setPromptLibrary] = useState<any>(null);
  const [companyHash, setCompanyHash] = useState<string | null>(null);
  const [assessmentInsights, setAssessmentInsights] = useState<AssessmentInsights | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const value = {
    sessionId,
    setSessionId,
    contactData,
    setContactData,
    deepProfileData,
    setDeepProfileData,
    promptLibrary,
    setPromptLibrary,
    companyHash,
    setCompanyHash,
    assessmentInsights,
    setAssessmentInsights,
    assessmentId,
    setAssessmentId,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = (): AssessmentContextValue => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
