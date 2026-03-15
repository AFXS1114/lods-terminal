"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Truck, Banknote, Clock } from "lucide-react"

interface OrderStatsProps {
  activeOrders: number
  onlineRiders: number
  todayRevenue: number
  pendingBookings: number
}

export function OrderStats({ activeOrders, onlineRiders, todayRevenue, pendingBookings }: OrderStatsProps) {
  const stats = [
    {
      title: "Active Orders",
      value: activeOrders.toString(),
      description: "In-transit or pending",
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Online Riders",
      value: onlineRiders.toString(),
      description: "Currently available",
      icon: Truck,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Today's Revenue",
      value: `₱${todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      description: "Confirmed gross revenue",
      icon: Banknote,
      color: "text-green-600",
      bgColor: "bg-green-600/10",
    },
    {
      title: "Pending Bookings",
      value: pendingBookings.toString(),
      description: "Awaiting assignment",
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
