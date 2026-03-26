"use client"

import { useState } from "react"
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Search, Plus, Wallet, PlayCircle, StopCircle, RefreshCcw, AlertTriangle, Briefcase } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface TellerListProps {
  tellers: any[]
}

export function TellerList({ tellers }: TellerListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [allocatingFor, setAllocatingFor] = useState<string | null>(null)
  const [cashAmount, setCashAmount] = useState<string>("")
  const [isResetting, setIsResetting] = useState(false)
  
  const firestore = useFirestore()
  const { toast } = useToast()

  const filteredTellers = tellers.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTimeIn = async (teller: any) => {
    try {
      const dtrRef = await addDoc(collection(firestore, "tellerDTR"), {
        tellerId: teller.id,
        tellerName: teller.name,
        timeIn: serverTimestamp(),
        timeOut: null,
        date: new Date().toISOString().split('T')[0]
      })
      await updateDoc(doc(firestore, "users", teller.id), {
        status: "online",
        lastTimeIn: serverTimestamp(),
        activeDtrId: dtrRef.id,
        cashAdvance: 0 // Ensure starting with 0 on clock in
      })
      toast({ title: "Teller Online", description: `${teller.name} is now deployed.` })
    } catch (e) {
      toast({ title: "Error", description: "Failed to time in.", variant: "destructive" })
    }
  }

  const handleEndDuty = async (teller: any) => {
    try {
      if (teller.activeDtrId) {
        await updateDoc(doc(firestore, "tellerDTR", teller.activeDtrId), {
          timeOut: serverTimestamp(),
          finalCashAdvance: teller.cashAdvance || 0
        })
      }
      
      await updateDoc(doc(firestore, "users", teller.id), {
        status: "offline",
        lastTimeIn: null,
        activeDtrId: null,
        cashAdvance: 0 // Wipe the cash advance completely
      })
      toast({ title: "Shift Terminated", description: `${teller.name} clocked out. Advances cleared.` })
    } catch (e) {
      toast({ title: "Error", description: "Failed to end duty.", variant: "destructive" })
    }
  }

  const handleAddAdvance = async (tellerId: string) => {
    if (!cashAmount || isNaN(Number(cashAmount)) || Number(cashAmount) <= 0) return
    try {
      const teller = tellers.find(t => t.id === tellerId)

      await updateDoc(doc(firestore, "users", tellerId), {
        cashAdvance: increment(Number(cashAmount))
      })

      if (teller) {
        await addDoc(collection(firestore, "cashAdvances"), {
          userId: teller.id,
          userName: teller.name,
          role: "teller",
          amount: Number(cashAmount),
          type: "cash_advance",
          timestamp: serverTimestamp(),
          date: new Date().toISOString().split('T')[0]
        })
      }

      toast({ title: "Cash Allocated", description: `Added ₱${cashAmount} advance.` })
      setCashAmount("")
      setAllocatingFor(null)
    } catch (e) {
      toast({ title: "Error", description: "Failed to allocate cash.", variant: "destructive" })
    }
  }

  const handleResetFleet = async () => {
    setIsResetting(true)
    try {
      const activeTellers = tellers.filter(r => r.status && r.status !== "offline")
      for (const t of activeTellers) {
        if (t.activeDtrId) {
          await updateDoc(doc(firestore, "tellerDTR", t.activeDtrId), {
            timeOut: serverTimestamp(),
            finalCashAdvance: t.cashAdvance || 0
          })
        }
        await updateDoc(doc(firestore, "users", t.id), {
          status: "offline",
          lastTimeIn: null,
          activeDtrId: null,
          cashAdvance: 0
        })
      }
      toast({ title: "Reset Complete", description: `Successfully stood down ${activeTellers.length} tellers.` })
    } catch (e) {
      toast({ title: "Override Failed", description: "An error occurred.", variant: "destructive" })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardHeader className="bg-muted/20 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
        <CardTitle className="text-lg flex items-center gap-2 text-primary"><Briefcase className="h-5 w-5" /> Active Personnel</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-9 shadow-sm hover:bg-destructive/90 transition-all">
                <RefreshCcw className="h-4 w-4 mr-2" /> End All Operations
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-destructive/20 shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive"><AlertTriangle className="h-5 w-5 inline mr-2" /> End Teller Operations?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will force clock-out all online tellers, safely log their complete DTR shift, and securely wipe their active cash advances to zero.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetFleet} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">Execute Command</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tellers..." 
              className="pl-9 h-9 border-primary/20 focus-visible:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Teller Profile</TableHead>
              <TableHead>Duty Status</TableHead>
              <TableHead>Shift Start</TableHead>
              <TableHead>Cash Advances</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTellers.map((teller) => (
              <TableRow key={teller.id} className="hover:bg-muted/10 transition-colors group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-primary/20">
                      <AvatarImage src={teller.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{teller.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{teller.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{teller.phone || 'NO CONTACT'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {!teller.status || teller.status === 'offline' ? (
                    <Button variant="outline" size="sm" onClick={() => handleTimeIn(teller)} className="h-7 w-24 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/30">
                      <PlayCircle className="h-3 w-3 mr-1.5" /> Time In
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleEndDuty(teller)} className="h-7 w-24 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30">
                      <StopCircle className="h-3 w-3 mr-1.5" /> End Duty
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {teller.status && teller.status !== 'offline' && teller.lastTimeIn ? (
                    <div className="flex items-center gap-1.5 font-mono text-sm text-primary font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      {new Date(typeof teller.lastTimeIn.toDate === 'function' ? teller.lastTimeIn.toDate() : teller.lastTimeIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs font-mono italic">--:--</span>
                  )}
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm tabular-nums ${teller.cashAdvance > 0 ? 'text-accent' : 'text-primary'}`}>₱{(teller.cashAdvance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    {teller.status && teller.status !== 'offline' && (
                      <Popover open={allocatingFor === teller.id} onOpenChange={(open) => {
                        if (open) { setAllocatingFor(teller.id); setCashAmount("") } 
                        else setAllocatingFor(null)
                      }}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-accent/20 text-accent hover:bg-accent hover:text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 shadow-2xl border-accent/20" align="start">
                          <div className="space-y-4">
                            <h4 className="font-bold text-sm flex items-center gap-2 tracking-tight text-accent bg-accent/5 p-2 rounded-md"><Wallet className="h-4 w-4" /> Issue Cash Advance</h4>
                            <div className="flex gap-2">
                              <Input 
                                type="number" 
                                placeholder="Amount in PHP" 
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                className="h-9 focus-visible:ring-accent/50"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAdvance(teller.id)}
                              />
                              <Button size="sm" className="h-9 bg-accent hover:bg-accent/90" onClick={() => handleAddAdvance(teller.id)}>Issue</Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredTellers.length === 0 && (
          <div className="py-16 flex flex-col items-center text-muted-foreground bg-muted/5 border-t border-dashed">
             <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-2" />
             <p className="font-semibold text-sm">No valid terminal personnel found.</p>
             <p className="text-xs">Assign a user the 'teller' role inside the core database.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
