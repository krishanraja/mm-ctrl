/**
 * useMarkdownImport Hook
 *
 * Reusable hook for importing markdown/text files and extracting memories.
 * Used across dashboard, memory center, and empty states.
 */

import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserMemory } from './useUserMemory';
import { useToast } from './use-toast';
import { memoryKeys } from './useMemoryQueries';

export type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

interface MarkdownImportResult {
  extracted: number;
  fileName: string;
}

interface UseMarkdownImportReturn {
  /** Open the file picker */
  triggerImport: () => void;
  /** Handle file(s) from drag-and-drop */
  handleFiles: (files: FileList) => void;
  /** Current status */
  status: ImportStatus;
  /** Whether import is in progress */
  isImporting: boolean;
  /** Result after successful import */
  result: MarkdownImportResult | null;
  /** Error message */
  error: string | null;
  /** Props to spread on a hidden <input type="file"> */
  fileInputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    type: 'file';
    accept: string;
    className: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

export function useMarkdownImport(): UseMarkdownImportReturn {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<MarkdownImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();
  const { extractFromTranscript } = useUserMemory();
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    const validExtensions = ['.md', '.txt', '.markdown'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setStatus('error');
      setError('Please select a markdown (.md) or text (.txt) file');
      return;
    }

    setStatus('importing');
    setResult(null);
    setError(null);

    try {
      const text = await file.text();

      if (!text.trim()) {
        setStatus('error');
        setError('File is empty');
        return;
      }

      const extractionResult = await extractFromTranscript(text, undefined, 'markdown');

      if (extractionResult.success) {
        const extracted = extractionResult.facts_extracted || 0;
        setStatus('success');
        setResult({ extracted, fileName: file.name });
        queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });

        toast({
          title: `${extracted} memories extracted`,
          description: `Imported from ${file.name}`,
        });
      } else {
        setStatus('error');
        setError(extractionResult.error || 'Failed to extract memories from file');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  }, [extractFromTranscript, queryClient, toast]);

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    if (file) processFile(file);
  }, [processFile]);

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFile]);

  return {
    triggerImport,
    handleFiles,
    status,
    isImporting: status === 'importing',
    result,
    error,
    fileInputProps: {
      ref: fileInputRef,
      type: 'file' as const,
      accept: '.md,.txt,.markdown',
      className: 'hidden',
      onChange: handleChange,
    },
  };
}
