import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { haptic } from '@/utils/haptic';

const COMMON_AI_TOOLS = [
  'ChatGPT',
  'Claude',
  'Notion AI',
  'Perplexity',
  'Midjourney',
  'DALL-E',
  'Runway',
  'ElevenLabs',
  'Zapier',
  'Make',
  'Notion',
  'Obsidian',
  'Cursor',
  'GitHub Copilot',
  'Jasper',
  'Copy.ai',
  'Grammarly',
  'Otter.ai',
  'Fireflies',
];

interface ToolCheckboxGridProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  className?: string;
}

export const ToolCheckboxGrid: React.FC<ToolCheckboxGridProps> = ({
  selectedTools,
  onToolsChange,
  className = ''
}) => {
  const handleToolToggle = (tool: string) => {
    haptic.light();
    if (selectedTools.includes(tool)) {
      onToolsChange(selectedTools.filter(t => t !== tool));
    } else {
      onToolsChange([...selectedTools, tool]);
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-1.5">
        {COMMON_AI_TOOLS.map(tool => {
          const isSelected = selectedTools.includes(tool);
          return (
            <Button
              key={tool}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              className={`h-9 justify-start text-xs font-normal px-2 ${
                isSelected ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => handleToolToggle(tool)}
            >
              {isSelected && <Check className="h-3 w-3 mr-1" />}
              <span className="truncate">{tool}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
