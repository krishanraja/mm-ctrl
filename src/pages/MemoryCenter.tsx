/**
 * MemoryCenter Page
 * 
 * Main page for managing user memory with tabs for:
 * - Memory list with search/filter
 * - Privacy settings
 * - Export/Import
 * 
 * Mobile-first design with proper viewport handling.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Plus, Shield, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemoryErrorBoundary } from '@/components/memory/MemoryErrorBoundary';
import { MemoryList } from '@/components/memory/MemoryList';
import { MemoryDetailSheet } from '@/components/memory/MemoryDetailSheet';
import { AddMemorySheet } from '@/components/memory/AddMemorySheet';
import { PrivacyControlsPanel } from '@/components/memory/PrivacyControlsPanel';
import { ExportImportPanel } from '@/components/memory/ExportImportPanel';
import { useDevice } from '@/hooks/useDevice';
import type { UserMemoryFact } from '@/types/memory';

export default function MemoryCenter() {
  const navigate = useNavigate();
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('memories');
  const [selectedMemory, setSelectedMemory] = useState<UserMemoryFact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleEditMemory = (memory: UserMemoryFact) => {
    setSelectedMemory(memory);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedMemory(null);
  };

  const handleAddMemory = () => {
    setIsAddOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
  };

  return (
    <MemoryErrorBoundary>
      <div className="h-[var(--mobile-vh)] overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <header className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Brain className="h-5 w-5 text-accent" />
                  Memory Center
                </h1>
                <p className="text-xs text-muted-foreground">
                  Your personal context and preferences
                </p>
              </div>
            </div>
            
            {/* Add button - visible on memories tab */}
            {activeTab === 'memories' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Button
                  onClick={handleAddMemory}
                  size="sm"
                  className="border-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </motion.div>
            )}
          </div>
        </header>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="flex-shrink-0 mx-4 mt-3 grid grid-cols-3 h-11">
            <TabsTrigger value="memories" className="text-sm">
              <Brain className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Memories
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-sm">
              <Shield className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="data" className="text-sm">
              <Download className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="memories" className="h-full m-0 data-[state=active]:flex flex-col">
              <MemoryList
                onEditMemory={handleEditMemory}
                onAddMemory={handleAddMemory}
              />
            </TabsContent>

            <TabsContent value="privacy" className="h-full m-0 overflow-y-auto">
              <div className="px-4 py-4 pb-safe">
                <PrivacyControlsPanel />
              </div>
            </TabsContent>

            <TabsContent value="data" className="h-full m-0 overflow-y-auto">
              <div className="px-4 py-4 pb-safe">
                <ExportImportPanel />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Memory Detail Sheet */}
        <MemoryDetailSheet
          memory={selectedMemory}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />

        {/* Add Memory Sheet */}
        <AddMemorySheet
          isOpen={isAddOpen}
          onClose={handleCloseAdd}
        />
      </div>
    </MemoryErrorBoundary>
  );
}
