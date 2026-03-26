
"use client"

import { useState } from "react"
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, History, Settings, Search, Star, Plus, Wallet, PlayCircle, StopCircle, RefreshCcw, AlertTriangle } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RiderDetailModal } from "./rider-detail-modal"
import { RiderEditModal } from "./rider-edit-modal"

interface RiderListProps {
  riders: any[]
  orders: any[]
}

export function RiderList({ riders, orders }: RiderListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [vehicleFilter, setVehicleFilter] = useState("all")
  const [selectedRider, setSelectedRider] = useState<any | null>(null)
  const [editingRider, setEditingRider] = useState<any | null>(null)
  
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [addingBudgetFor, setAddingBudgetFor] = useState<string | null>(null)
  const [budgetAmount, setBudgetAmount] = useState<string>("")
  const [allocatingAdvanceFor, setAllocatingAdvanceFor] = useState<string | null>(null)
  const [advanceAmount, setAdvanceAmount] = useState<string>("")

  const handleAddBudget = async (riderId: string) => {
    if (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0) return
    try {
      const rider = riders.find(r => r.id === riderId)

      await updateDoc(doc(firestore, "users", riderId), {
        budgetOnHand: increment(Number(budgetAmount))
      })

      if (rider) {
        await addDoc(collection(firestore, "cashAdvances"), {
          userId: rider.id,
          userName: rider.name,
          role: "rider",
          amount: Number(budgetAmount),
          type: "budget_allocation",
          timestamp: serverTimestamp(),
          date: new Date().toISOString().split('T')[0]
        })
      }

      toast({ title: "Funds Deployed", description: `Added ₱${budgetAmount} to rider.` })
      setBudgetAmount("")
      setAddingBudgetFor(null)
    } catch (e) {
      toast({ title: "Error", description: "Failed to allocate budget.", variant: "destructive" })
    }
  }

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || rider.status === statusFilter
    const matchesVehicle = vehicleFilter === "all" || rider.vehicleType === vehicleFilter
    return matchesSearch && matchesStatus && matchesVehicle
  })

  const getRiderLoad = (riderId: string) => {
    return orders.filter(o => o.riderId === riderId).length
  }

  const handleAddAdvance = async (riderId: string) => {
    if (!advanceAmount || isNaN(Number(advanceAmount)) || Number(advanceAmount) <= 0) return
    try {
      const rider = riders.find(r => r.id === riderId)

      await updateDoc(doc(firestore, "users", riderId), {
        cashAdvance: increment(Number(advanceAmount))
      })

      if (rider) {
        await addDoc(collection(firestore, "cashAdvances"), {
          userId: rider.id,
          userName: rider.name,
          role: "rider",
          amount: Number(advanceAmount),
          type: "cash_advance",
          timestamp: serverTimestamp(),
          date: new Date().toISOString().split('T')[0]
        })
      }

      toast({ title: "Cash Advance Issued", description: `₱${advanceAmount} deployed to rider.` })
      setAdvanceAmount("")
      setAllocatingAdvanceFor(null)
    } catch (e) {
      toast({ title: "Error", description: "Failed to issue advance.", variant: "destructive" })
    }
  }

  const handleTimeIn = async (rider: any) => {
    try {
      const dtrRef = await addDoc(collection(firestore, "riderDTR"), {
        riderId: rider.id,
        riderName: rider.name,
        timeIn: serverTimestamp(),
        timeOut: null,
        date: new Date().toISOString().split('T')[0]
      })
      await updateDoc(doc(firestore, "users", rider.id), {
        status: "online",
        lastTimeIn: serverTimestamp(), // keeping for fallback/frontend
        activeDtrId: dtrRef.id,
        cashAdvance: 0,
        budgetOnHand: 0
      })
      toast({ title: "Asset Online", description: `${rider.name} is now deployed on duty.` })
    } catch (e) {
      toast({ title: "Error", description: "Failed to time in.", variant: "destructive" })
    }
  }

  const handleEndDuty = async (rider: any) => {
    try {
      if (rider.activeDtrId) {
        await updateDoc(doc(firestore, "riderDTR", rider.activeDtrId), {
          timeOut: serverTimestamp(),
          finalCashAdvance: rider.cashAdvance || 0,
          finalBudget: rider.budgetOnHand || 0
        })
      } else if (rider.lastTimeIn) {
        // Fallback if they timed in before this update
        await addDoc(collection(firestore, "riderDTR"), {
          riderId: rider.id,
          riderName: rider.name,
          timeIn: rider.lastTimeIn,
          timeOut: serverTimestamp(),
          date: new Date().toISOString().split('T')[0],
          finalCashAdvance: rider.cashAdvance || 0,
          finalBudget: rider.budgetOnHand || 0
        })
      }
      
      await updateDoc(doc(firestore, "users", rider.id), {
        status: "offline",
        lastTimeIn: null,
        activeDtrId: null,
        budgetOnHand: 0,
        cashAdvance: 0
      })
      toast({ title: "Duty Terminated", description: `${rider.name} clocked out. Remaining budget and advances wiped.` })
    } catch (e) {
      toast({ title: "Error", description: "Failed to end duty.", variant: "destructive" })
    }
  }

  const [isResetting, setIsResetting] = useState(false)
  const handleResetFleet = async () => {
    setIsResetting(true)
    try {
      const activeRiders = riders.filter(r => r.status && r.status !== "offline")
      for (const rider of activeRiders) {
        if (rider.activeDtrId) {
          await updateDoc(doc(firestore, "riderDTR", rider.activeDtrId), {
            timeOut: serverTimestamp(),
            finalCashAdvance: rider.cashAdvance || 0,
            finalBudget: rider.budgetOnHand || 0
          })
        } else if (rider.lastTimeIn) {
          await addDoc(collection(firestore, "riderDTR"), {
            riderId: rider.id,
            riderName: rider.name,
            timeIn: rider.lastTimeIn,
            timeOut: serverTimestamp(),
            date: new Date().toISOString().split('T')[0],
            finalCashAdvance: rider.cashAdvance || 0,
            finalBudget: rider.budgetOnHand || 0
          })
        }
        await updateDoc(doc(firestore, "users", rider.id), {
          status: "offline",
          lastTimeIn: null,
          activeDtrId: null,
          budgetOnHand: 0,
          cashAdvance: 0
        })
      }
      toast({ title: "Fleet Reset Complete", description: `Successfully stood down ${activeRiders.length} assets.` })
    } catch (e) {
      toast({ title: "Override Failed", description: "An error occurred while terminating fleet ops.", variant: "destructive" })
    } finally {
      setIsResetting(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'default'
      case 'busy': return 'secondary'
      case 'offline': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardHeader className="bg-muted/20 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Fleet Management</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-9 shadow-lg shadow-destructive/20 relative group overflow-hidden bg-destructive/90 hover:bg-destructive">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <RefreshCcw className="h-4 w-4 mr-2" /> Reset Fleet
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="shadow-2xl border-destructive/20">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" /> End All Operations?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This core structural override will:
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                      <li>Forcefully clock out all currently online riders.</li>
                      <li>Securely lock their <strong>Daily Time Records (DTR)</strong> for the shift.</li>
                      <li>Safely zero out and reset all deployed budgets back to ₱0.00.</li>
                    </ul>
                    <br/>
                    Are you absolutely sure you want to stand down the fleet for the day?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetFleet} disabled={isResetting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-lg shadow-destructive/20">
                    {isResetting ? "Executing Override..." : "Execute Command"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name..." 
                className="pl-8 bg-background h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-[130px] h-9 bg-background">
                <SelectValue placeholder="Vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Rider Profile</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Advances</TableHead>
              <TableHead>Load</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRiders.map((rider) => (
              <TableRow key={rider.id} className="group hover:bg-muted/10 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                      <AvatarImage src={rider.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{rider.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{rider.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{rider.phone || 'NO CONTACT'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {!rider.status || rider.status === 'offline' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleTimeIn(rider)}
                      className="h-7 w-24 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border border-green-500/30 transition-colors shadow-sm"
                    >
                      <PlayCircle className="h-3 w-3 mr-1.5" /> Time In
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEndDuty(rider)}
                      className="h-7 w-24 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border border-destructive/30 transition-colors shadow-sm"
                    >
                      <StopCircle className="h-3 w-3 mr-1.5" /> End Duty
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <Star className="h-3 w-3 text-accent fill-accent" />
                    {rider.rating || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="font-bold text-sm text-primary">₱{(rider.budgetOnHand || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    {rider.status && rider.status !== 'offline' && (
                      <Popover open={addingBudgetFor === rider.id} onOpenChange={(open) => {
                        if (open) {
                          setAddingBudgetFor(rider.id)
                          setBudgetAmount("")
                        } else {
                          setAddingBudgetFor(null)
                        }
                      }}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-6 w-6 rounded-full ml-2 border-primary/20 text-primary hover:bg-primary/10">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 shadow-xl" align="start">
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Allocate Budget</h4>
                            <div className="flex gap-2">
                              <Input 
                                type="number" 
                                placeholder="Amount" 
                                value={budgetAmount}
                                onChange={(e) => setBudgetAmount(e.target.value)}
                                className="h-9"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddBudget(rider.id)
                                }}
                              />
                              <Button size="sm" className="h-9" onClick={() => handleAddBudget(rider.id)}>Add</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className={`font-bold text-sm ${rider.cashAdvance > 0 ? 'text-accent' : 'text-primary'}`}>₱{(rider.cashAdvance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    {rider.status && rider.status !== 'offline' && (
                      <Popover open={allocatingAdvanceFor === rider.id} onOpenChange={(open) => {
                        if (open) { setAllocatingAdvanceFor(rider.id); setAdvanceAmount("") } 
                        else setAllocatingAdvanceFor(null)
                      }}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-6 w-6 rounded-full ml-2 border-accent/30 text-accent hover:bg-accent/10">
                            <Wallet className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 shadow-xl border-accent/20" align="start">
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm flex items-center gap-2 tracking-tight text-accent bg-accent/5 p-1 rounded"><Wallet className="h-4 w-4" /> Issue Cash Advance</h4>
                            <div className="flex gap-2">
                              <Input 
                                type="number" 
                                placeholder="Amount in PHP" 
                                value={advanceAmount}
                                onChange={(e) => setAdvanceAmount(e.target.value)}
                                className="h-9 focus-visible:ring-accent/50"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAdvance(rider.id)}
                              />
                              <Button size="sm" className="h-9 bg-accent hover:bg-accent/90" onClick={() => handleAddAdvance(rider.id)}>Issue</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(getRiderLoad(rider.id) * 33, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{getRiderLoad(rider.id)} active</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">{rider.vehicleType || 'Bike'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setSelectedRider(rider)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      onClick={() => setEditingRider(rider)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredRiders.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No riders matching your filters found.
          </div>
        )}
      </CardContent>
      {selectedRider && (
        <RiderDetailModal 
          rider={selectedRider} 
          onClose={() => setSelectedRider(null)} 
        />
      )}
      <RiderEditModal 
        rider={editingRider}
        open={!!editingRider}
        onOpenChange={(open) => !open && setEditingRider(null)}
      />
    </Card>
  )
}
