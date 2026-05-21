"use client"

import { useMemo } from "react"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { RiderStats } from "@/components/riders/rider-stats"
import { RiderList } from "@/components/riders/rider-list"
import { RiderSidebar } from "@/components/riders/rider-sidebar"
import { Loader2 } from "lucide-react"

export default function RidersPage() {
  const { data: riders, isLoading: ridersLoading, refetch: refetchRiders } = useSupabaseCollection("users", {
    filter: { column: "role", operator: "==", value: "rider" }
  })

  const { data: activeOrders } = useSupabaseCollection("orders", {
    filter: { column: "status", operator: "in", value: ["pending", "in-transit", "picked-up"] }
  })

  const today = useMemo(() => new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], [])
  const { data: deployments } = useSupabaseCollection("rider_deployments", {
    filter: { column: "date", operator: "==", value: today }
  })

  const { data: ratings } = useSupabaseCollection("ratings")

  const deployedRiders = useMemo(() => {
    if (!riders || !deployments) return []
    
    const result: any[] = []
    
    riders.forEach((rider: any) => {
      const deployment = deployments.find((d: any) => d.rider_id === rider.id)
      if (deployment) {
        const totalBudget = Array.isArray(deployment.budget) 
          ? deployment.budget.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0)
          : 0
          
        const totalAdvances = Array.isArray(deployment.gas_budget)
          ? deployment.gas_budget.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0)
          : 0
          
        const riderRatings = ratings?.filter((r: any) => r.rider_id === rider.id) || []
        const avgRating = riderRatings.length > 0
          ? riderRatings.reduce((sum: number, r: any) => sum + (Number(r.rider_rating) || 0), 0) / riderRatings.length
          : null
          
        result.push({
          ...rider,
          budget_on_hand: totalBudget,
          cash_advance: totalAdvances,
          rating: avgRating ? avgRating.toFixed(1) : 'N/A',
        })
      }
    })
    
    return result
  }, [riders, deployments, ratings])

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

      <RiderStats riders={deployedRiders} orders={activeOrders || []} />

      <RiderList riders={deployedRiders} orders={activeOrders || []} refetchRiders={refetchRiders} />
    </div>
  )
}
