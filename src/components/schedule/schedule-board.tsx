"use client"

import { useState, useMemo } from "react"
import { doc, deleteDoc } from "firebase/firestore"
import { useFirestore } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { format, eachDayOfInterval, endOfWeek, isToday, parseISO } from "date-fns"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AssignShiftDialog } from "./assign-shift-dialog"
import {
  Plus, Trash2, Sun, Sunset, Moon, Coffee,
  Truck, Briefcase, Users, CalendarOff
} from "lucide-react"

const SHIFT_CONFIG: Record<string, {
  icon: React.ElementType
  colorClass: string
  bgClass: string
  ringClass: string
  badgeClass: string
}> = {
  Morning: {
    icon: Sun,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-900/20",
    ringClass: "ring-amber-200 dark:ring-amber-800",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300/50",
  },
  Afternoon: {
    icon: Sunset,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-900/20",
    ringClass: "ring-orange-200 dark:ring-orange-800",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300/50",
  },
  Evening: {
    icon: Moon,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
    ringClass: "ring-indigo-200 dark:ring-indigo-800",
    badgeClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-300/50",
  },
  "Rest Day": {
    icon: Coffee,
    colorClass: "text-slate-500 dark:text-slate-400",
    bgClass: "bg-slate-100 dark:bg-slate-800/40",
    ringClass: "ring-slate-200 dark:ring-slate-700",
    badgeClass: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300/50",
  },
}

type RoleFilter = "all" | "rider" | "teller"

interface ScheduleBoardProps {
  schedules: any[]
  staff: any[]
  weekStart: Date
}

export function ScheduleBoard({ schedules, staff, weekStart }: ScheduleBoardProps) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const firestore = useFirestore()
  const { toast } = useToast()

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: weekStart,
        end: endOfWeek(weekStart, { weekStartsOn: 1 }),
      }),
    [weekStart]
  )

  const filteredSchedules = useMemo(
    () =>
      roleFilter === "all"
        ? schedules
        : schedules.filter((s) => s.role === roleFilter),
    [schedules, roleFilter]
  )

  const getShiftsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd")
    return filteredSchedules.filter((s) => s.date === dayStr)
  }

  const handleRemoveShift = async (scheduleId: string, userName: string) => {
    try {
      await deleteDoc(doc(firestore, "schedules", scheduleId))
      toast({ title: "Shift Removed", description: `${userName}'s shift has been cleared.` })
    } catch {
      toast({ title: "Error", description: "Failed to remove shift.", variant: "destructive" })
    }
  }

  const handleAddClick = (day: Date) => {
    setSelectedDay(day)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Role Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
          <TabsList className="h-9 rounded-xl bg-muted/50 border border-border/50 p-1">
            <TabsTrigger value="all" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-3.5 w-3.5" /> All Staff
            </TabsTrigger>
            <TabsTrigger value="rider" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Truck className="h-3.5 w-3.5 text-blue-500" /> Riders
            </TabsTrigger>
            <TabsTrigger value="teller" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Briefcase className="h-3.5 w-3.5 text-violet-500" /> Tellers
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {Object.entries(SHIFT_CONFIG).map(([label, config]) => (
            <div key={label} className="flex items-center gap-1">
              <config.icon className={`h-3 w-3 ${config.colorClass}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const shifts = getShiftsForDay(day)
          const dayIsToday = isToday(day)

          return (
            <div key={day.toISOString()} className="flex flex-col min-h-0">
              {/* Day header */}
              <div
                className={`mb-2 rounded-xl px-2 py-2.5 text-center border transition-colors ${
                  dayIsToday
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-muted/20 text-muted-foreground border-border/40"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  {format(day, "EEE")}
                </p>
                <p className={`text-lg font-extrabold leading-tight ${dayIsToday ? "text-white" : ""}`}>
                  {format(day, "d")}
                </p>
                <p className={`text-[9px] ${dayIsToday ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                  {format(day, "MMM")}
                </p>
              </div>

              {/* Shift cards column */}
              <Card className="flex-1 border-border/40 shadow-sm hover:shadow-md transition-shadow bg-muted/5 rounded-xl overflow-hidden">
                <CardContent className="p-2 space-y-2 min-h-[120px]">
                  {shifts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground/30 gap-1">
                      <CalendarOff className="h-5 w-5" />
                      <p className="text-[9px]">No shifts</p>
                    </div>
                  ) : (
                    shifts.map((shift) => {
                      const config = SHIFT_CONFIG[shift.shiftLabel] || SHIFT_CONFIG["Rest Day"]
                      const ShiftIcon = config.icon
                      const isRider = shift.role === "rider"

                      return (
                        <TooltipProvider key={shift.id} delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`group relative rounded-lg p-2 ring-1 transition-all ${config.bgClass} ${config.ringClass} hover:shadow-sm`}
                              >
                                {/* Role stripe */}
                                <div
                                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                                    isRider ? "bg-blue-400" : "bg-violet-400"
                                  }`}
                                />
                                <div className="pl-1.5">
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Avatar className="h-5 w-5 shrink-0 ring-1 ring-white/50">
                                        <AvatarImage src={shift.avatar} />
                                        <AvatarFallback className="text-[8px] font-bold bg-muted">
                                          {shift.userName?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-[10px] font-semibold leading-tight truncate">
                                        {shift.userName?.split(" ")[0]}
                                      </span>
                                    </div>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-4 w-4 rounded flex items-center justify-center hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="border-destructive/20 shadow-2xl">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove Shift?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Remove <strong>{shift.userName}</strong>'s {shift.shiftLabel} shift on {format(parseISO(shift.date), "EEE, MMM d")}?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={() => handleRemoveShift(shift.id, shift.userName)}
                                          >
                                            Remove
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <ShiftIcon className={`h-2.5 w-2.5 ${config.colorClass}`} />
                                    <span className={`text-[9px] font-bold uppercase tracking-wide ${config.colorClass}`}>
                                      {shift.shiftLabel}
                                    </span>
                                  </div>
                                  {shift.shiftStart && shift.shiftEnd && (
                                    <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                                      {shift.shiftStart}–{shift.shiftEnd}
                                    </p>
                                  )}
                                  {shift.notes && (
                                    <p className="text-[9px] text-muted-foreground/70 mt-0.5 italic truncate">
                                      {shift.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs max-w-[180px]">
                              <p className="font-bold">{shift.userName}</p>
                              <p className="text-muted-foreground capitalize">{shift.role} · {shift.shiftLabel}</p>
                              {shift.shiftStart && <p className="font-mono">{shift.shiftStart} – {shift.shiftEnd}</p>}
                              {shift.notes && <p className="italic mt-1">{shift.notes}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })
                  )}
                </CardContent>

                {/* Add shift button */}
                <CardHeader className="p-2 pt-0 border-t border-dashed border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-[10px] text-muted-foreground/60 hover:text-primary hover:bg-primary/5 rounded-lg gap-1 transition-all"
                    onClick={() => handleAddClick(day)}
                  >
                    <Plus className="h-3 w-3" /> Assign
                  </Button>
                </CardHeader>
              </Card>
            </div>
          )
        })}
      </div>

      <AssignShiftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDay}
        staff={staff}
        roleFilter={roleFilter}
      />
    </div>
  )
}
