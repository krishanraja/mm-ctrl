// src/components/landing/HeroSection.tsx
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "./Logo"
import { TrustIndicators } from "./TrustIndicators"
import { slideUpProps } from "@/lib/motion"

export function HeroSection() {
  const navigate = useNavigate()

  return (
    <div className="relative h-screen-safe overflow-hidden flex items-center justify-center px-4 sm:px-6">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
        style={{
          opacity: 0.20, // 20% opacity as specified by user
          filter: 'grayscale(0.4) brightness(0.92) contrast(0.88)',
        }}
      >
        <source src="/Mindmaker for Leaders - background video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80 -z-10" />

      {/* Top Bar - Apple-level refinement */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-8 sm:p-10 md:p-12 z-10">
        <button
          onClick={() => navigate('/auth')}
          className="text-base sm:text-lg text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
        >
          View Examples
        </button>
        <button
          onClick={() => navigate('/auth')}
          className="text-base sm:text-lg font-semibold text-foreground hover:text-accent transition-colors duration-200"
        >
          Sign In →
        </button>
      </div>

      {/* Hero Card */}
      <motion.div
        {...slideUpProps}
        className="w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl"
      >
        <Card className="p-10 sm:p-12 md:p-16 lg:p-20 xl:p-24 shadow-xl">
          <CardContent className="flex flex-col gap-8 sm:gap-10 md:gap-12 lg:gap-14 p-0">
            {/* Logo */}
            <div className="flex justify-start mb-2">
              <Logo />
            </div>

            {/* Headline - Apple-level typography */}
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-[-0.02em]">
                Know where you
                <br />
                stand.
              </h1>
              <div className="relative inline-block mt-2">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-[-0.02em]">
                  See your blind
                  <br />
                  spots.
                </h1>
                {/* Animated SVG Underline - More refined */}
                <motion.svg
                  className="absolute -bottom-3 left-0 w-full h-4 opacity-90"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                  viewBox="0 0 400 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M 0 8 Q 100 0, 200 8 T 400 8"
                    stroke="hsl(var(--accent))"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </div>
            </div>

            {/* Description - Apple-level spacing and typography */}
            <p className="text-xl sm:text-2xl md:text-3xl leading-[1.6] text-muted-foreground max-w-2xl mt-6 font-medium">
              Get the mental models to use AI as a thinking partner.
            </p>

            {/* CTAs - Apple-level button spacing */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6 mt-6">
              <Button
                variant="default"
                size="xl"
                onClick={() => navigate('/diagnostic')}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Start Your Diagnostic
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() => navigate('/diagnostic')}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Take the 2-minute benchmark
              </Button>
            </div>

            {/* Trust Indicators - More spacing */}
            <TrustIndicators className="pt-8 sm:pt-10" />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
