
"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OrderDetailModal } from "@/components/orders/order-detail-modal"

interface LiveOrderFeedProps {
  orders: any[]
}

export function LiveOrderFeed({ orders }: LiveOrderFeedProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'secondary'
      case 'in-transit': return 'default'
      case 'pending': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'default'
    }
  }

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  return (
    <>
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[100px]">Booking</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-mono text-xs text-primary font-bold hover:underline">
                    {order.booking_no || order.bookingNo || 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.customer_name || order.customerName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.merchant_name || order.merchant || 'Generic'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <OrderDetailModal
        order={selectedOrder}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOrder(null)
        }}
      />
    </>
  )
}
