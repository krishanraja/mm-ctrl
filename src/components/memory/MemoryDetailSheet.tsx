/**
 * MemoryDetailSheet Component
 * 
 * Bottom sheet for viewing and editing a single memory item.
 * Supports inline editing and full editor mode.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Save, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUpdateMemory, useDeleteMemory } from '@/hooks/useMemoryQueries';
import type { UserMemoryFact } from '@/types/memory';
import { haptics } from '@/lib/haptics';

interface MemoryDetailSheetProps {
  memory: UserMemoryFact | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryDetailSheet: React.FC<MemoryDetailSheetProps> = ({
  memory,
  isOpen,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState('');
  const [editedContext, setEditedContext] = useState('');
  const [editedLabel, setEditedLabel] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();

  // Reset state when memory changes
  useEffect(() => {
    if (memory) {
      setEditedValue(memory.fact_value);
      setEditedContext(memory.fact_context || '');
      setEditedLabel(memory.fact_label);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setError(null);
    }
  }, [memory]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      haptics?.light?.();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSave = async () => {
    if (!memory) return;
    
    setError(null);
    
    try {
      await updateMemory.mutateAsync({
        id: memory.id,
        fact_value: editedValue,
        fact_context: editedContext || undefined,
        fact_label: editedLabel,
        verification_status: memory.verification_status === 'inferred' ? 'corrected' : memory.verification_status,
      });
      setIsEditing(false);
      haptics?.success?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      haptics?.error?.();
    }
  };

  const handleDelete = async () => {
    if (!memory) return;
    
    setError(null);
    
    try {
      await deleteMemory.mutateAsync(memory.id);
      haptics?.success?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete memory');
      haptics?.error?.();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!memory) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 400, mass: 0.8 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[70]",
              "h-[85vh] bg-background rounded-t-3xl",
              "border-t border-border shadow-2xl",
              "flex flex-col"
            )}
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? 'Edit Memory' : 'Memory Details'}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="h-10 w-10"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Error display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {isEditing ? (
                /* Edit mode */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Label</Label>
                    <Input
                      id="label"
                      value={editedLabel}
                      onChange={(e) => setEditedLabel(e.target.value)}
                      placeholder="e.g., Your Role"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value">Value</Label>
                    <Textarea
                      id="value"
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)}
                      placeholder="Enter the memory content..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context">Context (optional)</Label>
                    <Textarea
                      id="context"
                      value={editedContext}
                      onChange={(e) => setEditedContext(e.target.value)}
                      placeholder="Additional context or source..."
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="space-y-6">
                  {/* Main content */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {memory.fact_label}
                    </p>
                    <p className="text-lg text-foreground">
                      {memory.fact_value}
                    </p>
                  </div>

                  {/* Context */}
                  {memory.fact_context && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Context</p>
                      <p className="text-sm text-foreground/80 italic">
                        "{memory.fact_context}"
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Category</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {memory.fact_category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Source</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {memory.source_type}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs capitalize",
                          memory.verification_status === 'verified' && "bg-green-500/10 text-green-600",
                          memory.verification_status === 'corrected' && "bg-blue-500/10 text-blue-600",
                          memory.verification_status === 'inferred' && "bg-yellow-500/10 text-yellow-600"
                        )}
                      >
                        {memory.verification_status === 'verified' && <Check className="w-3 h-3 mr-1" />}
                        {memory.verification_status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Confidence</span>
                      <span className="text-xs text-foreground">
                        {Math.round(memory.confidence_score * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Created</span>
                      <span className="text-xs text-foreground">
                        {formatDate(memory.created_at)}
                      </span>
                    </div>

                    {memory.updated_at !== memory.created_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Updated</span>
                        <span className="text-xs text-foreground">
                          {formatDate(memory.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-border pb-safe">
              {isEditing ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedValue(memory.fact_value);
                      setEditedContext(memory.fact_context || '');
                      setEditedLabel(memory.fact_label);
                    }}
                    className="flex-1 border-0"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMemory.isPending || !editedValue.trim()}
                    className="flex-1 border-0"
                  >
                    {updateMemory.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              ) : showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    Are you sure you want to delete this memory?
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
                      onClick={handleDelete}
                      disabled={deleteMemory.isPending}
                      className="flex-1 border-0"
                    >
                      {deleteMemory.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Memory
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemoryDetailSheet;
