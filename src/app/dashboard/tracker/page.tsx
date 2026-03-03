"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Map } from "lucide-react"

export default function TrackerPage() {
  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Live Tracker</h2>
        <p className="text-muted-foreground">Full-screen operational tracking view.</p>
      </div>
      <Card className="flex-1 bg-slate-50 border-dashed overflow-hidden">
        <CardContent className="h-full flex flex-col items-center justify-center text-center">
          <Map className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold">Interactive Map Loading...</h3>
          <p className="text-muted-foreground max-w-sm">
            The full-screen real-time tracking engine is initializing.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
