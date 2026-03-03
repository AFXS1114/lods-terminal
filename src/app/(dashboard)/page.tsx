"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, query, onSnapshot, where, orderBy, limit, Timestamp, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/firebase/config"
import { OrderStats } from "@/components/dashboard/order-stats"
import { LiveOrderFeed } from "@/components/dashboard/live-order-feed"
import { OperationsMap } from "@/components/dashboard/operations-map"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Database, AlertCircle } from "lucide-react"

export default function MissionControlPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Real-time listener for Orders
  useEffect(() => {
    try {
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
        setError("Failed to connect to orders database.")
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (e) {
      console.error("Query setup error:", e)
      setLoading(false)
    }
  }, [])

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
    }, (err) => {
      console.warn("Riders listener suppressed or failed:", err)
    })

    return () => unsubscribe()
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const active = orders.filter(o => o.status === 'pending' || o.status === 'in-transit').length
    const online = riders.length
    const pending = orders.filter(o => o.status === 'pending').length
    
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const todayRevenue = orders
      .filter(o => {
        const date = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt || Date.now())
        return date >= startOfDay && o.status !== 'cancelled'
      })
      .reduce((acc, curr) => acc + (Number(curr.finalTotal) || 0), 0)

    return { active, online, revenue: todayRevenue, pending }
  }, [orders, riders])

  const createSampleData = async () => {
    try {
      await addDoc(collection(db, "orders"), {
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
        title: "Sample Data Created",
        description: "A test order has been added to your dashboard.",
      })
    } catch (e) {
      toast({
        title: "Setup Failed",
        description: "Could not add sample data. Check Firebase permissions.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">Establishing secure link to Mission Control...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-bold">Connection Error</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry Connection</Button>
        </Card>
      </div>
    )
  }

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

      {orders.length === 0 && (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Database className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Live Data Found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Your dashboard is currently empty. You can wait for real orders or initialize sample data for testing.
            </p>
            <Button onClick={createSampleData}>
              <Database className="mr-2 h-4 w-4" />
              Initialize Sample Order
            </Button>
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
        <Card className="lg:col-span-5 shadow-lg border-primary/10">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Live Order Feed</CardTitle>
            <CardDescription>Most recent delivery activities</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <LiveOrderFeed orders={orders.slice(0, 8)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 shadow-lg border-primary/10 overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Operations Map</CardTitle>
            <CardDescription>Real-time fleet & destination view</CardDescription>
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
