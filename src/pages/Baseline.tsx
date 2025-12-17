import { useAssessment } from '@/contexts/AssessmentContext';
import { SingleScrollResults } from '@/components/SingleScrollResults';

/**
 * Baseline
 * - Keeps the existing diagnostic “snapshot” experience accessible.
 * - This will gradually be reframed as “your starting point”, not the product.
 */
export default function Baseline() {
  const { contactData, deepProfileData, sessionId, promptLibrary } = useAssessment();

  // SingleScrollResults is resilient: it restores assessmentId from persistence internally.
  // We pass minimal props; most data is pulled from DB via aggregateLeaderResults.
  if (!contactData) {
    // Provide a minimal shape to avoid blocking baseline viewing.
    // Unlock flow can still collect email/password if user wants to claim history.
    const minimalContact: any = {
      fullName: 'Leader',
      email: '',
      companyName: '',
      department: '',
      companySize: '',
      primaryFocus: '',
      timeline: '',
      consentToInsights: true,
    };

    return (
      <SingleScrollResults
        assessmentData={{}}
        promptLibrary={null}
        contactData={minimalContact}
        deepProfileData={null}
        sessionId={sessionId || null}
      />
    );
  }

  return (
    <SingleScrollResults
      assessmentData={{}}
      promptLibrary={promptLibrary}
      contactData={contactData}
      deepProfileData={deepProfileData}
      sessionId={sessionId || null}
    />
  );
}

