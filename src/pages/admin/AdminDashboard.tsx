import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { fetchDashboard, fetchAnalytics } from "@/services/admin"
import type { AdminDashboardResponse, AdminAnalyticsResponse } from "@/types/admin"
import type { ApiError } from "@/types"

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; stats: AdminDashboardResponse; analytics: AdminAnalyticsResponse }

const STAT_CARDS: { label: string; key: keyof AdminDashboardResponse }[] = [
  { label: "Total Trips", key: "totalTrips" },
  { label: "Total Buses", key: "totalBuses" },
  { label: "Total Routes", key: "totalRoutes" },
  { label: "Total Bookings", key: "totalBookings" },
  { label: "Confirmed Bookings", key: "confirmedBookings" },
]

function fmt(dateStr: string) {
  try {
    return format(parseISO(dateStr), "MMM d")
  } catch {
    return dateStr
  }
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

type TooltipPayloadEntry = {
  name: string
  value: number
  color: string
}

type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  formatter?: (v: number) => string
}

function ChartTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm">
      <p className="mb-1 font-medium text-card-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : p.value.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchDashboard(), fetchAnalytics()])
      .then(([stats, analytics]) => {
        if (!cancelled) setState({ status: "success", stats, analytics })
      })
      .catch((err: ApiError) => {
        if (!cancelled)
          setState({ status: "error", message: err.message ?? "Failed to load dashboard." })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === "loading") {
    return (
      <div
        className="flex items-center gap-3 py-12 text-sm text-muted-foreground"
        aria-busy="true"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading dashboard…
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
      >
        <p className="font-medium text-destructive">Failed to load dashboard</p>
        <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
      </div>
    )
  }

  const { stats, analytics } = state
  const chartData = analytics.days.map((d) => ({ ...d, label: fmt(d.date) }))

  return (
    <div className="space-y-8">
      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map(({ label, key }) => (
          <StatCard key={key} label={label} value={stats[key].toLocaleString("en-IN")} />
        ))}
      </div>

      {/* Last 30-day summary */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Last 30 Days — Confirmed Bookings
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Bookings"
            value={analytics.totalBookings.toLocaleString("en-IN")}
          />
          <StatCard
            label="Seats Booked"
            value={analytics.totalSeats.toLocaleString("en-IN")}
          />
          <StatCard
            label="Revenue"
            value={`₹${analytics.totalRevenue.toLocaleString("en-IN")}`}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Seats booked per day */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold">Daily Seats Booked (Last 30 Days)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              />
              <Bar dataKey="seats" name="Seats" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue per day */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold">Daily Revenue — ₹ (Last 30 Days)</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                }
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
