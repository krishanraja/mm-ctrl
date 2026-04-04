import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ExportFormat, ExportUseCase, MemoryExportResult } from '@/types/memory';

export function useMemoryExport() {
  const [exportResult, setExportResult] = useState<MemoryExportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [customTitle, setCustomTitle] = useState<string | null>(null);

  const generateExport = useCallback(
    async (format: ExportFormat = 'markdown', useCase: ExportUseCase = 'general', maxTokens: number = 4000) => {
      setIsExporting(true);
      setCustomTitle(null);
      try {
        const { data, error } = await supabase.functions.invoke('memory-export', {
          body: { format, useCase, maxTokens },
        });
        if (error) throw error;
        const result: MemoryExportResult = {
          format,
          use_case: useCase,
          content: data?.context || '',
          token_count: data?.tokenCount || 0,
          last_updated: data?.lastUpdated || new Date().toISOString(),
        };
        setExportResult(result);
        return result;
      } catch (err) {
        console.error('Export failed:', err);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  const generateCustomExport = useCallback(
    async (transcript: string, format: ExportFormat = 'markdown') => {
      setIsExporting(true);
      setCustomTitle(null);
      try {
        const { data, error } = await supabase.functions.invoke('generate-custom-export', {
          body: { transcript, format },
        });
        if (error) throw error;
        const result: MemoryExportResult = {
          format,
          use_case: 'general',
          content: data?.context || '',
          token_count: data?.tokenCount || 0,
          last_updated: data?.lastUpdated || new Date().toISOString(),
        };
        setExportResult(result);
        setCustomTitle(data?.title || null);
        return result;
      } catch (err) {
        console.error('Custom export failed:', err);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  const copyToClipboard = useCallback(async () => {
    if (!exportResult?.content) return false;
    try {
      await navigator.clipboard.writeText(exportResult.content);
      return true;
    } catch {
      return false;
    }
  }, [exportResult]);

  const downloadAsFile = useCallback(
    (filename?: string) => {
      if (!exportResult?.content) return;
      const blob = new Blob([exportResult.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `my-ai-context-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [exportResult],
  );

  return { exportResult, isExporting, generateExport, generateCustomExport, customTitle, copyToClipboard, downloadAsFile };
}
