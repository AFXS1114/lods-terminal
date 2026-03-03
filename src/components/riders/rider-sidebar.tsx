
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Trophy, UserPlus, ArrowRight } from "lucide-react"

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
      <Card className="shadow-md border-none bg-slate-900 text-white overflow-hidden h-[250px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary" /> Rider Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative h-full">
           <div className="absolute inset-0 opacity-30 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }} 
           />
           <div className="flex flex-col items-center justify-center h-full p-4 text-center">
             <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
               <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
               <MapPin className="h-8 w-8 text-primary" />
             </div>
             <p className="mt-4 text-xs font-medium text-slate-400">Live clusters tracking in progress...</p>
           </div>
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

      <Card className="shadow-md border-primary/20 bg-primary/5 border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <UserPlus className="h-3 w-3" /> Pending Registrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border text-xs shadow-sm">
            <div className="flex flex-col">
              <span className="font-bold">Aleksei Volkov</span>
              <span className="text-[10px] text-muted-foreground">Heavy Van • Docs Pending</span>
            </div>
            <ArrowRight className="h-3 w-3 text-primary cursor-pointer hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[10px] text-center text-muted-foreground">3 applications awaiting review</p>
        </CardContent>
      </Card>
    </div>
  )
}
