export type Gender = "male" | "female" | "other"

export type PassengerForm = {
  fullName: string
  age: string
  gender: Gender | ""
  phone: string
}

export type PassengerFormError = {
  fullName?: string
  age?: string
  gender?: string
  phone?: string
}

/** Validated, clean passenger — ready to be sent to the backend later. */
export type ValidatedPassenger = {
  fullName: string
  age: number
  gender: Gender
  phone: string
  seatNumber: string
}

/** Shape stored in React Router location state to carry seat selection forward. */
export type SeatSelectionState = {
  tripId: string
  seatNumbers: string[]
  totalAmount: number
  /** ISO 8601 expiry timestamp returned by the backend lock response. */
  lockExpiresAt: string
}
