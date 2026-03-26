"use client"

import { useState, useMemo } from "react"
import { collection, query, orderBy } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Search, History, Activity, Calendar as CalendarIcon, X, Truck, Briefcase, Users } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type RoleFilter = "all" | "rider" | "teller"

export default function DtrPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const firestore = useFirestore()

  const riderDtrQuery = useMemoFirebase(() =>
    query(collection(firestore, "riderDTR"), orderBy("timeIn", "desc"))
  , [firestore])

  const tellerDtrQuery = useMemoFirebase(() =>
    query(collection(firestore, "tellerDTR"), orderBy("timeIn", "desc"))
  , [firestore])

  const { data: riderRecords, isLoading: riderLoading } = useCollection(riderDtrQuery)
  const { data: tellerRecords, isLoading: tellerLoading } = useCollection(tellerDtrQuery)

  const isLoading = riderLoading || tellerLoading

  // Merge and tag each record with its role
  const allRecords = useMemo(() => {
    const riders = (riderRecords || []).map(r => ({
      ...r,
      role: "rider" as const,
      staffName: r.riderName || "Unknown Rider",
    }))
    const tellers = (tellerRecords || []).map(r => ({
      ...r,
      role: "teller" as const,
      staffName: r.tellerName || "Unknown Teller",
    }))
    // Merge and sort by timeIn desc
    return [...riders, ...tellers].sort((a, b) => {
      const aTime = a.timeIn?.toDate ? a.timeIn.toDate().getTime() : 0
      const bTime = b.timeIn?.toDate ? b.timeIn.toDate().getTime() : 0
      return bTime - aTime
    })
  }, [riderRecords, tellerRecords])

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '---'
    try {
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch { return 'Invalid' }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '---'
    try {
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return 'Invalid' }
  }

  const calculateDuration = (timeIn: any, timeOut: any) => {
    if (!timeIn) return 'N/A'
    try {
      const start = typeof timeIn.toDate === 'function' ? timeIn.toDate() : new Date(timeIn)
      const end = timeOut
        ? (typeof timeOut.toDate === 'function' ? timeOut.toDate() : new Date(timeOut))
        : new Date()
      const diffMs = end.getTime() - start.getTime()
      if (diffMs < 0) return '0h 0m'
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      if (hours === 0) return `${minutes}m`
      return `${hours}h ${minutes}m`
    } catch { return 'Error' }
  }

  const filteredRecords = allRecords.filter(r => {
    const matchesSearch = r.staffName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || r.role === roleFilter
    let matchesDate = true
    if (dateFilter && r.timeIn) {
      try {
        const recordDate = typeof r.timeIn.toDate === 'function' ? r.timeIn.toDate() : new Date(r.timeIn)
        matchesDate = recordDate.toDateString() === dateFilter.toDateString()
      } catch { matchesDate = false }
    }
    return matchesSearch && matchesRole && matchesDate
  })

  const datesWithRecords = useMemo(() => {
    return allRecords
      .map(r => r.timeIn ? (typeof r.timeIn.toDate === 'function' ? r.timeIn.toDate() : new Date(r.timeIn)) : null)
      .filter((date): date is Date => date !== null)
  }, [allRecords])

  const activeShifts = allRecords.filter(r => !r.timeOut).length
  const activeRiders = (riderRecords || []).filter(r => !r.timeOut).length
  const activeTellers = (tellerRecords || []).filter(r => !r.timeOut).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Clock className="h-8 w-8 text-accent" /> Daily Time Records
          </h2>
          <p className="text-muted-foreground">Monitor all staff shifts, attendance, and operational hours.</p>
        </div>

        {/* Stat cards */}
        <div className="flex items-center gap-3 flex-wrap">
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active</span>
                <span className="text-2xl font-black text-primary flex items-center gap-2">
                  {activeShifts > 0 && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                    </span>
                  )}
                  {activeShifts}
                </span>
              </div>
              <div className="w-px h-10 bg-primary/20" />
              <div className="flex flex-col items-center">
                <Truck className="h-3.5 w-3.5 text-blue-500 mb-0.5" />
                <span className="text-lg font-black text-blue-500">{activeRiders}</span>
              </div>
              <div className="flex flex-col items-center">
                <Briefcase className="h-3.5 w-3.5 text-violet-500 mb-0.5" />
                <span className="text-lg font-black text-violet-500">{activeTellers}</span>
              </div>
              <div className="w-px h-10 bg-primary/20" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Logs</span>
                <span className="text-2xl font-black text-accent">{allRecords.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-muted/20 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" /> Shift History
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              {/* Role filter tabs */}
              <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                <TabsList className="h-9 rounded-xl bg-muted/50 p-1">
                  <TabsTrigger value="all" className="rounded-lg text-xs gap-1.5">
                    <Users className="h-3 w-3" /> All
                  </TabsTrigger>
                  <TabsTrigger value="rider" className="rounded-lg text-xs gap-1.5">
                    <Truck className="h-3 w-3 text-blue-500" /> Riders
                  </TabsTrigger>
                  <TabsTrigger value="teller" className="rounded-lg text-xs gap-1.5">
                    <Briefcase className="h-3 w-3 text-violet-500" /> Tellers
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search */}
              <div className="relative w-full sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  className="pl-9 bg-background focus-visible:ring-primary/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Date filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full sm:w-[200px] justify-start text-left font-normal border-primary/20 hover:bg-primary/5 ${!dateFilter && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {dateFilter
                        ? dateFilter.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : <span>Filter by date...</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 shadow-2xl border-primary/20" align="end">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                      className="p-3"
                      modifiers={{ hasRecord: datesWithRecords }}
                      modifiersClassNames={{
                        hasRecord:
                          "font-bold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full text-primary",
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {dateFilter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDateFilter(undefined)}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center flex-col gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading time records...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No shift records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium whitespace-nowrap text-sm">
                        {formatDate(record.timeIn)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={`text-[10px] font-bold ${record.role === "rider" ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"}`}>
                              {record.staffName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-sm text-primary">{record.staffName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold ${
                            record.role === "rider"
                              ? "text-blue-500 border-blue-500/30 bg-blue-50"
                              : "text-violet-500 border-violet-500/30 bg-violet-50"
                          }`}
                        >
                          {record.role === "rider" ? <Truck className="h-2.5 w-2.5 mr-1 inline" /> : <Briefcase className="h-2.5 w-2.5 mr-1 inline" />}
                          {record.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.shiftLabel ? (
                          <span className="text-xs font-semibold text-muted-foreground">{record.shiftLabel}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {formatTime(record.timeIn)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.timeOut ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            {formatTime(record.timeOut)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">--:--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">
                        {calculateDuration(record.timeIn, record.timeOut)}
                      </TableCell>
                      <TableCell>
                        {record.timeOut ? (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600 animate-pulse">
                            <Activity className="h-3 w-3 mr-1" /> Running...
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
