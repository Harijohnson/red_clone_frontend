import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { fetchBookingById } from "@/services/bookings"
import { RouteMapSvg } from "@/components/ui/RouteMapSvg"
import { CheckCircle2, User, MapPin, Clock, IndianRupee, Ticket, Printer } from "lucide-react"
import type { BookingDetail } from "@/types"
import type { ApiError } from "@/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  }
}

function formatDuration(departure: string, arrival: string): string {
  const diff = new Date(arrival).getTime() - new Date(departure).getTime()
  const totalMinutes = Math.round(diff / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "confirmed": return "bg-green-500/10 text-green-700 dark:text-green-400"
    case "cancelled": return "bg-destructive/10 text-destructive"
    default: return "bg-muted text-muted-foreground"
  }
}

function paymentBadgeClass(status: string): string {
  switch (status) {
    case "paid": return "bg-green-500/10 text-green-700 dark:text-green-400"
    case "refunded": return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    default: return "bg-amber-500/10 text-amber-700 dark:text-amber-400"
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>()

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) {
      setError("Invalid booking link.")
      setLoading(false)
      return
    }

    let cancelled = false
    fetchBookingById(bookingId)
      .then((data) => {
        if (!cancelled) {
          setBooking(data)
          setLoading(false)
        }
      })
      .catch((err: ApiError) => {
        if (!cancelled) {
          setError(
            err.status === 404
              ? "Booking not found."
              : (err.message ?? "Failed to load booking."),
          )
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [bookingId])

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div
          className="flex flex-col items-center gap-3 py-20 text-sm text-muted-foreground"
          aria-busy="true"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading booking…
        </div>
      </main>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error || !booking) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
        >
          <p className="font-medium text-destructive">{error ?? "Booking not found."}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This booking may not exist or may belong to a different account.
          </p>
          <Link
            to="/my-bookings"
            className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
          >
            View my bookings
          </Link>
        </div>
      </main>
    )
  }

  // ── Happy path ───────────────────────────────────────────────────────────

  const dep = formatDateTime(booking.trip.departureTime)
  const arr = formatDateTime(booking.trip.arrivalTime)
  const booked = formatDateTime(booking.bookedAt)
  const duration = formatDuration(booking.trip.departureTime, booking.trip.arrivalTime)

  const handlePrint = () => window.print()

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* ── Success banner ── */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-green-700 dark:text-green-400">
            Booking Confirmed!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Booked on {booked.date} at {booked.time}
          </p>
        </div>
      </div>

      {/* ── Ticket card ── */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border-2 border-primary/20 bg-card shadow-lg">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-emerald-500" />

        {/* Ticket header */}
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Booking Reference
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={[
                "inline-block rounded-full px-3 py-0.5 text-xs font-medium capitalize",
                statusBadgeClass(booking.bookingStatus),
              ].join(" ")}
            >
              {booking.bookingStatus}
            </span>
            <span
              className={[
                "inline-block rounded-full px-3 py-0.5 text-xs font-medium capitalize",
                paymentBadgeClass(booking.paymentStatus),
              ].join(" ")}
            >
              {booking.paymentStatus}
            </span>
          </div>
        </div>
        <p className="px-6 pb-5 pt-1 font-mono text-3xl font-bold tracking-widest text-primary">
          {booking.bookingReference}
        </p>

        {/* Dotted separator (perforated effect) */}
        <div className="flex items-center px-6">
          <div className="-ml-9 h-5 w-5 rounded-full border-2 border-primary/20 bg-background" />
          <div className="flex flex-1 gap-1 px-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-0.5 flex-1 rounded-full bg-border" />
            ))}
          </div>
          <div className="-mr-9 h-5 w-5 rounded-full border-2 border-primary/20 bg-background" />
        </div>

        {/* Route map */}
        <div className="px-6 py-5">
          <RouteMapSvg
            from={booking.trip.source}
            to={booking.trip.destination}
            duration={duration}
          />
        </div>

        {/* Journey grid */}
        <div className="grid grid-cols-2 gap-4 px-6 pb-5">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Departure</p>
              <p className="font-semibold">{booking.trip.source}</p>
              <p className="font-mono text-sm">{dep.time}</p>
              <p className="text-xs text-muted-foreground">{dep.date}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Arrival</p>
              <p className="font-semibold">{booking.trip.destination}</p>
              <p className="font-mono text-sm">{arr.time}</p>
              <p className="text-xs text-muted-foreground">{arr.date}</p>
            </div>
          </div>
        </div>

        {/* Operator */}
        <div className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">Operated by</p>
          <p className="mt-0.5 font-medium">{booking.trip.busName}</p>
        </div>
      </div>

      {/* ── Passengers ── */}
      <section className="mb-4 rounded-xl border bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Passengers
        </p>
        <ul className="flex flex-col divide-y">
          {booking.passengers.map((p) => (
            <li key={p.seatNumber} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.age} yrs</p>
                </div>
              </div>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                Seat {p.seatNumber}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Total ── */}
      <section className="mb-8 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Seats: <span className="font-mono font-medium text-foreground">{booking.seats.join(", ")}</span>
            </p>
          </div>
          <div className="flex items-center gap-0.5 text-xl font-bold">
            <IndianRupee className="h-4 w-4" />
            {booking.totalAmount.toLocaleString("en-IN")}
          </div>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-4 print:hidden">
        <Link
          to="/my-bookings"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          View all bookings
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <Printer className="h-4 w-4" />
          Print Ticket
        </button>
        <Link
          to="/"
          className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Book another trip
        </Link>
      </div>
    </main>
  )
}
