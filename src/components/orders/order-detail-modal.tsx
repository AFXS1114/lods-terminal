"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/supabase/config"
import {
  Package,
  MapPin,
  User,
  Phone,
  Truck,
  Clock,
  Store,
  ShoppingBag,
  Banknote,
  Hash,
  Loader2,
  Star,
  Bike,
  Navigation,
  CheckCircle2,
  XCircle,
  Circle,
  Mail,
} from "lucide-react"

interface OrderDetailModalProps {
  order: any | null
  open: boolean
  onClose: () => void
}

export function OrderDetailModal({ order, open, onClose }: OrderDetailModalProps) {
  const [riderInfo, setRiderInfo] = useState<any | null>(null)
  const [loadingRider, setLoadingRider] = useState(false)

  useEffect(() => {
    if (open && order?.rider_id) {
      setLoadingRider(true)
      supabase
        .from("users")
        .select("id, name, email, contact, vehicle_type, status, latitude, longitude, rating")
        .eq("id", order.rider_id)
        .single()
        .then(({ data }) => {
          setRiderInfo(data)
          setLoadingRider(false)
        })
    } else {
      setRiderInfo(null)
    }
  }, [open, order?.rider_id])

  if (!order) return null

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A"
    try {
      const date = new Date(dateValue)
      return date.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      return "Invalid Date"
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return { color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30", icon: <Circle className="h-3 w-3" />, label: "Pending" }
      case "assigned":
        return { color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: <Truck className="h-3 w-3" />, label: "Assigned" }
      case "picked-up":
      case "in-transit":
        return { color: "bg-primary/15 text-primary border-primary/30", icon: <Navigation className="h-3 w-3" />, label: status === "picked-up" ? "Picked Up" : "In Transit" }
      case "delivered":
        return { color: "bg-green-500/15 text-green-600 border-green-500/30", icon: <CheckCircle2 className="h-3 w-3" />, label: "Delivered" }
      case "cancelled":
        return { color: "bg-destructive/15 text-destructive border-destructive/30", icon: <XCircle className="h-3 w-3" />, label: "Cancelled" }
      default:
        return { color: "bg-muted text-muted-foreground border-border", icon: <Circle className="h-3 w-3" />, label: status || "Unknown" }
    }
  }

  const getRiderStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "online": return { color: "text-green-600", bg: "bg-green-500", label: "Online" }
      case "busy": return { color: "text-yellow-600", bg: "bg-yellow-500", label: "Busy" }
      default: return { color: "text-muted-foreground", bg: "bg-muted-foreground/50", label: "Offline" }
    }
  }

  const statusConfig = getStatusConfig(order.status)
  const items: any[] = Array.isArray(order.items) ? order.items : []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[580px] max-h-[88vh] overflow-y-auto p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold tracking-tight font-mono text-primary">
                  {order.booking_no || "LODS-XXXXX"}
                </DialogTitle>
                <DialogDescription asChild>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {formatDate(order.created_at)}
                  </p>
                </DialogDescription>
              </div>
            </div>
            <Badge
              className={`text-xs font-bold flex items-center gap-1.5 border px-2.5 py-1 ${statusConfig.color}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">

          {/* ── Customer Info ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <User className="h-3 w-3" /> Customer
            </p>
            <div className="p-3 rounded-xl bg-muted/30 border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{order.customer_name || "—"}</span>
                {order.service_type && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-primary/20 text-primary">
                    {order.service_type}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {order.customer_phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
                {order.customer_email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{order.customer_email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Merchant + Delivery Address ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <Store className="h-3 w-3" /> Merchant / Pickup
              </p>
              <div className="p-3 rounded-xl bg-muted/30 border h-full">
                <span className="text-sm font-bold">{order.merchant_name || "—"}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Delivery Address
              </p>
              <div className="p-3 rounded-xl bg-muted/30 border h-full">
                <p className="text-sm font-semibold leading-snug">{order.delivery_address || "—"}</p>
                {order.landmark && (
                  <p className="text-xs text-muted-foreground mt-1">📍 {order.landmark}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Order Items ── */}
          {items.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <ShoppingBag className="h-3 w-3" /> Items ({items.length})
              </p>
              <div className="rounded-xl border overflow-hidden">
                <div className="divide-y">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-background hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">{item.qty || 1}x</span>
                        </div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        ₱{Number(item.total || item.price || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Payment Summary ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <Banknote className="h-3 w-3" /> Payment Summary
            </p>
            <div className="rounded-xl border bg-muted/20 overflow-hidden">
              <div className="divide-y">
                {order.subtotal !== undefined && order.subtotal !== null && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums">₱{Number(order.subtotal).toFixed(2)}</span>
                  </div>
                )}
                {order.delivery_fee !== undefined && order.delivery_fee !== null && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium tabular-nums">₱{Number(order.delivery_fee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-primary/5">
                  <span className="text-sm font-bold text-primary">Total</span>
                  <span className="text-base font-extrabold text-primary tabular-nums">
                    ₱{Number(order.final_total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Rider Info ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <Truck className="h-3 w-3" /> Assigned Rider
            </p>

            {!order.rider_id ? (
              <div className="p-4 rounded-xl border border-dashed bg-muted/20 text-center">
                <Truck className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1.5" />
                <p className="text-sm text-muted-foreground font-medium">No rider assigned</p>
                <p className="text-xs text-muted-foreground/60">Use the Dispatch control to assign one</p>
              </div>
            ) : loadingRider ? (
              <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading rider info...</span>
              </div>
            ) : riderInfo ? (
              <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src={riderInfo.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {riderInfo.name?.charAt(0) || "R"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold">{riderInfo.name}</span>
                      {(() => {
                        const s = getRiderStatusConfig(riderInfo.status)
                        return (
                          <span className={`flex items-center gap-1 text-[11px] font-semibold ${s.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.bg}`} />
                            {s.label}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {riderInfo.contact && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {riderInfo.contact}
                        </span>
                      )}
                      {riderInfo.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {riderInfo.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-background border text-center">
                    <Bike className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-[11px] font-bold">{riderInfo.vehicle_type || "Bike"}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Vehicle</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-background border text-center">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400 mb-1" />
                    <span className="text-[11px] font-bold">{riderInfo.rating ?? "N/A"}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Rating</span>
                  </div>
                  {(riderInfo.latitude || riderInfo.longitude) ? (
                    <div className="flex flex-col items-center p-2 rounded-lg bg-background border text-center">
                      <Navigation className="h-4 w-4 text-primary mb-1" />
                      <span className="text-[11px] font-bold text-primary">Live</span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">GPS Active</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-2 rounded-lg bg-background border text-center opacity-50">
                      <Navigation className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-[11px] font-bold">No GPS</span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Location</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Fallback: show rider name from the order if profile not found */
              <div className="p-4 rounded-xl border bg-muted/20 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-bold">{order.rider_name}</span>
                  <p className="text-xs text-muted-foreground">Rider profile not found</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Timestamps Footer ── */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3 w-3 shrink-0 text-primary/50" />
              <span className="font-mono truncate">{order.id}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Updated {formatDate(order.updated_at)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
