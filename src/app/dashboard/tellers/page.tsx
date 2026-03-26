"use client"

import { collection, query, where } from "firebase/firestore"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { TellerList } from "@/components/tellers/teller-list"
import { Loader2 } from "lucide-react"

export default function TellersPage() {
  const firestore = useFirestore()

  const tellersQuery = useMemoFirebase(() => {
    return query(collection(firestore, "users"), where("role", "==", "teller"))
  }, [firestore])

  const { data: tellers, isLoading } = useCollection(tellersQuery)

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse font-medium">Booting Teller Console...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Cashier & Teller Command</h2>
          <p className="text-muted-foreground">Manage dispatch personnel, cash advances, and duty logs.</p>
        </div>
      </div>

      <TellerList tellers={tellers || []} />
    </div>
  )
}
