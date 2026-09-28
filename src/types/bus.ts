export type BusOperator = {
  id: string
  name: string
  logoUrl: string | null
}

export type BusRoute = {
  id: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  operator: BusOperator
  totalSeats: number
  availableSeats: number
  priceInPaise: number
  amenities: string[]
}

export type SearchParams = {
  from: string
  to: string
  date: string
}

export type SeatType = "seater" | "sleeper" | "semi-sleeper"

export type TripSearchResult = {
  tripId: string
  operator: string
  busName: string
  busType: SeatType
  amenities: string[]
  departure: string
  arrival: string
  pricePerSeat: number
  totalSeats: number
  availableSeats: number
}

export type TripSearchResponse = {
  trips: TripSearchResult[]
  count: number
}
