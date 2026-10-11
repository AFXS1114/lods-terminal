"use client"

import { useMemo, useState } from "react"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Truck } from "lucide-react"
import { OrderDetailModal } from "@/components/orders/order-detail-modal"

export default function RidersDeliveriesPage() {
  const { data: orders, isLoading } = useSupabaseCollection("orders", {
    orderBy: { column: "created_at", ascending: false }
  })
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    if (!orders) return []
    
    return orders.filter((order: any) => {
      if (!order.created_at) return false
      const dateObj = new Date(order.created_at)
      const orderDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0] // YYYY-MM-DD local
      
      const isAfterStart = startDate ? orderDate >= startDate : true
      const isBeforeEnd = endDate ? orderDate <= endDate : true
      
      return isAfterStart && isBeforeEnd
    })
  }, [orders, startDate, endDate])

  // Group orders by rider
  const ordersByRider = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return {}

    const grouped: Record<string, any[]> = {}

    filteredOrders.forEach((order: any) => {
      const riderName = order.rider_name || "Unassigned"
      if (!grouped[riderName]) {
        grouped[riderName] = []
      }
      grouped[riderName].push(order)
    })

    return grouped
  }, [filteredOrders])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const riderNames = Object.keys(ordersByRider)

  if (riderNames.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-muted-foreground">No delivery data available.</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Rider's Deliveries</h2>
        <p className="text-muted-foreground">Detailed delivery reports grouped by rider.</p>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap gap-4 items-end bg-muted/20 p-4 rounded-lg border">
        <div className="grid gap-2">
          <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
          <input
            id="startDate"
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
          <input
            id="endDate"
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(""); setEndDate(""); }}
            className="h-10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {riderNames.map((riderName) => {
        const riderOrders = ordersByRider[riderName]
        const totalRiderRevenue = riderOrders.reduce((sum, order) => sum + (Number(order.final_total) || 0), 0)

        return (
          <Card key={riderName} className="shadow-md border-none overflow-hidden">
            <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  {riderName}
                </CardTitle>
                <CardDescription>
                  {riderOrders.length} {riderOrders.length === 1 ? 'delivery' : 'deliveries'} recorded.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <div className="text-lg font-bold text-primary">₱{totalRiderRevenue.toFixed(2)}</div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Booking No.</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Delivery Fee</TableHead>
                    <TableHead className="text-right">Item Fee</TableHead>
                    <TableHead className="text-right">Total Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riderOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsModalOpen(true)
                          }}
                          className="font-mono text-xs font-bold text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors text-left cursor-pointer"
                          title="Click to view order details & rider info"
                        >
                          {order.booking_no || 'LODS-XXXXX'}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{order.merchant_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm font-medium">{order.customer_name}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">
                        {order.delivery_address || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ₱{(Number(order.delivery_fee) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ₱{((Number(order.final_total) || 0) - (Number(order.delivery_fee) || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">
                        ₱{(Number(order.final_total) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'delivered' ? 'secondary' : 'outline'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      })}

      <OrderDetailModal
        order={selectedOrder}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOrder(null)
        }}
      />
    </div>
  )
}
