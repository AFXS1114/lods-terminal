"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp, where } from "firebase/firestore"
import { db } from "@/firebase/config"
import { OrderStats } from "@/components/dashboard/order-stats"
import { LiveOrderFeed } from "@/components/dashboard/live-order-feed"
import { OperationsMap } from "@/components/dashboard/operations-map"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Database, AlertCircle, RefreshCcw, PlusCircle } from "lucide-react"

export default function MissionControlPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

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
      setError(null)
    }, (err) => {
      console.error("Firestore Orders Error:", err)
      setError("Database link established. Awaiting first data sync...")
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
    }, (err) => {
      console.warn("Riders listener failed:", err)
    })

    return () => unsubscribe()
  }, [])

  const stats = useMemo(() => {
    const active = orders.filter(o => o.status === 'pending' || o.status === 'in-transit').length
    const online = riders.length
    const pending = orders.filter(o => o.status === 'pending').length
    
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const todayRevenue = orders
      .filter(o => {
        const createdAt = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || Date.now())
        return createdAt >= startOfDay && o.status !== 'cancelled'
      })
      .reduce((acc, curr) => acc + (Number(curr.finalTotal) || 0), 0)

    return { active, online, revenue: todayRevenue, pending }
  }, [orders, riders])

  const createSampleData = async () => {
    try {
      addDoc(collection(db, "orders"), {
        bookingNo: `LODS-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: "Jane Doe (Sample)",
        merchant: "The Coffee House",
        status: "pending",
        finalTotal: 25.50,
        createdAt: serverTimestamp(),
        deliveryLocation: {
          lat: 6.5244,
          lng: 3.3792,
          address: "123 Sample Street, Lagos"
        }
      })
      
      toast({
        title: "Success",
        description: "Sample order initialized. Refreshing view...",
      })
    } catch (e: any) {
      toast({
        title: "Initialization Failed",
        description: e.message || "Could not add sample data.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse font-medium">Synchronizing with Terminal Database...</p>
        </div>
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
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="hidden md:flex">
             <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">System Live</span>
          </div>
        </div>
      </div>

      {orders.length === 0 && !error && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold">No Operational Data</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Your dashboard is connected but no orders were found in the 'orders' collection.
            </p>
            <Button onClick={createSampleData} className="shadow-lg shadow-primary/20">
              <PlusCircle className="mr-2 h-4 w-4" />
              Initialize First Order
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">{error}</p>
            <Button variant="link" size="sm" onClick={createSampleData} className="ml-auto">Try initializing data</Button>
          </CardContent>
        </Card>
      )}

      <OrderStats 
        activeOrders={stats.active} 
        onlineRiders={stats.online} 
        todayRevenue={stats.revenue} 
        pendingBookings={stats.pending} 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        <Card className="lg:col-span-5 shadow-lg border-primary/10 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-lg">Live Order Feed</CardTitle>
            <CardDescription>Most recent delivery activities</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <LiveOrderFeed orders={orders.slice(0, 8)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 shadow-lg border-primary/10 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-lg">Operations Map</CardTitle>
            <CardDescription>Fleet & destination visualizer</CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[400px]">
            <OperationsMap riders={riders} orders={orders} />
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
