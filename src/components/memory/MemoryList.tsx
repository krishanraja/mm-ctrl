/**
 * MemoryList Component
 * 
 * Displays list of memory items with search, filters, and pagination.
 * Mobile-first design with pull-to-refresh support.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Loader2, Brain, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemoryItemCard } from './MemoryItemCard';
import { useMemoryList, useDeleteMemory } from '@/hooks/useMemoryQueries';
import type { UserMemoryFact, FactCategory } from '@/types/memory';
import { staggerContainer, slideUp } from '@/lib/motion';

interface MemoryListProps {
  onEditMemory: (memory: UserMemoryFact) => void;
  onAddMemory: () => void;
}

const CATEGORIES: { value: FactCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'identity', label: 'About You' },
  { value: 'business', label: 'Business' },
  { value: 'objective', label: 'Goals' },
  { value: 'blocker', label: 'Challenges' },
  { value: 'preference', label: 'Preferences' },
];

const SOURCES: { value: string | 'all'; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'voice', label: 'Voice' },
  { value: 'manual', label: 'Manual' },
  { value: 'form', label: 'Form' },
];

export const MemoryList: React.FC<MemoryListProps> = ({
  onEditMemory,
  onAddMemory,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FactCategory | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Build filters
  const filters = useMemo(() => ({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    source: selectedSource === 'all' ? undefined : selectedSource,
    search: search || undefined,
  }), [selectedCategory, selectedSource, search]);

  const { data, isLoading, error, refetch } = useMemoryList(filters);
  const deleteMemory = useDeleteMemory();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMemory.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedSource('all');
  };

  const hasActiveFilters = search || selectedCategory !== 'all' || selectedSource !== 'all';

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading your memories...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <X className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-sm text-foreground font-medium mb-2">Failed to load memories</p>
        <p className="text-xs text-muted-foreground mb-4 text-center">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="border-0">
          Try again
        </Button>
      </div>
    );
  }

  const memories = data?.memories || [];

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Header */}
      <div className="flex-shrink-0 px-4 py-3 space-y-3 border-b border-border">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 h-11"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              "transition-colors",
              showFilters ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter chips */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-2"
            >
              {/* Category filters */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      selectedCategory === cat.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Source filters */}
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((src) => (
                  <button
                    key={src.value}
                    onClick={() => setSelectedSource(src.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      selectedSource === src.value
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Memory list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {memories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {hasActiveFilters ? 'No memories found' : 'No memories yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {hasActiveFilters
                ? 'Try adjusting your filters or search term'
                : 'Start capturing your thoughts, goals, and context to build your personal memory.'}
            </p>
            {!hasActiveFilters && (
              <Button onClick={onAddMemory} className="border-0">
                <Plus className="w-4 h-4 mr-2" />
                Add your first memory
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            {/* Results count */}
            <p className="text-xs text-muted-foreground mb-2">
              {data?.total || 0} {data?.total === 1 ? 'memory' : 'memories'}
              {hasActiveFilters && ' matching filters'}
            </p>

            <AnimatePresence mode="popLayout">
              {memories.map((memory) => (
                <MemoryItemCard
                  key={memory.id}
                  memory={memory}
                  onEdit={onEditMemory}
                  onDelete={handleDelete}
                  isDeleting={deletingId === memory.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MemoryList;
