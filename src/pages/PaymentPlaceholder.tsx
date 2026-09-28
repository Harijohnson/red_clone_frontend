import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams, Link } from "react-router-dom"
import { createBooking } from "@/services/bookings"
import { releaseLock } from "@/services/seats"
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
    <main className="mx-auto max-w-2xl px-4 py-10">
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
      <p className="mb-8 text-sm text-muted-foreground">
        Payment is not yet required. Confirm your booking to receive a booking reference.
      </p>

      {/* Booking summary */}
      <div className="mb-6 rounded-xl border bg-card p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Booking summary
        </p>
        <p className="text-sm text-muted-foreground">
          Seats:{" "}
          <span className="font-mono font-medium text-foreground">
            {state.seatNumbers.join(", ")}
          </span>
        </p>
        {state.totalAmount > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Total:{" "}
            <span className="font-medium text-foreground">
              ₹{state.totalAmount.toLocaleString("en-IN")}
            </span>
          </p>
        )}
        {state.passengers.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5 border-t pt-3">
            {state.passengers.map((p) => (
              <li key={p.seatNumber} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {p.fullName}, {p.age} yrs
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                  Seat {p.seatNumber}
                </span>
              </li>
            ))}
          </ul>
        )}
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
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Confirming…" : "Confirm Booking"}
        </button>
      </div>
    </main>
  )
}
