"use client"

import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isThisWeek } from "date-fns"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface WeeklyNavProps {
  weekStart: Date
  onWeekChange: (date: Date) => void
}

export function WeeklyNav({ weekStart, onWeekChange }: WeeklyNavProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const isCurrentWeek = isThisWeek(weekStart, { weekStartsOn: 1 })

  const goToPrev = () => onWeekChange(subWeeks(weekStart, 1))
  const goToNext = () => onWeekChange(addWeeks(weekStart, 1))
  const goToToday = () => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }))

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 border border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrev}
          className="h-8 w-8 rounded-lg hover:bg-background hover:shadow-sm transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 px-3 min-w-[240px] justify-center">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          className="h-8 w-8 rounded-lg hover:bg-background hover:shadow-sm transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!isCurrentWeek && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="h-9 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all rounded-xl"
        >
          Jump to Today
        </Button>
      )}

      {isCurrentWeek && (
        <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 bg-primary/5 rounded-full px-3 py-1 uppercase tracking-widest animate-pulse">
          Current Week
        </Badge>
      )}
    </div>
  )
}
