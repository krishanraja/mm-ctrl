/**
 * Platform-specific setup guides for the Export wizard.
 * Each platform has step-by-step instructions and mobile-specific notes.
 */

import type { ExportFormat } from '@/types/memory';

export interface PlatformStep {
  step: number;
  text: string;
  iconName: 'Settings' | 'User' | 'Clipboard' | 'Check' | 'FileText' | 'FolderOpen' | 'Terminal' | 'MessageSquare' | 'Download';
}

export interface PlatformGuide {
  platform: ExportFormat;
  label: string;
  steps: PlatformStep[];
  mobileNote: string | null;
  filename: string;
}

export const PLATFORM_GUIDES: Record<ExportFormat, PlatformGuide> = {
  chatgpt: {
    platform: 'chatgpt',
    label: 'ChatGPT',
    steps: [
      { step: 1, text: 'Open ChatGPT and click your profile icon', iconName: 'User' },
      { step: 2, text: 'Go to Settings, then Personalization', iconName: 'Settings' },
      { step: 3, text: 'Paste into "Custom Instructions"', iconName: 'Clipboard' },
      { step: 4, text: 'Click Save to apply', iconName: 'Check' },
    ],
    mobileNote: 'Custom Instructions work best from desktop. Tap below to email yourself the file.',
    filename: 'mindmaker-context-chatgpt.md',
  },
  claude: {
    platform: 'claude',
    label: 'Claude',
    steps: [
      { step: 1, text: 'Open Claude and start a new conversation', iconName: 'MessageSquare' },
      { step: 2, text: 'Paste this as the first message', iconName: 'Clipboard' },
      { step: 3, text: 'Claude will use this context for the entire conversation', iconName: 'Check' },
    ],
    mobileNote: null,
    filename: 'mindmaker-context-claude.md',
  },
  gemini: {
    platform: 'gemini',
    label: 'Gemini',
    steps: [
      { step: 1, text: 'Open Google Gemini and start a new chat', iconName: 'MessageSquare' },
      { step: 2, text: 'Paste this as your first message', iconName: 'Clipboard' },
      { step: 3, text: 'Gemini will reference your context throughout the chat', iconName: 'Check' },
    ],
    mobileNote: null,
    filename: 'mindmaker-context-gemini.md',
  },
  cursor: {
    platform: 'cursor',
    label: 'Cursor',
    steps: [
      { step: 1, text: 'Download the file below', iconName: 'Download' },
      { step: 2, text: 'Open your project folder in your file explorer', iconName: 'FolderOpen' },
      { step: 3, text: 'Place the .cursorrules file in your project root', iconName: 'FileText' },
      { step: 4, text: 'Cursor will automatically detect and use it', iconName: 'Check' },
    ],
    mobileNote: 'This requires Cursor IDE on your desktop. Tap below to email yourself the file.',
    filename: '.cursorrules',
  },
  'claude-code': {
    platform: 'claude-code',
    label: 'Claude Code',
    steps: [
      { step: 1, text: 'Download the file below', iconName: 'Download' },
      { step: 2, text: 'Open your project folder in your file explorer', iconName: 'FolderOpen' },
      { step: 3, text: 'Place CLAUDE.md in your project root', iconName: 'FileText' },
      { step: 4, text: 'Claude Code will automatically read it', iconName: 'Check' },
    ],
    mobileNote: 'This requires Claude Code on your desktop. Tap below to email yourself the file.',
    filename: 'CLAUDE.md',
  },
  markdown: {
    platform: 'markdown',
    label: 'Raw Markdown',
    steps: [
      { step: 1, text: 'Copy or download the file', iconName: 'Download' },
      { step: 2, text: 'Paste into any AI tool, note app, or document', iconName: 'Clipboard' },
      { step: 3, text: 'Works anywhere that accepts text or markdown', iconName: 'Check' },
    ],
    mobileNote: null,
    filename: 'mindmaker-context.md',
  },
};
