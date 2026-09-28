import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchMyBookings } from "@/services/bookings"
import type { BookingListItem } from "@/types"
import type { ApiError } from "@/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
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
// BookingCard
// ---------------------------------------------------------------------------

function BookingCard({ booking }: { booking: BookingListItem }) {
  return (
    <Link
      to={`/booking/${booking.bookingId}`}
      className="block rounded-xl border bg-card p-5 transition-colors hover:bg-accent/50"
    >
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {booking.trip.source} → {booking.trip.destination}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {booking.bookingReference}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              statusBadgeClass(booking.bookingStatus),
            ].join(" ")}
          >
            {booking.bookingStatus}
          </span>
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
              paymentBadgeClass(booking.paymentStatus),
            ].join(" ")}
          >
            {booking.paymentStatus}
          </span>
        </div>
      </div>

      {/* Details row */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Travel date</span>
          <span>{formatDate(booking.trip.departureTime)}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatTime(booking.trip.departureTime)} → {formatTime(booking.trip.arrivalTime)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground">Seats</span>
          <span className="font-mono">{booking.seats.join(", ")}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground">Amount</span>
          <span className="font-semibold">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MyBookings() {
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchMyBookings()
      .then((data) => {
        if (!cancelled) {
          setBookings(data.bookings)
          setLoading(false)
        }
      })
      .catch((err: ApiError) => {
        if (!cancelled) {
          setError(err.message ?? "Failed to load bookings.")
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div
          className="flex flex-col items-center gap-3 py-20 text-sm text-muted-foreground"
          aria-busy="true"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your bookings…
        </div>
      </main>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
        >
          <p className="font-medium text-destructive">Failed to load bookings</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchMyBookings()
                .then((data) => {
                  setBookings(data.bookings)
                  setLoading(false)
                })
                .catch((err: ApiError) => {
                  setError(err.message ?? "Failed to load bookings.")
                  setLoading(false)
                })
            }}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────────────

  if (bookings.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">My Bookings</h1>
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="font-medium">No bookings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your confirmed trips will appear here.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Search trips
          </Link>
        </div>
      </main>
    )
  }

  // ── Bookings list ────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Bookings</h1>
        <span className="text-sm text-muted-foreground">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {bookings.map((b) => (
          <li key={b.bookingId}>
            <BookingCard booking={b} />
          </li>
        ))}
      </ul>
    </main>
  )
}
