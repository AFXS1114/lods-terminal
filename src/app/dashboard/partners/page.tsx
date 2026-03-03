"use client"

import { useState, useEffect } from "react"
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, where } from "firebase/firestore"
import { db } from "@/firebase/config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Store, Plus, Search, MoreHorizontal, ShoppingBag, Phone, MapPin, User, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

export default function PartnersPage() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { toast } = useToast()

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Food",
    contactPerson: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    // Listen for all merchants
    const merchantsQuery = query(collection(db, "merchants"), orderBy("name", "asc"))
    const unsubscribeMerchants = onSnapshot(merchantsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMerchants(data)
      setLoading(false)
    })

    // Listen for orders to calculate merchant metrics
    const ordersQuery = query(collection(db, "orders"), where("status", "in", ["pending", "in-transit", "picked-up"]))
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setOrders(data)
    })

    return () => {
      unsubscribeMerchants()
      unsubscribeOrders()
    }
  }, [])

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addDoc(collection(db, "merchants"), {
        ...formData,
        status: "active",
        createdAt: serverTimestamp(),
      })
      toast({ title: "Merchant Added", description: `${formData.name} has been successfully registered.` })
      setIsModalOpen(false)
      setFormData({ name: "", category: "Food", contactPerson: "", phone: "", address: "" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message })
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active"
    try {
      await updateDoc(doc(db, "merchants", id), { status: newStatus })
      toast({ title: "Status Updated", description: `Merchant is now ${newStatus}.` })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message })
    }
  }

  const handleBulkStatus = async (newStatus: "active" | "inactive") => {
    try {
      await Promise.all(selectedIds.map(id => updateDoc(doc(db, "merchants", id), { status: newStatus })))
      toast({ title: "Bulk Update Successful", description: `${selectedIds.length} merchants updated to ${newStatus}.` })
      setSelectedIds([])
    } catch (error: any) {
      toast({ variant: "destructive", title: "Bulk Update Failed", description: error.message })
    }
  }

  const filteredMerchants = merchants.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getActiveOrdersCount = (merchantId: string) => {
    return orders.filter(o => o.merchantId === merchantId).length
  }

  if (loading) {
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
          <h2 className="text-3xl font-bold tracking-tight text-primary">Partner Registry</h2>
          <p className="text-muted-foreground">Manage your ecosystem of merchants and service partners.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg border">
              <span className="text-xs font-bold text-muted-foreground uppercase">{selectedIds.length} Selected</span>
              <Button variant="ghost" size="sm" onClick={() => handleBulkStatus("active")} className="h-7 text-green-600 hover:text-green-700">Activate</Button>
              <Button variant="ghost" size="sm" onClick={() => handleBulkStatus("inactive")} className="h-7 text-destructive hover:text-destructive">Deactivate</Button>
            </div>
          )}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Add New Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAddMerchant}>
                <DialogHeader>
                  <DialogTitle>Register New Merchant</DialogTitle>
                  <DialogDescription>Add a new store or logistics provider to the LODS network.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Store Name</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food & Beverage</SelectItem>
                        <SelectItem value="Grocery">Grocery</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Logistics">Logistics Provider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact" className="text-right">Contact</Label>
                    <Input id="contact" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="col-span-3" placeholder="Manager Name" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">Address</Label>
                    <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Complete Registration</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search merchants by name or category..." 
            className="pl-8 bg-background shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredMerchants.length === 0 ? (
        <Card className="border-dashed py-20 bg-muted/20">
          <CardContent className="flex flex-col items-center text-center">
            <Store className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <h3 className="text-2xl font-bold">No Partners Registered</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              Start building your network by adding your first merchant partner.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" /> Initialize First Partner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-12 shadow-md border-none overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={selectedIds.length === filteredMerchants.length && filteredMerchants.length > 0}
                        onCheckedChange={(checked) => {
                          setSelectedIds(checked ? filteredMerchants.map(m => m.id) : [])
                        }}
                      />
                    </TableHead>
                    <TableHead>Merchant Details</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(merchant.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds(prev => checked ? [...prev, merchant.id] : prev.filter(id => id !== merchant.id))
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Store className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{merchant.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{merchant.category}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" /> {merchant.contactPerson || "N/A"}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {merchant.phone || "No Phone"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary">{getActiveOrdersCount(merchant.id)}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Active Orders</span>
                          </div>
                          <div className="h-8 w-px bg-border" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-accent">0</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Lifetime</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={merchant.status === "active" ? "default" : "outline"}
                          className={merchant.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {merchant.status === "active" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {merchant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="sm" onClick={() => toggleStatus(merchant.id, merchant.status)}>
                              {merchant.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
