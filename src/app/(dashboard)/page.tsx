
"use client"

import { useMemo } from "react"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { supabase } from "@/supabase/config"
import { OrderStats } from "@/components/dashboard/order-stats"
import { LiveOrderFeed } from "@/components/dashboard/live-order-feed"
import { OperationsMap } from "@/components/dashboard/operations-map"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Database, AlertCircle, RefreshCcw, PlusCircle } from "lucide-react"

export default function MissionControlPage() {
  const { toast } = useToast()

  const { data: orders, isLoading: ordersLoading } = useSupabaseCollection("orders", {
    orderBy: { column: "created_at", ascending: false },
    limit: 50
  })

  const { data: riders, isLoading: ridersLoading } = useSupabaseCollection("users", {
    filter: [
      { column: "role", operator: "==", value: "rider" },
      { column: "status", operator: "==", value: "online" }
    ]
  })

  const loading = ordersLoading || ridersLoading
  const error = null // Simplified error handling

  // Calculate stats
  const stats = useMemo(() => {
    const ordersList = orders || []
    const ridersList = riders || []
    
    const active = ordersList.filter(o => o.status === 'pending' || o.status === 'in-transit').length
    const online = ridersList.length
    const pending = ordersList.filter(o => o.status === 'pending').length
    
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const todayRevenue = ordersList
      .filter(o => {
        const createdAt = new Date(o.created_at || Date.now())
        return createdAt >= startOfDay && o.status !== 'cancelled'
      })
      .reduce((acc, curr) => acc + (Number(curr.final_total) || 0), 0)

    return { active, online, revenue: todayRevenue, pending }
  }, [orders, riders])

  const createSampleData = async () => {
    try {
      await supabase.from("orders").insert({
        booking_no: `LODS-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_name: "Jane Doe (Sample)",
        merchant_name: "The Coffee House",
        status: "pending",
        final_total: 25.50,
        created_at: new Date().toISOString(),
        delivery_address: "123 Sample Street, Lagos"
        // lat/lng removed for simplicity as schema changed
      })
      
      toast({
        title: "Success",
        description: "Sample order initialized.",
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

      {(orders?.length === 0 || !orders) && !error && (
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
            <LiveOrderFeed orders={(orders || []).slice(0, 8)} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 shadow-lg border-primary/10 overflow-hidden">
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

