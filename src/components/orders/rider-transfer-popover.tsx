"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Truck, ArrowLeftRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RiderTransferPopoverProps {
  orderId: string
  currentRiderId?: string
  currentRiderName?: string
  orderStatus: string
}

export function RiderTransferPopover({ orderId, currentRiderId, currentRiderName, orderStatus }: RiderTransferPopoverProps) {
  const [open, setOpen] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const firestore = useFirestore()
  const { toast } = useToast()

  const ridersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "users"), where("role", "==", "rider"), where("status", "==", "online"))
  }, [firestore])
  const { data: onlineRiders, isLoading } = useCollection(ridersQuery)

  const activeOrdersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "orders"), where("status", "in", ["pending", "in-transit", "assigned", "picked-up"]))
  }, [firestore])
  const { data: activeOrders } = useCollection(activeOrdersQuery)

  const getRiderLoad = (riderId: string) => {
    return activeOrders?.filter(o => o.riderId === riderId).length || 0
  }

  const handleTransfer = async (newRiderId: string, newRiderName: string) => {
    if (newRiderId === currentRiderId) return
    setIsTransferring(true)
    try {
      await updateDoc(doc(firestore, "orders", orderId), {
        riderId: newRiderId,
        riderName: newRiderName,
        status: orderStatus === "pending" || !orderStatus ? "assigned" : orderStatus // keep in-transit if it already was
      })
      toast({
        title: "Order Reassigned",
        description: `Order successfully transferred to ${newRiderName}.`,
      })
      setOpen(false)
    } catch (e) {
      toast({
        title: "Transfer Failed",
        description: "An error occurred while reassigning the order.",
        variant: "destructive"
      })
    } finally {
      setIsTransferring(false)
    }
  }

  // Only allow transfer on active orders (not delivered or cancelled)
  const canTransfer = !["delivered", "cancelled"].includes(orderStatus?.toLowerCase() || "")

  // Sort riders by load, so the ones with 0 load are at the top
  const sortedRiders = onlineRiders ? [...onlineRiders].sort((a, b) => getRiderLoad(a.id) - getRiderLoad(b.id)) : []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 py-1 px-2 group relative overflow-hidden transition-all duration-300 w-full justify-start text-xs border border-primary/20 hover:border-primary shrink-0 bg-background"
          disabled={!canTransfer}
        >
          <div className="flex items-center gap-2 truncate w-[130px]">
            <Truck className="h-3 w-3 flex-shrink-0 text-primary" />
            <span className="truncate flex-1 font-semibold">{currentRiderName || "Unassigned"}</span>
            {canTransfer && (
              <ArrowLeftRight className="h-3 w-3 absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary focus:outline-none" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 shadow-2xl border-primary/20 overflow-hidden" align="start">
        <div className="bg-gradient-to-r from-primary/10 to-transparent border-b p-4 flex flex-col gap-1">
          <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 text-primary">
            <ArrowLeftRight className="h-4 w-4" />
            Dispatch Reassignment
          </h4>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            Select an online asset below to transfer this payload. Assets are sorted by lowest load.
          </p>
        </div>
        
        {isLoading ? (
          <div className="p-8 flex justify-center items-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !onlineRiders || onlineRiders.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center h-48">
            <AlertCircle className="h-8 w-8 text-destructive/50 mb-3" />
            <p className="font-medium text-destructive">No active riders available.</p>
            <p className="text-xs mt-1">Please ask a rider to go online first.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="p-2 flex flex-col gap-1.5">
              {sortedRiders.map(rider => {
                const load = getRiderLoad(rider.id)
                const isCurrent = rider.id === currentRiderId
                
                return (
                  <button
                    key={rider.id}
                    onClick={() => handleTransfer(rider.id, rider.name || "Unknown Rider")}
                    disabled={isCurrent || isTransferring}
                    className={`w-full text-left flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 border outline-none focus:ring-2 focus:ring-primary/20 ${
                      isCurrent 
                        ? "bg-muted/50 border-transparent opacity-50 cursor-not-allowed" 
                        : "bg-background border-border hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] shadow-sm hover:shadow"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-md border border-primary/10 shadow-sm">
                        <AvatarImage src={rider.avatar} />
                        <AvatarFallback className="text-xs font-bold rounded-md bg-primary/10 text-primary">
                          {rider.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          {rider.name}
                          {isCurrent && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          {rider.vehicleType || 'Bike'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <Badge variant={load > 3 ? "destructive" : load > 0 ? "secondary" : "default"} className="px-2 py-0 h-5 text-[10px] tracking-tight uppercase shadow-sm">
                        {load} Load
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
