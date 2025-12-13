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
    <div className="relative overflow-hidden bg-background min-h-[100dvh] flex items-center">
      <div className="container-width relative z-10 px-4 sm:px-6 py-4 sm:py-8 w-full">
        <div className="bg-white/80 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4 sm:p-8 md:p-12 max-w-3xl space-y-4 sm:space-y-6 md:space-y-8">
          <div className="flex justify-between items-start">
            <img 
              src={mindmakerLogo} 
              alt="MindMaker Logo" 
              className="w-[143px] h-auto"
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
          
          <div className="min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem]">
            <h1 
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wide text-primary text-left"
              aria-label={fullText}
            >
              <span aria-hidden="true">
                {displayedText}
                <span className="inline-block w-0.5 h-[0.9em] bg-primary ml-1 animate-[blink_1s_step-end_infinite] align-middle" />
              </span>
              <span className="sr-only">{fullText}</span>
            </h1>
          </div>
          
          <p className="text-xs sm:text-sm text-graphite leading-relaxed text-left">
            Spend 10 minutes mapping how AI fits your role. Get practical next steps and the questions you'll need when vendors or staff bring AI to your door.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-start items-start">
            <Button 
              onClick={onStartQuiz}
              className="btn-hero-cta group justify-start w-full sm:w-auto"
              size="default"
            >
              <span className="text-sm">Start diagnostic</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}