"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingForm } from "@/components/orders/booking-form"
import { RiderTransferPopover } from "@/components/orders/rider-transfer-popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export default function OrdersPage() {
  const firestore = useFirestore()
  
  const ordersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "orders"), orderBy("createdAt", "desc"))
  }, [firestore])

  const { data: orders, isLoading } = useCollection(ordersQuery)

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'secondary'
      case 'in-transit': return 'default'
      case 'pending': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A'
    try {
      const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue)
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return 'Invalid Date'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Orders Management</h2>
        <p className="text-muted-foreground">Create and manage delivery bookings in real-time.</p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Orders</TabsTrigger>
          <TabsTrigger value="create">New Booking</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>A comprehensive list of all past and current deliveries.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order At</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Dispatch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!orders || orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No orders found. Create your first booking.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-bold text-primary">
                            {order.bookingNo || 'LODS-XXXXX'}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{order.customerName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-xs">{order.deliveryLocation?.address || order.deliveryAddress}</TableCell>
                          <TableCell className="w-[160px]">
                            <RiderTransferPopover 
                              orderId={order.id} 
                              currentRiderId={order.riderId} 
                              currentRiderName={order.riderName} 
                              orderStatus={order.status} 
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            ₱{(Number(order.finalTotal) || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="create">
          <BookingForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
