
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LiveOrderFeedProps {
  orders: any[]
}

export function LiveOrderFeed({ orders }: LiveOrderFeedProps) {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'secondary'
      case 'in-transit': return 'default'
      case 'pending': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'default'
    }
  }

  return (
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
              <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30">
                <TableCell className="font-mono text-xs text-primary font-bold">
                  {order.bookingNo || 'N/A'}
                </TableCell>
                <TableCell className="text-sm">{order.customerName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {order.merchant || 'Generic'}
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
  )
}
