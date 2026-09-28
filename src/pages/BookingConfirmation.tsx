import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { fetchBookingById } from "@/services/bookings"
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

function statusBadgeClass(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-green-500/10 text-green-700 dark:text-green-400"
    case "cancelled":
      return "bg-destructive/10 text-destructive"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function paymentBadgeClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-green-500/10 text-green-700 dark:text-green-400"
    case "refunded":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    default:
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400"
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

    return () => {
      cancelled = true
    }
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Booking confirmed
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {booking.trip.source} → {booking.trip.destination}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Booked on {booked.date} at {booked.time}
        </p>
      </div>

      {/* Reference + Status */}
      <section className="mb-4 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Booking reference</p>
            <p className="mt-0.5 font-mono text-lg font-semibold tracking-widest">
              {booking.bookingReference}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
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
      </section>

      {/* Journey */}
      <section className="mb-4 rounded-xl border bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Journey
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Departure</p>
            <p className="font-medium">{booking.trip.source}</p>
            <p className="font-mono text-sm">{dep.time}</p>
            <p className="text-xs text-muted-foreground">{dep.date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Arrival</p>
            <p className="font-medium">{booking.trip.destination}</p>
            <p className="font-mono text-sm">{arr.time}</p>
            <p className="text-xs text-muted-foreground">{arr.date}</p>
          </div>
        </div>
        <div className="mt-4 border-t pt-4">
          <p className="text-xs text-muted-foreground">Operator</p>
          <p className="font-medium">{booking.trip.busName}</p>
        </div>
      </section>

      {/* Passengers */}
      <section className="mb-4 rounded-xl border bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Passengers
        </p>
        <ul className="flex flex-col divide-y">
          {booking.passengers.map((p) => (
            <li key={p.seatNumber} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.age} yrs</p>
              </div>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                Seat {p.seatNumber}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Seats + Amount */}
      <section className="mb-6 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Selected seats</p>
            <p className="mt-0.5 font-mono font-medium">{booking.seats.join(", ")}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total amount</p>
            <p className="mt-0.5 text-lg font-semibold">
              ₹{booking.totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Link
          to="/my-bookings"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          View all bookings
        </Link>
        <Link
          to="/"
          className="ml-auto rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Book another trip
        </Link>
      </div>
    </main>
  )
}
