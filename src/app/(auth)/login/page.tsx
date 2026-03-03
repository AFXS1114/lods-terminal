
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/config"
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react"
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Administrative Bypass for testing
      if (email === "admin@lods.com" && password === "password") {
        router.push("/dashboard")
        return
      }

      // Live Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-white shadow-xl">
            <Image
              src="/src/images/logo.png"
              alt="LODS Logo"
              fill
              className="object-contain p-1"
              priority
            />
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
              Enter your credentials to access the Mission Control dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@lods.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" className="px-0 font-normal text-xs text-primary" type="button">Forgot password?</Button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
              <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Enter Mission Control
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Secure Portal</span>
              </div>
            </div>
            <p className="px-8 text-center text-xs text-muted-foreground">
              Unauthorized access to this terminal is strictly prohibited.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
