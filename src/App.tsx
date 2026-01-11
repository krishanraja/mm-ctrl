import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AssessmentProvider } from "@/contexts/AssessmentContext";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { initMobileViewport } from "@/utils/mobileViewport";

// Pages
import PromptCoach from "./pages/PromptCoach";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppShell from "./pages/AppShell";
import Today from "./pages/Today";
import WeeklyCheckin from "./pages/WeeklyCheckin";
import DecisionCapture from "./pages/DecisionCapture";
import Timeline from "./pages/Timeline";
import Baseline from "./pages/Baseline";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Auth components
import { AuthDebugPanel } from "@/components/auth/AuthDebugPanel";
import { SessionExpiredDialog } from "@/components/auth/SessionExpiredDialog";

const queryClient = new QueryClient();

/**
 * Mindmaker for Leaders
 * 
 * A voice-first AI leadership tool that helps executives navigate AI uncertainty.
 * 
 * User flow:
 * 1. New users land on HeroSection ("Know Where You Stand")
 * 2. Complete diagnostic → prompted to save/login
 * 3. Returning users with completed diagnostic → Dashboard
 */
const App = () => {
  // Initialize mobile viewport utility on mount
  useEffect(() => {
    const cleanup = initMobileViewport();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen">
      {/* Note: No bg-background on root to allow video backgrounds in child components (e.g., HeroSection) */}
      <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AssessmentProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                {/* 
                  PRIMARY: Landing page with smart redirect
                  New users see HeroSection, returning users redirect to Dashboard
                */}
                <Route path="/" element={<Index />} />
                
                {/* 
                  Prompt Coach - practice tool
                */}
                <Route path="/coach" element={<PromptCoach />} />

                {/* 
                  App routes (require session)
                */}
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/today" element={<Today />} />
                  <Route path="/checkin" element={<WeeklyCheckin />} />
                  <Route path="/capture" element={<DecisionCapture />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/baseline" element={<Baseline />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Dev-only auth debug panel */}
              <AuthDebugPanel />
              {/* Session expiry dialog */}
              <SessionExpiredDialog />
            </BrowserRouter>
          </TooltipProvider>
        </AssessmentProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </div>
  );
};

export default App;
