
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Trophy, UserPlus, ArrowRight } from "lucide-react"
import { OperationsMap } from "@/components/dashboard/operations-map"

interface RiderSidebarProps {
  riders: any[]
}

export function RiderSidebar({ riders }: RiderSidebarProps) {
  // Mock top riders based on rating
  const topRiders = [...riders]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-none bg-slate-900 text-white overflow-hidden h-[300px] flex flex-col">
        <CardHeader className="pb-2 shrink-0 z-10 bg-slate-900 relative">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" /> Core Fleet Map Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative flex-1 min-h-0">
          <OperationsMap riders={riders} orders={[]} />
        </CardContent>
      </Card>

      <Card className="shadow-md border-none">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" /> Top Fleet Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {topRiders.map((rider, i) => (
            <div key={rider.id} className="flex items-center gap-3">
              <div className="relative font-bold text-xs text-muted-foreground w-4">{i + 1}</div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={rider.avatar} />
                <AvatarFallback>{rider.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{rider.name}</p>
                <p className="text-[10px] text-muted-foreground">{rider.vehicleType}</p>
              </div>
              <div className="text-[10px] font-bold text-accent">★ {rider.rating}</div>
            </div>
          ))}
          {topRiders.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-4">Ranking riders...</p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
