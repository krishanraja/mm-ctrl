import * as React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mic, ArrowRight, User, Brain, Zap, Shield, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HeroSection() {
  const navigate = useNavigate()
  const [isHoveringMic, setIsHoveringMic] = useState(false)

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-background">
      {/* Video Background - Desktop only */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-15 hidden lg:block"
        style={{
          filter: 'grayscale(0.3) brightness(0.7)',
        }}
      >
        <source src="/Mindmaker for Leaders - background video.mp4" type="video/mp4" />
      </video>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background lg:from-background/80 lg:via-background/70 lg:to-background" />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2">
          <img 
            src="/mindmaker-full-logo.png" 
            alt="Mindmaker" 
            className="h-6 sm:h-7 w-auto"
          />
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sign in</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center mb-8 lg:mb-12"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6"
            >
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">AI That Actually Knows You</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 lg:mb-6">
              <span className="text-foreground">Your AI advisor that</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                remembers everything
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Talk naturally. We extract your context, verify what matters, and build a memory that makes every interaction 10x more relevant than ChatGPT.
            </p>
          </motion.div>

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            <div className={cn(
              "bg-gradient-to-b from-card/80 to-card/60",
              "backdrop-blur-xl border border-white/10",
              "rounded-3xl p-6 sm:p-8",
              "shadow-2xl shadow-black/20"
            )}>
              {/* Question prompt */}
              <p className="text-center text-foreground/80 mb-6">
                What's the biggest challenge you're facing right now?
              </p>

              {/* Mic Button */}
              <div className="flex justify-center mb-4">
                <motion.button
                  onClick={() => navigate('/voice')}
                  onMouseEnter={() => setIsHoveringMic(true)}
                  onMouseLeave={() => setIsHoveringMic(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full",
                    "bg-gradient-to-br from-blue-500 to-purple-600",
                    "flex items-center justify-center",
                    "shadow-lg shadow-blue-500/30",
                    "border border-white/20",
                    "group"
                  )}
                >
                  {/* Pulse animation */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full bg-blue-500/30"
                  />
                  <Mic className="h-8 w-8 sm:h-10 sm:w-10 text-white relative z-10" />
                </motion.button>
              </div>

              <p className="text-center text-sm text-muted-foreground mb-6">
                Tap to speak — we'll learn about you as you talk
              </p>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-foreground/10" />
                <span className="text-xs text-foreground/30">or</span>
                <div className="flex-1 h-px bg-foreground/10" />
              </div>

              {/* Primary CTA */}
              <Button
                onClick={() => navigate('/diagnostic')}
                className={cn(
                  "w-full h-12 text-base font-semibold",
                  "bg-foreground text-background",
                  "hover:bg-foreground/90"
                )}
                size="lg"
              >
                Take the 2-minute diagnostic
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {/* Secondary link */}
              <p className="text-center text-xs text-muted-foreground mt-4">
                No account needed to start
              </p>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.button
            onClick={scrollToFeatures}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mx-auto mt-8 flex flex-col items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <span className="text-xs">See how it works</span>
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Why leaders choose Mindmaker
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built for executives who need AI that understands their context, not generic chatbots.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className={cn(
                "p-6 rounded-2xl",
                "bg-gradient-to-b from-blue-500/10 to-transparent",
                "border border-blue-500/20"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Persistent Memory</h3>
              <p className="text-sm text-muted-foreground">
                We remember your role, company, goals, and blockers. Every conversation builds on the last.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={cn(
                "p-6 rounded-2xl",
                "bg-gradient-to-b from-purple-500/10 to-transparent",
                "border border-purple-500/20"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <Mic className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Voice-First Design</h3>
              <p className="text-sm text-muted-foreground">
                Talk naturally. We extract insights without making you fill out forms or answer 20 questions.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className={cn(
                "p-6 rounded-2xl",
                "bg-gradient-to-b from-green-500/10 to-transparent",
                "border border-green-500/20"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">You Stay in Control</h3>
              <p className="text-sm text-muted-foreground">
                Verify what we learned. Edit or reject anything. Your memory, your rules.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className={cn(
                "p-6 rounded-2xl",
                "bg-gradient-to-b from-orange-500/10 to-transparent",
                "border border-orange-500/20"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Relevance</h3>
              <p className="text-sm text-muted-foreground">
                No more explaining your situation every time. Get advice that fits your exact context.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className={cn(
                "p-6 rounded-2xl sm:col-span-2 lg:col-span-2",
                "bg-gradient-to-b from-pink-500/10 to-transparent",
                "border border-pink-500/20"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">10x Better Than ChatGPT</h3>
                  <p className="text-sm text-muted-foreground">
                    ChatGPT forgets everything between sessions. We build a verified knowledge graph about you — your role, your company's stage, your blockers, your decision-making style. Every response is grounded in who you actually are.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to have AI that actually knows you?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start with a 2-minute diagnostic. No account required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/voice')}
              size="lg"
              className={cn(
                "h-12 px-8",
                "bg-gradient-to-r from-blue-500 to-purple-600",
                "hover:from-blue-400 hover:to-purple-500",
                "text-white font-semibold"
              )}
            >
              <Mic className="w-4 h-4 mr-2" />
              Start with voice
            </Button>
            <Button
              onClick={() => navigate('/diagnostic')}
              variant="outline"
              size="lg"
              className="h-12 px-8"
            >
              Take the quiz
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 border-t border-foreground/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img 
            src="/mindmaker-full-logo.png" 
            alt="Mindmaker" 
            className="h-5 w-auto opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            Built for senior leaders who need AI literacy fast, not depth.
          </p>
        </div>
      </footer>
    </div>
  )
}
