import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AssessmentProvider } from "@/contexts/AssessmentContext";
import PromptCoach from "./pages/PromptCoach";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppShell from "./pages/AppShell";
import Today from "./pages/Today";
import WeeklyCheckin from "./pages/WeeklyCheckin";
import DecisionCapture from "./pages/DecisionCapture";
import Timeline from "./pages/Timeline";
import Baseline from "./pages/Baseline";

const queryClient = new QueryClient();

const App = () => (
  <div className="min-h-screen bg-background">
    <QueryClientProvider client={queryClient}>
      <AssessmentProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Main Mindmaker for Leaders experience */}
              <Route path="/" element={<Index />} />
              
              {/* Prompt Coach - practice tool */}
              <Route path="/coach" element={<PromptCoach />} />

              {/* Ongoing loop (mobile-first) */}
              <Route element={<AppShell />}>
                <Route path="/today" element={<Today />} />
                <Route path="/checkin" element={<WeeklyCheckin />} />
                <Route path="/capture" element={<DecisionCapture />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/baseline" element={<Baseline />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AssessmentProvider>
    </QueryClientProvider>
  </div>
);

export default App;
