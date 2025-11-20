import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LogIn, LogOut, User } from "lucide-react";
import mindmakerLogo from "@/assets/mindmaker-logo.png";
import { useState, useEffect } from "react";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SampleResultsDialog } from "@/components/SampleResultsDialog";

interface HeroSectionProps {
  onStartVoice: () => void;
  onStartQuiz: () => void;
  onSignIn: () => void;
  user: SupabaseUser | null;
  onSignOut: () => void;
}

export function HeroSection({ onStartVoice, onStartQuiz, onSignIn, user, onSignOut }: HeroSectionProps) {
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "Know Where You Stand on AI";
  
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="hero-section-premium relative overflow-hidden">
      <div className="container-width relative z-10 px-6 py-20 md:py-32 lg:py-40">
        <div className="glass-card p-8 md:p-12 lg:p-16 max-w-3xl space-y-8 md:space-y-10">
          <div className="flex justify-between items-start">
            <img 
              src={mindmakerLogo} 
              alt="MindMaker Logo" 
              className="w-[190px] h-auto -ml-[18px]"
            />
            <div className="flex items-center gap-2">
              <SampleResultsDialog 
                onStartQuiz={onStartQuiz}
                onStartVoice={onStartVoice}
              />
              {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {user.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      const historySection = document.getElementById('assessment-history');
                      if (historySection) {
                        historySection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    My Assessments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              ) : (
                <Button
                  onClick={onSignIn}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
          
          <div className="min-h-[4rem] sm:min-h-[5rem] md:min-h-[6rem] lg:min-h-[7rem]">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wide text-primary mb-6 md:mb-10 text-left">
              {displayedText}
              <span className="inline-block w-0.5 h-[0.9em] bg-primary ml-1 animate-[blink_1s_step-end_infinite] align-middle" />
            </h1>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed text-left mb-6">
            Spend 10 minutes mapping how AI fits your role, team, and company. Get a clear view 
            of the gaps that matter, practical next steps, and the questions you'll need when 
            vendors, boards, or staff bring AI to your door.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-start items-start">
            <Button 
              onClick={onStartQuiz}
              className="btn-hero-cta group justify-start"
              size="lg"
            >
              <span className="text-sm">Start diagnostic</span>
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}