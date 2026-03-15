"use client"

import { useState } from "react"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
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
  Info
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
  const [editingUser, setEditingUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "rider" as UserRole,
    status: "online",
  })

  // Queries
  const usersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "users"), orderBy("name", "asc"))
  }, [firestore])

  const { data: users, isLoading } = useCollection(usersQuery)

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    addDocumentNonBlocking(collection(firestore, "users"), {
      ...formData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    toast({ title: "Profile Created", description: `${formData.name} has been added to the registry.` })
    setIsAddUserOpen(false)
    resetForm()
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    updateDocumentNonBlocking(doc(firestore, "users", editingUser.id), {
      ...formData,
      updatedAt: serverTimestamp(),
    })
    toast({ title: "Profile Updated", description: `Registry for ${formData.name} has been synchronized.` })
    setEditingUser(null)
    resetForm()
  }

  const handleDeleteUser = (id: string, name: string) => {
    deleteDocumentNonBlocking(doc(firestore, "users", id))
    toast({ 
      title: "Access Revoked", 
      description: `User ${name} has been removed from the registry. Terminal access is now disabled.`,
      variant: "destructive"
    })
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", role: "rider", status: "online" })
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
          <p className="text-muted-foreground">Orchestrate your fleet, partners, and administrative personnel.</p>
        </div>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-sm font-bold">Managerial Note</AlertTitle>
        <AlertDescription className="text-xs">
          Deleting a user here removes their profile and database access permissions. To fully remove their login credentials, please also delete the record from the <strong>Firebase Console Authentication</strong> tab.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> User Registry
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
                    <DialogDescription>Assign registry roles. User must still sign up with this email to log in.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
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
                      <div className="space-y-2">
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
                    <Button type="submit">Deploy Profile</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-md border-primary/5 overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Syncing User Registry...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-muted-foreground">No records found matching your search.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Registry ID</TableHead>
                      <TableHead>Access Role</TableHead>
                      <TableHead>System Status</TableHead>
                      <TableHead className="text-right">Operations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="group hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
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
                                  role: user.role,
                                  status: user.status,
                                })
                              }}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteUser(user.id, user.name)}
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

        <TabsContent value="preferences" className="space-y-6">
          <Card className="shadow-md">
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditUser}>
            <DialogHeader>
              <DialogTitle>Modify Registry Profile</DialogTitle>
              <DialogDescription>Update system permissions for {editingUser?.name}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input id="edit-email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Security Role</Label>
                  <Select value={formData.role} onValueChange={(v: any) => setFormData({...formData, role: v})}>
                    <SelectTrigger id="edit-role">
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
                <div className="space-y-2">
                  <Label htmlFor="edit-status">User Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger id="edit-status">
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
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button type="submit">Update Registry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}