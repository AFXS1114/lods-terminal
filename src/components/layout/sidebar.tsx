"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Users, 
  Settings, 
  LogOut,
  Map,
  Truck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-accent",
  },
  {
    label: "Orders",
    icon: Package,
    href: "/orders",
    color: "text-accent",
  },
  {
    label: "Live Tracker",
    icon: Map,
    href: "/tracker",
    color: "text-accent",
  },
  {
    label: "Merchants",
    icon: Store,
    href: "/merchants",
    color: "text-accent",
  },
  {
    label: "Riders",
    icon: Truck,
    href: "/riders",
    color: "text-accent",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-6 py-4 flex items-center mb-6">
        <div className="relative h-10 w-10 bg-white rounded-lg overflow-hidden mr-3 border border-white/20">
          <Image
            src="/src/images/logo.png"
            alt="LODS Logo"
            fill
            className="object-contain p-1"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">LODS Terminal</h1>
      </div>
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200",
                pathname === route.href ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md" : "text-sidebar-foreground/80"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color ? route.color : "text-sidebar-foreground/70")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 mt-auto border-t border-sidebar-border pt-4">
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}