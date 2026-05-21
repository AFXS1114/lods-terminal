"use client"

import { useMemo, useState } from "react"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { supabase } from "@/supabase/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Wallet, 
  Search, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  PiggyBank, 
  Clock, 
  User, 
  ShieldAlert, 
  Shield, 
  Truck, 
  Briefcase, 
  DollarSign,
  AlertCircle,
  X,
  Plus
} from "lucide-react"

export default function CashAdvancesPage() {
  const { toast } = useToast()

  // 1. Fetch all users (employees, tellers, riders)
  const { data: users, isLoading: loadingUsers } = useSupabaseCollection("users", {
    orderBy: { column: "name", ascending: true }
  })

  // 2. Fetch all cash advances
  const { data: advances, isLoading: loadingAdvances } = useSupabaseCollection("cash_advances", {
    orderBy: { column: "timestamp", ascending: false }
  })

  // 3. Setup filters state
  // Default to today's date in local time
  const [dateFilter, setDateFilter] = useState<Date | undefined>(() => new Date())
  const [searchName, setSearchName] = useState("")

  // Modal states for issuing advance
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [advanceType, setAdvanceType] = useState<"cash_advance" | "budget_allocation">("cash_advance")
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get only internal staff for dropdown selection
  const staffList = useMemo(() => {
    if (!users) return []
    return users.filter((u: any) => 
      ['admin', 'manager', 'teller', 'rider'].includes(u.role?.toLowerCase())
    )
  }, [users])

  const handleIssueAdvance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffId) {
      toast({ title: "Validation Error", description: "Please select an employee.", variant: "destructive" })
      return
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Validation Error", description: "Please enter a valid amount greater than zero.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const staffMember = users?.find((u: any) => u.id === selectedStaffId)
      if (!staffMember) throw new Error("Staff member not found")

      // 1. Increment the balance in the users table
      const columnName = advanceType === "budget_allocation" ? "budget_on_hand" : "cash_advance"
      await supabase.rpc('increment_column', {
        table_name: 'users',
        column_name: columnName,
        row_id: selectedStaffId,
        amount: Number(amount)
      })

      // 2. Insert the cash advance audit record
      const timestamp = new Date().toISOString()
      const date = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]

      const { error } = await supabase.from('cash_advances').insert({
        user_id: staffMember.id,
        user_name: staffMember.name,
        role: staffMember.role,
        amount: Number(amount),
        type: advanceType,
        timestamp,
        date
      })

      if (error) throw error

      toast({
        title: "Success",
        description: `Successfully allocated ₱${Number(amount).toFixed(2)} to ${staffMember.name}.`
      })

      // Reset form and close
      setAmount("")
      setSelectedStaffId("")
      setAdvanceType("cash_advance")
      setIsModalOpen(false)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to issue cash advance.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Convert Date to YYYY-MM-DD local format
  const getFormattedDate = (date: Date | undefined) => {
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const selectedDateStr = useMemo(() => getFormattedDate(dateFilter), [dateFilter])

  // Helper: Format Time from ISO string
  const formatTime = (isoString: string) => {
    if (!isoString) return ""
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return ""
    }
  }

  // Helper: Format Date for Display
  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Helper: Role Icon and Styling
  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return (
          <Badge className="bg-red-500/10 text-red-600 border border-red-500/20 font-semibold gap-1">
            <ShieldAlert className="h-3 w-3" /> Admin
          </Badge>
        )
      case 'manager':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-semibold gap-1">
            <Shield className="h-3 w-3" /> Manager
          </Badge>
        )
      case 'teller':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold gap-1">
            <Briefcase className="h-3 w-3" /> Teller
          </Badge>
        )
      case 'rider':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 font-semibold gap-1">
            <Truck className="h-3 w-3" /> Rider
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="font-semibold gap-1">
            <User className="h-3 w-3" /> {role || 'Staff'}
          </Badge>
        )
    }
  }

  // 4. Generate dates with advances for the calendar dots
  const datesWithAdvances = useMemo(() => {
    if (!advances) return []
    return advances
      .map((adv: any) => {
        if (!adv.date) return null
        const parts = adv.date.split('-')
        if (parts.length === 3) {
          // Construct date in local timezone to prevent offset errors
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        }
        return null
      })
      .filter((date): date is Date => date !== null)
  }, [advances])

  // 5. Filter advances by date
  const filteredAdvances = useMemo(() => {
    if (!advances) return []
    return advances.filter((adv: any) => {
      if (!adv.date) return false
      if (!selectedDateStr) return true // Show all if date filter is cleared
      return adv.date === selectedDateStr
    })
  }, [advances, selectedDateStr])

  // 6. Combine and calculate advances for each user/personnel
  const personnelWithAdvances = useMemo(() => {
    if (!users) return []

    // We list all personnel (admin, manager, teller, rider) matching search
    const filteredUsers = users.filter((u: any) => {
      const isStaffRole = ['admin', 'manager', 'teller', 'rider'].includes(u.role?.toLowerCase())
      const matchesSearch = u.name?.toLowerCase().includes(searchName.toLowerCase())
      return isStaffRole && matchesSearch
    })

    return filteredUsers.map((u: any) => {
      // Find all advances for this user on the selected date
      const userAdvances = filteredAdvances.filter((adv: any) => adv.user_id === u.id)
      
      // Sum the total advance amount for the selected date
      const totalAmount = userAdvances.reduce((sum: number, adv: any) => sum + (Number(adv.amount) || 0), 0)

      return {
        ...u,
        advancesList: userAdvances,
        totalAdvance: totalAmount
      }
    })
  }, [users, filteredAdvances, searchName])

  // 7. Calculate Top Summary Stats for selected date
  const summaryStats = useMemo(() => {
    let total = 0
    let ridersTotal = 0
    let tellersTotal = 0
    let otherTotal = 0

    filteredAdvances.forEach((adv: any) => {
      const amount = Number(adv.amount) || 0
      total += amount
      
      const role = adv.role?.toLowerCase()
      if (role === 'rider') {
        ridersTotal += amount
      } else if (role === 'teller') {
        tellersTotal += amount
      } else {
        otherTotal += amount
      }
    })

    return { total, ridersTotal, tellersTotal, otherTotal }
  }, [filteredAdvances])

  if (loadingUsers || loadingAdvances) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse font-medium">Syncing Ledger Vault...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" /> Cash Advances
          </h2>
          <p className="text-muted-foreground">Real-time ledger audit of personnel, tellers, and riders cash advances.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedStaffId("")
            setAmount("")
            setAdvanceType("cash_advance")
            setIsModalOpen(true)
          }}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 rounded-xl px-4 py-2"
        >
          <Plus className="h-4 w-4" /> Issue Cash Advance
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Deployed */}
        <Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Deployed</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₱{summaryStats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
              {dateFilter ? `On ${formatDate(dateFilter)}` : 'All Time'}
            </p>
          </CardContent>
        </Card>

        {/* Riders Total */}
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Riders Advances</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₱{summaryStats.ridersTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
              {dateFilter ? `On ${formatDate(dateFilter)}` : 'All Time'}
            </p>
          </CardContent>
        </Card>

        {/* Tellers Total */}
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tellers Advances</CardTitle>
            <Briefcase className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ₱{summaryStats.tellersTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
              {dateFilter ? `On ${formatDate(dateFilter)}` : 'All Time'}
            </p>
          </CardContent>
        </Card>

        {/* Other Personnel */}
        <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Other Personnel</CardTitle>
            <Shield className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              ₱{summaryStats.otherTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
              {dateFilter ? `On ${formatDate(dateFilter)}` : 'All Time'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end justify-between bg-muted/20 p-4 rounded-xl border">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          {/* Date Selector Popover & Calendar */}
          <div className="grid gap-1.5 w-full sm:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" /> Date Filter
            </label>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full sm:w-[220px] justify-start text-left font-normal border-primary/20 bg-background hover:bg-primary/5 h-9 rounded-lg shadow-sm ${!dateFilter && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {dateFilter
                      ? formatDate(dateFilter)
                      : <span>Filter by date...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-2xl border-primary/20" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                    className="p-3"
                    modifiers={{ hasAdvance: datesWithAdvances }}
                    modifiersClassNames={{
                      hasAdvance:
                        "font-bold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-accent after:rounded-full text-accent",
                    }}
                  />
                </PopoverContent>
              </Popover>
              {dateFilter && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDateFilter(undefined)}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors rounded-lg border border-primary/20 bg-background"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="grid gap-1.5 w-full sm:w-64">
            <label htmlFor="searchName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-primary" /> Search Personnel
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchName"
                placeholder="Search by name..."
                className="pl-8 bg-background h-9 border-primary/20 focus-visible:ring-primary/50 rounded-lg shadow-sm"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-muted/15 border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Ledger Directory {dateFilter && <span className="text-sm font-normal text-muted-foreground">showing advances for {formatDate(dateFilter)}</span>}
          </CardTitle>
          <CardDescription>Comprehensive audit log of cash advances respective to the date filter.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[280px]">Employee / Profile</TableHead>
                <TableHead className="w-[150px]">Security Role</TableHead>
                <TableHead className="w-[120px]">Duty Status</TableHead>
                <TableHead>Cash Advances & Time Stamps</TableHead>
                <TableHead className="text-right w-[180px]">Total Allocated</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personnelWithAdvances.map((person) => {
                const isOnline = person.status && person.status !== "offline"

                return (
                  <TableRow key={person.id} className="hover:bg-muted/10 transition-colors group py-4">
                    {/* Employee Profile */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                          <AvatarImage src={person.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                            {person.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight">{person.name}</span>
                          <span className="text-[9px] font-mono text-muted-foreground uppercase">{person.email || person.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Badge */}
                    <TableCell>
                      {getRoleBadge(person.role)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {isOnline ? (
                        <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 font-semibold gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground font-semibold gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                          Offline
                        </Badge>
                      )}
                    </TableCell>

                    {/* Itemized Advances */}
                    <TableCell>
                      <div className="space-y-1.5 py-1">
                        {person.advancesList && person.advancesList.length > 0 ? (
                          person.advancesList.map((adv: any, index: number) => {
                            const isAllocation = adv.type === "budget_allocation"
                            return (
                              <div 
                                key={adv.id || index} 
                                className="flex items-center gap-2 text-xs p-1 px-2 rounded bg-muted/30 border border-muted-foreground/10 w-fit"
                              >
                                <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(adv.timestamp)}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-[9px] uppercase tracking-wider px-1 font-semibold ${
                                    isAllocation 
                                      ? "text-blue-600 bg-blue-500/5 border-blue-500/10" 
                                      : "text-accent bg-accent/5 border-accent/10"
                                  }`}
                                >
                                  {isAllocation ? "Budget" : "Advance"}
                                </Badge>
                                <span className="font-bold text-primary">
                                  ₱{Number(adv.amount).toFixed(2)}
                                </span>
                              </div>
                            )
                          })
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                            No advances issued for this date.
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Aggregate Total */}
                    <TableCell className="text-right">
                      <span className={`font-mono font-bold text-base tabular-nums ${person.totalAdvance > 0 ? 'text-accent' : 'text-muted-foreground/60'}`}>
                        ₱{person.totalAdvance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-primary/20 hover:bg-primary/10 text-primary font-medium gap-1 rounded-md"
                        onClick={() => {
                          setSelectedStaffId(person.id)
                          setAmount("")
                          setAdvanceType("cash_advance")
                          setIsModalOpen(true)
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Issue
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}

              {personnelWithAdvances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                    <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="font-bold text-sm">No personnel match your search filters.</p>
                    <p className="text-xs">Adjust your search parameters or select a different date.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Modal for Issuing Cash Advance */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-6 bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
              <Wallet className="h-5 w-5 text-primary" /> Issue Cash Advance
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Allocate operational float or personal advances. This writes to the audit log and updates their live balance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleIssueAdvance} className="space-y-4 pt-2">
            {/* Employee Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Employee
              </label>
              <Select 
                value={selectedStaffId} 
                onValueChange={setSelectedStaffId}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full bg-background border-primary/20 h-10 rounded-lg shadow-sm focus:ring-primary/50">
                  <SelectValue placeholder="Choose staff member..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {staffList.map((staff: any) => (
                    <SelectItem key={staff.id} value={staff.id} className="capitalize text-sm font-medium">
                      {staff.name} <span className="text-xs text-muted-foreground italic font-normal">({staff.role || 'Staff'})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advance Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Advance Type
              </label>
              <Select 
                value={advanceType} 
                onValueChange={(val: any) => setAdvanceType(val)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full bg-background border-primary/20 h-10 rounded-lg shadow-sm focus:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_advance" className="text-sm font-medium">
                    Cash Advance <span className="text-xs text-muted-foreground italic font-normal">(Standard Advance)</span>
                  </SelectItem>
                  <SelectItem value="budget_allocation" className="text-sm font-medium">
                    Budget Allocation <span className="text-xs text-muted-foreground italic font-normal">(Rider operational float)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label htmlFor="advanceAmount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Amount (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-muted-foreground text-sm">₱</span>
                <Input
                  id="advanceAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="pl-7 bg-background h-10 border-primary/20 focus-visible:ring-primary/50 rounded-lg shadow-sm font-semibold text-lg"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="h-10 rounded-lg shadow-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 rounded-lg px-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Issue Advance
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
