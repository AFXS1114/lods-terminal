
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Truck, Star, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"

interface RiderStatsProps {
  riders: any[]
  orders: any[]
}

const sparklineData = [
  { val: 4.2 }, { val: 4.5 }, { val: 4.3 }, { val: 4.6 }, { val: 4.8 }, { val: 4.7 }
]

export function RiderStats({ riders, orders }: RiderStatsProps) {
  const onlineRiders = riders.filter(r => r.status === 'online' || r.status === 'busy')
  const busyRidersCount = orders.filter(o => o.riderId).map(o => o.riderId).length
  const idleRidersCount = onlineRiders.length - busyRidersCount

  const avgRating = riders.length > 0 
    ? (riders.reduce((acc, curr) => acc + (curr.rating || 0), 0) / riders.length).toFixed(1)
    : "0.0"

  const totalDeployedBudget = riders.reduce((acc, curr) => acc + (Number(curr.budgetOnHand) || 0), 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-md border-none overflow-hidden group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Riders Online Now</CardTitle>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold flex items-baseline gap-2">
            {onlineRiders.length}
            <span className="text-xs font-normal text-muted-foreground">total active</span>
          </div>
          <div className="flex gap-4 mt-2">
             <div className="flex items-center gap-1.5">
               <div className="h-1.5 w-1.5 rounded-full bg-primary" />
               <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Idle: {idleRidersCount > 0 ? idleRidersCount : 0}</p>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="h-1.5 w-1.5 rounded-full bg-accent" />
               <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">On Delivery: {busyRidersCount}</p>
             </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fleet Efficiency</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">94%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg. Delivery Time: <span className="font-bold text-primary">28 mins</span>
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rider Rating Avg</CardTitle>
          <Star className="h-4 w-4 text-accent fill-accent" />
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{avgRating}</div>
            <p className="text-xs text-muted-foreground mt-1">Weekly Trend</p>
          </div>
          <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line type="monotone" dataKey="val" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deployed Budget</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₱{totalDeployedBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-1">Total active on fleet</p>
        </CardContent>
      </Card>
    </div>
  )
}
