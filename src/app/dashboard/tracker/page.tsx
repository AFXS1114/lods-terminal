
"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, where } from "firebase/firestore"
import { OperationsMap } from "@/components/dashboard/operations-map"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Maximize2, Map } from "lucide-react"

export default function TrackerPage() {
  const firestore = useFirestore()

  const ordersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "orders"), where("status", "==", "pending"))
  }, [firestore])

  const ridersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "users"), where("role", "==", "rider"), where("status", "==", "online"))
  }, [firestore])

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery)
  const { data: riders, isLoading: ridersLoading } = useCollection(ridersQuery)

  if (ordersLoading || ridersLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Initializing Global Tracking Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Map className="h-8 w-8" /> Live Fleet Tracker
          </h2>
          <p className="text-muted-foreground">Global real-time visualization of all mobile assets.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
          <Maximize2 className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Full Operational View</span>
        </div>
      </div>

      <Card className="flex-1 bg-slate-900 shadow-2xl border-none overflow-hidden relative">
        <CardContent className="p-0 h-full">
          <OperationsMap riders={riders || []} orders={orders || []} />
        </CardContent>
      </Card>
    </div>
  )
}
