"use client"

import { OrderStats } from "@/components/dashboard/order-stats"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const recentOrders = [
  {
    id: "ORD-7281",
    customer: "John Doe",
    merchant: "Gourmet Foods",
    status: "Active",
    time: "2 mins ago",
    amount: "$24.50",
  },
  {
    id: "ORD-7282",
    customer: "Alice Smith",
    merchant: "Tech Store",
    status: "Pending",
    time: "15 mins ago",
    amount: "$120.00",
  },
  {
    id: "ORD-7283",
    customer: "Bob Wilson",
    merchant: "Pharmacy Plus",
    status: "Completed",
    time: "1 hour ago",
    amount: "$45.20",
  },
  {
    id: "ORD-7284",
    customer: "Sarah Jane",
    merchant: "Bakery Delight",
    status: "Active",
    time: "2 hours ago",
    amount: "$15.75",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Logistics Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, Administrator. Here's what's happening today.</p>
      </div>

      <OrderStats />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>A live view of current delivery operations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.merchant}</TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === "Active" ? "default" : 
                        order.status === "Pending" ? "outline" : "secondary"
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{order.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Active Riders</CardTitle>
            <CardDescription>Available riders in the field.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                { name: "Michael Ross", status: "On Delivery", avatar: "MR" },
                { name: "Jessica Day", status: "Available", avatar: "JD" },
                { name: "Nick Miller", status: "Break", avatar: "NM" },
                { name: "Cece Parekh", status: "On Delivery", avatar: "CP" },
              ].map((rider) => (
                <div key={rider.name} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://picsum.photos/seed/${rider.name}/40/40`} />
                    <AvatarFallback>{rider.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{rider.name}</p>
                    <p className="text-sm text-muted-foreground">{rider.status}</p>
                  </div>
                  <div className="ml-auto font-medium">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      rider.status === "Available" ? "bg-green-500" : 
                      rider.status === "Break" ? "bg-orange-400" : "bg-blue-500"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}