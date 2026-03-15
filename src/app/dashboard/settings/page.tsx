"use client"

import { useState } from "react"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, adminCreateUser, addDocumentNonBlocking } from "@/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Settings, 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  ShieldAlert, 
  Truck, 
  Store, 
  User as UserIcon, 
  Trash2, 
  Edit2, 
  Loader2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Info,
  Lock,
  MapPin,
  DollarSign,
  Upload,
  Plus,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UserRole = 'rider' | 'manager' | 'admin' | 'partners' | 'customer';

export default function SettingsPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAddRateOpen, setIsAddRateOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "rider" as UserRole,
    status: "online",
  })

  const [rateData, setRateData] = useState({
    rateName: "",
    baseFee: "",
    perKmRate: "",
    minimumDistanceKm: "",
    maxDistanceKm: "",
    weightLimitKg: "",
    applicableRegion: "",
    isActive: true
  })

  // Queries
  const usersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "users"), orderBy("name", "asc"))
  }, [firestore])

  const ratesQuery = useMemoFirebase(() => {
    return query(collection(firestore, "deliveryRates"), orderBy("applicableRegion", "asc"))
  }, [firestore])

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery)
  const { data: rates, isLoading: ratesLoading } = useCollection(ratesQuery)

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" })
      return
    }

    setIsActionLoading(true)
    try {
      const uid = await adminCreateUser(formData.email, formData.password)
      const userRef = doc(firestore, "users", uid)
      setDocumentNonBlocking(userRef, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })

      toast({ 
        title: "Terminal Access Deployed", 
        description: `${formData.name} is now registered in Auth and Firestore.` 
      })
      setIsAddUserOpen(false)
      resetUserForm()
    } catch (error: any) {
      toast({ 
        title: "Creation Failed", 
        description: error.message || "Could not synchronize with Authentication server.",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleAddRate = (e: React.FormEvent) => {
    e.preventDefault()
    addDocumentNonBlocking(collection(firestore, "deliveryRates"), {
      ...rateName,
      baseFee: parseFloat(rateData.baseFee),
      perKmRate: parseFloat(rateData.perKmRate),
      minimumDistanceKm: parseFloat(rateData.minimumDistanceKm),
      maxDistanceKm: parseFloat(rateData.maxDistanceKm),
      weightLimitKg: parseFloat(rateData.weightLimitKg),
      rateName: rateData.rateName,
      applicableRegion: rateData.applicableRegion,
      isActive: rateData.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    toast({ title: "Rate Configured", description: `New rate for ${rateData.applicableRegion} has been deployed.` })
    setIsAddRateOpen(false)
    resetRateForm()
  }

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (Array.isArray(json)) {
          json.forEach(rate => {
            addDocumentNonBlocking(collection(firestore, "deliveryRates"), {
              ...rate,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          })
          toast({ title: "Bulk Import Initiated", description: `Synchronizing ${json.length} rates with terminal database.` })
        }
      } catch (err) {
        toast({ title: "Invalid JSON", description: "Please ensure the file is a valid array of rate objects.", variant: "destructive" })
      }
    }
    reader.readAsText(file)
  }

  const resetUserForm = () => {
    setFormData({ name: "", email: "", password: "", role: "rider", status: "online" })
  }

  const resetRateForm = () => {
    setRateData({
      rateName: "",
      baseFee: "",
      perKmRate: "",
      minimumDistanceKm: "",
      maxDistanceKm: "",
      weightLimitKg: "",
      applicableRegion: "",
      isActive: true
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="h-4 w-4 text-destructive" />
      case 'manager': return <Shield className="h-4 w-4 text-primary" />
      case 'rider': return <Truck className="h-4 w-4 text-blue-500" />
      case 'partners': return <Store className="h-4 w-4 text-accent" />
      default: return <UserIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">System Command</h2>
          <p className="text-muted-foreground">Orchestrate your fleet, rates, and administrative personnel.</p>
        </div>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Zap className="h-4 w-4 text-primary" />
        <AlertTitle className="text-sm font-bold">Terminal Operational Mode</AlertTitle>
        <AlertDescription className="text-xs">
          Registry synchronization and regional rate intelligence are active.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> User Registry
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Regional Rates
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Terminal Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search registry..." 
                className="pl-9 bg-background shadow-sm border-primary/10 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                  <UserPlus className="mr-2 h-4 w-4" /> Register New Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddUser}>
                  <DialogHeader>
                    <DialogTitle>Add Terminal Profile</DialogTitle>
                    <DialogDescription>Assign a UID and password. This user will be added to system Authentication.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="password">Initial Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type="password" 
                          className="pl-9"
                          placeholder="Min. 6 characters" 
                          value={formData.password} 
                          onChange={e => setFormData({...formData, password: e.target.value})} 
                          required 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="role">Security Role</Label>
                        <Select value={formData.role} onValueChange={(v: any) => setFormData({...formData, role: v})}>
                          <SelectTrigger id="role">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="rider">Rider</SelectItem>
                            <SelectItem value="partners">Partner</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="status">Initial Status</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isActionLoading}>
                      {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      Deploy User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-md border-none overflow-hidden">
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Syncing User Registry...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Profile (UID)</TableHead>
                      <TableHead>Access Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Operations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="group hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{user.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{user.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <span className="text-xs font-bold uppercase tracking-wider">{user.role}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.status === "online" ? "default" : user.status === "suspended" ? "destructive" : "outline"}
                            className="gap-1.5"
                          >
                            {user.status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setEditingUser(user)
                                setFormData({
                                  name: user.name,
                                  email: user.email,
                                  password: "",
                                  role: user.role,
                                  status: user.status,
                                })
                              }}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  deleteDocumentNonBlocking(doc(firestore, "users", user.id))
                                  toast({ title: "Profile Revoked", variant: "destructive" })
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Revoke Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" className="relative cursor-pointer h-9">
                <Upload className="mr-2 h-4 w-4 text-primary" />
                Bulk Import JSON
                <input 
                  type="file" 
                  accept=".json" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleJsonUpload}
                />
              </Button>
              <p className="text-[10px] text-muted-foreground uppercase font-bold bg-muted px-2 py-1 rounded">
                Initial Setup Tool
              </p>
            </div>

            <Dialog open={isAddRateOpen} onOpenChange={setIsAddRateOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20 bg-accent text-accent-foreground hover:bg-accent/90 h-9">
                  <Plus className="mr-2 h-4 w-4" /> Define New Rate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleAddRate}>
                  <DialogHeader>
                    <DialogTitle>Regional Rate Intelligence</DialogTitle>
                    <DialogDescription>Configure pricing metrics for a specific geographical region.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Rate Label</Label>
                        <Input placeholder="e.g. Lagos Mainland" value={rateData.rateName} onChange={e => setRateData({...rateData, rateName: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <Label>Region</Label>
                        <Input placeholder="City or Zone" value={rateData.applicableRegion} onChange={e => setRateData({...rateData, applicableRegion: e.target.value})} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Base Fee ($)</Label>
                        <Input type="number" step="0.01" value={rateData.baseFee} onChange={e => setRateData({...rateData, baseFee: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <Label>Per KM Rate ($)</Label>
                        <Input type="number" step="0.01" value={rateData.perKmRate} onChange={e => setRateData({...rateData, perKmRate: e.target.value})} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>Min KM</Label>
                        <Input type="number" value={rateData.minimumDistanceKm} onChange={e => setRateData({...rateData, minimumDistanceKm: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <Label>Max KM</Label>
                        <Input type="number" value={rateData.maxDistanceKm} onChange={e => setRateData({...rateData, maxDistanceKm: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <Label>Weight (kg)</Label>
                        <Input type="number" value={rateData.weightLimitKg} onChange={e => setRateData({...rateData, weightLimitKg: e.target.value})} required />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Deploy Rate structure</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-md border-none overflow-hidden">
            <CardContent className="p-0">
              {ratesLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Region & Label</TableHead>
                      <TableHead>Base Fee</TableHead>
                      <TableHead>Surcharge</TableHead>
                      <TableHead>Distance Limit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ops</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates?.map((rate) => (
                      <TableRow key={rate.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{rate.applicableRegion}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">{rate.rateName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary">${rate.baseFee.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-medium">${rate.perKmRate.toFixed(2)} / km</TableCell>
                        <TableCell className="text-xs">{rate.maxDistanceKm}km</TableCell>
                        <TableCell>
                          <Badge variant={rate.isActive ? "default" : "outline"} className={rate.isActive ? "bg-green-500" : ""}>
                            {rate.isActive ? "Live" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 text-destructive"
                             onClick={() => deleteDocumentNonBlocking(doc(firestore, "deliveryRates", rate.id))}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rates || rates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                          No rates defined. Use Bulk Import or manual entry.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="shadow-md border-none">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Settings className="h-5 w-5" /> Operational Preferences
              </CardTitle>
              <CardDescription>Configure terminal synchronization and notification behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between space-x-2 p-4 rounded-xl border bg-muted/5">
                <Label htmlFor="notifications" className="flex flex-col space-y-1">
                  <span className="font-bold">Order Notifications</span>
                  <span className="font-normal text-xs text-muted-foreground">Receive real-time alerts for new fleet bookings.</span>
                </Label>
                <Switch id="notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 p-4 rounded-xl border bg-muted/5">
                <Label htmlFor="auto-refresh" className="flex flex-col space-y-1">
                  <span className="font-bold">Fleet Sync Engine</span>
                  <span className="font-normal text-xs text-muted-foreground">Keep registry data synchronized via real-time listeners.</span>
                </Label>
                <Switch id="auto-refresh" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
