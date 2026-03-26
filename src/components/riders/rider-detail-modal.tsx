
"use client"

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Truck, Phone, Star, ShieldCheck, Clock, CheckCircle, Wallet } from "lucide-react"

interface RiderDetailModalProps {
  rider: any
  onClose: () => void
}

export function RiderDetailModal({ rider, onClose }: RiderDetailModalProps) {
  return (
    <Dialog open={!!rider} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0">
        <div className="h-32 bg-primary relative">
          <div className="absolute -bottom-12 left-8 border-4 border-background rounded-full overflow-hidden shadow-xl">
            <Avatar className="h-24 w-24">
              <AvatarImage src={rider.avatar} />
              <AvatarFallback className="text-2xl font-bold bg-muted">{rider.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        <div className="pt-16 px-8 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{rider.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] font-bold tracking-widest uppercase px-2">
                  ID: {rider.id.substring(0, 8)}
                </Badge>
                <div className="flex items-center gap-1 text-accent">
                  <Star className="h-3 w-3 fill-accent" />
                  <span className="text-xs font-bold">{rider.rating || '0.0'}</span>
                </div>
              </div>
            </div>
            <Badge className="bg-green-500 hover:bg-green-600 px-4 py-1">{rider.status}</Badge>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="p-3 bg-muted/30 rounded-lg flex flex-col items-center text-center">
              <Truck className="h-4 w-4 text-primary mb-2" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Vehicle</span>
              <span className="text-sm font-bold">{rider.vehicleType || 'Bike'}</span>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg flex flex-col items-center text-center">
              <Phone className="h-4 w-4 text-primary mb-2" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Contact</span>
              <span className="text-sm font-bold">{rider.phone || 'N/A'}</span>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg flex flex-col items-center text-center border border-primary/20">
              <Wallet className="h-4 w-4 text-primary mb-2" />
              <span className="text-[10px] text-primary uppercase font-bold">Budget</span>
              <span className="text-sm font-bold text-primary">₱{(rider.budgetOnHand || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg flex flex-col items-center text-center">
              <ShieldCheck className="h-4 w-4 text-primary mb-2" />
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Verified</span>
              <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
            </div>
          </div>

          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="w-full bg-muted/50 p-1">
              <TabsTrigger value="overview" className="flex-1">Performance</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">Order History</TabsTrigger>
              <TabsTrigger value="feedback" className="flex-1">Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Reliability
                  </p>
                  <p className="text-2xl font-bold mt-1">98.2%</p>
                  <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-green-500 w-[98%]" />
                  </div>
                </div>
                <div className="border p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" /> Completion
                  </p>
                  <p className="text-2xl font-bold mt-1">452</p>
                  <p className="text-[10px] text-muted-foreground">Total deliveries</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="history" className="py-4 text-center text-muted-foreground text-sm">
              Loading recent operational history...
            </TabsContent>
            <TabsContent value="feedback" className="py-4 text-center text-muted-foreground text-sm">
              "Great rider, very professional and fast!" - User ID 4x82
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
