"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck } from "lucide-react"

export default function RidersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rider Registry</h2>
        <p className="text-muted-foreground">View and manage the delivery fleet.</p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold">Fleet Management System</h3>
          <p className="text-muted-foreground max-w-sm">
            Access to rider performance stats and registration is being finalized.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
