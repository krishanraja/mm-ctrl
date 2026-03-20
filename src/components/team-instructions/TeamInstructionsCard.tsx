/**
 * Team Instructions Card
 *
 * Tool card displayed on the Think page that opens the TeamInstructionsSheet.
 */

import { useState } from 'react';
import { Users } from 'lucide-react';
import { TeamInstructionsSheet } from './TeamInstructionsSheet';

export function useTeamInstructionsTool() {
  const [isOpen, setIsOpen] = useState(false);

  const tool = {
    id: 'team-instructions',
    title: 'Team Instructions',
    description: 'Draft clear instructions for your team',
    icon: Users,
    color: 'from-indigo-500 to-purple-500',
    action: () => setIsOpen(true),
  };

  const sheet = (
    <TeamInstructionsSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
  );

  return { tool, sheet };
}
