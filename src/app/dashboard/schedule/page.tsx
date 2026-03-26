"use client"

import { useState, useMemo } from "react"
import { startOfWeek } from "date-fns"
import { collection, query, where } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { Loader2 } from "lucide-react"
import { WeeklyNav } from "@/components/schedule/weekly-nav"
import { ScheduleStats } from "@/components/schedule/schedule-stats"
import { ScheduleBoard } from "@/components/schedule/schedule-board"
import { format } from "date-fns"

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const firestore = useFirestore()

  // All staff: riders + tellers
  const ridersQuery = useMemoFirebase(
    () => query(collection(firestore, "users"), where("role", "==", "rider")),
    [firestore]
  )
  const tellersQuery = useMemoFirebase(
    () => query(collection(firestore, "users"), where("role", "==", "teller")),
    [firestore]
  )

  // Current week's schedules
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const weekEndDate = new Date(weekStart)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEndStr = format(weekEndDate, "yyyy-MM-dd")

  const schedulesQuery = useMemoFirebase(
    () =>
      query(
        collection(firestore, "schedules"),
        where("date", ">=", weekStartStr),
        where("date", "<=", weekEndStr)
      ),
    [firestore, weekStartStr, weekEndStr]
  )

  const { data: riders, isLoading: ridersLoading } = useCollection(ridersQuery)
  const { data: tellers, isLoading: tellersLoading } = useCollection(tellersQuery)
  const { data: schedules, isLoading: schedulesLoading } = useCollection(schedulesQuery)

  const staff = useMemo(() => [...(riders || []), ...(tellers || [])], [riders, tellers])

  const isLoading = ridersLoading || tellersLoading || schedulesLoading

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading Schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Work Schedule</h2>
          <p className="text-muted-foreground">Plan weekly shifts for all riders and tellers.</p>
        </div>
        <WeeklyNav weekStart={weekStart} onWeekChange={setWeekStart} />
      </div>

      {/* Summary stats */}
      <ScheduleStats schedules={schedules || []} weekStart={weekStart} />

      {/* Weekly calendar board */}
      <ScheduleBoard
        schedules={schedules || []}
        staff={staff}
        weekStart={weekStart}
      />
    </div>
  )
}
