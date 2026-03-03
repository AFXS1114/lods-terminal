
"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, query, onSnapshot, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "@/firebase/config"
import { OrderStats } from "@/components/dashboard/order-stats"
import { LiveOrderFeed } from "@/components/dashboard/live-order-feed"
import { OperationsMap } from "@/components/dashboard/operations-map"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function MissionControlPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Real-time listener for Orders
  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(50)
    )

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setOrders(ordersData)
      setLoading(false)
    }, (error) => {
      console.error("Firestore Orders Error:", error)
      toast({
        title: "Connection Error",
        description: "Failed to sync orders in real-time.",
        variant: "destructive"
      })
    })

    return () => unsubscribe()
  }, [toast])

  // Real-time listener for Online Riders
  useEffect(() => {
    const ridersQuery = query(
      collection(db, "users"),
      where("role", "==", "rider"),
      where("status", "==", "online")
    )

    const unsubscribe = onSnapshot(ridersQuery, (snapshot) => {
      const ridersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setRiders(ridersData)
    })

    return () => unsubscribe()
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const active = orders.filter(o => o.status === 'pending' || o.status === 'in-transit').length
    const online = riders.length
    const pending = orders.filter(o => o.status === 'pending').length
    
    // Revenue for today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayRevenue = orders
      .filter(o => {
        const date = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt)
        return date >= startOfDay && o.status !== 'cancelled'
      })
      .reduce((acc, curr) => acc + (curr.finalTotal || 0), 0)

    return { active, online, revenue: todayRevenue, pending }
  }, [orders, riders])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Mission Control</h2>
          <p className="text-muted-foreground">LODS Logistics Real-time Operations Center</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live System Active</span>
        </div>
      </div>

      {/* Main Stats Bar */}
      <OrderStats 
        activeOrders={stats.active} 
        onlineRiders={stats.online} 
        todayRevenue={stats.revenue} 
        pendingBookings={stats.pending} 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        {/* Live Order Feed */}
        <Card className="lg:col-span-5 shadow-lg border-primary/10">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Live Order Feed</CardTitle>
            <CardDescription>Most recent delivery activities</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <LiveOrderFeed orders={orders.slice(0, 8)} />
          </CardContent>
        </Card>

        {/* Operations Map */}
        <Card className="lg:col-span-4 shadow-lg border-primary/10 overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Operations Map</CardTitle>
            <CardDescription>Real-time fleet & destination view</CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[400px]">
            <OperationsMap riders={riders} orders={orders} />
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
