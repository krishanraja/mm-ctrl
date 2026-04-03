import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface UpgradeBannerProps {
  user: User | null;
  onUpgradeClick: () => void;
  onAuth: () => void;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({
  user,
  onUpgradeClick,
  onAuth,
}) => {
  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Unlock Your Full Leadership Diagnostic</p>
            <p className="text-sm text-muted-foreground">Get all insights, risks, and actionable recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onUpgradeClick} size="sm">
            Upgrade
          </Button>
          <Button
            onClick={onAuth}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {user ? (
              <>
                <LogOut className="h-4 w-4" />
                Sign Out
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
