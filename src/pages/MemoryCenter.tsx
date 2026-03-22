import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Plus, Shield, Download, Upload, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemoryErrorBoundary } from '@/components/memory/MemoryErrorBoundary';
import { MemoryList } from '@/components/memory/MemoryList';
import { MemoryDetailSheet } from '@/components/memory/MemoryDetailSheet';
import { AddMemorySheet } from '@/components/memory/AddMemorySheet';
import { PrivacyControlsPanel } from '@/components/memory/PrivacyControlsPanel';
import { ExportImportPanel } from '@/components/memory/ExportImportPanel';
import { LLMImportWizard } from '@/components/memory/LLMImportWizard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDevice } from '@/hooks/useDevice';
import { useMemoryWeb } from '@/hooks/useMemoryWeb';
import { useMarkdownImport } from '@/hooks/useMarkdownImport';
import { DesktopSidebar } from '@/components/memory-web/DesktopSidebar';
import { BottomNav } from '@/components/memory-web/BottomNav';
import type { UserMemoryFact } from '@/types/memory';

export default function MemoryCenter() {
  const { isMobile } = useDevice();
  const { stats } = useMemoryWeb();
  const [activeTab, setActiveTab] = useState('memories');
  const [selectedMemory, setSelectedMemory] = useState<UserMemoryFact | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { triggerImport, isImporting, fileInputProps } = useMarkdownImport();
  const [isLLMImportOpen, setIsLLMImportOpen] = useState(false);

  const handleEditMemory = (memory: UserMemoryFact) => {
    setSelectedMemory(memory);
    setIsDetailOpen(true);
  };

  const content = (
    <MemoryErrorBoundary>
      {/* Hidden file input for markdown import */}
      <input {...fileInputProps} />
      <div className="flex-1 min-h-0 flex flex-col space-y-4">
        {/* Stats bar */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 text-sm text-muted-foreground"
          >
            <span>{stats.total_facts} facts</span>
            <span className="text-foreground/10">|</span>
            <span>{stats.verified_rate}% verified</span>
            <span className="text-foreground/10">|</span>
            <span>{stats.temperature_distribution?.hot || 0} hot, {stats.temperature_distribution?.warm || 0} warm</span>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-3 h-11">
              <TabsTrigger value="memories" className="text-sm">
                <Brain className="h-4 w-4 mr-1.5 hidden sm:inline" />
                All Facts
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

            {activeTab === 'memories' && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-0 bg-secondary/50"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {isImporting ? 'Importing...' : 'Import'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsLLMImportOpen(true)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Import from AI chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={triggerImport} disabled={isImporting}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import from file
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => setIsAddOpen(true)}
                  size="sm"
                  className="border-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="memories" className="mt-4 flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0">
            <MemoryList
              onEditMemory={handleEditMemory}
              onAddMemory={() => setIsAddOpen(true)}
            />
          </TabsContent>

          <TabsContent value="privacy" className="mt-4 flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0">
            <PrivacyControlsPanel />
          </TabsContent>

          <TabsContent value="data" className="mt-4 flex-1 overflow-y-auto scrollbar-hide overscroll-contain min-h-0">
            <ExportImportPanel />
          </TabsContent>
        </Tabs>
      </div>

      <MemoryDetailSheet
        memory={selectedMemory}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedMemory(null); }}
      />

      <AddMemorySheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <LLMImportWizard
        isOpen={isLLMImportOpen}
        onClose={() => setIsLLMImportOpen(false)}
      />
    </MemoryErrorBoundary>
  );

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopSidebar />
        <main className="ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 mb-1">
                <Brain className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-semibold">Memory Browser</h1>
              </div>
              <p className="text-muted-foreground">
                View, verify, edit, and manage everything your AI knows about you.
              </p>
            </motion.div>
            {content}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      <header className="flex-shrink-0 px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-semibold">Memory</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Everything your AI knows about you
          </p>
        </motion.div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden px-4 py-2 flex flex-col">
        {content}
      </main>

      <BottomNav />
    </div>
  );
}
