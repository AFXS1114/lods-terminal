"use client"

import { useState } from "react"
import { useSupabaseCollection } from "@/supabase/use-collection"
import { supabase } from "@/supabase/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Users, Plus, Search, Phone, MapPin, Gift, Loader2, MoreHorizontal, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function ClientsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    landmark: "",
  })

  // Real-time data
  const { data: clients, isLoading } = useSupabaseCollection("clients", {
    orderBy: { column: "full_name", ascending: true }
  })

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from("clients").insert({
      ...formData,
      loyalty_count: 0,
      total_orders: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      toast({ 
        title: "Registration Failed", 
        description: error.message, 
        variant: "destructive" 
      })
      return
    }

    toast({ title: "Client Registered", description: `${formData.full_name} has been added to the database.` })
    setIsModalOpen(false)
    setFormData({ full_name: "", phone: "", address: "", landmark: "" })
  }

  const filteredClients = clients?.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Client Database</h2>
          <p className="text-muted-foreground">Manage your loyal customers and track their delivery rewards.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Register Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAddClient}>
              <DialogHeader>
                <DialogTitle>Register New Client</DialogTitle>
                <DialogDescription>Add a new customer to the loyalty program.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Full Name</Label>
                  <Input id="name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="col-span-3" placeholder="09XX-XXX-XXXX" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">Address</Label>
                  <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="landmark" className="text-right">Landmark</Label>
                  <Input id="landmark" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} className="col-span-3" placeholder="Near church, green gate, etc." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Complete Registration</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients by name or phone..." 
            className="pl-8 bg-background shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!clients || clients.length === 0 ? (
        <Card className="border-dashed py-20 bg-muted/20">
          <CardContent className="flex flex-col items-center text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-2xl font-bold">No Clients Found</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              Start building your customer base to enable loyalty rewards.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" /> Initialize First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md border-none overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Client Information</TableHead>
                  <TableHead>Logistics Details</TableHead>
                  <TableHead>Loyalty Progress (11th FREE)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const progress = (client.loyalty_count || 0) / 11 * 100
                  const isNextFree = client.loyalty_count === 10
                  
                  return (
                    <TableRow key={client.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{client.full_name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {client.phone || "No Phone"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[200px]">
                          <span className="text-xs font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" /> {client.address || "No Address"}
                          </span>
                          {client.landmark && (
                            <span className="text-[10px] text-muted-foreground italic truncate">
                              "{client.landmark}"
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-[300px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                            <span className={isNextFree ? "text-accent animate-pulse" : "text-muted-foreground"}>
                              {isNextFree ? "NEXT DELIVERY IS FREE!" : `${client.loyalty_count || 0} / 11 DELIVERIES`}
                            </span>
                            <span className="text-primary font-bold">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <Progress value={progress} className={isNextFree ? "bg-accent/20" : ""} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
