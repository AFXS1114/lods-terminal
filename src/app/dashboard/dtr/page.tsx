"use client"

import { useState, useMemo, useEffect } from "react"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { supabase } from "@/supabase/config"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()

  const { data: allRecordsData, isLoading } = useSupabaseCollection("dtr", {
    orderBy: { column: "time_in", ascending: false }
  })

  const { data: schedules } = useSupabaseCollection("schedules")

  const allRecords = useMemo(() => {
    return (allRecordsData || []).map(r => ({
      ...r,
      staffName: r.user_name || "Unknown Staff",
    }))
  }, [allRecordsData])

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '---'
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch { return 'Invalid' }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '---'
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return 'Invalid' }
  }

  // Check if the shift's scheduled end time has passed but time_out not yet written
  const isShiftOnHold = (record: any) => {
    if (record.time_out) return false // already completed
    if (!record.time_in) return false
    const recordDateObj = new Date(record.time_in)
    const year = recordDateObj.getFullYear()
    const month = String(recordDateObj.getMonth() + 1).padStart(2, '0')
    const day = String(recordDateObj.getDate()).padStart(2, '0')
    const recordDateStr = `${year}-${month}-${day}`
    const schedule = schedules?.find((s: any) => s.user_id === record.user_id && s.date === recordDateStr)
    if (!schedule || !schedule.shift_end) return false
    const [endHours, endMinutes] = schedule.shift_end.split(':').map(Number)
    const endDutyTime = new Date(recordDateObj)
    endDutyTime.setHours(endHours, endMinutes, 0, 0)
    if (schedule.shift_start && schedule.shift_end < schedule.shift_start) {
      endDutyTime.setDate(endDutyTime.getDate() + 1)
    }
    return new Date() > endDutyTime
  }

  const calculateDuration = (timeIn: any, timeOut: any) => {
    if (!timeIn || !timeOut) return '--'
    try {
      const start = new Date(timeIn)
      const end = new Date(timeOut)
      const diffMs = end.getTime() - start.getTime()
      if (diffMs < 0) return '0m'
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      if (hours === 0) return `${minutes}m`
      return `${hours}h ${minutes}m`
    } catch { return 'Error' }
  }

  // Determine shift status based on schedule window vs current time
  const getShiftStatus = (record: any): 'onhold' | 'running' | 'completed' => {
    if (record.time_out) return 'completed'
    if (!record.time_in) return 'onhold'
    const recordDateObj = new Date(record.time_in)
    const year = recordDateObj.getFullYear()
    const month = String(recordDateObj.getMonth() + 1).padStart(2, '0')
    const day = String(recordDateObj.getDate()).padStart(2, '0')
    const recordDateStr = `${year}-${month}-${day}`
    const schedule = schedules?.find((s: any) => s.user_id === record.user_id && s.date === recordDateStr)
    if (!schedule) return 'running' // no schedule set — treat as running
    const now = new Date()
    if (schedule.shift_start) {
      const [sH, sM] = schedule.shift_start.split(':').map(Number)
      const startTime = new Date(recordDateObj)
      startTime.setHours(sH, sM, 0, 0)
      if (now < startTime) return 'onhold' // current time is before shift start
    }
    return 'running' // within or past shift window but no time_out yet
  }

  const filteredRecords = allRecords.filter(r => {
    const matchesSearch = r.staffName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || r.role === roleFilter
    let matchesDate = true
    if (dateFilter && r.time_in) {
      try {
        const recordDate = new Date(r.time_in)
        matchesDate = recordDate.toDateString() === dateFilter.toDateString()
      } catch { matchesDate = false }
    }

    // Schedule and End Duty checks
    let matchesSchedule = true
    if (r.time_in) {
      const recordDateObj = new Date(r.time_in)
      const recordDateStr = new Date(recordDateObj.getTime() - recordDateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0]
      const schedule = schedules?.find((s: any) => s.user_id === r.user_id && s.date === recordDateStr)

      // Rule 1: Display only when work schedule is set
      if (!schedule) matchesSchedule = false

      // Rule 2: Clear if set end duty is reached
      if (schedule && schedule.shift_end) {
        const now = new Date()
        const [hours, minutes] = schedule.shift_end.split(':').map(Number)
        const endDutyTime = new Date(recordDateObj)
        endDutyTime.setHours(hours, minutes, 0, 0)

        if (now > endDutyTime) {
          matchesSchedule = false // Clear if past end duty
        }
      }
    }

    return matchesSearch && matchesRole && matchesDate && matchesSchedule
  })

  const datesWithRecords = useMemo(() => {
    return allRecords
      .map(r => r.time_in ? new Date(r.time_in) : null)
      .filter((date): date is Date => date !== null)
  }, [allRecords])

  const activeShifts = allRecords.filter(r => !r.time_out).length
  const activeRiders = allRecords.filter(r => r.role === "rider" && !r.time_out).length
  const activeTellers = allRecords.filter(r => r.role === "teller" && !r.time_out).length

  useEffect(() => {
    const autoEndShifts = async () => {
      if (!allRecordsData || !schedules) return

      const now = new Date()
      
      for (const record of allRecordsData) {
        if (!record.time_out && record.time_in) {
          const recordDateObj = new Date(record.time_in)
          const recordDateStr = new Date(recordDateObj.getTime() - recordDateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0]
          
          const schedule = schedules.find((s: any) => s.user_id === record.user_id && s.date === recordDateStr)
          
          if (schedule && schedule.shift_end) {
            const [endHours, endMinutes] = schedule.shift_end.split(':').map(Number)
            const endDutyTime = new Date(recordDateObj)
            endDutyTime.setHours(endHours, endMinutes, 0, 0)
            
            if (schedule.shift_start && schedule.shift_end < schedule.shift_start) {
              endDutyTime.setDate(endDutyTime.getDate() + 1)
            }
            
            if (now > endDutyTime) {
              console.log(`Auto-ending shift for ${record.user_name}`)
              
              const { data: userData } = await supabase.from('users').select('cash_advance').eq('id', record.user_id).single()
              
              await supabase.from('dtr').update({
                time_out: now.toISOString(),
                final_cash_advance: userData?.cash_advance || 0
              }).eq('id', record.id)
              
              await supabase.from('users').update({
                status: "offline",
                last_time_in: null,
                active_dtr_id: null,
                cash_advance: 0
              }).eq('id', record.user_id)
              
              toast({ title: "Shift Auto-Terminated", description: `${record.user_name}'s shift reached its end time.` })
            }
          }
        }
      }
    }
    
    autoEndShifts()
  }, [allRecordsData, schedules, toast])

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
                        {formatDate(record.time_in)}
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
                        {record.shift_type ? (
                          <span className="text-xs font-semibold text-muted-foreground">{record.shift_type}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {formatTime(record.time_in)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.timeOut ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            {formatTime(record.time_out)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">--:--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">
                        {calculateDuration(record.time_in, record.time_out)}
                      </TableCell>
                      <TableCell>
                        {record.time_out ? (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                            Completed
                          </Badge>
                        ) : getShiftStatus(record) === 'onhold' ? (
                          <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50">
                            <span className="h-2 w-2 rounded-full bg-amber-400 mr-1.5 inline-block" /> Standby
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
