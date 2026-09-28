import { useCallback, useEffect, useRef, useState } from "react"

type CountdownState =
  | { status: "active"; secondsLeft: number }
  | { status: "expired" }

/**
 * Drives a countdown from a server-provided ISO 8601 expiry timestamp.
 * The remaining time is always derived from Date.now() vs the server timestamp —
 * never accumulated from a frontend start time.
 *
 * Returns "expired" once Date.now() >= expiresAt, and calls onExpire exactly once.
 */
export function useLockCountdown(
  expiresAt: string | null,
  onExpire: () => void,
): CountdownState {
  const onExpireRef = useRef(onExpire)
  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])

  const computeState = useCallback((): CountdownState => {
    if (!expiresAt) return { status: "expired" }
    const msLeft = new Date(expiresAt).getTime() - Date.now()
    if (msLeft <= 0) return { status: "expired" }
    return { status: "active", secondsLeft: Math.floor(msLeft / 1000) }
  }, [expiresAt])

  const [countdownState, setCountdownState] = useState<CountdownState>(computeState)
  const firedRef = useRef(false)

  useEffect(() => {
    // Reset fired flag whenever expiresAt changes (new lock)
    firedRef.current = false
    setCountdownState(computeState())

    if (!expiresAt) return

    const tick = () => {
      const next = computeState()
      setCountdownState(next)
      if (next.status === "expired" && !firedRef.current) {
        firedRef.current = true
        onExpireRef.current()
      }
    }

    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, computeState])

  return countdownState
}

/** Format seconds as m:ss */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
