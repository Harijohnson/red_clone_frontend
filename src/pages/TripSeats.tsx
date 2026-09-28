import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { fetchTripSeats, lockSeats } from "@/services/seats"
import SeatGrid from "@/components/seats/SeatGrid"
import type { SeatEntry, TripSeatsResponse, ApiError, SelectionError, SeatSelectionState } from "@/types"

const MAX_SEATS = 6

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: TripSeatsResponse }

type LockState =
  | { status: "idle" }
  | { status: "locking" }
  | { status: "failed"; unavailableSeats: string[]; message: string }

export default function TripSeats() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>({ status: "loading" })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectionError, setSelectionError] = useState<SelectionError | null>(null)
  const [staleSeatNumbers, setStaleSeatNumbers] = useState<string[]>([])
  const [lockState, setLockState] = useState<LockState>({ status: "idle" })

  // Keep a ref to the current selected set so loadSeats can read it without
  // becoming a dependency of the effect.
  const selectedRef = useRef<Set<string>>(selected)
  useEffect(() => { selectedRef.current = selected }, [selected])

  const loadSeats = useCallback(async (isRefresh = false) => {
    if (!tripId) return
    if (!isRefresh) setState({ status: "loading" })

    try {
      const data = await fetchTripSeats(tripId)

      if (isRefresh) {
        // After a refresh, prune any previously selected seat that is no longer available.
        const availableSet = new Set(
          data.seats
            .filter((s) => s.status === "available" || s.isLockedByMe)
            .map((s) => s.number),
        )
        const nowStale = Array.from(selectedRef.current).filter(
          (n) => !availableSet.has(n),
        )
        if (nowStale.length > 0) {
          setStaleSeatNumbers(nowStale)
          setSelected((prev) => {
            const next = new Set(prev)
            for (const n of nowStale) next.delete(n)
            return next
          })
        }
      }

      setState({ status: "ready", data })
    } catch (err) {
      const apiErr = err as ApiError
      setState({ status: "error", message: apiErr.message ?? "Failed to load seats." })
    }
  }, [tripId])

  // Initial load + re-load on tripId change
  useEffect(() => {
    loadSeats(false)
  }, [loadSeats])

  // Re-fetch on window focus (handles the browser refresh / tab-return case)
  useEffect(() => {
    function onFocus() { loadSeats(true) }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [loadSeats])

  function handleToggle(seatNumber: string) {
    // Clear stale banner once the user starts interacting again
    setStaleSeatNumbers([])
    setSelectionError(null)
    setLockState({ status: "idle" })

    setSelected((prev) => {
      // Deselect
      if (prev.has(seatNumber)) {
        const next = new Set(prev)
        next.delete(seatNumber)
        return next
      }

      // Guard: max reached
      if (prev.size >= MAX_SEATS) {
        setSelectionError({ kind: "max_reached", max: MAX_SEATS })
        return prev
      }

      // Guard: seat no longer available (optimistic check from live data)
      if (state.status === "ready") {
        const seat = state.data.seats.find((s) => s.number === seatNumber)
        if (seat && seat.status !== "available" && !seat.isLockedByMe) {
          setSelectionError({ kind: "seat_unavailable", seatNumber })
          return prev
        }
      }

      const next = new Set(prev)
      next.add(seatNumber)
      return next
    })
  }

  async function handleContinue() {
    if (!tripId || state.status !== "ready") return
    if (selected.size === 0) return

    setLockState({ status: "locking" })

    const seatNumbers = Array.from(selected).sort()

    try {
      const lockResult = await lockSeats(tripId, { seatNumbers })

      const selectedSeats = state.data.seats.filter((s) => selected.has(s.number))
      const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0)

      const locationState: SeatSelectionState = {
        tripId,
        seatNumbers,
        totalAmount,
        lockExpiresAt: lockResult.expiresAt,
      }

      setLockState({ status: "idle" })
      navigate(`/trips/${tripId}/passenger-details`, { state: locationState })
    } catch (err) {
      const apiErr = err as ApiError

      // Refresh seat availability so the UI reflects current state
      await loadSeats(true)

      // Determine which of the selected seats are now unavailable
      if (state.status === "ready") {
        const unavailableSeats = seatNumbers.filter((sn) => {
          const seat = state.data.seats.find((s) => s.number === sn)
          return seat && seat.status !== "available" && !seat.isLockedByMe
        })
        setLockState({
          status: "failed",
          unavailableSeats,
          message: apiErr.message ?? "Could not lock seats. Please try again.",
        })
      } else {
        setLockState({
          status: "failed",
          unavailableSeats: [],
          message: apiErr.message ?? "Could not lock seats. Please try again.",
        })
      }
    }
  }

  const seats: SeatEntry[] = state.status === "ready" ? state.data.seats : []
  const isLocking = lockState.status === "locking"

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Select Seats</h1>
        <Link
          to="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          New search
        </Link>
      </div>

      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState message={state.message} />}

      {state.status === "ready" && (
        <>
          <Legend />

          {staleSeatNumbers.length > 0 && (
            <StaleSeatsBanner seatNumbers={staleSeatNumbers} onDismiss={() => setStaleSeatNumbers([])} />
          )}

          {selectionError !== null && (
            <SelectionErrorBanner error={selectionError} onDismiss={() => setSelectionError(null)} />
          )}

          {lockState.status === "failed" && (
            <LockFailedBanner
              unavailableSeats={lockState.unavailableSeats}
              message={lockState.message}
              onDismiss={() => setLockState({ status: "idle" })}
            />
          )}

          <div className="mt-6 overflow-x-auto">
            <SeatGrid
              seats={seats}
              selected={selected}
              onToggle={handleToggle}
              maxSelect={MAX_SEATS}
            />
          </div>
          <SeatSummary
            seats={seats}
            selected={selected}
            maxSelect={MAX_SEATS}
            isLocking={isLocking}
            onContinue={handleContinue}
          />
        </>
      )}
    </main>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <p className="text-sm text-muted-foreground">Loading seats…</p>
      <div className="h-64 animate-pulse rounded-xl border bg-muted" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center">
      <p className="font-medium text-destructive">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
        Back to search
      </Link>
    </div>
  )
}

