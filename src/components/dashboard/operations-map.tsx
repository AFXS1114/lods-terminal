
"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from 'next/dynamic'
import { MapPin, User, Navigation, Loader2 } from "lucide-react"
import 'leaflet/dist/leaflet.css'

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface OperationsMapProps {
  riders: any[]
  orders: any[]
}

export function OperationsMap({ riders, orders }: OperationsMapProps) {
  const [mounted, setMounted] = useState(false)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    import('leaflet').then(mod => setL(mod.default))
  }, [])

  // Create custom icons using Lucide components
  const createRiderIcon = (rider: any) => {
    if (!L) return null
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="p-1 bg-primary rounded-full shadow-lg border-2 border-white animate-in zoom-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }

  const createOrderIcon = () => {
    if (!L) return null
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="p-1 bg-accent rounded-full shadow-xl border-2 border-white animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    })
  }

  // Determine map center
  const defaultCenter: [number, number] = [13.0, 123.0] // Generic center, will be updated by fleet data
  const center = useMemo(() => {
    const validRiders = riders.filter(r => r.currentLatitude && r.currentLongitude)
    if (validRiders.length > 0) {
      const lat = validRiders.reduce((acc, r) => acc + r.currentLatitude, 0) / validRiders.length
      const lng = validRiders.reduce((acc, r) => acc + r.currentLongitude, 0) / validRiders.length
      return [lat, lng] as [number, number]
    }
    return defaultCenter
  }, [riders])

  if (!mounted || !L) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Real-time Rider Markers */}
        {riders.map((rider) => (
          rider.currentLatitude && rider.currentLongitude && (
            <Marker 
              key={rider.id} 
              position={[rider.currentLatitude, rider.currentLongitude]}
              icon={createRiderIcon(rider)}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm">{rider.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{rider.vehicleType} • {rider.status}</p>
                  <p className="text-[10px] mt-1 italic text-primary">Last seen: {rider.locationUpdateTime ? new Date(rider.locationUpdateTime).toLocaleTimeString() : 'Recent'}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Pending Order Targets */}
        {orders.filter(o => o.status === 'pending').map((order) => {
          const location = order.deliveryLocation || { lat: order.dropoffLatitude, lng: order.dropoffLongitude }
          if (!location?.lat || !location?.lng) return null
          
          return (
            <Marker 
              key={order.id} 
              position={[location.lat, location.lng]}
              icon={createOrderIcon()}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm">Target: {order.bookingNo}</p>
                  <p className="text-[10px]">{order.customerName}</p>
                  <p className="text-[10px] text-accent font-bold mt-1">Status: {order.status}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Control Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
            <span className="flex items-center gap-1"><Navigation className="h-3 w-3 text-primary" /> Live Fleet Sync</span>
            <span className="text-primary">{riders.filter(r => r.currentLatitude).length} Active Assets</span>
          </div>
          <div className="flex gap-2">
            {riders.filter(r => r.currentLatitude).map((r, i) => (
              <div key={i} className="h-1.5 flex-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
