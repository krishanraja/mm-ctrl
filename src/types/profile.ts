/**
 * Type definitions for deep profile data
 * All fields are optional to handle partial data gracefully
 */

export interface DeepProfileData {
  workBreakdown?: {
    writing?: number;
    presentations?: number;
    planning?: number;
    decisions?: number;
    coaching?: number;
  };
  timeWaste?: number;
  timeWasteExamples?: string;
  delegationTasks?: string[];
  delegateTasks?: string[];
  biggestChallenge?: string;
  stakeholders?: string[];
  communicationStyle?: string[];
  informationNeeds?: string[];
  transformationGoal?: string;
  urgency?: string;
  primaryBottleneck?: string;
  thinkingProcess?: string;
}
