/**
 * ExportImportPanel Component
 *
 * Panel for exporting memory to JSON/CSV and importing from JSON or Markdown.
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, FileJson, FileSpreadsheet, Loader2, AlertCircle, Check, X, ArrowUpRight, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExportMemory, useImportMemory, useBulkDeleteMemory, memoryKeys } from '@/hooks/useMemoryQueries';
import { useUserMemory } from '@/hooks/useUserMemory';

interface ExportImportPanelProps {
  className?: string;
}

export const ExportImportPanel: React.FC<ExportImportPanelProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [extractionResult, setExtractionResult] = useState<{ extracted: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const exportMemory = useExportMemory();
  const importMemory = useImportMemory();
  const bulkDelete = useBulkDeleteMemory();
  const { extractFromTranscript, isExtracting } = useUserMemory();

  const handleExport = async (format: 'json' | 'csv') => {
    setError(null);
    try {
      const blob = await exportMemory.mutateAsync(format);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memory-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportResult(null);
    setExtractionResult(null);

    try {
      const text = await file.text();

      if (file.name.endsWith('.md')) {
        // Markdown path: send to AI extraction
        const result = await extractFromTranscript(text, undefined, 'markdown');
        if (result.success) {
          setExtractionResult({ extracted: result.facts_extracted || 0 });
          queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
        } else {
          setError(result.error || 'Markdown extraction failed');
        }
      } else {
        // JSON path: existing logic
        const data = JSON.parse(text);

        // Handle both array format and object with memories array
        const memories = Array.isArray(data) ? data : data.memories;

        if (!Array.isArray(memories)) {
          throw new Error('Invalid file format: expected an array of memories');
        }

        const result = await importMemory.mutateAsync(memories);
        setImportResult(result);
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON file');
      } else {
        setError(err instanceof Error ? err.message : 'Import failed');
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAll = async () => {
    setError(null);
    try {
      await bulkDelete.mutateAsync({ delete_all: true });
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const isImporting = importMemory.isPending || isExtracting;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-destructive/10 border border-destructive/20"
          >
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:bg-destructive/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import result (JSON) */}
      <AnimatePresence>
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">
                Imported {importResult.imported} memories
                {importResult.skipped > 0 && ` (${importResult.skipped} skipped)`}
              </p>
              <button
                onClick={() => setImportResult(null)}
                className="ml-auto p-1 hover:bg-green-500/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extraction result (Markdown) */}
      <AnimatePresence>
        {extractionResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">
                Extracted {extractionResult.extracted} memories from markdown
              </p>
              <button
                onClick={() => setExtractionResult(null)}
                className="ml-auto p-1 hover:bg-green-500/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Export Wizard CTA */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 via-purple-500/5 to-emerald-500/5">
        <CardContent className="p-4">
          <button
            onClick={() => navigate('/context')}
            className="w-full flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Export to AI</p>
              <p className="text-xs text-muted-foreground">
                Formatted context for ChatGPT, Claude, Gemini, Cursor, and more
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-accent flex-shrink-0" />
          </button>
        </CardContent>
      </Card>

      {/* Export Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Memory
          </CardTitle>
          <CardDescription className="text-sm">
            Download all your memories to your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport('json')}
              disabled={exportMemory.isPending}
              className="border-0 bg-secondary/50"
            >
              {exportMemory.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="w-4 h-4 mr-2" />
              )}
              JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={exportMemory.isPending}
              className="border-0 bg-secondary/50"
            >
              {exportMemory.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              CSV
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            JSON format is recommended for importing back into Mindmaker.
          </p>
        </CardContent>
      </Card>

      {/* Import Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Memory
          </CardTitle>
          <CardDescription className="text-sm">
            Import memories from a JSON or Markdown file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full border-0 bg-secondary/50"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isExtracting ? 'Extracting memories...' : 'Choose file (.json or .md)'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            JSON imports directly. Markdown files are parsed by AI to extract memories.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-sm">
            Permanently delete all your memories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {showDeleteConfirm ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground">
                  Are you sure? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border-0"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAll}
                    disabled={bulkDelete.isPending}
                    className="flex-1 border-0"
                  >
                    {bulkDelete.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Delete All
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete all memories
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportImportPanel;
