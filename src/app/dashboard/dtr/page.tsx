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
import { Clock, Search, History, Activity, Calendar as CalendarIcon, X } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function DtrPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const firestore = useFirestore()

  const dtrQuery = useMemoFirebase(() => {
    return query(collection(firestore, "riderDTR"), orderBy("timeIn", "desc"))
  }, [firestore])

  const { data: records, isLoading } = useCollection(dtrQuery)

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '---'
    try {
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return 'Invalid'
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '---'
    try {
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Invalid'
    }
  }

  const calculateDuration = (timeIn: any, timeOut: any) => {
    if (!timeIn) return 'N/A'
    
    try {
      const start = typeof timeIn.toDate === 'function' ? timeIn.toDate() : new Date(timeIn)
      const end = timeOut 
        ? (typeof timeOut.toDate === 'function' ? timeOut.toDate() : new Date(timeOut))
        : new Date() // Use current time if still running

      const diffMs = end.getTime() - start.getTime()
      if (diffMs < 0) return '0h 0m'

      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

      if (hours === 0) return `${minutes}m`
      return `${hours}h ${minutes}m`
    } catch {
      return 'Error'
    }
  }

  const filteredRecords = records?.filter(r => {
    const matchesSearch = r.riderName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesDate = true
    if (dateFilter && r.timeIn) {
      try {
        const recordDate = typeof r.timeIn.toDate === 'function' ? r.timeIn.toDate() : new Date(r.timeIn)
        matchesDate = recordDate.toDateString() === dateFilter.toDateString()
      } catch {
        matchesDate = false
      }
    }
    
    return matchesSearch && matchesDate
  }) || []

  const datesWithRecords = useMemo(() => {
    if (!records) return []
    return records
      .map(r => r.timeIn ? (typeof r.timeIn.toDate === 'function' ? r.timeIn.toDate() : new Date(r.timeIn)) : null)
      .filter((date): date is Date => date !== null)
  }, [records])

  const activeShifts = records?.filter(r => !r.timeOut).length || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Clock className="h-8 w-8 text-accent" /> Daily Time Records
          </h2>
          <p className="text-muted-foreground">Monitor rider shifts, attendance, and operational hours.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Card className="bg-primary/5 border-primary/20 shadow-none">
             <CardContent className="p-4 flex items-center gap-4">
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Shifts</span>
                 <span className="text-2xl font-black text-primary flex items-center gap-2">
                    {activeShifts > 0 && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}
                    {activeShifts}
                 </span>
               </div>
               <div className="w-px h-10 bg-primary/20" />
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Logs</span>
                 <span className="text-2xl font-black text-accent">{records?.length || 0}</span>
               </div>
             </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-muted/20 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" /> Shift History
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by rider name..." 
                className="pl-9 bg-background focus-visible:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full sm:w-[220px] justify-start text-left font-normal border-primary/20 hover:bg-primary/5 ${!dateFilter && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {dateFilter ? dateFilter.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : <span>Filter by date...</span>}
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
                      hasRecord: "font-bold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full text-primary"
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
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center flex-col gap-4">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading exact time records...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Rider Profile</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No shift records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium whitespace-nowrap text-sm">
                        {formatDate(record.timeIn)}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {record.riderName || 'Unknown Asset'}
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
