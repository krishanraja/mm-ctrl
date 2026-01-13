// src/components/auth/SignUpForm.tsx
import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "./AuthProvider"
import { useNavigate } from "react-router-dom"

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      navigate('/diagnostic')
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="pb-8">
        <CardTitle className="text-3xl sm:text-4xl font-bold">Sign Up</CardTitle>
        <CardDescription className="text-base sm:text-lg mt-3">Create your account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="password" className="text-base font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
              required
              minLength={6}
            />
          </div>
          {error && (
            <div className="text-base text-destructive p-4 bg-destructive/10 rounded-xl">{error}</div>
          )}
          <Button type="submit" size="lg" className="w-full h-14 text-lg font-semibold" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
