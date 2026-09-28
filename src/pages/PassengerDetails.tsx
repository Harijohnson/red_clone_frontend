import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams, Link } from "react-router-dom"
import { fetchTripSeats, releaseLock } from "@/services/seats"
import { useLockCountdown, formatCountdown } from "@/hooks/useLockCountdown"
import type {
  Gender,
  PassengerForm,
  PassengerFormError,
  SeatSelectionState,
  ValidatedPassenger,
} from "@/types"

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const PHONE_RE = /^[6-9]\d{9}$/

function validatePassenger(form: PassengerForm): PassengerFormError {
  const errors: PassengerFormError = {}

  if (!form.fullName.trim()) {
    errors.fullName = "Full name is required."
  } else if (form.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters."
  }

  if (!form.age.trim()) {
    errors.age = "Age is required."
  } else {
    const parsed = Number(form.age)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120) {
      errors.age = "Age must be a whole number between 1 and 120."
    }
  }

  if (!form.gender) {
    errors.gender = "Gender is required."
  }

  if (!form.phone.trim()) {
    errors.phone = "Phone number is required."
  } else if (!PHONE_RE.test(form.phone.trim())) {
    errors.phone = "Enter a valid 10-digit Indian mobile number."
  }

  return errors
}

function hasErrors(e: PassengerFormError): boolean {
  return Object.values(e).some((v) => v !== undefined)
}

