// src/pages/Landing.tsx
import * as React from "react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { HeroSection } from "@/components/landing/HeroSection"
import { useAuth } from "@/components/auth/AuthProvider"
import { supabase } from "@/integrations/supabase/client"

export default function Landing() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user has baseline and redirect to dashboard
    const checkBaseline = async () => {
      if (user && !isLoading) {
        try {
          const { data } = await supabase
            .from('leaders')
            .select('baseline')
            .eq('id', user.id)
            .single()

          if (data?.baseline) {
            navigate('/dashboard')
          }
        } catch (error) {
          // User doesn't have baseline yet, stay on landing
          console.error('Error checking baseline:', error)
        }
      }
    }

    checkBaseline()
  }, [user, isLoading, navigate])

  // Light mode only for landing page
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return <HeroSection />
}
