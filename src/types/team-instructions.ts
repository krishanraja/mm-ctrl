/**
 * Team Instructions Types
 * Generate contextual instructions for team members using Memory Web
 */

export interface TeamInstructionRequest {
  recipientName: string;
  recipientRole: string;
  briefDescription: string;
  focusAreas?: string[];
}

export interface TeamInstructionSection {
  title: string;
  content: string;
}

export interface TeamInstructionResult {
  instructions: string;
  sections: TeamInstructionSection[];
  generatedAt: string;
}
