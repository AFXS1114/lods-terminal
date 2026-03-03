"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Store } from "lucide-react"

export default function PartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Partner Network</h2>
        <p className="text-muted-foreground">Manage merchants and delivery partners.</p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Store className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold">Partner Registry Under Maintenance</h3>
          <p className="text-muted-foreground max-w-sm">
            We are currently optimizing the partner management interface. This feature will be available shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
