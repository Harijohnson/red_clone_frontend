import type { SeatType } from "./bus"

export type SeatAvailabilityStatus = "available" | "booked" | "locked"
export type DeckType = "lower" | "upper" | "single"
export type SeatPositionType = "window" | "aisle" | "middle"

export type SeatEntry = {
  number: string
  type: SeatType
  status: SeatAvailabilityStatus
  deck: DeckType
  row: number
  column: number
  position: SeatPositionType
  price: number
  isLockedByMe: boolean
}

export type TripSeatsResponse = {
  tripId: string
  seats: SeatEntry[]
  lockTtlSeconds: number
}

export type LockSeatsRequest = {
  seatNumbers: string[]
}

export type LockSeatsResponse = {
  lockedSeats: string[]
  expiresAt: string
}

// DELETE /trips/:tripId/seats/lock — identifies user via JWT, no body needed
export type ReleaseLockRequest = Record<string, never>

export type ConfirmBookingRequest = {
  paymentReference?: string
}

export type ConfirmBookingResponse = {
  bookingId: string
  bookingStatus: "confirmed"
  paymentStatus: "paid"
}

/** Reason a seat toggle was rejected. */
export type SelectionError =
  | { kind: "max_reached"; max: number }
  | { kind: "seat_unavailable"; seatNumber: string }
