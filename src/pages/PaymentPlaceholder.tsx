import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams, Link } from "react-router-dom"
import { createBooking } from "@/services/bookings"
import { releaseLock } from "@/services/seats"
import { BookingSteps } from "@/components/ui/BookingSteps"
import { User, IndianRupee } from "lucide-react"
import type { ValidatedPassenger, SeatSelectionState } from "@/types"
import type { ApiError } from "@/types"

type PaymentState = SeatSelectionState & {
  passengers: ValidatedPassenger[]
}

export default function PaymentPlaceholder() {
  const { tripId } = useParams<{ tripId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as PaymentState | null

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Prevent double-submission
  const submittedRef = useRef(false)
  // Track whether lock was kept alive (don't release if we're booking)
  const releasedRef = useRef(false)

  const releaseIfHeld = useCallback(() => {
    if (!tripId || releasedRef.current) return
    releasedRef.current = true
    releaseLock(tripId).catch(() => { /* best-effort */ })
  }, [tripId])

  useEffect(() => {
    function onBeforeUnload() { releaseIfHeld() }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [releaseIfHeld])

  useEffect(() => {
    return () => {
      releaseIfHeld()
    }
  }, [releaseIfHeld])

  async function handleConfirm() {
    if (!state || !tripId || submittedRef.current) return
    submittedRef.current = true
    releasedRef.current = true  // We're booking — do not release lock

    setSubmitting(true)
    setError(null)

    try {
      const result = await createBooking({
        tripId: state.tripId,
        passengers: state.passengers.map((p) => ({
          name: p.fullName,
          age: p.age,
          seatNumber: p.seatNumber,
        })),
      })

      navigate(`/booking/${result.bookingId}`, { replace: true })
    } catch (err) {
      submittedRef.current = false
      releasedRef.current = false
      const apiErr = err as ApiError
      setError(
        apiErr.message ?? "Failed to confirm booking. Please try again.",
      )
      setSubmitting(false)
    }
  }

  // ── Guard: no state ──────────────────────────────────────────────────────

  if (!state) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
        >
          <p className="font-medium text-destructive">Session expired or invalid link</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please start a new search to book a trip.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
          >
            Start a new search
          </Link>
        </div>
      </main>
    )
  }

  // ── Summary + Confirm ────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <BookingSteps current={5} />

      <div className="mb-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Review & Confirm</h1>
        <Link
          to={`/trips/${tripId}/passenger-details`}
          state={state}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Check your details below — no payment required to confirm.
      </p>

      {/* Passengers */}
      {state.passengers.length > 0 && (
        <div className="mb-4 rounded-xl border bg-card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Passengers
          </p>
          <ul className="flex flex-col divide-y">
            {state.passengers.map((p: ValidatedPassenger) => (
              <li key={p.seatNumber} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">{p.age} yrs · {p.gender}</p>
                  </div>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                  Seat {p.seatNumber}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seats + amount */}
      <div className="mb-4 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Selected seats</p>
            <p className="mt-0.5 font-mono font-medium">{state.seatNumbers.join(", ")}</p>
          </div>
          {state.totalAmount > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total amount</p>
              <p className="mt-0.5 flex items-center gap-0.5 text-xl font-bold">
                <IndianRupee className="h-4 w-4" />
                {state.totalAmount.toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Confirm button */}
      <div className="flex items-center justify-between rounded-xl border bg-card p-5">
        {state.totalAmount > 0 ? (
          <div>
            <p className="text-xs text-muted-foreground">Amount payable</p>
            <p className="text-lg font-semibold">
              ₹{state.totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          )}
          {submitting ? "Confirming…" : "Confirm Booking"}
        </button>
      </div>
    </main>
  )
}
