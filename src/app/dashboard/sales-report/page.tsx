"use client"

import { useMemo } from "react"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Package, Truck, DollarSign, Award, ShoppingBag } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts"

export default function SalesReportPage() {
  const { data: orders, isLoading } = useSupabaseCollection("orders", {
    orderBy: { column: "created_at", ascending: false }
  })

  // Process data for reports
  const reportData = useMemo(() => {
    if (!orders || orders.length === 0) return null

    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    let totalRevenue = 0
    let totalOrders = 0
    let completedOrders = 0
    const salesByDay: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}
    const riderStats: Record<string, { count: number, revenue: number }> = {}
    const itemStats: Record<string, { count: number, revenue: number }> = {}

    orders.forEach((order: any) => {
      const orderDate = new Date(order.created_at)
      const dayStr = orderDate.toLocaleDateString('en-US', { weekday: 'short' })
      const total = Number(order.final_total) || 0

      totalOrders++
      totalRevenue += total

      if (order.status?.toLowerCase() === 'delivered') {
        completedOrders++
      }

      // Sales by day
      salesByDay[dayStr] = (salesByDay[dayStr] || 0) + total

      // Status counts
      const status = order.status || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1

      // Rider stats
      const riderName = order.rider_name || 'Unassigned'
      if (!riderStats[riderName]) {
        riderStats[riderName] = { count: 0, revenue: 0 }
      }
      riderStats[riderName].count++
      riderStats[riderName].revenue += total

      // Item stats
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemName = item.name || 'Unknown'
          const qty = Number(item.qty) || 0
          const price = Number(item.price) || 0
          const itemTotal = qty * price

          if (!itemStats[itemName]) {
            itemStats[itemName] = { count: 0, revenue: 0 }
          }
          itemStats[itemName].count += qty
          itemStats[itemName].revenue += itemTotal
        })
      }
    })

    // Format sales by day for chart (ensure all days are present or just use what's there)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const chartData = days.map(day => ({
      name: day,
      sales: salesByDay[day] || 0
    }))

    // Format status data for pie chart
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }))

    // Format rider data and sort
    const topRiders = Object.entries(riderStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Format item data and sort
    const topItems = Object.entries(itemStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      chartData,
      pieData,
      topRiders,
      topItems
    }
  }, [orders])

  const COLORS = ['#8B5CF6', '#459366', '#EF4444', '#F59E0B', '#10B981']

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-muted-foreground">No data available to generate reports.</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Sales Report</h2>
        <p className="text-muted-foreground">Analyze your business performance and top performers.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-none bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{reportData.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none bg-gradient-to-br from-accent/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Placed orders</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{reportData.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.completedOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-md border-none">
          <CardHeader>
            <CardTitle>Weekly Sales Trend</CardTitle>
            <CardDescription>Sales performance grouped by day of the week.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={reportData.chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}`} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-md border-none">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Distribution of order statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Riders */}
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                Top Tier Riders
              </CardTitle>
              <CardDescription>Riders with the highest revenue generated.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topRiders.map((rider, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{rider.name}</TableCell>
                    <TableCell className="text-right">{rider.count}</TableCell>
                    <TableCell className="text-right font-bold">₱{rider.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Most Ordered Items */}
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Most Ordered Items
              </CardTitle>
              <CardDescription>Items with the highest quantity ordered.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right font-bold">₱{item.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
