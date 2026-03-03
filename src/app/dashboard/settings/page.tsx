"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Terminal Settings</h2>
        <p className="text-muted-foreground">Configure your Mission Control environment.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="notifications" className="flex flex-col space-y-1">
              <span>Order Notifications</span>
              <span className="font-normal text-xs text-muted-foreground">Receive real-time alerts for new bookings.</span>
            </Label>
            <Switch id="notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="auto-refresh" className="flex flex-col space-y-1">
              <span>Live Sync</span>
              <span className="font-normal text-xs text-muted-foreground">Keep dashboard data synchronized automatically.</span>
            </Label>
            <Switch id="auto-refresh" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
