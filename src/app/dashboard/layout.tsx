import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full relative flex">
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="md:pl-64 flex-1 w-full min-h-screen">
        <div className="h-full p-6 md:p-8 bg-background">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