function emptyForm(): PassengerForm {
  return { fullName: "", age: "", gender: "", phone: "" }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PassengerDetails() {
  const { tripId } = useParams<{ tripId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const locationState = location.state as SeatSelectionState | null

  // Validate the state passed via React Router
  const seatState: SeatSelectionState | null =
    locationState &&
    typeof locationState.tripId === "string" &&
    Array.isArray(locationState.seatNumbers) &&
    locationState.seatNumbers.length > 0 &&
    typeof locationState.lockExpiresAt === "string" &&
    locationState.tripId === tripId
      ? locationState
      : null

  const seatCount = seatState?.seatNumbers.length ?? 0

  const [forms, setForms] = useState<PassengerForm[]>(() =>
    Array.from({ length: seatCount }, emptyForm),
  )
  const [errors, setErrors] = useState<PassengerFormError[]>(() =>
    Array.from({ length: seatCount }, () => ({})),
  )
  const [submitted, setSubmitted] = useState(false)

  // "lockVerified" starts null (unknown), becomes true/false after we check
  // the backend on mount. This handles the browser-refresh case: we cannot
  // trust React state alone — we must confirm the seat is still locked by us.
  const [lockVerified, setLockVerified] = useState<boolean | null>(
    seatState ? null : false,
  )
  const [lockExpired, setLockExpired] = useState(false)
  // Tracks whether we have already fired the release-on-exit call
  const releasedRef = useRef(false)
  // Ref mirror of lockExpired so the unmount cleanup can read it without being a dependency
  const lockExpiredRef = useRef(false)
  // Holds the deferred-release timer so StrictMode's remount can cancel it
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---------------------------------------------------------------------------
  // Verify lock is still alive on mount (handles browser refresh)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!seatState || !tripId) return

    let cancelled = false
    fetchTripSeats(tripId)
      .then((data) => {
        if (cancelled) return
        // The lock is valid if every selected seat reports isLockedByMe
        const lockedByMe = seatState.seatNumbers.every((sn) => {
          const seat = data.seats.find((s) => s.number === sn)
          return seat?.isLockedByMe === true
        })
        setLockVerified(lockedByMe)
        if (!lockedByMe) {
          lockExpiredRef.current = true
          setLockExpired(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLockVerified(false)
      })

    return () => { cancelled = true }
    // Run only once on mount — seatState reference won't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Countdown — driven by the server's expiresAt, not the frontend clock
  // ---------------------------------------------------------------------------
  const handleExpire = useCallback(() => {
    lockExpiredRef.current = true
    setLockExpired(true)
  }, [])

  const countdown = useLockCountdown(
    seatState?.lockExpiresAt ?? null,
    handleExpire,
  )

  // ---------------------------------------------------------------------------
  // Release lock on exit — beforeunload and navigate-away
  // ---------------------------------------------------------------------------

  // Release when the tab is closed / hard-refreshed
  useEffect(() => {
    function onBeforeUnload() {
      if (!tripId || releasedRef.current || lockExpiredRef.current) return
      releasedRef.current = true
      releaseLock(tripId).catch(() => { /* best-effort */ })
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [tripId])

  // Release when the user navigates away within the SPA.
  // Deferred 200 ms so React StrictMode's unmount+remount cycle cancels it.
  // StrictMode sequence: setup → cleanup (schedules timer) → setup (cancels timer) → [real unmount] cleanup (schedules timer, fires for real)
  useEffect(() => {
    // Cancel any pending release from the previous (StrictMode) unmount
    if (releaseTimerRef.current != null) {
      clearTimeout(releaseTimerRef.current)
      releaseTimerRef.current = null
    }

    return () => {
      if (lockExpiredRef.current || releasedRef.current || !tripId) return
      releaseTimerRef.current = setTimeout(() => {
        releaseTimerRef.current = null
        releaseLock(tripId).catch(() => { /* best-effort */ })
      }, 200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Form handlers
  // ---------------------------------------------------------------------------

  function updateField<K extends keyof PassengerForm>(
    index: number,
    field: K,
    value: PassengerForm[K],
  ) {
    setForms((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })

    if (submitted) {
      setErrors((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: undefined }
        return next
      })
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)

    if (!seatState || lockExpired) return

    const nextErrors = forms.map((form) => validatePassenger(form))
    setErrors(nextErrors)

    if (nextErrors.some(hasErrors)) return

    const passengers: ValidatedPassenger[] = forms.map((form, i) => ({
      fullName: form.fullName.trim(),
      age: Number(form.age),
      gender: form.gender as Gender,
      phone: form.phone.trim(),
      seatNumber: seatState.seatNumbers[i],
    }))

    // Lock is still active — don't release it on the way out
    releasedRef.current = true

    navigate(`/trips/${tripId}/payment`, {
      state: {
        tripId: seatState.tripId,
        seatNumbers: seatState.seatNumbers,
        totalAmount: seatState.totalAmount,
        lockExpiresAt: seatState.lockExpiresAt,
        passengers,
      },
    })
  }

  // ---------------------------------------------------------------------------
  // Guard: missing or unverifiable state
  // ---------------------------------------------------------------------------

  if (!seatState) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <InvalidSessionCard />
      </main>
    )
  }

  // Still verifying the lock after a browser refresh — show a subtle spinner
  if (lockVerified === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground" aria-busy="true">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Verifying your seat hold…
        </div>
      </main>
    )
  }

  // Lock is expired (either timed out or refresh revealed it's gone)
  if (lockExpired || lockVerified === false) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <LockExpiredCard tripId={tripId!} />
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Passenger Details</h1>
        <Link
          to={`/trips/${tripId}/seats`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to seats
        </Link>
      </div>

      {/* Seat summary + countdown */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Seats:{" "}
          <span className="font-mono font-medium text-foreground">
            {seatState.seatNumbers.join(", ")}
          </span>
          {seatState.totalAmount > 0 && (
            <>
              {" "}· Total:{" "}
              <span className="font-medium text-foreground">
                ₹{seatState.totalAmount.toLocaleString("en-IN")}
              </span>
            </>
          )}
        </p>

        {countdown.status === "active" && (
          <CountdownPill secondsLeft={countdown.secondsLeft} />
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-6">
          {seatState.seatNumbers.map((seatNumber, i) => (
            <PassengerCard
              key={seatNumber}
              index={i}
              seatNumber={seatNumber}
              form={forms[i]}
              errors={errors[i]}
              onChange={(field, value) => updateField(i, field, value)}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-xl border bg-card p-5">
          <div>
            {seatState.totalAmount > 0 && (
              <>
                <p className="text-xs text-muted-foreground">Amount payable</p>
                <p className="text-lg font-semibold">
                  ₹{seatState.totalAmount.toLocaleString("en-IN")}
                </p>
              </>
            )}
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </main>
  )
}

// ---------------------------------------------------------------------------
// CountdownPill
// ---------------------------------------------------------------------------

function CountdownPill({ secondsLeft }: { secondsLeft: number }) {
  const isUrgent = secondsLeft <= 60
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tabular-nums",
        isUrgent
          ? "bg-destructive/10 text-destructive"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      ].join(" ")}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className={[
          "inline-block h-1.5 w-1.5 rounded-full",
          isUrgent ? "animate-pulse bg-destructive" : "bg-amber-500",
        ].join(" ")}
      />
      Hold expires in {formatCountdown(secondsLeft)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Lock expired card
// ---------------------------------------------------------------------------

function LockExpiredCard({ tripId }: { tripId: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
    >
      <p className="font-medium text-destructive">Your seat hold has expired</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The seats were released. Please select them again to continue.
      </p>
      <Link
        to={`/trips/${tripId}/seats`}
        className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
      >
        Back to seat selection
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Invalid session card
// ---------------------------------------------------------------------------

function InvalidSessionCard() {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-8 text-center"
    >
      <p className="font-medium text-destructive">Session expired or invalid link</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Please select your seats again to continue.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block text-sm font-medium underline underline-offset-4"
      >
        Start a new search
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PassengerCard
// ---------------------------------------------------------------------------

type PassengerCardProps = {
  index: number
  seatNumber: string
  form: PassengerForm
  errors: PassengerFormError
  onChange: <K extends keyof PassengerForm>(field: K, value: PassengerForm[K]) => void
}

function PassengerCard({ index, seatNumber, form, errors, onChange }: PassengerCardProps) {
  return (
    <fieldset className="rounded-xl border bg-card p-5">
      <legend className="px-1 text-sm font-semibold">
        Passenger {index + 1}{" "}
        <span className="font-mono text-xs font-normal text-muted-foreground">
          · Seat {seatNumber}
        </span>
      </legend>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Full name */}
        <div className="sm:col-span-2">
          <Field
            label="Full name"
            htmlFor={`fullName-${index}`}
            error={errors.fullName}
            required
          >
            <input
              id={`fullName-${index}`}
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              placeholder="As on government ID"
              className={inputClass(!!errors.fullName)}
            />
          </Field>
        </div>

        {/* Age */}
        <Field label="Age" htmlFor={`age-${index}`} error={errors.age} required>
          <input
            id={`age-${index}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={120}
            value={form.age}
            onChange={(e) => onChange("age", e.target.value)}
            placeholder="e.g. 28"
            className={inputClass(!!errors.age)}
          />
        </Field>

        {/* Gender */}
        <Field label="Gender" htmlFor={`gender-${index}`} error={errors.gender} required>
          <select
            id={`gender-${index}`}
            value={form.gender}
            onChange={(e) => onChange("gender", e.target.value as Gender | "")}
            className={selectClass(!!errors.gender, form.gender === "")}
          >
            <option value="" disabled>
              Select gender
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>

        {/* Phone */}
        <div className="sm:col-span-2">
          <Field
            label="Phone number"
            htmlFor={`phone-${index}`}
            error={errors.phone}
            required
          >
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                +91
              </span>
              <input
                id={`phone-${index}`}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile number"
                className={`${inputClass(!!errors.phone)} rounded-l-none`}
              />
            </div>
          </Field>
        </div>
      </div>
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string
  htmlFor: string
  error: string | undefined
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared style helpers
// ---------------------------------------------------------------------------

function inputClass(hasError: boolean): string {
  return [
    "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
    hasError ? "border-destructive focus:ring-destructive/40" : "border-input",
  ].join(" ")
}

function selectClass(hasError: boolean, isEmpty: boolean): string {
  return [
    "w-full rounded-lg border bg-background px-3 py-2 text-sm",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
    hasError ? "border-destructive focus:ring-destructive/40" : "border-input",
    isEmpty ? "text-muted-foreground" : "text-foreground",
  ].join(" ")
}
