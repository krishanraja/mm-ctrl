// src/pages/Auth.tsx
import * as React from "react"
import { useState } from "react"
import { SignInForm } from "@/components/auth/SignInForm"
import { SignUpForm } from "@/components/auth/SignUpForm"
import { Button } from "@/components/ui/button"

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true)

  return (
    <div className="h-screen-safe overflow-hidden flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 bg-background">
      <div className="w-full max-w-lg space-y-8 sm:space-y-10">
        <div className="flex gap-3 sm:gap-4 justify-center">
          <Button
            variant={isSignIn ? "default" : "outline"}
            onClick={() => setIsSignIn(true)}
            size="lg"
            className="min-w-[120px] h-12 text-base font-semibold"
          >
            Sign In
          </Button>
          <Button
            variant={!isSignIn ? "default" : "outline"}
            onClick={() => setIsSignIn(false)}
            size="lg"
            className="min-w-[120px] h-12 text-base font-semibold"
          >
            Sign Up
          </Button>
        </div>
        {isSignIn ? <SignInForm /> : <SignUpForm />}
      </div>
    </div>
  )
}
