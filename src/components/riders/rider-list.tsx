
"use client"

import { useState } from "react"
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
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, History, Settings, Search, Star } from "lucide-react"
import { RiderDetailModal } from "./rider-detail-modal"

interface RiderListProps {
  riders: any[]
  orders: any[]
}

export function RiderList({ riders, orders }: RiderListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [vehicleFilter, setVehicleFilter] = useState("all")
  const [selectedRider, setSelectedRider] = useState<any | null>(null)

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || rider.status === statusFilter
    const matchesVehicle = vehicleFilter === "all" || rider.vehicleType === vehicleFilter
    return matchesSearch && matchesStatus && matchesVehicle
  })

  const getRiderLoad = (riderId: string) => {
    return orders.filter(o => o.riderId === riderId).length
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
                  <Badge variant={getStatusVariant(rider.status)} className="capitalize px-3">
                    {rider.status || 'Offline'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <Star className="h-3 w-3 text-accent fill-accent" />
                    {rider.rating || 'N/A'}
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
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
    </Card>
  )
}
