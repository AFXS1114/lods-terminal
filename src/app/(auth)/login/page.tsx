"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useAuth } from "@/firebase"
import { Loader2, ArrowRight, ShieldCheck, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Access Granted",
        description: "Initializing secure terminal link...",
      })
      router.push("/dashboard/mission-control")
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Invalid credentials or system offline.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 rotate-3">
            <Truck className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">LODS Terminal</h1>
            <p className="text-sm text-muted-foreground">Lean On Delivery Services Portal</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> 
              Manager Access
            </CardTitle>
            <CardDescription>
              Enter credentials to access Mission Control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@lods.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/50"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/50"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Initialize Link
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-60">
              Authorized Personnel Only
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
