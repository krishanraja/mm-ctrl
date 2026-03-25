import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  LogOut,
  Moon,
  Sun,
  Settings,
  Zap,
  Brain,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from '@/components/ui/theme-provider';
import { useDevice } from '@/hooks/useDevice';
import { useMemoryWeb } from '@/hooks/useMemoryWeb';
import { useEdgeSubscription } from '@/hooks/useEdgeSubscription';
import { Sidebar } from '@/components/dashboard/desktop/Sidebar';
import { BottomNav } from '@/components/memory-web/BottomNav';

function ProfileContent() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { stats } = useMemoryWeb();
  const { hasAccess, subscription } = useEdgeSubscription();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Leader';

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="space-y-4">
      {/* User identity card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground truncate capitalize">
                {userName}
              </h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              {hasAccess && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold">
                  <Zap className="h-2.5 w-2.5" />
                  Edge Pro
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      {stats && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total_facts}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Facts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.verified_rate}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Verified</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.patterns_count || 0}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Patterns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings links */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Settings</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate('/memory')}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Memory Browser</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground flex-1 text-left">Privacy & Data</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {resolvedTheme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="text-sm">Dark Mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${resolvedTheme === 'dark' ? 'bg-accent' : 'bg-secondary'}
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${resolvedTheme === 'dark' ? 'left-6' : 'left-1'}
                `}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        onClick={signOut}
        className="w-full text-destructive hover:text-destructive"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { isMobile } = useDevice();

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Profile</h1>
            <ProfileContent />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Profile</h1>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4">
        <ProfileContent />
      </main>

      <BottomNav />
    </div>
  );
}
