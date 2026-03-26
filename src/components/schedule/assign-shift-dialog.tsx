"use client"

import { useState } from "react"
import { collection, addDoc, serverTimestamp, updateDoc, doc, Timestamp } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { format, isToday, parse } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Sparkles, Sun, Sunset, Moon, Coffee, Zap, Timer, AlarmClock } from "lucide-react"

const SHIFT_PRESETS = [
  {
    label: "Morning",
    start: "06:00",
    end: "14:00",
    icon: Sun,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    description: "6:00 AM – 2:00 PM",
  },
  {
    label: "Afternoon",
    start: "14:00",
    end: "22:00",
    icon: Sunset,
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/30",
    description: "2:00 PM – 10:00 PM",
  },
  {
    label: "Evening",
    start: "22:00",
    end: "06:00",
    icon: Moon,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    description: "10:00 PM – 6:00 AM",
  },
  {
    label: "Rest Day",
    start: "",
    end: "",
    icon: Coffee,
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/30",
    description: "Day off",
  },
]

type AutoStartMode = "now" | "scheduled"

interface AssignShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date | null
  staff: any[]
  roleFilter?: "all" | "rider" | "teller"
}

export function AssignShiftDialog({
  open,
  onOpenChange,
  date,
  staff,
  roleFilter = "all",
}: AssignShiftDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedShift, setSelectedShift] = useState("")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [notes, setNotes] = useState("")
  const [autoStartMode, setAutoStartMode] = useState<AutoStartMode>("now")
  const [isSaving, setIsSaving] = useState(false)

  const firestore = useFirestore()
  const { toast } = useToast()

  const filteredStaff = roleFilter === "all"
    ? staff
    : staff.filter((s) => s.role === roleFilter)

  const preset = SHIFT_PRESETS.find((p) => p.label === selectedShift)
  const shiftStart = selectedShift === "Rest Day" ? "" : (customStart || preset?.start || "")
  const shiftEnd = selectedShift === "Rest Day" ? "" : (customEnd || preset?.end || "")

  const isAssigningToday = date ? isToday(date) : false
  const isActiveShift = selectedShift && selectedShift !== "Rest Day"

  // Build the timeIn timestamp based on the chosen auto-start mode
  const buildTimeIn = () => {
    if (autoStartMode === "now" || !shiftStart || !date) {
      // Option 1: use Firestore server timestamp (now)
      return serverTimestamp()
    }
    // Option 2: use today's date + the shift start time string (e.g. "08:00")
    try {
      const parsed = parse(shiftStart, "HH:mm", new Date(date))
      return Timestamp.fromDate(parsed)
    } catch {
      return serverTimestamp()
    }
  }

  const handleSave = async () => {
    if (!selectedUserId || !selectedShift || !date) return

    const user = staff.find((s) => s.id === selectedUserId)
    if (!user) return

    setIsSaving(true)
    try {
      const dateStr = format(date, "yyyy-MM-dd")

      // 1. Save schedule entry
      await addDoc(collection(firestore, "schedules"), {
        userId: user.id,
        userName: user.name,
        role: user.role,
        date: dateStr,
        shiftLabel: selectedShift,
        shiftStart: shiftStart,
        shiftEnd: shiftEnd,
        notes: notes || null,
        createdAt: serverTimestamp(),
      })

      // 2. If today + active shift → auto Time In via DTR
      if (isAssigningToday && isActiveShift) {
        const dtrCollection = user.role === "rider" ? "riderDTR" : "tellerDTR"
        const timeInValue = buildTimeIn()

        const dtrPayload: Record<string, any> = {
          timeIn: timeInValue,
          timeOut: null,
          date: dateStr,
          shiftLabel: selectedShift,
          shiftStart: shiftStart,
          shiftEnd: shiftEnd,
        }

        if (user.role === "rider") {
          dtrPayload.riderId = user.id
          dtrPayload.riderName = user.name
        } else {
          dtrPayload.tellerId = user.id
          dtrPayload.tellerName = user.name
        }

        const dtrRef = await addDoc(collection(firestore, dtrCollection), dtrPayload)

        await updateDoc(doc(firestore, "users", user.id), {
          status: "online",
          lastTimeIn: timeInValue,
          activeDtrId: dtrRef.id,
          cashAdvance: 0,
          ...(user.role === "rider" ? { budgetOnHand: 0 } : {}),
        })

        const modeLabel =
          autoStartMode === "now"
            ? "clocked in immediately"
            : `timer set to ${shiftStart}`

        toast({
          title: "Shift Assigned & Timer Started ⚡",
          description: `${user.name} ${modeLabel} for the ${selectedShift} shift.`,
        })
      } else {
        toast({
          title: "Shift Scheduled ✓",
          description: `${user.name} scheduled for ${selectedShift} on ${format(date, "EEE, MMM d")}.`,
        })
      }

      // Reset
      setSelectedUserId("")
      setSelectedShift("")
      setCustomStart("")
      setCustomEnd("")
      setNotes("")
      setAutoStartMode("now")
      onOpenChange(false)
    } catch (e) {
      toast({
        title: "Failed to Assign",
        description: "An error occurred while saving the shift.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = selectedUserId && selectedShift

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary/90 to-primary px-6 pt-6 pb-5">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              Assign Shift
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-1">
              {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
            </DialogDescription>
          </DialogHeader>

          {/* Today + active shift: show auto-start mode selector */}
          {isAssigningToday && isActiveShift && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-white/60 font-bold uppercase tracking-widest">
                Auto-Start Mode
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Option 1 */}
                <button
                  type="button"
                  onClick={() => setAutoStartMode("now")}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                    autoStartMode === "now"
                      ? "bg-white/20 border-white/60 shadow-sm"
                      : "bg-white/5 border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${autoStartMode === "now" ? "bg-yellow-400/30" : "bg-white/10"}`}>
                    <Zap className={`h-3.5 w-3.5 ${autoStartMode === "now" ? "text-yellow-300" : "text-white/50"}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${autoStartMode === "now" ? "text-white" : "text-white/60"}`}>
                      Start Now
                    </p>
                    <p className="text-[10px] text-white/40 leading-tight mt-0.5">
                      Clock in at the current time
                    </p>
                  </div>
                </button>

                {/* Option 2 */}
                <button
                  type="button"
                  onClick={() => setAutoStartMode("scheduled")}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                    autoStartMode === "scheduled"
                      ? "bg-white/20 border-white/60 shadow-sm"
                      : "bg-white/5 border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${autoStartMode === "scheduled" ? "bg-sky-400/30" : "bg-white/10"}`}>
                    <AlarmClock className={`h-3.5 w-3.5 ${autoStartMode === "scheduled" ? "text-sky-300" : "text-white/50"}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${autoStartMode === "scheduled" ? "text-white" : "text-white/60"}`}>
                      Start at Shift Time
                    </p>
                    <p className="text-[10px] text-white/40 leading-tight mt-0.5">
                      {shiftStart ? `Timer set to ${shiftStart}` : "Use shift start time"}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Plain today banner (before shift is selected) */}
          {isAssigningToday && !isActiveShift && (
            <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <Timer className="h-4 w-4 text-yellow-300 shrink-0" />
              <p className="text-[12px] text-white/90 font-medium">
                Today's date — assigning a shift will <strong className="text-yellow-300">auto-start the DTR timer</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Staff picker */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Staff Member
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="h-11 border-primary/20 focus:ring-primary/30 rounded-xl">
                <SelectValue placeholder="Choose a staff member..." />
              </SelectTrigger>
              <SelectContent>
                {filteredStaff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {member.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase ml-1 py-0 px-1.5 ${
                          member.role === "rider"
                            ? "text-blue-500 border-blue-500/30"
                            : "text-violet-500 border-violet-500/30"
                        }`}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift type selector */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Shift Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {SHIFT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setSelectedShift(p.label)
                    setCustomStart(p.start)
                    setCustomEnd(p.end)
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                    selectedShift === p.label
                      ? `${p.bg} shadow-sm`
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedShift === p.label ? p.bg : "bg-muted/40"}`}>
                    <p.icon className={`h-4 w-4 ${selectedShift === p.label ? p.color : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${selectedShift === p.label ? p.color : "text-foreground"}`}>
                      {p.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom time override (hide for Rest Day) */}
          {selectedShift && selectedShift !== "Rest Day" && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Custom Time Override
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Start Time</Label>
                  <Input
                    type="time"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-9 rounded-xl border-primary/20 focus-visible:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">End Time</Label>
                  <Input
                    type="time"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-9 rounded-xl border-primary/20 focus-visible:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Notes <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. Cover for absent staff, priority route..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 rounded-xl border-primary/20 focus-visible:ring-primary/30"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/30"
              disabled={!canSave || isSaving}
              onClick={handleSave}
            >
              {isAssigningToday && isActiveShift ? (
                autoStartMode === "now" ? (
                  <><Zap className="h-4 w-4" />{isSaving ? "Clocking In..." : "Assign & Start Now"}</>
                ) : (
                  <><AlarmClock className="h-4 w-4" />{isSaving ? "Scheduling..." : `Assign & Start at ${shiftStart || "Shift Time"}`}</>
                )
              ) : (
                <><Sparkles className="h-4 w-4" />{isSaving ? "Saving..." : "Assign Shift"}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
