import { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  X,
  Check,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { SendToInboxButton } from './SendToInboxButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArtifactPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  actionId: string | null;
}

// ---------------------------------------------------------------------------
// Simple markdown renderer
// ---------------------------------------------------------------------------

function renderMarkdown(md: string): string {
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-foreground mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-6 mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-sm text-foreground/90 leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm text-foreground/90 leading-relaxed">$1</li>')
    // Paragraphs (lines that aren't already tagged)
    .replace(/^(?!<[hlu]|<li)(.+)$/gm, '<p class="text-sm text-foreground/90 leading-relaxed mb-2">$1</p>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-1 mb-3">$&</ul>');

  return html;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

function PreviewContent({
  content,
  title,
  actionId,
  onClose,
}: {
  content: string;
  title: string;
  actionId: string | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  }, [content, toast]);

  return (
    <div className="flex flex-col h-full">
      {/* Title bar */}
      <div className="flex items-center gap-3 pb-4 border-b border-border flex-shrink-0">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <FileText className="h-4 w-4 text-amber-400" />
        </div>
        <h3 className="text-base font-bold text-foreground truncate flex-1">
          {title}
        </h3>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto py-4 min-h-0"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 pt-4 border-t border-border flex-shrink-0"
      >
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>

        {actionId && (
          <SendToInboxButton actionId={actionId} />
        )}

        <div className="flex-1" />

        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Close
        </Button>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ArtifactPreview({
  isOpen,
  onClose,
  content,
  title,
  actionId,
}: ArtifactPreviewProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-6 pb-6 pt-6 h-[90vh] flex flex-col"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Preview of generated artifact</SheetDescription>
          </SheetHeader>
          <PreviewContent
            content={content}
            title={title}
            actionId={actionId}
            onClose={onClose}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Preview of generated artifact</DialogDescription>
        </DialogHeader>
        <PreviewContent
          content={content}
          title={title}
          actionId={actionId}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
