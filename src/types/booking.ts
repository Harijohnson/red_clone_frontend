export type BookingStatus = "confirmed" | "cancelled" | "pending"
export type PaymentStatus = "paid" | "unpaid" | "refunded"

export type BookingPassenger = {
  name: string
  age: number
  seatNumber: string
}

export type BookingTripInfo = {
  tripId: string
  departureTime: string
  arrivalTime: string
  source: string
  destination: string
  busName: string
}

export type BookingDetail = {
  bookingId: string
  bookingReference: string
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  bookedAt: string
  totalAmount: number
  trip: BookingTripInfo
  passengers: BookingPassenger[]
  seats: string[]
}

export type BookingListItem = {
  bookingId: string
  bookingReference: string
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  bookedAt: string
  totalAmount: number
  seats: string[]
  trip: BookingTripInfo
}

export type BookingListResponse = {
  bookings: BookingListItem[]
  count: number
}
