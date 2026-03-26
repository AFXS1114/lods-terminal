"use client"

import { useMemo } from "react"
import { eachDayOfInterval, endOfWeek, format, isSameDay } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Truck, Briefcase, AlertTriangle, CalendarCheck2 } from "lucide-react"

interface ScheduleStatsProps {
  schedules: any[]
  weekStart: Date
}

export function ScheduleStats({ schedules, weekStart }: ScheduleStatsProps) {
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 1 }),
  })

  const stats = useMemo(() => {
    const activeShifts = schedules.filter(s => s.shiftLabel !== "Rest Day")
    const riderShifts = activeShifts.filter(s => s.role === "rider")
    const tellerShifts = activeShifts.filter(s => s.role === "teller")

    // Days where riders on duty < 2
    const understaffedDays = weekDays.filter(day => {
      const dayStr = format(day, "yyyy-MM-dd")
      const ridersOnDay = schedules.filter(s => s.date === dayStr && s.role === "rider" && s.shiftLabel !== "Rest Day")
      return ridersOnDay.length < 2
    }).length

    // Unique staff scheduled this week
    const uniqueStaff = new Set(activeShifts.map(s => s.userId)).size

    return {
      total: activeShifts.length,
      riderShifts: riderShifts.length,
      tellerShifts: tellerShifts.length,
      understaffedDays,
      uniqueStaff,
    }
  }, [schedules, weekDays])

  const cards = [
    {
      label: "Total Shift Slots",
      value: stats.total,
      icon: CalendarCheck2,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Staff Scheduled",
      value: stats.uniqueStaff,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
    },
    {
      label: "Rider Shifts",
      value: stats.riderShifts,
      icon: Truck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Teller Shifts",
      value: stats.tellerShifts,
      icon: Briefcase,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      label: "Understaffed Days",
      value: stats.understaffedDays,
      icon: AlertTriangle,
      color: stats.understaffedDays > 0 ? "text-destructive" : "text-green-500",
      bg: stats.understaffedDays > 0 ? "bg-destructive/10" : "bg-green-500/10",
      border: stats.understaffedDays > 0 ? "border-destructive/20" : "border-green-500/20",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className={`border ${card.border} shadow-sm hover:shadow-md transition-shadow`}>
          <CardContent className="p-4">
            <div className={`inline-flex items-center justify-center h-9 w-9 rounded-xl ${card.bg} mb-3`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className={`text-2xl font-extrabold tabular-nums ${card.color}`}>{card.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
