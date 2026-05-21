
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



    </div>
  )
}
