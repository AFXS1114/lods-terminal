"use client"

import { collection, query, where } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { RiderStats } from "@/components/riders/rider-stats"
import { RiderList } from "@/components/riders/rider-list"
import { RiderSidebar } from "@/components/riders/rider-sidebar"
import { Loader2 } from "lucide-react"

export default function RidersPage() {
  const firestore = useFirestore()

  const ridersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "users"), where("role", "==", "rider"))
  }, [firestore])

  const activeOrdersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "orders"), where("status", "in", ["pending", "in-transit", "picked-up"]))
  }, [firestore])

  const { data: riders, isLoading: ridersLoading } = useCollection(ridersQuery)
  const { data: activeOrders } = useCollection(activeOrdersQuery)

  if (ridersLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse font-medium">Accessing Rider Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Rider Command Center</h2>
          <p className="text-muted-foreground">Fleet orchestration and performance monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Fleet Sync Active</span>
        </div>
      </div>

      <RiderStats riders={riders || []} orders={activeOrders || []} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <RiderList riders={riders || []} orders={activeOrders || []} />
        </div>
        <div className="lg:col-span-4">
          <RiderSidebar riders={riders || []} />
        </div>
      </div>
    </div>
  )
}
