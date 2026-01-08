import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn, LogOut, User, Sparkles, Shield, Clock, Users } from "lucide-react";
import { useState, useEffect } from "react";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";
import { getPersistedAssessmentId } from "@/utils/assessmentPersistence";
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
  const [mounted, setMounted] = useState(false);
  const [hasBaseline, setHasBaseline] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Small delay for smooth entrance, but content is already positioned
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const { assessmentId } = getPersistedAssessmentId();
    setHasBaseline(Boolean(assessmentId));
  }, []);
  
  return (
    <div className="relative min-h-[100dvh] bg-background flex flex-col">
      {/* Subtle geometric background pattern - lighter dots on dark */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--soft-white)) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--deep-green) / 0.08), transparent)`,
        }}
      />
      
      {/* Header Navigation - Minimal, only for logged-in user account menu */}
      <header className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center justify-end">
            {user && (
              <div 
                className={`transition-opacity duration-500 delay-75 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 sm:px-3 text-sm flex items-center gap-1.5 hover:bg-secondary/80"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="hidden sm:inline max-w-[80px] truncate text-xs">
                        {user.email?.split('@')[0]}
                      </span>
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
                      <Sparkles className="mr-2 h-4 w-4" />
                      My Assessments
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Hero Content - Centered */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* Top Row: Badge + Action Buttons - Aligned above card */}
          <div 
            className={`mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 transition-opacity duration-500 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '100ms' }}
          >
            {/* Badge - Entry point above card */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Get quick AI help for you
            </span>
            
            {/* Action Buttons - Clear labels on mobile */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <SampleResultsDialog 
                onStartQuiz={onStartQuiz}
                onStartVoice={onStartVoice}
              />
              
              {!user && (
                <Button
                  onClick={onSignIn}
                  variant="ghost"
                  size="sm"
                  className="h-8 sm:h-9 px-3 text-xs sm:text-sm flex items-center gap-1.5 hover:bg-secondary/80 border border-border sm:border-0 text-foreground"
                >
                  <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Sign In</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Hero Card - Dark glass-morphism */}
          <div 
            className={`
              bg-card/80 backdrop-blur-xl rounded-2xl 
              shadow-[0_8px_40px_rgba(0,0,0,0.4)] 
              border border-primary/20
              p-6 sm:p-8 md:p-10
              transition-all duration-700 ease-out
              relative overflow-hidden
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {/* Subtle gradient overlay inside card */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background: `linear-gradient(135deg, hsl(var(--deep-green) / 0.1) 0%, transparent 50%, hsl(var(--deep-green) / 0.05) 100%)`,
              }}
            />
            
            {/* Full Logo - Left-aligned, using 11.png from public (white version for dark bg) */}
            <div 
              className={`mb-6 transition-opacity duration-500 ease-out relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '150ms' }}
            >
              <img 
                src="/11.png" 
                alt="Mindmaker" 
                className="h-6 sm:h-7 md:h-8 w-auto brightness-0 invert"
              />
            </div>
            
            {/* Headline */}
            <h1 
              className={`text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.15] mb-4 sm:mb-5 transition-opacity duration-500 ease-out relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '250ms' }}
            >
              Know Where You
              <br />
              <span className="relative inline-block">
                Stand on AI
                <svg 
                  className="absolute -bottom-1 left-0 w-full h-2 text-primary" 
                  viewBox="0 0 200 8" 
                  fill="none" 
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M2 6C50 2 150 2 198 6" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{
                      strokeDasharray: 200,
                      strokeDashoffset: mounted ? 0 : 200,
                      transition: 'stroke-dashoffset 1s ease-out 0.5s'
                    }}
                  />
                </svg>
              </span>
            </h1>
            
            {/* Description */}
            <p 
              className={`text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-lg transition-opacity duration-500 ease-out relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '350ms' }}
            >
              Speak your biggest AI uncertainty. Get one insight and one action for this week. No course. No overwhelm.
            </p>
            
            {/* CTA Buttons */}
            <div
              className={`transition-opacity duration-500 ease-out relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '450ms' }}
            >
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Primary: Quick entry - Green CTA */}
                <Button 
                  onClick={onStartVoice}
                  size="lg"
                  className="
                    group w-full sm:w-auto 
                    h-12 sm:h-14 
                    px-6 sm:px-8 
                    text-base sm:text-lg 
                    font-semibold 
                    bg-primary hover:bg-primary/90
                    text-primary-foreground 
                    shadow-lg shadow-primary/25
                    hover:shadow-xl hover:shadow-primary/35
                    transition-all duration-300
                    rounded-xl
                  "
                >
                  Get quick AI help for you
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>

                {/* Secondary: Full diagnostic or Continue */}
                {hasBaseline ? (
                  <Button
                    onClick={() => navigate('/today')}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 sm:h-14 rounded-xl border-border text-foreground hover:bg-secondary"
                  >
                    Continue to Today
                  </Button>
                ) : (
                  <Button
                    onClick={onStartQuiz}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 sm:h-14 rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    Full 2-min diagnostic →
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Trust indicators - Mobile-native layout below card */}
          <div 
            className={`
              mt-6 sm:mt-8 
              transition-all duration-700 ease-out delay-300
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {/* Mobile: Stack vertically, Desktop: Horizontal row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-3 sm:gap-6 lg:gap-8">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                </div>
                <span>2 min diagnostic</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                </div>
                <span>100% private</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                  <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                </div>
                <span>No course. No fluff.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
