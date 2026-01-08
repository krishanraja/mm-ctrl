import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AssessmentProvider } from "@/contexts/AssessmentContext";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Core Control Surface
import ExecutiveControlSurface from "./components/ExecutiveControlSurface";

// Demoted features (accessible but not primary)
import PromptCoach from "./pages/PromptCoach";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppShell from "./pages/AppShell";
import Today from "./pages/Today";
import WeeklyCheckin from "./pages/WeeklyCheckin";
import DecisionCapture from "./pages/DecisionCapture";
import Timeline from "./pages/Timeline";
import Baseline from "./pages/Baseline";

// Auth components
import { AuthDebugPanel } from "@/components/auth/AuthDebugPanel";
import { SessionExpiredDialog } from "@/components/auth/SessionExpiredDialog";

const queryClient = new QueryClient();

/**
 * Wrapper component to provide navigate function to ExecutiveControlSurface
 * This enables proper SPA navigation instead of window.location.href
 */
const ExecutiveControlSurfaceWrapper = () => {
  const navigate = useNavigate();
  return <ExecutiveControlSurface onNavigateToBaseline={() => navigate('/baseline')} />;
};

/**
 * Mindmaker Control
 * 
 * A voice-first executive decision system that keeps leaders in control of AI-shaped work.
 * 
 * This is not a chatbot.
 * This is not a dashboard.
 * This is not a learning product.
 * 
 * It answers one question: "What do I need to know or decide right now?"
 */
const App = () => (
  <div className="min-h-screen bg-background">
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AssessmentProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* 
                  PRIMARY: Executive Control Surface
                  The home screen. Nothing else competes with it.
                  User intent: "I've got 30 seconds. Tell me what matters."
                */}
                <Route path="/" element={<ExecutiveControlSurfaceWrapper />} />
                
                {/* 
                  DEMOTED: Diagnostic/Onboarding
                  Entry only. Re-run occasionally. Never the main product.
                */}
                <Route path="/diagnostic" element={<Index />} />
                <Route path="/onboarding" element={<Index />} />
                
                {/* 
                  DEMOTED: Prompt Coach - practice tool
                  Surface only when relevant. No library browsing.
                */}
                <Route path="/coach" element={<PromptCoach />} />

                {/* 
                  SECONDARY: Ongoing loop routes
                  These power the home card - they do not get primary placement.
                */}
                <Route element={<AppShell />}>
                  <Route path="/today" element={<Today />} />
                  <Route path="/checkin" element={<WeeklyCheckin />} />
                  <Route path="/capture" element={<DecisionCapture />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/baseline" element={<Baseline />} />
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

export default App;
