"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingForm } from "@/components/orders/booking-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
        <p className="text-muted-foreground">Create and manage delivery bookings.</p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Orders</TabsTrigger>
          <TabsTrigger value="create">New Booking</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>A comprehensive list of all past and current deliveries.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">LODS-{1000 + i}</TableCell>
                      <TableCell className="max-w-[150px] truncate">123 Business St, Downtown</TableCell>
                      <TableCell className="max-w-[150px] truncate">456 Residential Ave, Uptown</TableCell>
                      <TableCell>Medium Box</TableCell>
                      <TableCell>
                        <Badge variant={i % 2 === 0 ? "outline" : "default"}>
                          {i % 2 === 0 ? "Pending" : "Dispatched"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary cursor-pointer hover:underline">
                        View Details
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