function StaleSeatsBanner({
  seatNumbers,
  onDismiss,
}: {
  seatNumbers: string[]
  onDismiss: () => void
}) {
  const list = seatNumbers.sort().join(", ")
  return (
    <div
      role="alert"
      className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <p className="text-amber-700 dark:text-amber-300">
        <span className="font-semibold">Seat{seatNumbers.length > 1 ? "s" : ""} no longer available:</span>{" "}
        <span className="font-mono">{list}</span>. Please choose a different seat.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-amber-700 hover:opacity-70 dark:text-amber-300"
      >
        ✕
      </button>
    </div>
  )
}

function SelectionErrorBanner({
  error,
  onDismiss,
}: {
  error: SelectionError
  onDismiss: () => void
}) {
  const message =
    error.kind === "max_reached"
      ? `You can select at most ${error.max} seat${error.max > 1 ? "s" : ""} per booking.`
      : `Seat ${error.seatNumber} is no longer available.`

  return (
    <div
      role="alert"
      className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
    >
      <p className="text-destructive">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-destructive hover:opacity-70"
      >
        ✕
      </button>
    </div>
  )
}

function LockFailedBanner({
  unavailableSeats,
  message,
  onDismiss,
}: {
  unavailableSeats: string[]
  message: string
  onDismiss: () => void
}) {
  return (
    <div
      role="alert"
      className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
    >
      <div>
        <p className="font-semibold text-destructive">{message}</p>
        {unavailableSeats.length > 0 && (
          <p className="mt-0.5 text-destructive">
            Unavailable:{" "}
            <span className="font-mono">{unavailableSeats.sort().join(", ")}</span>
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-destructive hover:opacity-70"
      >
        ✕
      </button>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {[
        { color: "bg-muted", label: "Available" },
        { color: "bg-primary", label: "Selected" },
        { color: "bg-muted/40 border border-muted", label: "Booked" },
        { color: "bg-muted/40 border border-amber-400", label: "Locked" },
        { color: "bg-amber-500/20 border border-amber-400", label: "Your hold" },
      ].map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`inline-block h-4 w-4 rounded ${color}`} />
          {label}
        </span>
      ))}
    </div>
  )
}

function SeatSummary({
  seats,
  selected,
  maxSelect,
  isLocking,
  onContinue,
}: {
  seats: SeatEntry[]
  selected: Set<string>
  maxSelect: number
  isLocking: boolean
  onContinue: () => void
}) {
  const selectedSeats = seats.filter((s) => selected.has(s.number))
  const hasPricing = selectedSeats.length > 0 && selectedSeats.every((s) => s.price > 0)
  const total = hasPricing ? selectedSeats.reduce((sum, s) => sum + s.price, 0) : null
  const seatNumbers = Array.from(selected).sort()
  const atLimit = selected.size >= maxSelect

  return (
    <div className="mt-8 flex flex-col items-start gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {selected.size === 0 ? (
          <p className="text-sm text-muted-foreground">
            Select up to {maxSelect} seat{maxSelect > 1 ? "s" : ""} to continue
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">
              {selected.size}/{maxSelect} seat{selected.size > 1 ? "s" : ""} selected:{" "}
              <span className="font-mono">{seatNumbers.join(", ")}</span>
            </p>
            {total !== null && (
              <p className="text-xs text-muted-foreground">
                Total: ₹{total.toLocaleString("en-IN")}
              </p>
            )}
            {atLimit && (
              <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                Maximum seats selected. Deselect a seat to change your choice.
              </p>
            )}
          </>
        )}
      </div>
      <button
        type="button"
        disabled={selected.size === 0 || isLocking}
        onClick={onContinue}
        className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLocking ? "Reserving…" : "Continue"}
      </button>
    </div>
  )
}
