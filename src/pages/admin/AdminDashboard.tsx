import { useEffect, useState } from "react"
import { fetchDashboard } from "@/services/admin"
import type { AdminDashboardResponse } from "@/types/admin"
import type { ApiError } from "@/types"

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: AdminDashboardResponse }

const STAT_CARDS: { label: string; key: keyof AdminDashboardResponse }[] = [
  { label: "Total Trips", key: "totalTrips" },
  { label: "Total Buses", key: "totalBuses" },
  { label: "Total Routes", key: "totalRoutes" },
  { label: "Total Bookings", key: "totalBookings" },
  { label: "Confirmed Bookings", key: "confirmedBookings" },
]

export default function AdminDashboard() {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    fetchDashboard()
      .then((data) => { if (!cancelled) setState({ status: "success", data }) })
      .catch((err: ApiError) => {
        if (!cancelled)
          setState({ status: "error", message: err.message ?? "Failed to load stats." })
      })
    return () => { cancelled = true }
  }, [])

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground" aria-busy="true">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading dashboard…
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center">
        <p className="font-medium text-destructive">Failed to load dashboard</p>
        <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
      </div>
    )
  }

  const { data } = state

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {STAT_CARDS.map(({ label, key }) => (
        <div key={key} className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{data[key].toLocaleString("en-IN")}</p>
        </div>
      ))}
    </div>
  )
}
