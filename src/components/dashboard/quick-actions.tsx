
"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Store, Users, Map, Settings } from "lucide-react"

export function QuickActions() {
  return (
    <div className="space-y-4">
      <Card className="shadow-md border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Priority Ops</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full shadow-lg shadow-primary/20">
            <Link href="/orders?tab=create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Booking
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-md border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Terminal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button variant="outline" asChild className="justify-start hover:border-primary/50 hover:bg-primary/5 h-9">
            <Link href="/partners">
              <Store className="mr-2 h-4 w-4 text-primary" /> Partner Network
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start hover:border-primary/50 hover:bg-primary/5 h-9">
            <Link href="/riders">
              <Users className="mr-2 h-4 w-4 text-primary" /> Rider Registry
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start hover:border-primary/50 hover:bg-primary/5 h-9">
            <Link href="/tracker">
              <Map className="mr-2 h-4 w-4 text-primary" /> Live Tracking
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start hover:border-primary/50 hover:bg-primary/5 h-9">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4 text-primary" /> System Config
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
