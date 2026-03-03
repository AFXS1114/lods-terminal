"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Truck, CheckCircle, Clock } from "lucide-react"

const stats = [
  {
    title: "Pending Orders",
    value: "24",
    description: "Requires rider assignment",
    icon: Clock,
    color: "text-orange-500",
  },
  {
    title: "Active Deliveries",
    value: "42",
    description: "Currently in transit",
    icon: Truck,
    color: "text-blue-600",
  },
  {
    title: "Completed Today",
    value: "156",
    description: "+12% from yesterday",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    title: "Total Bookings",
    value: "1,284",
    description: "This month",
    icon: Package,
    color: "text-purple-600",
  },
]

export function OrderStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
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