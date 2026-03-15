"use client"

import { useMemo } from "react"
import { collection, query, orderBy, limit, where } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { OrderStats } from "@/components/dashboard/order-stats"
import { LiveOrderFeed } from "@/components/dashboard/live-order-feed"
import { OperationsMap } from "@/components/dashboard/operations-map"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw } from "lucide-react"

export default function MissionControlPage() {
  const firestore = useFirestore()

  const ordersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "orders"), orderBy("createdAt", "desc"), limit(50))
  }, [firestore])

  const ridersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "users"), where("role", "==", "rider"), where("status", "==", "online"))
  }, [firestore])

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery)
  const { data: riders } = useCollection(ridersQuery)

  const stats = useMemo(() => {
    if (!orders) return { active: 0, online: riders?.length || 0, revenue: 0, pending: 0 }
    
    const active = orders.filter(o => o.status === 'pending' || o.status === 'in-transit').length
    const online = riders?.length || 0
    const pending = orders.filter(o => o.status === 'pending').length
    
    const todayRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + (Number(curr.finalTotal) || 0), 0)

    return { active, online, revenue: todayRevenue, pending }
  }, [orders, riders])

  if (ordersLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Mission Control</h2>
          <p className="text-muted-foreground">Logistics Real-time Operations Center</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
             <RefreshCcw className="h-4 w-4 mr-2" /> Live Sync
          </Button>
        </div>
      </div>

      <OrderStats 
        activeOrders={stats.active} 
        onlineRiders={stats.online} 
        todayRevenue={stats.revenue} 
        pendingBookings={stats.pending} 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        <Card className="lg:col-span-5 shadow-lg">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-lg">Live Order Feed</CardTitle>
            <CardDescription>Real-time delivery status</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <LiveOrderFeed orders={orders?.slice(0, 8) || []} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 shadow-lg">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-lg">Operations Map</CardTitle>
            <CardDescription>Fleet & destination visualizer</CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[400px]">
            <OperationsMap riders={riders || []} orders={orders || []} />
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
