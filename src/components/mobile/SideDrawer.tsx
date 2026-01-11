import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, User, BarChart3, Target, Brain, Settings, LogOut, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onNavigate: (path: string) => void;
  onSheetOpen?: (sheet: string) => void;
}

const navigationItems = [
  { id: 'strategic-pulse', label: 'Strategic Pulse', icon: BarChart3, action: 'sheet' },
  { id: 'competitive-intel', label: 'Competitive Intelligence', icon: TrendingUp, action: 'sheet' },
  { id: 'action-queue', label: 'Action Queue', icon: Target, action: 'sheet' },
  { id: 'learning', label: 'Learning Engine', icon: Brain, action: 'sheet' },
  { id: 'baseline', label: 'Your Baseline', icon: BarChart3, action: 'navigate' },
  { id: 'profile', label: 'Profile', icon: User, action: 'navigate' },
  { id: 'settings', label: 'Settings', icon: Settings, action: 'navigate' },
];

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onNavigate,
  onSheetOpen,
}) => {
  const handleItemClick = (item: typeof navigationItems[0]) => {
    if (item.action === 'sheet' && onSheetOpen) {
      onSheetOpen(item.id);
    } else if (item.action === 'navigate') {
      onNavigate(`/${item.id}`);
    }
    onClose();
  };

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Leader';
  const userTier = 'Advancing'; // TODO: Get from baseline data

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-background shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{userName}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {userTier}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  onNavigate('/logout');
                  onClose();
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
