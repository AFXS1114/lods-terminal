"use client"

import { useState, useEffect } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { doc, updateDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Settings, UserCircle, Truck, Phone, CheckCircle2 } from "lucide-react"

interface RiderEditSheetProps {
  rider: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RiderEditSheet({ rider, open, onOpenChange }: RiderEditSheetProps) {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicleType: "",
    status: ""
  })

  // Sync form data when rider changes
  useEffect(() => {
    if (rider) {
      setFormData({
        name: rider.name || "",
        phone: rider.phone || "",
        vehicleType: rider.vehicleType || "Bike",
        status: rider.status || "offline"
      })
    }
  }, [rider])

  if (!rider) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateDoc(doc(firestore, "users", rider.id), {
        name: formData.name,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        status: formData.status
      })
      toast({
        title: "Profile Updated",
        description: `${formData.name}'s profile has been successfully updated on the network.`
      })
      onOpenChange(false)
    } catch (e) {
      toast({
        title: "Update Failed",
        description: "An error occurred while saving the profile.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-l-primary/20 shadow-2xl flex flex-col h-full">
        <SheetHeader className="pb-6 border-b border-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-xl">Edit Fleet Profile</SheetTitle>
              <SheetDescription className="text-[10px] uppercase tracking-widest font-bold">
                ID: {rider.id?.substring(0, 8)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <UserCircle className="h-4 w-4" /> Personal Identity
            </h4>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-xs text-muted-foreground uppercase">Full Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="bg-muted/30 focus-visible:ring-primary/50"
                  placeholder="e.g. Juan Officer"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase">Contact Sequence</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    className="pl-9 bg-muted/30 focus-visible:ring-primary/50 font-mono text-sm"
                    placeholder="09XX-XXX-XXXX"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-primary/5 pt-6">
            <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
              <Truck className="h-4 w-4" /> Operational Parameters
            </h4>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="vehicle" className="text-xs text-muted-foreground uppercase">Assigned Asset (Vehicle)</Label>
                <Select value={formData.vehicleType} onValueChange={(v) => setFormData({...formData, vehicleType: v})}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bike">Bicycle</SelectItem>
                    <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Van">Van / L300</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-1.5">
                <Label htmlFor="status" className="text-xs text-muted-foreground uppercase">Network Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Select network status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online (Deployable)</SelectItem>
                    <SelectItem value="busy">Busy (On Mission)</SelectItem>
                    <SelectItem value="offline">Offline (Standby)</SelectItem>
                    <SelectItem value="suspended">Suspended (Restricted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-6 border-t border-primary/10 flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto flex-1 text-muted-foreground">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto flex-1 shadow-lg shadow-primary/20">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save Fleet Data
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
