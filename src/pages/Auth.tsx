import * as React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { SignInForm } from "@/components/auth/SignInForm"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true)
  const navigate = useNavigate()

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center px-4 sm:px-6 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/mindmaker-favicon.png" 
              alt="Mindmaker" 
              className="h-12 w-12"
            />
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg mb-6">
            <button
              onClick={() => setIsSignIn(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                isSignIn 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignIn(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                !isSignIn 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          {isSignIn ? <SignInForm /> : <SignUpForm />}
        </motion.div>
      </main>
    </div>
  )
}
