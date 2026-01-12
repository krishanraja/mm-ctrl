import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn, LogOut, User, Sparkles, Shield, Clock, Users, LayoutDashboard, Settings, Target } from "lucide-react";
import { useState, useEffect } from "react";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from "react-router-dom";
import { useUserState } from "@/hooks/useUserState";
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
  onSelectMode?: () => void;
  userMode?: 'leader' | 'operator' | null;
  onStartOperatorIntake?: () => void;
}

export function HeroSection({ onStartVoice, onStartQuiz, onSignIn, user, onSignOut, onSelectMode, userMode, onStartOperatorIntake }: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { hasBaseline, isAuthenticated, isAnonymous } = useUserState();
  
  // Use prop user for display, but hook for logic consistency
  // This allows parent to control user display while hook ensures state consistency
  const effectiveUser = user;
  const effectiveIsAuthenticated = effectiveUser && !effectiveUser.is_anonymous;
  const effectiveIsAnonymous = effectiveUser && (effectiveUser.is_anonymous === true || (effectiveUser.user_metadata as any)?.is_anonymous === true);
  
  useEffect(() => {
    // Small delay for smooth entrance, but content is already positioned
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="relative h-[var(--mobile-vh)] flex flex-col overflow-hidden">
      {/* Background Video - Full opacity at base layer */}
      <video
        className="fixed inset-0 w-full h-full object-cover opacity-100 -z-20 pointer-events-none"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onEnded={(e) => {
          // Ensure infinite looping by restarting if video ends
          e.currentTarget.currentTime = 0;
          e.currentTarget.play();
        }}
      >
        <source src="/Mindmaker for Leaders - background video.mp4" type="video/mp4" />
      </video>
      
      {/* Semi-transparent black overlay - 50% opacity */}
      <div className="fixed inset-0 bg-black/50 -z-10 pointer-events-none" />
      
      {/* Subtle geometric background pattern - lighter dots on dark */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--soft-white)) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--deep-green) / 0.08), transparent)`,
        }}
      />
      
      {/* Header Navigation - Minimal, only for logged-in user account menu */}
      <header className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center justify-end">
            {effectiveUser && effectiveIsAuthenticated ? (
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
                        {effectiveUser.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      {effectiveUser.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      My Assessments
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : effectiveUser && effectiveIsAnonymous ? (
              <div 
                className={`transition-opacity duration-500 delay-75 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              >
                <Button
                  onClick={onSignIn}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 sm:px-3 text-sm flex items-center gap-1.5 hover:bg-secondary/80"
                >
                  <LogIn className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Main Hero Content - Centered */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* Top Row: Action Buttons - Aligned above card */}
          <div 
            className={`mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 sm:gap-3 transition-opacity duration-500 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '100ms' }}
          >
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
              p-4 sm:p-6 md:p-8 lg:p-10
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
            
            {/* Full Logo - Left-aligned, using 11.png from public (white version for dark bg) - Reduced by 25% */}
            <div 
              className={`mb-6 transition-opacity duration-500 ease-out relative z-10 flex items-center gap-2 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '150ms' }}
            >
              <img 
                src="/11.png" 
                alt="Mindmaker" 
                className="w-auto brightness-0 invert h-[1.125rem] sm:h-[1.3125rem] md:h-[1.5rem]"
                style={{ transform: 'translateY(-0.9px)' }}
              />
              <span className="brand-typography-ctrl flex items-center font-bold uppercase shimmer-mint" style={{ transform: 'translateY(-0.5px)', letterSpacing: '0.06em' }}>
                CTRL
              </span>
            </div>
            
            {/* Headline - Different for leaders vs operators */}
            {userMode === 'operator' ? (
              <h1 
                className={`text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.15] mb-4 sm:mb-5 transition-opacity duration-500 ease-out relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: '250ms' }}
              >
                Get one clear
                <br />
                <span className="relative inline-block">
                  <span>AI decision per week</span>
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
            ) : (
              <h1 
                className={`text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground leading-[1.15] mb-4 sm:mb-5 transition-opacity duration-500 ease-out relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: '250ms' }}
              >
                Know where you stand.
                <br />
                <span className="relative inline-block">
                  <span>See your blind spots.</span>
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
            )}
            
            {/* Description - Highly differentiated */}
            <p 
              className={`text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-lg transition-opacity duration-500 ease-out relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '350ms' }}
            >
              {userMode === 'operator' 
                ? 'Personalized to your business mix. No fluff. Just the next move that matters.'
                : 'Get the mental models to use AI as a thinking partner. Boardroom-ready insights in 2 minutes.'}
            </p>
            
            {/* CTA Buttons */}
            <div
              className={`transition-opacity duration-500 ease-out relative z-10 ${mounted ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '450ms' }}
            >
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Primary CTA - Different for operators vs leaders */}
                {userMode === 'operator' && onStartOperatorIntake ? (
                  <Button 
                    onClick={onStartOperatorIntake}
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
                    Set Up Your Profile
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                ) : (
                  <>
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
                      {hasBaseline ? "Get new insights" : "Start Your Diagnostic"}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>

                    {/* Secondary: Full diagnostic, Continue, or Sign In */}
                    {hasBaseline && effectiveUser && effectiveIsAuthenticated ? (
                      <Button
                        onClick={() => navigate('/today')}
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto h-12 sm:h-14 rounded-xl border-border text-foreground hover:bg-secondary"
                      >
                        Continue to Today
                      </Button>
                    ) : hasBaseline && (!effectiveUser || effectiveIsAnonymous) ? (
                      <Button
                        onClick={onSignIn}
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto h-12 sm:h-14 rounded-xl border-border text-foreground hover:bg-secondary"
                      >
                        Sign in to continue
                      </Button>
                    ) : (
                      <Button
                        onClick={onStartQuiz}
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto h-12 sm:h-14 rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      >
                        Take the 2-minute benchmark
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Trust indicators - Compact mobile layout */}
          <div 
            className={`
              mt-4 sm:mt-6 
              transition-all duration-700 ease-out delay-300
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {/* Mobile: Compact single-line, Desktop: Horizontal row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-2 sm:gap-6 lg:gap-8">
              {userMode === 'operator' ? (
                <>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                      <Target className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                    </div>
                    <span className="line-clamp-1 sm:line-clamp-none">Built for solopreneurs running multiple revenue streams.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                      <Shield className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                    </div>
                    <span className="line-clamp-1 sm:line-clamp-none">Real business decisions. No theory. Just your next move.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                      <Clock className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                    </div>
                    <span>One decision per week. Personalized to your mix.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                      <Clock className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                    </div>
                    <span className="line-clamp-1 sm:line-clamp-none">Trained on 20+ years of executive learnings from 200+ leaders and cognitive frameworks.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                      <Shield className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                    </div>
                    <span className="line-clamp-1 sm:line-clamp-none">Boardroom-ready insights tailored to your leadership style and business context.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full bg-card shadow-sm border border-border flex items-center justify-center flex-shrink-0">
                      <Users className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-primary" />
                    </div>
                    <span>No course. No fluff. Just clarity.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
