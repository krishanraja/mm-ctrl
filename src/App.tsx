import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sharpen from "./pages/Sharpen";
import PromptCoach from "./pages/PromptCoach";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <div className="min-h-screen bg-background">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* New Sharpen experience - main entry point */}
            <Route path="/" element={<Sharpen />} />
            <Route path="/coach" element={<PromptCoach />} />
            
            {/* Legacy assessment - kept for enterprise/deep-dive */}
            <Route path="/diagnostic" element={<Index />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </div>
);

export default App;
